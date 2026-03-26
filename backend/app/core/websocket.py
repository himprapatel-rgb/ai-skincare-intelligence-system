"""
WebSocket Connection Manager for real-time notifications.

Manages per-user WebSocket connections with heartbeat/ping-pong keep-alive.
"""
import asyncio
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)

# Heartbeat interval in seconds
HEARTBEAT_INTERVAL = 30


class ConnectionManager:
    """Manages active WebSocket connections grouped by user_id."""

    def __init__(self) -> None:
        # user_id -> set of WebSocket connections
        self.active_connections: dict[int, set[WebSocket]] = {}
        # Track heartbeat tasks so they can be cancelled on disconnect
        self._heartbeat_tasks: dict[WebSocket, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: int) -> None:
        """Accept and register a WebSocket connection for a user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        # Start heartbeat for this connection
        task = asyncio.create_task(self._heartbeat(websocket, user_id))
        self._heartbeat_tasks[websocket] = task
        logger.info("WebSocket connected for user %d (total: %d)", user_id, len(self.active_connections[user_id]))

    def disconnect(self, websocket: WebSocket, user_id: int) -> None:
        """Remove a WebSocket connection from the registry."""
        # Cancel heartbeat task
        task = self._heartbeat_tasks.pop(websocket, None)
        if task and not task.done():
            task.cancel()
        # Remove from active connections
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info("WebSocket disconnected for user %d", user_id)

    async def send_to_user(self, user_id: int, data: dict[str, Any]) -> None:
        """Send a JSON message to all connections belonging to a user."""
        connections = self.active_connections.get(user_id, set())
        stale: list[WebSocket] = []
        for ws in connections:
            try:
                await ws.send_json(data)
            except Exception:
                stale.append(ws)
        # Clean up any broken connections
        for ws in stale:
            self.disconnect(ws, user_id)

    async def broadcast(self, data: dict[str, Any]) -> None:
        """Send a JSON message to every connected user."""
        for user_id in list(self.active_connections.keys()):
            await self.send_to_user(user_id, data)

    async def _heartbeat(self, websocket: WebSocket, user_id: int) -> None:
        """Send ping every HEARTBEAT_INTERVAL seconds; disconnect on failure."""
        try:
            while True:
                await asyncio.sleep(HEARTBEAT_INTERVAL)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    logger.warning("Heartbeat failed for user %d, disconnecting", user_id)
                    self.disconnect(websocket, user_id)
                    break
        except asyncio.CancelledError:
            pass


# Singleton instance shared across the application
manager = ConnectionManager()

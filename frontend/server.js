// Express server for SPA routing - AI Skincare Intelligence System
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve static files FIRST.
// This ensures that requests for CSS/JS/Images are handled
// by the file system, not the index.html fallback.
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 2. Handle SPA Fallback.
// Only if a request didn't match a static file above,
// serve index.html to allow React Router to handle the URL.
// Use RegExp to bypass path-to-regexp v7+ strict syntax (rejects * and /(.*))
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 AI Skincare Frontend Server running on port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});

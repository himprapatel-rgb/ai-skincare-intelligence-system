# Self-Hosted ML Server Setup Guide

**Status:** Future Implementation  
**Purpose:** Zero-cost AI processing on your Dell server at home

---

## Overview

When you're ready to eliminate cloud AI costs, you can run all models on your own hardware. This guide covers setting up a Dell server at home.

---

## Hardware Requirements

### Minimum Specs
| Component | Spec | Notes |
|-----------|------|-------|
| GPU | RTX 3060 12GB | Handles all models |
| RAM | 32GB | For model loading |
| CPU | i7 / Xeon E5 | 8+ cores |
| Storage | 500GB SSD | For models + cache |
| Network | 100 Mbps upload | For serving requests |

### Recommended Specs
| Component | Spec | Notes |
|-----------|------|-------|
| GPU | RTX 3090 24GB | Faster, larger models |
| RAM | 64GB | Multiple models loaded |
| CPU | i9 / Xeon Gold | Better throughput |
| Storage | 1TB NVMe | Fast model loading |
| Network | 500 Mbps+ fiber | Handle more users |

### Optimal Specs (High Volume)
| Component | Spec | Notes |
|-----------|------|-------|
| GPU | RTX 4090 or A100 | Maximum performance |
| RAM | 128GB | All models in memory |
| CPU | Xeon Platinum | High parallelism |
| Storage | 2TB NVMe RAID | Redundancy |
| Network | 1 Gbps fiber | Production ready |

---

## Dell Server Options

### Tower Servers (Home Office)
- **Dell PowerEdge T640** - Dual GPU support, quiet
- **Dell Precision 7920** - Workstation, good for development

### Rack Servers (Dedicated Space)
- **Dell PowerEdge R740** - 2U, enterprise grade
- **Dell PowerEdge R750** - Latest gen, PCIe 4.0

### Used Market Prices (2026)
| Server | Price Range | Notes |
|--------|-------------|-------|
| PowerEdge T640 | $800-1500 | Add your own GPU |
| Precision 7920 | $600-1200 | Often includes GPU |
| RTX 3090 | $800-1200 | Used market |
| RTX 4090 | $1400-1800 | Best performance |

---

## Software Setup

### 1. Operating System
```bash
# Ubuntu Server 22.04 LTS (recommended)
# Download: https://ubuntu.com/download/server

# After install, update:
sudo apt update && sudo apt upgrade -y
```

### 2. NVIDIA Drivers + CUDA
```bash
# Add NVIDIA repository
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update

# Install latest driver
sudo apt install nvidia-driver-535

# Install CUDA toolkit
sudo apt install nvidia-cuda-toolkit

# Verify
nvidia-smi
```

### 3. Docker + NVIDIA Container Toolkit
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update
sudo apt install -y nvidia-container-toolkit
sudo systemctl restart docker
```

---

## ML Server Docker Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  # Background Removal API
  rembg:
    image: danielgatis/rembg:gpu
    ports:
      - "5001:5000"
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  # Face Enhancement (CodeFormer)
  codeformer:
    build:
      context: ./codeformer
      dockerfile: Dockerfile
    ports:
      - "5002:5000"
    volumes:
      - ./models/codeformer:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  # Image Upscaling (Real-ESRGAN)
  esrgan:
    build:
      context: ./esrgan
      dockerfile: Dockerfile
    ports:
      - "5003:5000"
    volumes:
      - ./models/esrgan:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  # 3D Face Reconstruction (DECA)
  deca:
    build:
      context: ./deca
      dockerfile: Dockerfile
    ports:
      - "5004:5000"
    volumes:
      - ./models/deca:/app/models
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  # API Gateway (routes to all services)
  gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - REMBG_URL=http://rembg:5000
      - CODEFORMER_URL=http://codeformer:5000
      - ESRGAN_URL=http://esrgan:5000
      - DECA_URL=http://deca:5000
    depends_on:
      - rembg
      - codeformer
      - esrgan
      - deca
    restart: unless-stopped

  # Cloudflare Tunnel (secure external access)
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
```

---

## API Gateway Code

### gateway/app.py
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os

app = FastAPI(title="Pellicura Self-Hosted ML")

REMBG_URL = os.getenv("REMBG_URL", "http://rembg:5000")
CODEFORMER_URL = os.getenv("CODEFORMER_URL", "http://codeformer:5000")
ESRGAN_URL = os.getenv("ESRGAN_URL", "http://esrgan:5000")
DECA_URL = os.getenv("DECA_URL", "http://deca:5000")

class ImageRequest(BaseModel):
    image_url: str

class ProcessingResponse(BaseModel):
    success: bool
    output_url: str = None
    error: str = None

@app.post("/remove-background")
async def remove_background(request: ImageRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{REMBG_URL}/remove",
            json={"image_url": request.image_url}
        )
        return response.json()

@app.post("/enhance-face")
async def enhance_face(request: ImageRequest, upscale: int = 2, fidelity: float = 0.7):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CODEFORMER_URL}/enhance",
            json={
                "image_url": request.image_url,
                "upscale": upscale,
                "fidelity": fidelity
            }
        )
        return response.json()

@app.post("/upscale")
async def upscale(request: ImageRequest, scale: int = 4, face_enhance: bool = True):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ESRGAN_URL}/upscale",
            json={
                "image_url": request.image_url,
                "scale": scale,
                "face_enhance": face_enhance
            }
        )
        return response.json()

@app.post("/reconstruct-3d")
async def reconstruct_3d(request: ImageRequest):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{DECA_URL}/reconstruct",
            json={"image_url": request.image_url}
        )
        return response.json()

@app.get("/health")
async def health():
    return {"status": "healthy", "provider": "self_hosted", "cost_per_image": 0}
```

---

## Cloudflare Tunnel Setup

### 1. Create Tunnel
```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create pellicura-ml

# Get tunnel token
cloudflared tunnel token pellicura-ml
```

### 2. Configure DNS
In Cloudflare Dashboard:
- Add CNAME: `ml.pellicura.com` → `<tunnel-id>.cfargotunnel.com`

### 3. Add Token to Docker
```bash
# Create .env file
echo "CLOUDFLARE_TUNNEL_TOKEN=<your-token>" > .env

# Start services
docker-compose up -d
```

---

## Switching Providers

### To Switch from Replicate to Self-Hosted

1. Set environment variables on Fly.io:
```bash
flyctl secrets set AI_PROVIDER="self_hosted" --app pellicura-api
flyctl secrets set SELF_HOSTED_ML_URL="https://ml.pellicura.com" --app pellicura-api
```

2. (Optional) Add authentication:
```bash
flyctl secrets set SELF_HOSTED_ML_TOKEN="your-secret-token" --app pellicura-api
```

3. Redeploy:
```bash
flyctl deploy --app pellicura-api
```

### To Switch Back to Replicate
```bash
flyctl secrets set AI_PROVIDER="replicate" --app pellicura-api
flyctl deploy --app pellicura-api
```

---

## Performance Benchmarks

### Processing Time per Image

| Operation | RTX 3060 | RTX 3090 | RTX 4090 |
|-----------|----------|----------|----------|
| Background Removal | 2s | 1s | 0.5s |
| Face Enhancement | 5s | 2s | 1s |
| Upscale 4x | 8s | 3s | 1.5s |
| 3D Face | 10s | 4s | 2s |
| **Full Pipeline** | **25s** | **10s** | **5s** |

### Throughput (images/hour)

| GPU | Images/Hour | Users/Day |
|-----|-------------|-----------|
| RTX 3060 | 144 | ~500 |
| RTX 3090 | 360 | ~1,500 |
| RTX 4090 | 720 | ~3,000 |
| 2x RTX 4090 | 1,400 | ~6,000 |

---

## Cost Analysis

### One-Time Hardware Cost
| Item | Cost |
|------|------|
| Dell Server (used) | $800-1500 |
| RTX 3090 | $800-1200 |
| RAM upgrade | $100-200 |
| NVMe SSD | $80-150 |
| **Total** | **$1,800-3,050** |

### Monthly Operating Cost
| Item | Cost |
|------|------|
| Electricity (~300W avg) | $30-50 |
| Internet (fiber) | Already have |
| Cloudflare Tunnel | FREE |
| **Total** | **$30-50/month** |

### Break-Even Analysis
| Replicate Cost | Break-Even |
|----------------|------------|
| $100/month | 18-30 months |
| $200/month | 9-15 months |
| $500/month | 4-6 months |
| $1000/month | 2-3 months |

---

## Security Considerations

1. **Cloudflare Tunnel** - No open ports, encrypted
2. **API Token** - Authenticate requests
3. **Rate Limiting** - Prevent abuse
4. **Firewall** - Block direct access
5. **Updates** - Keep Docker images updated

---

## Monitoring

### Recommended Tools
- **Grafana + Prometheus** - Metrics
- **Portainer** - Docker management
- **Uptime Kuma** - Health monitoring

```yaml
# Add to docker-compose.yml
  portainer:
    image: portainer/portainer-ce
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

---

## Checklist for Future Migration

- [ ] Purchase Dell server or workstation
- [ ] Install GPU (RTX 3090 or better)
- [ ] Install Ubuntu Server 22.04
- [ ] Install NVIDIA drivers + CUDA
- [ ] Install Docker + NVIDIA toolkit
- [ ] Clone ML server setup files
- [ ] Download model weights
- [ ] Set up Cloudflare Tunnel
- [ ] Test locally
- [ ] Switch AI_PROVIDER to "self_hosted"
- [ ] Monitor and optimize

---

**End of Document**

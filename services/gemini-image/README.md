# 🍌 Gemini Image Generation Service

Standalone microservice for AI image generation using Google Gemini API.

## Quick Start

```bash
# Install dependencies
npm install

# Copy env and configure
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start service
npm start
# or for development with hot reload
npm run dev
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/gemini/image/status` | Service status & config |
| GET | `/api/gemini/image/models` | Available models |
| POST | `/api/gemini/image` | Generate image |

## Models

| Mode | Model ID | Max Refs | Resolution |
|------|----------|----------|------------|
| `nano-banana` | gemini-2.5-flash-image | 3 | 1024px |
| `nano-banana-pro` | gemini-3-pro-image-preview | 14 | up to 4K |
| `imagen-3` | imagen-3.0-generate-002 | 0 | 1K |
| `imagen-4` | imagen-4.0-generate-001 | 0 | 1K |

## Example Request

```bash
curl -X POST http://localhost:3010/api/gemini/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A billiard player in dramatic lighting",
    "mode": "nano-banana",
    "aspect_ratio": "9:16",
    "style": "cinematic"
  }'
```

## Response

```json
{
  "success": true,
  "output": "data:image/png;base64,...",
  "image_url": "data:image/png;base64,...",
  "model": "gemini-2.5-flash-image",
  "mode": "nano-banana",
  "provider": "google-gemini",
  "duration_ms": 3500
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_IMAGE_PORT` | 3010 | Service port |
| `GEMINI_API_KEY` | - | Google Gemini API key (required) |

## Docker

```bash
docker build -t gemini-image-service .
docker run -p 3010:3010 -e GEMINI_API_KEY=xxx gemini-image-service
```

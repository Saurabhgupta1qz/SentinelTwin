# SentinelTwin — Deployment & Operations Guide (DEPLOYMENT)

**Document ID:** DEP-001  
**Project:** SentinelTwin  
**Runtime:** Python 3.11+ (FastAPI) & Node.js 18+ (React 18 + Vite)  
**Version:** 1.0.0  

---

## 1. Local Development Setup (Quickstart)

### 1.1 Prerequisites
- Python 3.11 or 3.12 (`python --version`)
- Node.js 18.18+ or 20 LTS (`node -v`)
- npm 9+ (`npm -v`)

---

### 1.2 Backend Setup & Execution

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
# Windows PowerShell:
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS:
# python3 -m venv venv
# source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env and enter TINYFISH_API_KEY and ANTHROPIC_API_KEY if available.
# (If left empty, system runs seamlessly in offline fixture mode).

# 5. Initialize SQLite database & seed PayPulse reference architecture
python -m app.db.seed_data

# 6. Start FastAPI development server (with hot reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

*The backend is now accessible at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.*

---

### 1.3 Frontend Setup & Execution

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```

*The frontend operations console is now live at `http://localhost:5173`.*

---

## 2. Docker & Containerized Deployment

SentinelTwin includes a lightweight `docker-compose.yml` for unified single-command deployment:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - TINYFISH_API_KEY=${TINYFISH_API_KEY:-}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - ENVIRONMENT=production
    volumes:
      - sentineltwin_data:/app/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  sentineltwin_data:
```

### Run with Docker Compose:
```bash
docker-compose up --build
```

---

## 3. Production Health Checks & Verification

### 3.1 Automated Health Check Endpoint
```bash
curl -s http://localhost:8000/api/health | jq .
```

Expected JSON:
```json
{
  "status": "HEALTHY",
  "version": "1.0.0",
  "database": "CONNECTED",
  "external_integrations": {
    "tinyfish": { "configured": true, "mode": "LIVE_API" },
    "anthropic": { "configured": true, "mode": "LIVE_CLAUDE_3_5" }
  }
}
```

### 3.2 Smoke Test Script
SentinelTwin includes a single-command smoke test `scripts/smoke_test.py` that verifies:
1. SQLite connection and seed data validity.
2. NetworkX traversal of the 12-node reference DAG.
3. TinyFish client connectivity and offline fixture fallback.
4. FastAPI endpoint response times ($< 50\text{ ms}$).

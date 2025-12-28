# Docker Quick Start

## Local Testing with Docker Desktop

1. **Create `.env` file** in project root:
   ```env
   HF_TOKEN=your_token
   OPENAI_API_KEY=your_key
   ALLOWED_ORIGINS=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

2. **Start services**:
   ```bash
   docker-compose up --build
   ```

3. **Access**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000/health

## Deploy to Ubuntu VPS

1. **Upload project** to VPS
2. **Create `.env`** with production values
3. **Run**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

See `DOCKER_DEPLOY.md` for detailed instructions.











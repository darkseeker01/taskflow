# TaskFlow

A task management app used to learn real-world DevOps on AWS ECS Fargate.

## Stack

| Layer    | Technology           |
|----------|----------------------|
| Frontend | React 18             |
| Backend  | Node.js + Express    |
| Database | PostgreSQL (optional) |
| Runtime  | Docker / ECS Fargate |

## Local Development

### Prerequisites
- Node.js 18+
- Docker Desktop

### Run with Docker Compose
```bash
docker compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

### Run without Docker
```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm start
```

## API Reference

| Method | Endpoint          | Description        |
|--------|-------------------|--------------------|
| GET    | /health           | Health check       |
| GET    | /api/tasks        | List all tasks     |
| POST   | /api/tasks        | Create a task      |
| PATCH  | /api/tasks/:id    | Update task status |
| DELETE | /api/tasks/:id    | Delete a task      |

### Create Task — Request Body
```json
{
  "title": "Deploy to ECS",
  "priority": "high"
}
```

### Update Status — Request Body
```json
{
  "status": "in-progress"
}
```
Valid status values: `todo`, `in-progress`, `done`

## Environment Variables

### Backend
| Variable      | Default       | Description                        |
|---------------|---------------|------------------------------------|
| PORT          | 5000          | Server port                        |
| NODE_ENV      | development   | Environment name                   |
| APP_VERSION   | 1.0.0         | Version tag (injected by CI/CD)    |
| DATABASE_URL  | (empty)       | PostgreSQL URL — in-memory if blank|

### Frontend
| Variable            | Default                  | Description              |
|---------------------|--------------------------|--------------------------|
| REACT_APP_API_URL   | http://localhost:5000    | Backend API base URL     |
| REACT_APP_ENV       | development              | Environment label in UI  |

## Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   └── index.js        # Express app — all routes
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Main component — Kanban board
│   │   ├── index.js        # React entry point
│   │   └── index.css       # Styles
│   ├── .env.example
│   └── package.json
├── docker-compose.yml      # Local dev orchestration
└── README.md
```

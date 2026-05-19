require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory store used when database is not configured
let inMemoryTasks = [
  { id: uuidv4(), title: 'Set up Docker', status: 'todo', priority: 'high', created_at: new Date() },
  { id: uuidv4(), title: 'Push image to ECR', status: 'todo', priority: 'medium', created_at: new Date() },
  { id: uuidv4(), title: 'Deploy to ECS Fargate', status: 'todo', priority: 'high', created_at: new Date() },
];

// Database pool — only used when DATABASE_URL is set
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

async function initDB() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'todo',
      priority VARCHAR(50) DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database initialized');
}

// Health check — required for ALB and ECS health checks
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'taskflow-backend',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// List all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    res.json(inMemoryTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a task
app.post('/api/tasks', async (req, res) => {
  const { title, priority = 'medium' } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const task = { id: uuidv4(), title, status: 'todo', priority, created_at: new Date() };
  try {
    if (pool) {
      await pool.query(
        'INSERT INTO tasks (id, title, status, priority, created_at) VALUES ($1, $2, $3, $4, $5)',
        [task.id, task.title, task.status, task.priority, task.created_at]
      );
      return res.status(201).json(task);
    }
    inMemoryTasks.unshift(task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status
app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['todo', 'in-progress', 'done'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }

  try {
    if (pool) {
      const result = await pool.query(
        'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
      return res.json(result.rows[0]);
    }
    const task = inMemoryTasks.find(t => t.id === id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.status = status;
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (pool) {
      const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found' });
      return res.status(204).send();
    }
    const idx = inMemoryTasks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });
    inMemoryTasks.splice(idx, 1);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`TaskFlow backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${pool ? 'PostgreSQL connected' : 'in-memory mode'}`);
  });
});

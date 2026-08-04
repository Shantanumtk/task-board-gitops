const express = require('express');
const { Pool } = require('pg');
const { createClient } = require('redis');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'ntier',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'ntier',
});

const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
});
redisClient.on('error', (err) => console.error('Redis error', err));

let ready = false;

async function init() {
  await redisClient.connect();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  ready = true;
  console.log('API ready');
}

app.get('/health', (req, res) => {
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'starting' });
});

app.get('/api/tasks', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, processed, created_at FROM tasks ORDER BY id DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.post('/api/tasks', async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const { rows } = await pool.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING id',
      [title]
    );
    await redisClient.lPush('task_queue', String(rows[0].id));
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

app.get('/api/stats', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT count(*) AS total, count(*) FILTER (WHERE processed) AS processed FROM tasks'
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const port = process.env.PORT || 3000;
init()
  .then(() => app.listen(port, () => console.log(`API listening on ${port}`)))
  .catch((err) => {
    console.error('Failed to init', err);
    process.exit(1);
  });

const { Pool } = require('pg');
const { createClient } = require('redis');

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

async function main() {
  await redisClient.connect();
  console.log('Worker started, waiting for tasks...');

  for (;;) {
    const result = await redisClient.blPop('task_queue', 0);
    const id = result.element;
    console.log(`Processing task ${id}`);
    await new Promise((r) => setTimeout(r, 2000)); // simulate work
    await pool.query('UPDATE tasks SET processed = TRUE WHERE id = $1', [id]);
    console.log(`Task ${id} processed`);
  }
}

main().catch((err) => {
  console.error('Worker crashed', err);
  process.exit(1);
});

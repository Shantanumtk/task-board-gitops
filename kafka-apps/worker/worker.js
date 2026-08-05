const { Pool } = require('pg');
const { Kafka } = require('kafkajs');

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: process.env.PGPORT || 5432,
  user: process.env.PGUSER || 'ntier',
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE || 'ntier',
});

const kafka = new Kafka({
  clientId: 'ntier-worker',
  brokers: [process.env.KAFKA_BROKER || 'task-board-kafka-kafka-bootstrap:9092'],
  retry: { initialRetryTime: 1000, retries: 20 },
});
const consumer = kafka.consumer({ groupId: 'task-workers' });

async function main() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'tasks', fromBeginning: true });
  console.log('Worker started, waiting for tasks...');

  await consumer.run({
    eachMessage: async ({ message }) => {
      const id = message.value.toString();
      console.log(`Processing task ${id}`);
      await new Promise((r) => setTimeout(r, 2000)); // simulate work
      await pool.query('UPDATE tasks SET processed = TRUE WHERE id = $1', [id]);
      console.log(`Task ${id} processed`);
    },
  });
}

main().catch((err) => {
  console.error('Worker crashed', err);
  process.exit(1);
});

import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

function getRedisConnection() {
  const raw = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  const url = new URL(raw);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    tls: url.protocol === "rediss:" ? { servername: url.hostname } : undefined,
  };
}

@Injectable()
export class ProofQueueService implements OnModuleDestroy {
  private readonly queue = new Queue("invoiceproof-anchor-trigger", {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 50,
    },
  });

  async enqueueBatchTrigger() {
    const delay = Number(process.env.ANCHOR_BATCH_DELAY_MS || 5000);

    await this.queue.add(
      "process-pending-batch",
      { requestedAt: new Date().toISOString() },
      {
        delay,
      }
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}

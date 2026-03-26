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
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

function envInt(name: string, fallback: number, min?: number) {
  const raw = Number(process.env[name]);
  const value = Number.isFinite(raw) ? Math.floor(raw) : fallback;
  return typeof min === "number" ? Math.max(min, value) : value;
}

@Injectable()
export class ProofQueueService implements OnModuleDestroy {
  private readonly windowedJobId = "anchor-windowed-submit";
  private readonly queue = new Queue("invoiceproof-anchor-trigger", {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });

  async enqueueBatchTrigger(reason = "invoice-created") {
    const delay = envInt("ANCHOR_COLLECTION_WINDOW_MS", 5000, 0);

    await this.queue.add(
      "anchor.windowed-submit",
      {
        reason,
        requestedAt: new Date().toISOString(),
      },
      {
        jobId: this.windowedJobId,
        delay,
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      }
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}

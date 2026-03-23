import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Job, Queue, Worker } from "bullmq";
import { ProofBatchService } from "./proof-batch.service";

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
  };
}

@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerService.name);
  private worker?: Worker;
  private queue?: Queue;

  constructor(private readonly proofBatchService: ProofBatchService) {}

  async onModuleInit() {
    const connection = getRedisConnection();
    const queueName = "invoiceproof-anchor-trigger";
    const reconcileEveryMs = Number(
      process.env.ANCHOR_RECONCILE_EVERY_MS || 5000
    );
    const tickEveryMs = Number(process.env.ANCHOR_TICK_EVERY_MS || 5000);

    this.queue = new Queue(queueName, {
      connection,
      defaultJobOptions: {
        attempts: Number(process.env.ANCHOR_JOB_ATTEMPTS || 5),
        backoff: {
          type: "exponential",
          delay: Number(process.env.ANCHOR_JOB_BACKOFF_MS || 2000),
        },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    this.worker = new Worker(
      queueName,
      async (job: Job) => {
        const result = await this.proofBatchService.processJob(
          job.name,
          job.data as { batchId?: string }
        );

        this.logger.log(
          `Processed ${job.name || "default"}: ${JSON.stringify(result)}`
        );

        return result;
      },
      {
        connection,
        concurrency: 1,
      }
    );

    this.worker.on("failed", (job, error) => {
      this.logger.error(
        `Job ${job?.name || "unknown"} failed: ${error?.message || error}`
      );
    });

    await this.queue.upsertJobScheduler(
      "anchor-reconcile-scheduler",
      {
        every: reconcileEveryMs,
      },
      {
        name: "anchor.reconcile",
        data: {},
        opts: {
          attempts: 1,
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      }
    );

    await this.queue.upsertJobScheduler(
      "anchor-tick-scheduler",
      {
        every: tickEveryMs,
      },
      {
        name: "anchor.tick",
        data: {},
        opts: {
          attempts: 1,
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      }
    );

    this.logger.log(
      "InvoiceProof worker started with single-writer submission and scheduled receipt reconciliation."
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}

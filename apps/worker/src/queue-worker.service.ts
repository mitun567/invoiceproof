// import {
//   Injectable,
//   Logger,
//   OnModuleDestroy,
//   OnModuleInit,
// } from "@nestjs/common";
// import { Job, Queue, Worker } from "bullmq";
// import { ProofBatchService } from "./proof-batch.service";

// function getRedisConnection() {
//   const raw = process.env.REDIS_URL || "redis://127.0.0.1:6379";
//   const url = new URL(raw);

//   return {
//     host: url.hostname,
//     port: Number(url.port || 6379),
//     username: url.username ? decodeURIComponent(url.username) : undefined,
//     password: url.password ? decodeURIComponent(url.password) : undefined,
//     tls: url.protocol === "rediss:" ? { servername: url.hostname } : undefined,
//     maxRetriesPerRequest: null,
//   };
// }

// @Injectable()
// export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(QueueWorkerService.name);
//   private worker?: Worker;
//   private queue?: Queue;

//   constructor(private readonly proofBatchService: ProofBatchService) {}

//   async onModuleInit() {
//     const connection = getRedisConnection();
//     const queueName = "invoiceproof-anchor-trigger";
//     const reconcileEveryMs = Number(
//       process.env.ANCHOR_RECONCILE_EVERY_MS || 5000
//     );
//     const tickEveryMs = Number(process.env.ANCHOR_TICK_EVERY_MS || 5000);

//     this.queue = new Queue(queueName, {
//       connection,
//       defaultJobOptions: {
//         attempts: Number(process.env.ANCHOR_JOB_ATTEMPTS || 5),
//         backoff: {
//           type: "exponential",
//           delay: Number(process.env.ANCHOR_JOB_BACKOFF_MS || 2000),
//         },
//         removeOnComplete: 1000,
//         removeOnFail: 5000,
//       },
//     });

//     this.worker = new Worker(
//       queueName,
//       async (job: Job) => {
//         const result = await this.proofBatchService.processJob(
//           job.name,
//           job.data as { batchId?: string }
//         );

//         this.logger.log(
//           `Processed ${job.name || "default"}: ${JSON.stringify(result)}`
//         );

//         return result;
//       },
//       {
//         connection,
//         concurrency: 1,
//       }
//     );

//     this.worker.on("failed", (job, error) => {
//       this.logger.error(
//         `Job ${job?.name || "unknown"} failed: ${error?.message || error}`
//       );
//     });

//     await this.queue.upsertJobScheduler(
//       "anchor-reconcile-scheduler",
//       {
//         every: reconcileEveryMs,
//       },
//       {
//         name: "anchor.reconcile",
//         data: {},
//         opts: {
//           attempts: 1,
//           removeOnComplete: 1000,
//           removeOnFail: 1000,
//         },
//       }
//     );

//     await this.queue.upsertJobScheduler(
//       "anchor-tick-scheduler",
//       {
//         every: tickEveryMs,
//       },
//       {
//         name: "anchor.tick",
//         data: {},
//         opts: {
//           attempts: 1,
//           removeOnComplete: 1000,
//           removeOnFail: 1000,
//         },
//       }
//     );

//     this.logger.log(
//       "InvoiceProof worker started with single-writer submission and scheduled receipt reconciliation."
//     );
//   }

//   async onModuleDestroy() {
//     await this.worker?.close();
//     await this.queue?.close();
//   }
// }
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
    enableReadyCheck: false,
  };
}

function envFlag(name: string, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function envInt(name: string, fallback: number, min?: number) {
  const raw = Number(process.env[name]);
  const value = Number.isFinite(raw) ? Math.floor(raw) : fallback;
  return typeof min === "number" ? Math.max(min, value) : value;
}

@Injectable()
export class QueueWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorkerService.name);
  private readonly queueName = "invoiceproof-anchor-trigger";
  private readonly windowedJobId = "anchor-windowed-submit";
  private worker?: Worker;
  private queue?: Queue;
  private started = false;

  constructor(private readonly proofBatchService: ProofBatchService) {}

  async onModuleInit() {
    if (!envFlag("WORKER_ENABLED", true)) {
      this.logger.log("Queue worker disabled because WORKER_ENABLED=false.");
      return;
    }

    const connection = getRedisConnection();
    const attempts = envInt("ANCHOR_JOB_ATTEMPTS", 5, 1);
    const backoffMs = envInt("ANCHOR_JOB_BACKOFF_MS", 2000, 250);
    const backlogEveryMs = envInt("ANCHOR_BACKLOG_SCAN_EVERY_MS", 60000, 5000);
    const collectionWindowMs = envInt("ANCHOR_COLLECTION_WINDOW_MS", 5000, 0);
    const drainDelay = envInt("ANCHOR_DRAIN_DELAY_SECONDS", 5, 1);
    const concurrency = envInt("ANCHOR_WORKER_CONCURRENCY", 1, 1);

    try {
      this.queue = new Queue(this.queueName, {
        connection,
        defaultJobOptions: {
          attempts,
          backoff: {
            type: "exponential",
            delay: backoffMs,
          },
          removeOnComplete: 1000,
          removeOnFail: 5000,
        },
      });

      this.worker = new Worker(
        this.queueName,
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
          concurrency,
          drainDelay,
        }
      );

      this.worker.on("failed", (job, error) => {
        this.logger.error(
          `Job ${job?.name || "unknown"} failed: ${error?.message || error}`
        );
      });

      this.worker.on("error", (error) => {
        const message = error?.message || String(error);
        this.logger.error(`Worker error: ${message}`);
      });

      await this.queue.upsertJobScheduler(
        "anchor-backlog-scan-scheduler",
        { every: backlogEveryMs },
        {
          name: "anchor.backlog-scan",
          data: {},
          opts: {
            attempts: 1,
            removeOnComplete: 1000,
            removeOnFail: 1000,
          },
        }
      );

      await this.schedulePendingWindowTick(
        "startup-catchup",
        collectionWindowMs
      );

      this.started = true;
      this.logger.log(
        `InvoiceProof worker started. window=${collectionWindowMs}ms backlogScan=${backlogEveryMs}ms concurrency=${concurrency}.`
      );
      this.logger.log(
        "Expected behavior: first pending invoice waits 5 seconds to collect peers into the same Merkle batch; leftover pending invoices are picked up every 60 seconds even if no new invoice arrives."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Queue worker startup failed: ${message}`);
      await this.safeClose();
    }
  }

  async onModuleDestroy() {
    await this.safeClose();
  }

  async schedulePendingWindowTick(
    reason = "invoice-created",
    delayMs?: number
  ) {
    if (!this.queue) {
      this.logger.warn(
        `Skipped scheduling pending-window tick because queue is not ready. reason=${reason}`
      );
      return { queued: false, reason: "queue-not-ready" };
    }

    const effectiveDelayMs =
      typeof delayMs === "number"
        ? delayMs
        : envInt("ANCHOR_COLLECTION_WINDOW_MS", 5000, 0);

    await this.queue.add(
      "anchor.windowed-submit",
      {
        reason,
        requestedAt: new Date().toISOString(),
      },
      {
        jobId: this.windowedJobId,
        delay: effectiveDelayMs,
        attempts: 1,
        removeOnComplete: 1000,
        removeOnFail: 1000,
      }
    );

    this.logger.log(
      `Scheduled windowed anchor submission in ${effectiveDelayMs}ms. reason=${reason}`
    );

    return {
      queued: true,
      jobId: this.windowedJobId,
      delayMs: effectiveDelayMs,
      reason,
    };
  }

  private async safeClose() {
    if (this.worker) {
      try {
        await this.worker.close();
      } catch (error) {
        this.logger.warn(
          `Worker close warning: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        this.worker = undefined;
      }
    }

    if (this.queue) {
      try {
        await this.queue.close();
      } catch (error) {
        this.logger.warn(
          `Queue close warning: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        this.queue = undefined;
      }
    }

    this.started = false;
  }

  isStarted() {
    return this.started;
  }
}

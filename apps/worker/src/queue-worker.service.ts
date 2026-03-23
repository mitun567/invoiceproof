import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Worker } from "bullmq";
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

  constructor(private readonly proofBatchService: ProofBatchService) {}

  onModuleInit() {
    this.worker = new Worker(
      "invoiceproof-anchor-trigger",
      async () => {
        const result = await this.proofBatchService.processPendingBatch();
        this.logger.log(`Processed batch trigger: ${JSON.stringify(result)}`);
        return result;
      },
      {
        connection: getRedisConnection(),
        concurrency: 1,
      }
    );

    this.worker.on("failed", (_job, error) => {
      this.logger.error(error);
    });

    this.logger.log(
      "InvoiceProof worker started and listening for batch trigger jobs."
    );
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}

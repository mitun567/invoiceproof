import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AnchorAdapter } from './anchor.adapter';
import { ProofBatchService } from './proof-batch.service';
import { QueueWorkerService } from './queue-worker.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [PrismaService, AnchorAdapter, ProofBatchService, QueueWorkerService],
})
export class WorkerModule {}

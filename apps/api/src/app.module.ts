import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { InvoicesController } from './invoices.controller';
import { VerifyController } from './verify.controller';
import { InvoicesService } from './invoices.service';
import { PrismaService } from './prisma.service';
import { LocalStorageService } from './storage.service';
import { ProofQueueService } from './proof-queue.service';
import { AiInvoiceService } from './ai-invoice.service';
import { InvoicePdfService } from './invoice-pdf.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HealthController, InvoicesController, VerifyController],
  providers: [
    PrismaService,
    InvoicesService,
    LocalStorageService,
    ProofQueueService,
    AiInvoiceService,
    InvoicePdfService,
  ],
})
export class AppModule {}

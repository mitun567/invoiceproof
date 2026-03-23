import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AnchorAdapter } from "./anchor.adapter";
import { buildMerkleTree } from "./merkle";

@Injectable()
export class ProofBatchService {
  private readonly logger = new Logger(ProofBatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anchorAdapter: AnchorAdapter
  ) {}

  async processPendingBatch() {
    const batchSize = Number(process.env.ANCHOR_BATCH_SIZE || 100);
    const proofUpsertChunkSize = Number(
      process.env.PROOF_UPSERT_CHUNK_SIZE || 20
    );

    const invoices = await this.prisma.client.invoiceRecord.findMany({
      where: {
        batchId: null,
        recordHash: { not: null },
        status: { in: ["pending_anchor", "anchor_failed_retrying"] },
      },
      include: { document: true },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });

    if (!invoices.length) {
      this.logger.log("No pending invoices found for anchoring.");
      return { processed: 0 };
    }

    const invoiceIds = invoices.map((invoice: any) => invoice.id);

    this.logger.log(
      `Preparing anchor batch for ${invoices.length} invoice(s).`
    );

    const merkle = buildMerkleTree(
      invoices.map((invoice: any) => invoice.recordHash)
    );

    const batch = await this.prisma.client.anchorBatch.create({
      data: {
        merkleRoot: merkle.root,
        status: "queued",
      },
    });

    this.logger.log(
      `Created anchor batch ${batch.id} with root ${batch.merkleRoot}.`
    );

    // Fast DB-only operations: assign invoices to batch and write audit logs.
    await this.prisma.client.$transaction([
      this.prisma.client.invoiceRecord.updateMany({
        where: {
          id: { in: invoiceIds },
        },
        data: {
          batchId: batch.id,
          status: "anchor_submitted",
        },
      }),
      this.prisma.client.auditLog.createMany({
        data: invoices.map((invoice: any) => ({
          orgId: invoice.orgId,
          action: "proof.batch_assigned",
          entityType: "InvoiceRecord",
          entityId: invoice.id,
          metadataJson: {
            batchId: batch.id,
          },
        })),
      }),
    ]);

    try {
      this.logger.log(`Submitting Polygon anchor for batch ${batch.id}...`);

      const anchorResult = await this.anchorAdapter.anchorBatch({
        batchId: batch.id,
        merkleRoot: batch.merkleRoot,
        timestamp: Date.now(),
      });

      const persistedMerkleRoot =
        anchorResult.merkleRoot ||
        (batch.merkleRoot.startsWith("0x")
          ? batch.merkleRoot
          : `0x${batch.merkleRoot}`);

      const anchoredAt =
        anchorResult.anchoredAt instanceof Date
          ? anchorResult.anchoredAt
          : new Date(anchorResult.anchoredAt);

      this.logger.log(
        `Anchor submitted for batch ${batch.id}. txHash=${anchorResult.txHash}`
      );

      // Fast DB-only operations: mark batch/invoices anchored and write audit logs.
      await this.prisma.client.$transaction([
        this.prisma.client.anchorBatch.update({
          where: { id: batch.id },
          data: {
            status: "anchored",
            txHash: anchorResult.txHash,
            anchoredAt,
          },
        }),
        this.prisma.client.invoiceRecord.updateMany({
          where: {
            id: { in: invoiceIds },
          },
          data: {
            status: "anchored",
            anchorTxHash: anchorResult.txHash,
            anchoredAt,
          },
        }),
        this.prisma.client.auditLog.createMany({
          data: invoices.map((invoice: any) => ({
            orgId: invoice.orgId,
            action: "proof.anchored",
            entityType: "InvoiceRecord",
            entityId: invoice.id,
            metadataJson: {
              batchId: batch.id,
              txHash: anchorResult.txHash,
              merkleRoot: persistedMerkleRoot,
            },
          })),
        }),
      ]);

      // Upsert proofs in small chunks to avoid long interactive transactions.
      for (
        let start = 0;
        start < invoices.length;
        start += proofUpsertChunkSize
      ) {
        const chunk = invoices.slice(start, start + proofUpsertChunkSize);

        await this.prisma.client.$transaction(
          chunk.map((invoice: any, offset: number) => {
            const proofIndex = start + offset;
            const leafProof = merkle.proofs[proofIndex];

            return this.prisma.client.recordProof.upsert({
              where: { invoiceRecordId: invoice.id },
              update: {
                leafHash: leafProof.leafHash,
                merkleRoot: persistedMerkleRoot,
                merkleProofJson: leafProof.proof,
                network: anchorResult.network,
                contractAddress: anchorResult.contractAddress,
                txHash: anchorResult.txHash,
              },
              create: {
                invoiceRecordId: invoice.id,
                leafHash: leafProof.leafHash,
                merkleRoot: persistedMerkleRoot,
                merkleProofJson: leafProof.proof,
                network: anchorResult.network,
                contractAddress: anchorResult.contractAddress,
                txHash: anchorResult.txHash,
              },
            });
          })
        );
      }

      this.logger.log(
        `Batch ${batch.id} anchored successfully. Processed ${invoices.length} invoice(s).`
      );

      return {
        processed: invoices.length,
        batchId: batch.id,
        merkleRoot: persistedMerkleRoot,
        txHash: anchorResult.txHash,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown anchor failure";

      this.logger.error(`Batch ${batch.id} failed: ${message}`);

      await this.prisma.client.$transaction([
        this.prisma.client.anchorBatch.update({
          where: { id: batch.id },
          data: {
            status: "failed",
            failureReason: message,
            retryCount: { increment: 1 },
          },
        }),
        this.prisma.client.invoiceRecord.updateMany({
          where: {
            id: { in: invoiceIds },
          },
          data: {
            status: "anchor_failed_retrying",
            batchId: null,
          },
        }),
        this.prisma.client.auditLog.createMany({
          data: invoices.map((invoice: any) => ({
            orgId: invoice.orgId,
            action: "proof.anchor_failed",
            entityType: "InvoiceRecord",
            entityId: invoice.id,
            metadataJson: {
              batchId: batch.id,
              error: message,
            },
          })),
        }),
      ]);

      throw error;
    }
  }
}

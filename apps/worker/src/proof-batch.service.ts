import { Injectable, Logger } from "@nestjs/common";
import { AnchorAdapter } from "./anchor.adapter";
import { buildMerkleTree } from "./merkle";
import { PrismaService } from "./prisma.service";

@Injectable()
export class ProofBatchService {
  private readonly logger = new Logger(ProofBatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anchorAdapter: AnchorAdapter
  ) {}

  async processPendingBatch() {
    const prepared = await this.preparePendingBatch();
    const submitted = await this.submitPreparedBatch(
      prepared.batchId || undefined
    );
    const reconciled = await this.reconcilePendingReceipts();

    return {
      prepared,
      submitted,
      reconciled,
    };
  }

  async processJob(jobName: string, data?: { batchId?: string }) {
    switch (jobName) {
      case "anchor.prepare":
        return this.preparePendingBatch();
      case "anchor.submit":
        return this.submitPreparedBatch(data?.batchId);
      case "anchor.reconcile":
        return this.reconcilePendingReceipts();
      case "anchor.tick":
      default:
        return this.processPendingBatch();
    }
  }

  private isPermanentSendFailure(message: string) {
    const value = message.toLowerCase();
    return (
      value.includes("execution reverted") ||
      value.includes("call_exception") ||
      value.includes("estimategas")
    );
  }

  private async writeProofsForBatch(batch: any, merkleRootOverride?: string) {
    const proofUpsertChunkSize = Number(
      process.env.PROOF_UPSERT_CHUNK_SIZE || 20
    );
    const invoices = batch.invoices.filter((invoice: any) =>
      Boolean(invoice.recordHash)
    );

    if (!invoices.length) {
      return;
    }

    const merkle = buildMerkleTree(
      invoices.map((invoice: any) => invoice.recordHash)
    );
    const persistedMerkleRoot =
      merkleRootOverride ||
      (batch.merkleRoot.startsWith("0x")
        ? batch.merkleRoot
        : `0x${batch.merkleRoot}`);

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
              network: process.env.CHAIN_NETWORK || "polygon",
              contractAddress: process.env.ANCHOR_CONTRACT_ADDRESS,
              txHash: batch.txHash,
            },
            create: {
              invoiceRecordId: invoice.id,
              leafHash: leafProof.leafHash,
              merkleRoot: persistedMerkleRoot,
              merkleProofJson: leafProof.proof,
              network: process.env.CHAIN_NETWORK || "polygon",
              contractAddress: process.env.ANCHOR_CONTRACT_ADDRESS,
              txHash: batch.txHash,
            },
          });
        })
      );
    }
  }

  private async markBatchAnchored(
    batch: any,
    anchoredAt: Date,
    merkleRootOverride?: string
  ) {
    const persistedMerkleRoot =
      merkleRootOverride ||
      (batch.merkleRoot.startsWith("0x")
        ? batch.merkleRoot
        : `0x${batch.merkleRoot}`);

    await this.prisma.client.$transaction([
      this.prisma.client.anchorBatch.update({
        where: { id: batch.id },
        data: {
          status: "anchored",
          anchoredAt,
          confirmedAt: anchoredAt,
          lastReceiptCheckAt: new Date(),
          receiptCheckCount: { increment: 1 },
          failureReason: null,
        },
      }),
      this.prisma.client.invoiceRecord.updateMany({
        where: { batchId: batch.id },
        data: {
          status: "anchored",
          anchorTxHash: batch.txHash,
          anchoredAt,
        },
      }),
      this.prisma.client.auditLog.createMany({
        data: batch.invoices.map((invoice: any) => ({
          orgId: invoice.orgId,
          action: "proof.anchored",
          entityType: "InvoiceRecord",
          entityId: invoice.id,
          metadataJson: {
            batchId: batch.id,
            txHash: batch.txHash,
            merkleRoot: persistedMerkleRoot,
          },
        })),
      }),
    ]);

    await this.writeProofsForBatch(batch, persistedMerkleRoot);
  }

  async preparePendingBatch() {
    const batchSize = Number(process.env.ANCHOR_BATCH_SIZE || 100);

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
      this.logger.log("No pending invoices found for batch preparation.");
      return { prepared: 0, batchId: null };
    }

    const invoiceIds = invoices.map((invoice: any) => invoice.id);
    const merkle = buildMerkleTree(
      invoices.map((invoice: any) => invoice.recordHash)
    );

    const batch = await this.prisma.client.anchorBatch.create({
      data: {
        merkleRoot: merkle.root,
        status: "batch_prepared",
      },
    });

    await this.prisma.client.$transaction([
      this.prisma.client.invoiceRecord.updateMany({
        where: { id: { in: invoiceIds } },
        data: {
          batchId: batch.id,
          status: "anchor_submitted",
        },
      }),
      this.prisma.client.auditLog.createMany({
        data: invoices.map((invoice: any) => ({
          orgId: invoice.orgId,
          action: "proof.batch_prepared",
          entityType: "InvoiceRecord",
          entityId: invoice.id,
          metadataJson: {
            batchId: batch.id,
            merkleRoot: batch.merkleRoot,
          },
        })),
      }),
    ]);

    this.logger.log(
      `Prepared anchor batch ${batch.id} for ${invoices.length} invoice(s).`
    );

    return {
      prepared: invoices.length,
      batchId: batch.id,
      merkleRoot: batch.merkleRoot,
    };
  }

  async submitPreparedBatch(batchId?: string) {
    const batch = await this.prisma.client.anchorBatch.findFirst({
      where: batchId
        ? {
            id: batchId,
            txHash: null,
            invoices: { some: {} },
          }
        : {
            status: { in: ["batch_prepared", "anchor_send_failed_retryable"] },
            txHash: null,
            invoices: { some: {} },
          },
      include: {
        invoices: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!batch) {
      this.logger.log("No prepared batch found for submission.");
      return { submitted: 0, batchId: null };
    }

    const onChainState = await this.anchorAdapter.getBatchState({
      batchId: batch.id,
    });

    if (onChainState.exists) {
      const anchoredAt = onChainState.anchoredAt || new Date();
      await this.markBatchAnchored(
        batch,
        anchoredAt,
        onChainState.merkleRoot || undefined
      );

      this.logger.log(
        `Recovered already-anchored batch ${batch.id} from chain state.`
      );

      return {
        submitted: 0,
        batchId: batch.id,
        recoveredFromChain: true,
      };
    }

    try {
      this.logger.log(`Submitting Polygon anchor for batch ${batch.id}...`);

      const anchorResult = await this.anchorAdapter.sendAnchorBatch({
        batchId: batch.id,
        merkleRoot: batch.merkleRoot,
        timestamp: Date.now(),
      });

      await this.prisma.client.$transaction([
        this.prisma.client.anchorBatch.update({
          where: { id: batch.id },
          data: {
            status: "anchor_broadcasted",
            chainBatchId: anchorResult.chainBatchId,
            txHash: anchorResult.txHash,
            nonce: anchorResult.nonce ?? undefined,
            sentAt: anchorResult.sentAt,
            providerUsed: anchorResult.providerUsed,
            maxFeePerGas: anchorResult.maxFeePerGas,
            maxPriorityFeePerGas: anchorResult.maxPriorityFeePerGas,
            failureReason: null,
          },
        }),
        this.prisma.client.invoiceRecord.updateMany({
          where: { batchId: batch.id },
          data: {
            status: "anchor_submitted",
            anchorTxHash: anchorResult.txHash,
          },
        }),
        this.prisma.client.auditLog.createMany({
          data: batch.invoices.map((invoice: any) => ({
            orgId: invoice.orgId,
            action: "proof.anchor_broadcasted",
            entityType: "InvoiceRecord",
            entityId: invoice.id,
            metadataJson: {
              batchId: batch.id,
              txHash: anchorResult.txHash,
              providerUsed: anchorResult.providerUsed,
            },
          })),
        }),
      ]);

      this.logger.log(
        `Anchor tx broadcasted for batch ${batch.id}. txHash=${anchorResult.txHash}`
      );

      return {
        submitted: batch.invoices.length,
        batchId: batch.id,
        txHash: anchorResult.txHash,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown anchor send failure";

      const recoveredChainState = await this.anchorAdapter.getBatchState({
        batchId: batch.id,
      });
      if (recoveredChainState.exists) {
        const anchoredAt = recoveredChainState.anchoredAt || new Date();
        await this.markBatchAnchored(
          batch,
          anchoredAt,
          recoveredChainState.merkleRoot || undefined
        );

        this.logger.log(
          `Recovered batch ${batch.id} as anchored after send failure.`
        );

        return {
          submitted: 0,
          batchId: batch.id,
          recoveredFromChain: true,
        };
      }

      const permanentFailure = this.isPermanentSendFailure(message);
      this.logger.error(`Batch ${batch.id} send failed: ${message}`);

      await this.prisma.client.$transaction([
        this.prisma.client.anchorBatch.update({
          where: { id: batch.id },
          data: {
            status: permanentFailure
              ? "anchor_failed_final"
              : "anchor_send_failed_retryable",
            failureReason: message,
            retryCount: { increment: 1 },
          },
        }),
        this.prisma.client.invoiceRecord.updateMany({
          where: { batchId: batch.id },
          data: permanentFailure
            ? {
                status: "saved",
                batchId: null,
                anchorTxHash: null,
              }
            : {
                status: "anchor_failed_retrying",
                batchId: null,
                anchorTxHash: null,
              },
        }),
        this.prisma.client.auditLog.createMany({
          data: batch.invoices.map((invoice: any) => ({
            orgId: invoice.orgId,
            action: permanentFailure
              ? "proof.anchor_send_failed_final"
              : "proof.anchor_send_failed",
            entityType: "InvoiceRecord",
            entityId: invoice.id,
            metadataJson: {
              batchId: batch.id,
              error: message,
            },
          })),
        }),
      ]);

      if (permanentFailure) {
        return {
          submitted: 0,
          batchId: batch.id,
          finalFailure: true,
          error: message,
        };
      }

      throw error;
    }
  }

  async reconcilePendingReceipts() {
    const maxBatchesPerPass = Number(
      process.env.ANCHOR_RECONCILE_BATCHES_PER_PASS || 10
    );
    const confirmations = Number(process.env.ANCHOR_CONFIRMATIONS || 1);

    const batches = await this.prisma.client.anchorBatch.findMany({
      where: {
        status: { in: ["anchor_broadcasted", "anchor_receipt_pending"] },
        txHash: { not: null },
      },
      include: {
        invoices: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { sentAt: "asc" },
      take: maxBatchesPerPass,
    });

    if (!batches.length) {
      this.logger.log(
        "No broadcasted batches found for receipt reconciliation."
      );
      return { reconciled: 0 };
    }

    let reconciled = 0;
    let pending = 0;

    for (const batch of batches) {
      if (!batch.txHash) {
        continue;
      }

      try {
        const receiptResult =
          await this.anchorAdapter.getTransactionReceiptSafe({
            txHash: batch.txHash,
            confirmations,
          });

        if (receiptResult.status !== "confirmed" || !receiptResult.receipt) {
          pending += 1;

          await this.prisma.client.anchorBatch.update({
            where: { id: batch.id },
            data: {
              status: "anchor_receipt_pending",
              lastReceiptCheckAt: new Date(),
              receiptCheckCount: { increment: 1 },
            },
          });

          continue;
        }

        if (receiptResult.receipt.status !== 1) {
          const message = `Anchor transaction reverted for batch ${batch.id}`;

          await this.prisma.client.$transaction([
            this.prisma.client.anchorBatch.update({
              where: { id: batch.id },
              data: {
                status: "anchor_failed_final",
                failureReason: message,
                lastReceiptCheckAt: new Date(),
                receiptCheckCount: { increment: 1 },
              },
            }),
            this.prisma.client.invoiceRecord.updateMany({
              where: { batchId: batch.id },
              data: {
                status: "saved",
                batchId: null,
                anchorTxHash: null,
              },
            }),
            this.prisma.client.auditLog.createMany({
              data: batch.invoices.map((invoice: any) => ({
                orgId: invoice.orgId,
                action: "proof.anchor_reverted",
                entityType: "InvoiceRecord",
                entityId: invoice.id,
                metadataJson: {
                  batchId: batch.id,
                  txHash: batch.txHash,
                  error: message,
                },
              })),
            }),
          ]);

          continue;
        }

        const anchoredAt = receiptResult.anchoredAt || new Date();
        await this.markBatchAnchored(batch, anchoredAt);
        reconciled += 1;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Unknown receipt reconciliation failure for ${batch.id}`;

        this.logger.error(
          `Receipt reconciliation failed for batch ${batch.id}: ${message}`
        );

        await this.prisma.client.anchorBatch.update({
          where: { id: batch.id },
          data: {
            status: "anchor_receipt_pending",
            failureReason: message,
            lastReceiptCheckAt: new Date(),
            receiptCheckCount: { increment: 1 },
          },
        });

        pending += 1;
      }
    }

    this.logger.log(
      `Receipt reconciliation pass finished. Anchored=${reconciled}, pending=${pending}.`
    );

    return {
      reconciled,
      pending,
    };
  }
}

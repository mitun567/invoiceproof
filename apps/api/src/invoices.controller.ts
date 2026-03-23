import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import {
  AiCanvasGenerateDto,
  AiInvoiceDraftRequestDto,
  CanvasDraftRequestDto,
  CreateInvoiceDto,
  FinalizeCanvasInvoiceDto,
  FinalizeGeneratedInvoiceDto,
} from './invoices.dto';
import { InvoicesService } from './invoices.service';

function isPdfBuffer(file: Express.Multer.File) {
  return file.buffer?.subarray(0, 5).toString('utf8') === '%PDF-';
}

function parseAndValidateJsonBody<T extends object>(payload: string, DtoClass: new () => T, errorCode: string, errorMessage: string) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(payload) as Record<string, unknown>;
  } catch {
    throw new BadRequestException({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }

  const instance = plainToInstance(DtoClass, parsed);
  const errors = validateSync(instance as object, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    const constraints = errors.flatMap((error) => Object.values(error.constraints || {}));
    throw new BadRequestException({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD_FIELDS',
        message: constraints[0] || 'Payload validation failed.',
      },
    });
  }

  return instance;
}

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async list() {
    return {
      success: true,
      data: await this.invoicesService.list(),
    };
  }

  @Post('ai-drafts')
  async aiDrafts(@Body() body: AiInvoiceDraftRequestDto) {
    return {
      success: true,
      data: await this.invoicesService.generateAiDrafts(body),
    };
  }

  @Post('ai-canvas-draft')
  async aiCanvasDraft(@Body() body: AiCanvasGenerateDto) {
    return {
      success: true,
      data: await this.invoicesService.generateAiCanvasDraft(body),
    };
  }

  @Post('canvas-drafts')
  async canvasDrafts(@Body() body: CanvasDraftRequestDto) {
    return {
      success: true,
      data: await this.invoicesService.generateCanvasDrafts(body),
    };
  }

  @Post('upload-detect')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async detectUpload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .addFileTypeValidator({ fileType: /pdf$/i })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    if (!isPdfBuffer(file)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_PDF_SIGNATURE',
          message: 'The uploaded file is not a valid PDF.',
        },
      });
    }

    return {
      success: true,
      data: await this.invoicesService.detectUpload(file),
    };
  }

  @Post('upload-finalize')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async finalizeUpload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .addFileTypeValidator({ fileType: /pdf$/i })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Body('invoice') invoice: string,
  ) {
    if (!invoice) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'MISSING_INVOICE_PAYLOAD',
          message: 'Detected invoice payload is required.',
        },
      });
    }

    if (!isPdfBuffer(file)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_PDF_SIGNATURE',
          message: 'The uploaded file is not a valid PDF.',
        },
      });
    }

    const parsed = parseAndValidateJsonBody(
      invoice,
      FinalizeGeneratedInvoiceDto,
      'INVALID_INVOICE_PAYLOAD',
      'Could not parse the invoice payload.',
    );

    return {
      success: true,
      data: await this.invoicesService.finalizeUpload(parsed, file),
    };
  }

  @Post('finalize-canvas')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'attachments', maxCount: 10 }],
      { storage: memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } },
    ),
  )
  async finalizeCanvas(
    @UploadedFiles() files: { attachments?: Express.Multer.File[] },
    @Body('invoice') invoice: string,
  ) {
    if (!invoice) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'MISSING_CANVAS_PAYLOAD',
          message: 'Canvas invoice payload is required.',
        },
      });
    }

    const parsed = parseAndValidateJsonBody(
      invoice,
      FinalizeCanvasInvoiceDto,
      'INVALID_CANVAS_PAYLOAD',
      'Could not parse the canvas invoice payload.',
    );

    const attachments = Array.isArray(files?.attachments) ? files.attachments : [];
    for (const file of attachments) {
      if (!file.mimetype.toLowerCase().includes('pdf') || !isPdfBuffer(file)) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_ATTACHMENT_TYPE',
            message: 'All attachments must be valid PDFs.',
          },
        });
      }
    }

    return {
      success: true,
      data: await this.invoicesService.finalizeCanvas(parsed, attachments),
    };
  }

  @Post('create')
  async create(@Body() body: CreateInvoiceDto) {
    return {
      success: true,
      data: await this.invoicesService.create(body),
    };
  }

  @Post('finalize-generated')
  async finalizeGenerated(@Body() body: FinalizeGeneratedInvoiceDto) {
    return {
      success: true,
      data: await this.invoicesService.finalizeGenerated(body),
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .addFileTypeValidator({ fileType: /(pdf|png|jpg|jpeg)$/i })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
    @Body() body: CreateInvoiceDto,
  ) {
    return {
      success: true,
      data: await this.invoicesService.create(body, file),
    };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const invoice = await this.invoicesService.getById(id);
    if (!invoice) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found',
        },
      });
    }

    return {
      success: true,
      data: invoice,
    };
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() response: Response) {
    const file = await this.invoicesService.getPdf(id);
    if (!file) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PDF_NOT_FOUND',
          message: 'Invoice PDF not found',
        },
      });
    }

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    response.send(file.buffer);
  }

  @Get(':id/qr')
  async getQrData(@Param('id') id: string) {
    const qr = await this.invoicesService.getQrData(id);
    if (!qr) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'QR_NOT_FOUND',
          message: 'QR target not found',
        },
      });
    }

    return {
      success: true,
      data: qr,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { mkdir, writeFile, readFile, rm, stat } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export interface StoredFileResult {
  key: string;
  checksum: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

@Injectable()
export class LocalStorageService {
  private readonly rootPath = process.env.LOCAL_STORAGE_PATH || '/tmp/invoiceproof-storage';

  async saveFile(input: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredFileResult> {
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `documents/${crypto.randomUUID()}-${safeName}`;
    const fullPath = join(this.rootPath, key);

    await mkdir(join(this.rootPath, 'documents'), { recursive: true });
    await writeFile(fullPath, input.buffer);
    const fileInfo = await stat(fullPath);

    return {
      key,
      checksum: crypto.createHash('sha256').update(input.buffer).digest('hex'),
      filePath: fullPath,
      fileName: safeName,
      mimeType: input.mimeType,
      fileSize: fileInfo.size,
    };
  }

  async getFile(key: string) {
    return readFile(join(this.rootPath, key));
  }

  async deleteFile(key: string) {
    await rm(join(this.rootPath, key), { force: true });
  }
}

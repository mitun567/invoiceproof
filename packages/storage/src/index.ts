export interface StoredFileResult {
  key: string;
  checksum: string;
  url?: string;
}

export interface DocumentStorage {
  saveFile(input: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<StoredFileResult>;

  getFile(key: string): Promise<unknown>;
  deleteFile(key: string): Promise<void>;
}

import { Injectable } from "@nestjs/common";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IAlmacenamientoAdapter } from "./almacenamiento.adapter.interface";

@Injectable()
export class R2AlmacenamientoAdapter implements IAlmacenamientoAdapter {
  private s3: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || "rescata-bucket";
    this.publicUrl = process.env.R2_PUBLIC_URL || "https://pub-mock.r2.dev";

    this.s3 = new S3Client({
      endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
      credentials: {
        accessKeyId: accessKeyId || "mock",
        secretAccessKey: secretAccessKey || "mock",
      },
      region: "auto",
    });
  }

  async subir(file: Express.Multer.File, nombreUnico: string): Promise<string> {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.warn("⚠️ Cloudflare R2 credentials not fully configured. Using mock URL path.");
      return `${this.publicUrl}/${nombreUnico}`;
    }

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: nombreUnico,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return `${this.publicUrl}/${nombreUnico}`;
  }
}

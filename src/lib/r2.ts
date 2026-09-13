import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

let _client: S3Client | null = null;

function getClient() {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

const BUCKET = () => process.env.R2_BUCKET_NAME!;

export async function uploadApplicationFile(
  file: File,
  kind: string
): Promise<{ r2Key: string; fileName: string; fileSize: number }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const r2Key = `college-coaching/${kind}/${randomUUID()}-${file.name}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: r2Key,
      Body: bytes,
      ContentType: file.type || "application/octet-stream",
    })
  );

  return { r2Key, fileName: file.name, fileSize: bytes.byteLength };
}

// Files are private (no public bucket access) — partners get a short-lived
// signed URL only when they actually view an application, not a permanent link.
export async function getSignedFileUrl(r2Key: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: BUCKET(), Key: r2Key }),
    { expiresIn: 60 * 10 }
  );
}

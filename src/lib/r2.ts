import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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

// Kept for small server-side uploads elsewhere if ever needed, but the
// college-coaching form no longer routes files through our own function —
// see getUploadUrl below. Proxying file bytes through a Vercel Serverless
// Function body is capped at 4.5MB there; real phone photos blow past that
// and the function rejects the whole request with FUNCTION_PAYLOAD_TOO_LARGE
// before our code even runs.
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

// Lets the browser PUT the file straight to R2, bypassing our function's
// body-size limit entirely. The client uploads here first, then submits the
// resulting r2Key (not the file itself) to /api/college-coaching/submit.
export async function getUploadUrl(
  kind: string,
  fileName: string,
  contentType: string
): Promise<{ url: string; r2Key: string }> {
  const r2Key = `college-coaching/${kind}/${randomUUID()}-${fileName}`;
  const url = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: BUCKET(),
      Key: r2Key,
      ContentType: contentType || "application/octet-stream",
    }),
    { expiresIn: 60 * 10 }
  );
  return { url, r2Key };
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

export async function deleteFile(r2Key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: r2Key }));
}

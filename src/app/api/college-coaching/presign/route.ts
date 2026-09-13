import { NextResponse } from "next/server";
import { getUploadUrl } from "@/lib/r2";

const ALLOWED_KINDS = new Set(["transcript", "test_scores"]);

export async function POST(request: Request) {
  const { kind, fileName, contentType } = await request.json();

  if (!ALLOWED_KINDS.has(kind) || !fileName) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { url, r2Key } = await getUploadUrl(kind, fileName, contentType);
  return NextResponse.json({ url, r2Key });
}

"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, FolderInput } from "lucide-react";

import { createProfileAction, importTalentsAction, requestResumeUpload } from "./actions";

type ErrorCode = "type" | "size" | "upload" | "extract" | "notResume" | "notFound";

export function UploadResume({
  t,
}: {
  t: {
    uploadTitle: string;
    uploadHelp: string;
    upload: string;
    uploading: string;
    extracting: string;
    errors: Record<ErrorCode, string>;
  };
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"idle" | "uploading" | "extracting">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const file = fileRef.current?.files?.[0];

    if (!file) return;
    setError(null);
    setStage("uploading");
    try {
      const up = await requestResumeUpload(file.name, file.type, file.size);

      if (!up.ok) throw up.error;
      const put = await fetch(up.url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

      if (!put.ok) throw "upload";
      setStage("extracting");
      const res = await createProfileAction(up.key, file.name, file.type);

      if (!res.ok) throw res.error;
      router.push(`/admin/profiles/${res.id}`);
    } catch (e) {
      setError(t.errors[(typeof e === "string" ? e : "upload") as ErrorCode] ?? t.errors.upload);
      setStage("idle");
    }
  };

  const busy = stage !== "idle";

  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-yellow-900 flex items-center gap-2">
        <FileUp aria-hidden className="h-4 w-4" />
        {t.uploadTitle}
      </h2>
      <p className="text-xs text-gray-500">{t.uploadHelp}</p>
      <input
        ref={fileRef}
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="text-sm"
        disabled={busy}
        type="file"
      />
      <div className="flex items-center gap-3">
        <button
          className="h-9 rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
          disabled={busy}
          type="button"
          onClick={submit}
        >
          {stage === "uploading" ? t.uploading : stage === "extracting" ? t.extracting : t.upload}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
    </div>
  );
}

export function ImportButton({
  labels,
}: {
  labels: { title: string; help: string; button: string; importing: string; failed: string };
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-yellow-900 flex items-center gap-2">
        <FolderInput aria-hidden className="h-4 w-4" />
        {labels.title}
      </h2>
      <p className="text-xs text-gray-500">{labels.help}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="h-9 rounded-md border border-yellow-300 bg-white px-4 text-sm text-yellow-800 hover:bg-yellow-50 disabled:opacity-50"
          disabled={pending}
          type="button"
          onClick={() =>
            start(async () => {
              setMsg(null);
              const res = await importTalentsAction();

              setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: labels.failed });
            })
          }
        >
          {pending ? labels.importing : labels.button}
        </button>
        {msg ? <span className={`text-xs ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</span> : null}
      </div>
    </div>
  );
}

"use client";

export function PrintButton() {
  return (
    <button
      className="rounded-full border border-white/50 px-3 py-1 text-sm hover:bg-white/15"
      type="button"
      onClick={() => window.print()}
    >
      打印 / 保存 PDF
    </button>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Download, Film, MessageCircle, Newspaper, Palette, Phone, ShieldCheck } from "lucide-react";
import { hasLocale, locales, type Locale } from "@/lib/i18n";
import { boilerplate, brandColors, MEDIA_CONTACT, pressCopy, pressLogos, pressUrl, pressVideos } from "@/lib/press";
import { CopyButton } from "@/components/press/CopyButton";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  const t = pressCopy(locale);
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    alternates: { languages: { zh: "/zh/press", en: "/en/press" } },
    openGraph: { title: t.metaTitle, description: t.metaDesc, images: [pressUrl("jycareer-brand-film-16x9.jpg")] },
  };
}

const aspect = { "16:9": "aspect-video", "9:16": "aspect-[9/16]", "3:4": "aspect-[3/4]" } as const;

export default async function PressPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const l = locale as Locale;
  const t = pressCopy(l);
  const [film, ...shorts] = pressVideos;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-1.5 text-sm font-medium text-yellow-800">
          <Newspaper className="h-4 w-4" />
          {t.badge}
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">{t.title}</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600">{t.lead}</p>
        <a
          href={pressUrl("jycareer-brand-kit.zip")}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-yellow-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-yellow-700"
        >
          <Download className="h-5 w-5" />
          {t.kit}
        </a>
        <p className="mt-2 text-xs text-gray-400">{t.kitNote}</p>
      </header>

      {/* About / boilerplate */}
      <section className="mt-14">
        <h2 className="text-xl font-bold text-gray-900">{t.aboutTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { label: t.oneLine, text: t.oneLineText },
            { label: t.aboutZh, text: boilerplate.zh },
            { label: t.aboutEn, text: boilerplate.en },
          ].map((b) => (
            <div key={b.label} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-500">{b.label}</p>
                <CopyButton text={b.text} label={t.copy} done={t.copied} />
              </div>
              <p className="mt-3 select-all text-sm leading-relaxed text-gray-800">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Videos */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Film className="h-5 w-5 text-yellow-600" />
          {t.videosTitle}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{t.videosLead}</p>

        <div className="mt-5">
          <VideoCard v={film} l={l} t={t} wide />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shorts.map((v) => (
            <VideoCard key={v.file} v={v} l={l} t={t} />
          ))}
        </div>
      </section>

      {/* Logos + colors */}
      <section className="mt-14">
        <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <Palette className="h-5 w-5 text-yellow-600" />
          {t.logosTitle}
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pressLogos.map((g) => (
            <a
              key={g.file}
              href={pressUrl(g.file)}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:border-yellow-400"
            >
              <div className={`flex h-36 items-center justify-center p-6 ${g.bg === "dark" ? "bg-gray-900" : "bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]"}`}>
                <img src={pressUrl(g.file)} alt="" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-gray-700">{g.label[l]}</span>
                <Download className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-yellow-600" />
              </div>
            </a>
          ))}
        </div>

        <h3 className="mt-8 text-base font-semibold text-gray-900">{t.colorsTitle}</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {brandColors.map((c) => (
            <div key={c.hex} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
              <span className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: c.hex }} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{c.hex}</p>
                <p className="truncate text-xs text-gray-500">{c.name[l]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usage + contact */}
      <section className="mt-14 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <ShieldCheck className="h-5 w-5 text-yellow-600" />
            {t.rulesTitle}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-gray-700">
            {t.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl bg-gray-900 p-6 text-gray-300">
          <h2 className="text-lg font-bold text-white">{t.contactTitle}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-yellow-500" />
              {t.phone}：<a href={`tel:${MEDIA_CONTACT.phone}`} className="font-semibold text-white">{MEDIA_CONTACT.phone}</a>
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-yellow-500" />
              {t.wechat}：<span className="select-all font-semibold text-white">{MEDIA_CONTACT.wechat}</span>
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-400">{t.contactNote}</p>
        </div>
      </section>
    </main>
  );
}

function VideoCard({ v, l, t, wide = false }: { v: (typeof pressVideos)[number]; l: Locale; t: ReturnType<typeof pressCopy>; wide?: boolean }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white ${wide ? "lg:flex-row" : ""}`}>
      <div className={`${aspect[v.ratio]} w-full bg-black ${wide ? "lg:w-2/3 lg:shrink-0" : v.ratio === "16:9" ? "" : "mx-auto max-h-[520px]"}`}>
        <video
          src={pressUrl(v.file)}
          poster={pressUrl(v.poster)}
          controls
          playsInline
          preload="none"
          className="h-full w-full object-contain"
        />
      </div>
      <div className={`flex flex-1 flex-col p-4 ${wide ? "lg:justify-center lg:p-8" : ""}`}>
        <p className={`font-semibold text-gray-900 ${wide ? "lg:text-xl" : ""}`}>{v.title[l]}</p>
        <p className="mt-1 text-xs text-gray-500">{v.note[l]}</p>
        <div className={`flex flex-wrap items-center gap-2 pt-4 ${wide ? "lg:mt-4" : "mt-auto"}`}>
          <a
            href={pressUrl(v.file)}
            className="inline-flex items-center gap-1.5 rounded-full bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
          >
            <Download className="h-4 w-4" />
            {t.download} · {v.ratio} · {v.size}
          </a>
          {v.alt && (
            <a
              href={pressUrl(v.alt.file)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-yellow-400"
            >
              <Download className="h-4 w-4" />
              {v.alt.label[l]} · {v.alt.size}
            </a>
          )}
          <span className="text-xs text-gray-400">{v.duration}</span>
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { hasLocale } from "@/lib/i18n";
import CollegeCoachingForm from "./CollegeCoachingForm";

type Copy = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

const zh: Copy = {
  eyebrow: "教育项目 · JYEdu 杰圆教育",
  title: "College Coaching 申请表",
  subtitle: "填写以下信息，帮助我们了解你的背景、目标院校方向与支持需求",
};

const en: Copy = {
  eyebrow: "Education Program · JYEdu",
  title: "College Coaching Application",
  subtitle: "Complete the sections below so we can understand your background, goals, and support needs",
};

export default async function CollegeCoachingSurveyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const c = locale === "en" ? en : zh;

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 max-w-3xl">
        <div className="text-center mb-6 sm:mb-10">
          <p className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-wide text-yellow-700 mb-3">
            <ClipboardList className="h-4 w-4" />
            {c.eyebrow}
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-yellow-900 mb-3 sm:mb-4">
            {c.title}
          </h1>
          <p className="text-base sm:text-xl text-gray-600">{c.subtitle}</p>
        </div>

        <CollegeCoachingForm locale={locale} />
      </div>
    </div>
  );
}

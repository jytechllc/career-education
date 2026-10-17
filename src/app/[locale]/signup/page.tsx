import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, ClipboardList, PencilLine, ShieldCheck, UserPlus } from "lucide-react";

import { hasLocale } from "@/lib/i18n";
import { auth0 } from "@/lib/auth0";

type Copy = {
  meta: { title: string; description: string };
  title: string;
  subtitle: string;
  benefits: { title: string; body: string }[];
  signup: string;
  note: string;
  haveAccount: string;
  login: string;
};

const zh: Copy = {
  meta: {
    title: "注册账号 | 杰圆职场教育",
    description: "注册杰圆账号，建立个人资料，咨询时顾问可直接据此了解你的背景。",
  },
  title: "注册账号",
  subtitle: "建立个人资料，顾问咨询前即可了解你的背景。",
  benefits: [
    { title: "一次建档", body: "基本信息与求职偏好填写一次，后续咨询无需重复提供。" },
    { title: "随时修改", body: "登录后可在「用户中心」查看和更新资料。" },
    { title: "信息保密", body: "资料仅供杰圆顾问为你提供服务使用，不对外公开。" },
  ],
  signup: "免费注册",
  note: "点击后将跳转至安全登录页完成注册，注册成功后自动进入资料填写页。",
  haveAccount: "已有账号？",
  login: "直接登录",
};

const en: Copy = {
  meta: {
    title: "Sign up | JY Education and Career Center",
    description: "Create a JY account and set up your profile so our advisors know your background before you talk.",
  },
  title: "Create your account",
  subtitle: "Set up your profile so our advisors know your background before you talk.",
  benefits: [
    { title: "Fill it in once", body: "Enter your details and job preferences once — no need to repeat them at every consultation." },
    { title: "Edit any time", body: "View and update your profile from your Dashboard after logging in." },
    { title: "Kept private", body: "Your profile is used only by JY advisors to serve you and is never made public." },
  ],
  signup: "Sign up free",
  note: "You'll be taken to our secure sign-in page to register, then straight to your profile.",
  haveAccount: "Already have an account?",
  login: "Log in",
};

const ICONS = [ClipboardList, PencilLine, ShieldCheck];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === "en" ? en : zh;
  return { title: c.meta.title, description: c.meta.description };
}

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const c = locale === "en" ? en : zh;

  const profilePath = `/${locale}/profile`;
  const session = await auth0.getSession();
  if (session) redirect(profilePath);

  // screen_hint=signup opens Auth0 Universal Login on its sign-up tab.
  const signupHref = `/auth/login?screen_hint=signup&returnTo=${encodeURIComponent(profilePath)}`;
  const loginHref = `/auth/login?returnTo=${encodeURIComponent(profilePath)}`;

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="container mx-auto max-w-xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="rounded-xl bg-white shadow-lg p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <UserPlus className="h-6 w-6 text-yellow-700" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-yellow-900 mb-2">{c.title}</h1>
            <p className="text-gray-600">{c.subtitle}</p>
          </div>

          <ul className="space-y-4 mb-8">
            {c.benefits.map((b, i) => {
              const Icon = ICONS[i];
              return (
                <li key={b.title} className="flex gap-3">
                  <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">{b.title}</p>
                    <p className="text-sm text-gray-600">{b.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <a
            href={signupHref}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white transition hover:bg-yellow-700"
          >
            {c.signup}
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-center text-xs text-gray-500">{c.note}</p>

          <p className="mt-6 border-t border-yellow-100 pt-6 text-center text-sm text-gray-600">
            {c.haveAccount}{" "}
            <a href={loginHref} className="font-semibold text-yellow-700 hover:text-yellow-800">
              {c.login}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

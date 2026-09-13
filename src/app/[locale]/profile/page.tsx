import { notFound, redirect } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { auth0 } from "@/lib/auth0";
import { getMyProfile } from "@/lib/actions/profile";
import { ProfileForm } from "@/components/ProfileForm";

type CopyEntry = {
  pageTitle: string;
  pageSubtitle: string;
  welcome: string;
  sectionContact: string;
  sectionEEO: string;
  sectionEEONote: string;
  sectionJob: string;
  sectionAddress: string;
  sectionLinks: string;
  phone: string;
  preferredLanguage: string;
  gender: string;
  ethnicity: string;
  veteranStatus: string;
  disability: string;
  expectedSalary: string;
  authorizedInCountry: string;
  validDrivingLicense: string;
  needsVisaSponsorship: string;
  availableDate: string;
  yearsOfExperience: string;
  jobType: string;
  fullyRemote: string;
  linkedin: string;
  portfolio: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  preferNot: string;
  yes: string;
  no: string;
  save: string;
  saving: string;
  saved: string;
  saveError: string;
  jobTypes: { value: string; label: string }[];
  genders: string[];
  ethnicities: string[];
  veteranOptions: string[];
  disabilityOptions: string[];
};

const COPY: Record<"zh" | "en", CopyEntry> = {
  zh: {
    pageTitle: "候选人资料",
    pageSubtitle: "完善以下信息，帮助我们更好地为你匹配机会。",
    welcome: "你好",
    sectionContact: "联系方式",
    sectionEEO: "自愿披露（可选）",
    sectionEEONote: "以下信息为自愿填写，仅用于平等就业机会统计，不会影响匹配结果。",
    sectionJob: "求职偏好",
    sectionAddress: "地址",
    sectionLinks: "链接",
    phone: "电话",
    preferredLanguage: "工作语言",
    gender: "性别",
    ethnicity: "种族",
    veteranStatus: "退伍军人状态",
    disability: "残障情况",
    expectedSalary: "期望薪资",
    authorizedInCountry: "是否在工作国家有合法工作授权？",
    validDrivingLicense: "是否持有有效驾照？",
    needsVisaSponsorship: "是否需要签证担保？",
    availableDate: "可入职日期",
    yearsOfExperience: "工作经验（年）",
    jobType: "工作类型",
    fullyRemote: "完全远程？",
    linkedin: "LinkedIn",
    portfolio: "作品集",
    address: "街道地址",
    city: "城市",
    state: "省/州",
    zipcode: "邮政编码",
    preferNot: "不愿透露",
    yes: "是",
    no: "否",
    save: "保存",
    saving: "保存中...",
    saved: "已保存 ✓",
    saveError: "保存失败，请重试",
    jobTypes: [
      { value: "Full-time", label: "全职" },
      { value: "Part-time", label: "兼职" },
      { value: "Contract", label: "合同制" },
      { value: "Internship", label: "实习" },
    ],
    genders: ["女", "男", "非二元", "其他"],
    ethnicities: ["亚裔", "白人", "黑人", "西班牙裔", "印第安人", "太平洋岛民", "其他"],
    veteranOptions: ["否", "退伍军人", "现役军人"],
    disabilityOptions: ["否", "是"],
  },
  en: {
    pageTitle: "Candidate Profile",
    pageSubtitle: "Fill in the info below so we can match you with the right opportunities.",
    welcome: "Hi",
    sectionContact: "Contact",
    sectionEEO: "Voluntary self-identification (optional)",
    sectionEEONote: "Voluntary EEO disclosure — used for equal-opportunity reporting only and does not affect matching.",
    sectionJob: "Job preferences",
    sectionAddress: "Address",
    sectionLinks: "Links",
    phone: "Phone",
    preferredLanguage: "Working language",
    gender: "Gender",
    ethnicity: "Ethnicity",
    veteranStatus: "Veteran status",
    disability: "Disability",
    expectedSalary: "Expected salary",
    authorizedInCountry: "Authorized to work in job country?",
    validDrivingLicense: "Valid driving license?",
    needsVisaSponsorship: "Need visa sponsorship?",
    availableDate: "Available start date",
    yearsOfExperience: "Years of professional experience",
    jobType: "Job type",
    fullyRemote: "Fully remote?",
    linkedin: "LinkedIn",
    portfolio: "Portfolio",
    address: "Street address",
    city: "City",
    state: "State / Province",
    zipcode: "Zip / Postal code",
    preferNot: "Prefer not to say",
    yes: "Yes",
    no: "No",
    save: "Save",
    saving: "Saving...",
    saved: "Saved ✓",
    saveError: "Save failed, please retry",
    jobTypes: [
      { value: "Full-time", label: "Full-time" },
      { value: "Part-time", label: "Part-time" },
      { value: "Contract", label: "Contract" },
      { value: "Internship", label: "Internship" },
    ],
    genders: ["Female", "Male", "Non-binary", "Other"],
    ethnicities: [
      "Asian",
      "White",
      "Black or African American",
      "Hispanic or Latino",
      "Native American",
      "Pacific Islander",
      "Other",
    ],
    veteranOptions: ["Not a veteran", "Veteran", "Active duty"],
    disabilityOptions: ["No", "Yes"],
  },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();

  const session = await auth0.getSession();
  if (!session?.user) {
    redirect(`/auth/login?returnTo=/${locale}/profile`);
  }

  const profile = await getMyProfile();
  const copy = COPY[locale];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-10 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-900 mb-2">
            {copy.pageTitle}
          </h1>
          <p className="text-gray-600">{copy.pageSubtitle}</p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-100 mb-6 flex items-center gap-3 text-sm">
          {session.user.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.picture as string}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-semibold">
              {((session.user.name as string) || (session.user.email as string) || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">
              {copy.welcome}
              {", "}
              {(session.user.name as string) || (session.user.email as string)}
            </div>
            <div className="text-gray-500 text-xs">{session.user.email as string}</div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <ProfileForm initial={profile} copy={copy} />
        </div>
      </div>
    </div>
  );
}

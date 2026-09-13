"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { saveMyProfile, type ProfileInput } from "@/lib/actions/profile";
import type { Candidate } from "@/lib/schema";

interface Copy {
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
}

export function ProfileForm({
  initial,
  copy,
}: {
  initial: Candidate | null;
  copy: Copy;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const triState = (key: string): boolean | undefined => {
      const v = fd.get(key);
      if (v === "true") return true;
      if (v === "false") return false;
      return undefined;
    };

    const yearsRaw = fd.get("yearsOfExperience") as string | null;
    const years = yearsRaw && yearsRaw.length > 0 ? Number(yearsRaw) : undefined;

    const input: ProfileInput = {
      phone: (fd.get("phone") as string) || undefined,
      preferredLanguage: (fd.get("preferredLanguage") as string) || undefined,
      gender: (fd.get("gender") as string) || undefined,
      ethnicity: (fd.get("ethnicity") as string) || undefined,
      veteranStatus: (fd.get("veteranStatus") as string) || undefined,
      disability: (fd.get("disability") as string) || undefined,
      expectedSalary: (fd.get("expectedSalary") as string) || undefined,
      authorizedInCountry: triState("authorizedInCountry"),
      validDrivingLicense: triState("validDrivingLicense"),
      needsVisaSponsorship: triState("needsVisaSponsorship"),
      availableDate: (fd.get("availableDate") as string) || undefined,
      yearsOfExperience: years,
      jobType: (fd.get("jobType") as string) || undefined,
      fullyRemote: triState("fullyRemote"),
      linkedinUrl: (fd.get("linkedinUrl") as string) || undefined,
      portfolioUrl: (fd.get("portfolioUrl") as string) || undefined,
      address: (fd.get("address") as string) || undefined,
      city: (fd.get("city") as string) || undefined,
      state: (fd.get("state") as string) || undefined,
      zipcode: (fd.get("zipcode") as string) || undefined,
    };

    startTransition(async () => {
      const res = await saveMyProfile(input);
      setStatus(res.ok ? "ok" : "error");
    });
  };

  const triValue = (b: boolean | null | undefined): string =>
    b === true ? "true" : b === false ? "false" : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Contact */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-yellow-900 mb-2">
          {copy.sectionContact}
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label={copy.phone} name="phone" defaultValue={initial?.phone ?? ""} type="tel" />
          <Field
            label={copy.preferredLanguage}
            name="preferredLanguage"
            defaultValue={initial?.preferredLanguage ?? ""}
          />
        </div>
      </fieldset>

      {/* EEO */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-yellow-900 mb-1">
          {copy.sectionEEO}
        </legend>
        <p className="text-xs text-gray-500 mb-2">{copy.sectionEEONote}</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <Select
            label={copy.gender}
            name="gender"
            defaultValue={initial?.gender ?? ""}
            options={[
              { value: "", label: "—" },
              ...copy.genders.map((g) => ({ value: g, label: g })),
              { value: "Prefer not to say", label: copy.preferNot },
            ]}
          />
          <Select
            label={copy.ethnicity}
            name="ethnicity"
            defaultValue={initial?.ethnicity ?? ""}
            options={[
              { value: "", label: "—" },
              ...copy.ethnicities.map((g) => ({ value: g, label: g })),
              { value: "Prefer not to say", label: copy.preferNot },
            ]}
          />
          <Select
            label={copy.veteranStatus}
            name="veteranStatus"
            defaultValue={initial?.veteranStatus ?? ""}
            options={[
              { value: "", label: "—" },
              ...copy.veteranOptions.map((g) => ({ value: g, label: g })),
              { value: "Prefer not to say", label: copy.preferNot },
            ]}
          />
          <Select
            label={copy.disability}
            name="disability"
            defaultValue={initial?.disability ?? ""}
            options={[
              { value: "", label: "—" },
              ...copy.disabilityOptions.map((g) => ({ value: g, label: g })),
              { value: "Prefer not to say", label: copy.preferNot },
            ]}
          />
        </div>
      </fieldset>

      {/* Job */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-yellow-900 mb-2">
          {copy.sectionJob}
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label={copy.expectedSalary}
            name="expectedSalary"
            defaultValue={initial?.expectedSalary ?? ""}
            placeholder="$80,000 / yr"
          />
          <Field
            label={copy.yearsOfExperience}
            name="yearsOfExperience"
            type="number"
            min={0}
            max={60}
            defaultValue={initial?.yearsOfExperience ?? ""}
          />
          <Field
            label={copy.availableDate}
            name="availableDate"
            type="date"
            defaultValue={initial?.availableDate ?? ""}
          />
          <Select
            label={copy.jobType}
            name="jobType"
            defaultValue={initial?.jobType ?? ""}
            options={[{ value: "", label: "—" }, ...copy.jobTypes]}
          />
          <TriBool
            label={copy.authorizedInCountry}
            name="authorizedInCountry"
            defaultValue={triValue(initial?.authorizedInCountry)}
            yes={copy.yes}
            no={copy.no}
          />
          <TriBool
            label={copy.validDrivingLicense}
            name="validDrivingLicense"
            defaultValue={triValue(initial?.validDrivingLicense)}
            yes={copy.yes}
            no={copy.no}
          />
          <TriBool
            label={copy.needsVisaSponsorship}
            name="needsVisaSponsorship"
            defaultValue={triValue(initial?.needsVisaSponsorship)}
            yes={copy.yes}
            no={copy.no}
          />
          <TriBool
            label={copy.fullyRemote}
            name="fullyRemote"
            defaultValue={triValue(initial?.fullyRemote)}
            yes={copy.yes}
            no={copy.no}
          />
        </div>
      </fieldset>

      {/* Address */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-yellow-900 mb-2">
          {copy.sectionAddress}
        </legend>
        <Field label={copy.address} name="address" defaultValue={initial?.address ?? ""} />
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={copy.city} name="city" defaultValue={initial?.city ?? ""} />
          <Field label={copy.state} name="state" defaultValue={initial?.state ?? ""} />
          <Field label={copy.zipcode} name="zipcode" defaultValue={initial?.zipcode ?? ""} />
        </div>
      </fieldset>

      {/* Links */}
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold text-yellow-900 mb-2">
          {copy.sectionLinks}
        </legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label={copy.linkedin}
            name="linkedinUrl"
            type="url"
            placeholder="https://linkedin.com/in/..."
            defaultValue={initial?.linkedinUrl ?? ""}
          />
          <Field
            label={copy.portfolio}
            name="portfolioUrl"
            type="url"
            placeholder="https://..."
            defaultValue={initial?.portfolioUrl ?? ""}
          />
        </div>
      </fieldset>

      <div className="flex items-center gap-4 sticky bottom-0 bg-white py-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={pending}
          className="bg-yellow-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-yellow-700 transition disabled:opacity-50 inline-flex items-center"
        >
          <Save className="h-4 w-4 mr-2" />
          {pending ? copy.saving : copy.save}
        </button>
        {status === "ok" && (
          <span className="text-green-600 text-sm">{copy.saved}</span>
        )}
        {status === "error" && (
          <span className="text-red-600 text-sm">{copy.saveError}</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition outline-none"
      />
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition outline-none bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TriBool({
  label,
  name,
  defaultValue,
  yes,
  no,
}: {
  label: string;
  name: string;
  defaultValue: string;
  yes: string;
  no: string;
}) {
  return (
    <Select
      label={label}
      name={name}
      defaultValue={defaultValue}
      options={[
        { value: "", label: "—" },
        { value: "true", label: yes },
        { value: "false", label: no },
      ]}
    />
  );
}

"use client";

import { MapPin, Phone, Clock, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";

export const Contact = ({ dict }: { dict: Dictionary }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      setSubmitStatus({ type: "success", message: dict.contact.successMessage });
      form.reset();
    } catch {
      setSubmitStatus({ type: "error", message: dict.contact.errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: Phone, title: dict.contact.phoneTitle, content: ["17318011997"] },
    { icon: MessageCircle, title: dict.contact.wechatTitle, content: ["HELENLAN998"] },
    { icon: MapPin, title: dict.contact.addressTitle, content: [dict.contact.address] },
    {
      icon: Clock,
      title: dict.contact.hoursTitle,
      content: [dict.contact.hoursWeekday, dict.contact.hoursSaturday],
    },
  ];

  return (
    <section id="contact" className="py-20 md:py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {dict.contact.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{dict.contact.subtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4">
            {contactInfo.map((item, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  {item.content.map((line, i) => (
                    <p key={i} className="text-gray-600 text-sm">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-gray-100">
            <h3 className="text-xl font-bold mb-6 text-gray-900">
              {dict.contact.formTitle}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {dict.contact.name}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={dict.contact.namePlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-shadow outline-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {dict.contact.email}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={dict.contact.emailPlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-shadow outline-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {dict.contact.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder={dict.contact.phonePlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-shadow outline-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {dict.contact.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder={dict.contact.messagePlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-shadow outline-none resize-none"
                  required
                  disabled={isSubmitting}
                />
              </div>
              {submitStatus.type && (
                <div
                  className={`p-3 rounded-xl text-sm ${
                    submitStatus.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {submitStatus.message}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow-600 text-white py-3 rounded-xl font-semibold hover:bg-yellow-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center group"
              >
                {isSubmitting ? (
                  dict.contact.submitting
                ) : (
                  <>
                    {dict.contact.submit}
                    <Send className="ml-2 h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

import Link from "next/link";
import { GraduationCap, Phone, MessageCircle, MapPin } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

export const Footer = ({ dict, locale }: { dict: Dictionary; locale: string }) => {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-7 w-7 text-yellow-500" />
              <span className="text-xl font-bold text-white">
                {locale === "zh" ? "杰圆教育" : "JYEdu"}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{dict.footer.tagline}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {dict.footer.contactTitle}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span>17318011997</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MessageCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span>HELENLAN998</span>
              </div>
              <div className="flex items-start space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <span>{dict.contact.address}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {dict.footer.hoursTitle}
            </h3>
            <div className="space-y-2 text-sm">
              <p>{dict.contact.hoursWeekday}</p>
              <p>{dict.contact.hoursSaturday}</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              {dict.footer.linksTitle}
            </h3>
            <div className="space-y-2 text-sm">
              <Link href={`/${locale}#service`} className="block hover:text-yellow-400 transition-colors">
                {dict.nav.service}
              </Link>
              <Link href={`/${locale}#success-stories`} className="block hover:text-yellow-400 transition-colors">
                {dict.nav.successStories}
              </Link>
              <Link href={`/${locale}#about`} className="block hover:text-yellow-400 transition-colors">
                {dict.nav.about}
              </Link>
              <Link href={`/${locale}#contact`} className="block hover:text-yellow-400 transition-colors">
                {dict.nav.contact}
              </Link>
              <Link href={`/${locale}/cases`} className="block hover:text-yellow-400 transition-colors">
                {dict.nav.cases}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            {locale === "zh" ? "杰圆教育" : "JYEdu"}.{" "}
            {dict.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
};

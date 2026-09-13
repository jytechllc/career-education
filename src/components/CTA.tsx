import { ArrowRight, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

export const CTA = ({ dict, locale }: { dict: Dictionary; locale: string }) => {
  return (
    <section className="py-20 md:py-24 bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800 text-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-400/15 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="container mx-auto px-6 text-center relative z-10">
        <Sparkles className="h-10 w-10 mx-auto mb-6 text-yellow-300" />
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{dict.cta.title}</h2>
        <p className="text-yellow-100/90 mb-8 max-w-xl mx-auto text-lg">
          {dict.cta.subtitle}
        </p>
        <a
          href={`/${locale}#contact`}
          className="group bg-white text-yellow-700 px-8 py-3.5 rounded-full font-semibold hover:bg-yellow-50 hover:shadow-lg transition-all duration-300 inline-flex items-center"
        >
          {dict.cta.button}
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </section>
  );
};

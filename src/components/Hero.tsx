import { ArrowRight } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

export const Hero = ({ dict, locale }: { dict: Dictionary; locale: string }) => {
  return (
    <header className="relative bg-gradient-to-br from-yellow-700 via-yellow-800 to-yellow-900 text-white min-h-[500px] md:min-h-[600px] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/85 via-yellow-800/75 to-yellow-700/70" />
      </div>

      <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-56 h-56 bg-yellow-300/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 py-16 md:py-24 relative z-10">
        <div className="md:w-2/3 lg:w-1/2">
          <div className="inline-block bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            {dict.hero.badge}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {dict.hero.title1}
            <br />
            <span className="text-yellow-300">{dict.hero.title2}</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 text-yellow-100/90 leading-relaxed max-w-lg">
            {dict.hero.subtitle}
          </p>
          <a href={`/${locale}#contact`} className="inline-block">
            <button className="bg-white text-yellow-700 px-8 py-3.5 rounded-full font-semibold hover:bg-yellow-50 hover:shadow-lg hover:shadow-yellow-900/20 transition-all duration-300 flex items-center group">
              {dict.hero.cta}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </a>
        </div>
      </div>
    </header>
  );
};

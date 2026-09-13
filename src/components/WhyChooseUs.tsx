import {
  Users,
  Target,
  Building2,
  TrendingUp,
  Calendar,
  HeadphonesIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

const icons = [Users, Target, Building2, TrendingUp, Calendar, HeadphonesIcon];

export const WhyChooseUs = ({ dict }: { dict: Dictionary }) => {
  return (
    <section className="py-20 md:py-24 bg-white" id="about">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-900 mb-4">
            {dict.whyChooseUs.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {dict.whyChooseUs.subtitle}
          </p>
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {dict.whyChooseUs.items.map((text, index) => {
              const Icon = icons[index] ?? Users;
              return (
                <div
                  key={index}
                  className="group flex items-center space-x-4 bg-gray-50 p-5 rounded-xl hover:bg-yellow-50 hover:shadow-md transition-all duration-300 border border-transparent hover:border-yellow-200"
                >
                  <div className="w-11 h-11 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-600 transition-colors duration-300">
                    <Icon className="h-5 w-5 text-yellow-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <span className="text-gray-700 font-medium">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

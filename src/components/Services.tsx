import { Users, Building2, Trophy, ArrowRight } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

const icons = [Users, Building2, Trophy];

export const Services = ({ dict }: { dict: Dictionary }) => {
  return (
    <section className="py-20 md:py-24 bg-yellow-50" id="service">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-900 mb-4">
            {dict.services.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {dict.services.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {dict.services.items.map((service, index) => {
            const Icon = icons[index] ?? Users;
            return (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-yellow-600 transition-colors duration-300">
                  <Icon className="h-7 w-7 text-yellow-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-center text-yellow-600 text-sm font-semibold group-hover:text-yellow-700">
                  {service.highlight}
                  <ArrowRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import { Trophy, Briefcase, Quote } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

const icons = [Trophy, Briefcase];

export const SuccessStories = ({ dict }: { dict: Dictionary }) => {
  return (
    <section className="py-20 md:py-24 bg-yellow-50" id="success-stories">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-yellow-900 mb-4">
            {dict.successStories.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {dict.successStories.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {dict.successStories.items.map((story, index) => {
            const Icon = icons[index] ?? Trophy;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-8 py-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{story.title}</h3>
                  <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-medium">
                    {story.tag}
                  </span>
                </div>
                <div className="p-8">
                  <Quote className="h-8 w-8 text-yellow-200 mb-4" />
                  <p className="text-gray-600 leading-relaxed mb-6">
                    {story.content}
                  </p>
                  <div className="flex items-center text-yellow-600 font-semibold border-t border-gray-100 pt-4">
                    <Icon className="h-5 w-5 mr-2" />
                    <span>{story.achievement}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

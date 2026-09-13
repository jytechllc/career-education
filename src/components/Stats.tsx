"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/dictionaries";

type StatItem = Dictionary["stats"][number];

const useCountUp = (target: number, duration = 2000, shouldStart: boolean) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, shouldStart]);

  return count;
};

const StatCard = ({ stat, shouldAnimate }: { stat: StatItem; shouldAnimate: boolean }) => {
  const count = useCountUp(stat.value, 2000, shouldAnimate);
  return (
    <div className="text-center px-4 py-8">
      <div className="text-4xl md:text-5xl font-bold text-yellow-600 mb-3 tabular-nums">
        {shouldAnimate ? count : 0}
        {stat.suffix}
      </div>
      <div className="w-10 h-1 bg-yellow-400 rounded-full mx-auto mb-3" />
      <p className="text-gray-600 font-medium">{stat.label}</p>
    </div>
  );
};

export const Stats = ({ dict }: { dict: Dictionary }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x divide-yellow-200 max-w-4xl mx-auto">
          {dict.stats.map((stat, index) => (
            <StatCard key={index} stat={stat} shouldAnimate={visible} />
          ))}
        </div>
      </div>
    </section>
  );
};

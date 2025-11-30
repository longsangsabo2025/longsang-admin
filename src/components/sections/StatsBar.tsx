import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const useCountUp = (end: number, shouldStart: boolean, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(end * easeOutQuart);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, shouldStart]);

  return count;
};

export const StatsBar = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const stats = [
    { value: 50, labelKey: "stats.projects", suffix: "+" },
    { value: 100000, labelKey: "stats.linesOfCode", suffix: "+" },
    { value: 8, labelKey: "stats.technologies", suffix: "+" },
    { value: 5, labelKey: "stats.experience", suffix: ` ${t("stats.years")}` },
    { value: 99.9, labelKey: "stats.reliability", suffix: "%" },
    { value: 24, labelKey: "stats.support", suffix: "/7" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section ref={sectionRef} className="relative -mt-12 pb-12">
      <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="relative bg-card/60 backdrop-blur-md border border-border/10 rounded-2xl p-8 md:p-12 shadow-xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <StatItem
                key={stat.labelKey}
                stat={stat}
                shouldAnimate={isVisible}
                delay={index * 100}
                t={t}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface StatItemProps {
  stat: { value: number; labelKey: string; suffix: string };
  shouldAnimate: boolean;
  delay: number;
  t: any;
}

const StatItem = ({ stat, shouldAnimate, delay, t }: StatItemProps) => {
  const count = useCountUp(stat.value, 2000, shouldAnimate);

  const formatNumber = (num: number) => {
    if (stat.value >= 100000) {
      return Math.floor(num).toLocaleString();
    }
    if (stat.labelKey.includes("reliability")) {
      return num.toFixed(1);
    }
    return Math.floor(num);
  };

  return (
    <div
      className="text-center group cursor-default transition-transform hover:scale-105 duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-4xl md:text-5xl font-bold text-primary group-hover:text-accent transition-colors duration-200">
        {formatNumber(count)}
        {shouldAnimate && count > 0 && stat.suffix}
      </div>
      <div className="text-sm md:text-base font-medium text-muted-foreground mt-2">
        {t(stat.labelKey)}
      </div>
    </div>
  );
};

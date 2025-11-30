import { useTranslation } from "react-i18next";

export const ProcessSection = () => {
  const { t } = useTranslation();

  const processSteps = [
    {
      numberKey: "process.step1.number",
      titleKey: "process.step1.title",
      activitiesKey: "process.step1.activities",
    },
    {
      numberKey: "process.step2.number",
      titleKey: "process.step2.title",
      activitiesKey: "process.step2.activities",
    },
    {
      numberKey: "process.step3.number",
      titleKey: "process.step3.title",
      activitiesKey: "process.step3.activities",
    },
    {
      numberKey: "process.step4.number",
      titleKey: "process.step4.title",
      activitiesKey: "process.step4.activities",
    },
  ];

  return (
    <section className="py-8 md:py-16 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-secondary/5" />
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-24 xl:px-32">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">
            {t("process.header")}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            {t("process.subtitle")}
          </h2>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Connecting Line (Desktop Only) */}
          <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-border/30" />

          {/* Steps Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 relative z-10">
            {processSteps.map((step, index) => (
              <div
                key={step.numberKey}
                className="bg-card border border-border/10 rounded-2xl p-6 md:p-8 flex flex-col hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_16px_32px_rgba(0,0,0,0.3)] transition-all duration-300"
                style={{
                  animation: "fade-in 0.6s ease-out forwards",
                  animationDelay: `${index * 250}ms`,
                  opacity: 0,
                }}
              >
                {/* Step Number */}
                <div className="text-5xl font-bold text-primary mb-4 leading-none hover:scale-105 transition-transform duration-200">
                  {t(step.numberKey)}
                </div>

                {/* Step Title */}
                <h3 className="text-2xl font-semibold uppercase tracking-wider text-foreground mb-4">
                  {t(step.titleKey)}
                </h3>

                {/* Activities List */}
                <ul className="space-y-2 text-muted-foreground">
                  {(t(step.activitiesKey, { returnObjects: true }) as string[]).map(
                    (activity: string, actIndex: number) => (
                      <li
                        key={actIndex}
                        className="text-[15px] leading-relaxed flex items-start gap-2"
                      >
                        <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                        <span>{activity}</span>
                      </li>
                    )
                  )}
                </ul>

                {/* Arrow for Desktop (Between Steps) */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-6 text-3xl text-border/20 animate-pulse-soft">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-16 bg-primary/10 border border-primary/30 rounded-xl px-8 py-5 text-center max-w-2xl mx-auto">
          <p className="text-base text-muted-foreground">{t("process.timeline")}</p>
        </div>
      </div>
    </section>
  );
};

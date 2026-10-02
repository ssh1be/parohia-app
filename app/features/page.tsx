import type { Metadata } from "next";
import FeedbackCTA from "../../components/FeedbackCTA";
import { ChapterIndex } from "../../components/features/ChapterNav";
import { FeatureChapters } from "../../components/features/FeatureChapters";
import PageFooter from "../../components/PageFooter";
import PageHeader from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";

export const metadata: Metadata = {
  title: "Features | Parohia",
  description: "Explore the Orthodox calendar, parish schedules, reminders, the bulletin board, volunteering, and confession scheduling in Parohia.",
};

export default function FeaturesPage() {
  return (
    <main className="relative min-h-[100dvh]">
      <div className="ambient-glow pointer-events-none fixed inset-0" aria-hidden />
      <PageHeader />

      <section className="relative z-10 border-b border-zinc-200 dark:border-white/[0.06]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-20 md:pb-16 md:pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center lg:gap-16 lg:px-8 lg:pt-32">
          <Reveal>
            <h1 className="max-w-[12ch] font-display text-5xl leading-[1.04] tracking-[-0.015em] md:text-[64px]">One home for your parish life</h1>
            <p className="mt-5 max-w-[44ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Calendar, schedules, announcements, volunteering, and confession in one place. Every screen below is the real app, so tap around.
            </p>
          </Reveal>
          <ChapterIndex />
        </div>
      </section>

      <div className="relative z-10">
        <FeatureChapters />
      </div>

      <FeedbackCTA />
      <PageFooter />
    </main>
  );
}

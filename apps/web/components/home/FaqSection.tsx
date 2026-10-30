"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { Icon } from "../Icon";
import { Reveal } from "../Reveal";

const FAQS = [
  {
    q: "What is Parohia?",
    a: "Parohia is a mobile companion for Orthodox Christian parish life. It brings the liturgical calendar, parish schedules, announcements, volunteering, and confession booking into one calm place on your phone.",
  },
  {
    q: "Who is it for?",
    a: "Parishioners who want to stay close to the Liturgical year and their community, and parish admins or clergy who need a simple way to share schedules, post updates, and coordinate volunteers.",
  },
  {
    q: "How much does it cost?",
    a: "Parohia is currently free for parishioners and for parishes. The app is fully supported by user donations, so communities can use everything without a subscription.",
  },
  {
    q: "Does it work with my parish calendar?",
    a: "Yes. Parishes can connect their Google Calendar so services and gatherings appear alongside feasts, fasts, and saints. Reminders and chant sign-ups sit right on those events.",
  },
  {
    q: "Is confession scheduling private?",
    a: "Confession times are shared so people can reserve a slot, but the details of a reservation stay between the parishioner and the clergy who manage the schedule. Parohia is built to keep pastoral context respectful.",
  },
  {
    q: "Will it be on iOS and Android?",
    a: "Yes. Parohia is coming to both iOS and Android. Join the waitlist and we’ll let you know when your platform is ready.",
  },
  {
    q: "How does my parish get started?",
    a: "A parish admin creates an account, registers the parish, and invites the community. From there you can connect a calendar, open the bulletin, and turn on the tools your parish needs.",
  },
] as const;

const EASE = [0.16, 1, 0.3, 1] as const;

function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  const reduce = useReducedMotion();
  const panelId = useId();
  const buttonId = useId();

  return (
    <div className="border-b border-zinc-200 dark:border-white/[0.08]">
      <h3>
        <button
          type="button"
          id={buttonId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="group flex w-full items-start justify-between gap-6 py-5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <span className="font-display text-[22px] leading-[1.2] text-zinc-900 sm:text-[26px] dark:text-white">{question}</span>
          <span
            className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center text-zinc-500 transition-all dark:border-white/10 dark:text-zinc-400 ${
              open
                ? "rotate-180"
                : "group-hover:border-zinc-300 dark:group-hover:border-white/20"
            }`}
          >
            <Icon name="chevron-down" size={16} />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-[58ch] pb-6 text-[15px] leading-relaxed text-zinc-600 sm:text-[16px] dark:text-zinc-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-20">
          <Reveal>
            <h2 className="max-w-[12ch] font-display text-[44px] leading-[1.05] tracking-[-0.015em] md:text-6xl">Your questions answered</h2>
            <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              A few things people usually ask before joining the waitlist or bringing Parohia to their parish.
            </p>
            <a
              href="mailto:support@parohia.app"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-red"
            >
              Still curious? Email us
              <Icon name="arrow-forward" size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </Reveal>

          <Reveal delay={0.08} className="min-w-0">
            <div className="border-t border-zinc-200 dark:border-white/[0.08]">
              {FAQS.map((item, i) => (
                <FaqItem
                  key={item.q}
                  question={item.q}
                  answer={item.a}
                  open={openIndex === i}
                  onToggle={() => setOpenIndex((current) => (current === i ? null : i))}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

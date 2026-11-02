import type { Metadata } from "next";
import { Icon } from "../../components/Icon";
import PageFooter from "../../components/PageFooter";
import PageHeader from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";

const DONATE_URL = "https://buymeacoffee.com/parohia";

export const metadata: Metadata = {
  title: "Donate | Parohia",
  description: "Parohia is free for everyone. Support the project with a coffee and help keep it that way for Orthodox parishes.",
};

export default function DonatePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <div className="ambient-glow pointer-events-none fixed inset-0" aria-hidden />
      <PageHeader />

      <section className="relative z-10 flex flex-1 items-center overflow-hidden">
        <div className="page-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-24 pt-16 md:pt-24 lg:px-8">
          <div className="mx-auto max-w-xl text-center">
            <Reveal>
              <img
                src="/App_store_1024_1x.png"
                alt=""
                className="mx-auto h-[72px] w-[72px] rounded-[22px] shadow-[0_24px_48px_-20px_rgba(141,3,0,0.55)]"
              />
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-10 font-display text-5xl leading-[1.04] tracking-[-0.015em] md:text-[64px]">Support our platform</h1>
              <p className="mx-auto mt-5 max-w-[40ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Parohia is free for everyone. If it helps your parish, a coffee goes a long way toward keeping it that way!
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <a
                href={DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-8 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                <Icon name="cafe-outline" size={17} />
                Buy me a coffee
                <Icon name="open-outline" size={14} className="opacity-80" />
              </a>

              <div className="mt-12">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
                >
                  <Icon name="arrow-back" size={15} />
                  Back to home
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}

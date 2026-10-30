import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

export default function FeedbackCTA() {
  return (
    <section className="relative z-10 overflow-hidden px-6 py-20 md:py-28">
      <div className="page-grid pointer-events-none absolute inset-0" aria-hidden />
      <Reveal className="relative mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FA433F] to-[#8D0300] px-8 py-14 text-white md:px-16 md:py-20">
          <img
            src="/App_store_1024_1x.png"
            alt=""
            className="pointer-events-none absolute -right-24 -top-24 w-[420px] opacity-25 blur-3xl"
          />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-[40px] leading-[1.08] md:text-[56px]">We want to hear from you</h2>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-white/85">
              Feedback from Orthodox clergy and parishioners shapes every part of Parohia. Tell us what your parish needs.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/notify"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#8D0300] transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                Join the waitlist
                <Icon name="arrow-forward" size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </a>
              <a
                href="mailto:support@parohia.app"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Icon name="mail-outline" size={16} />
                support@parohia.app
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

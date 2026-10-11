import { Icon } from "../../../components/Icon";
import PageFooter from "../../../components/PageFooter";
import PageHeader from "../../../components/PageHeader";
import { Reveal } from "../../../components/Reveal";

export default function NotifySuccessPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <div className="ambient-glow pointer-events-none fixed inset-0" aria-hidden />
      <PageHeader />

      <section className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-16 md:pt-24 lg:px-8">
          <Reveal className="max-w-2xl">
            <span className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
              <Icon name="checkmark-circle" size={28} color="#10B981" />
            </span>
            <h1 className="font-display text-5xl leading-[1.04] tracking-[-0.015em] md:text-7xl">You&apos;re on the list!</h1>
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">Thanks for signing up! We&apos;ll email you when Parohia is ready.</p>
            <a href="/" className="mt-12 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white">
              <Icon name="arrow-back" size={15} />
              Back to home
            </a>
          </Reveal>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}

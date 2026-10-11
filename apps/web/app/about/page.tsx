import AuthorPhoto from "../../components/AuthorPhoto";
import { Icon } from "../../components/Icon";
import PageFooter from "../../components/PageFooter";
import PageHeader from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";

export default function AboutPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <div className="ambient-glow pointer-events-none fixed inset-0" aria-hidden />
      <PageHeader />

      <section className="relative z-10 flex-1">
        <div className="mx-auto grid max-w-6xl items-start gap-14 px-6 pb-24 pt-16 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:pt-24 lg:px-8">
          <Reveal>
            <h1 className="font-display text-5xl leading-[1.04] tracking-[-0.015em] md:text-7xl">About Parohia</h1>
            <h2 className="mt-12 font-display text-[30px] leading-tight">Our team</h2>
            <p className="mt-4 max-w-[60ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Parohia is currently being built and maintained by me, <span className="font-semibold text-zinc-900 dark:text-white">Alexandru Perussi</span>, a
              Computer Science student from Oregon State University. I was raised in the Orthodox Church and began Parohia as a personal project to help
              parishes stay organized and connected. The ultimate goal is to help us further embrace our precious faith daily.
            </p>
            <a
              href="mailto:support@parohia.app"
              className="mt-10 inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 px-6 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
            >
              <Icon name="mail-outline" size={16} />
              Get in touch
            </a>
          </Reveal>
          <Reveal delay={0.1} className="md:sticky md:top-28">
            <AuthorPhoto
              src="/alexandru2.webp"
              alt="Alexandru Perussi"
              fallbackSrc="/alexandru2.jpg"
              className="aspect-[4/5] w-full max-w-sm rounded-[28px] object-cover shadow-[0_40px_80px_-40px_rgba(9,9,11,0.45)] md:ml-auto"
            />
          </Reveal>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}

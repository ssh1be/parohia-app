import AuthorPhoto from "../../components/AuthorPhoto";
import PageHeader from "../../components/PageHeader";
import PageFooter from "../../components/PageFooter";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      <PageHeader />

      <section className="relative z-10 flex-1">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 md:pt-24 pb-20">
          {/* Page title */}
          <div className="max-w-3xl">
            <p className="font-sans text-sm font-medium text-brand-red tracking-widest uppercase mb-4">
              Our Story
            </p>
            <h1 className="text-4xl font-semibold sm:text-5xl">
              About Parohia
            </h1>
          </div>

          {/* Team section */}
          <div className="mt-12 grid gap-10 md:grid-cols-2 items-start">
            <div className="order-1 md:order-1 mt-4 md:mt-8">
              <h2 className="text-xl font-semibold">Our Team</h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Parohia is currently being built and maintained by me,{" "}
                <span className="text-zinc-900 dark:text-white font-medium">Alexandru Perussi</span>,
                a Computer Science student from Oregon State University. I was
                raised in the Orthodox Church and began Parohia as a personal
                project to help parishes stay organized and connected. The
                ultimate goal is to help us further embrace our precious faith
                daily.
              </p>
            </div>

            <div className="order-2 md:order-2 md:self-start">
              <div className="relative inline-block rounded-2xl p-3 mx-auto md:ml-auto md:sticky md:top-28">
                <AuthorPhoto
                  src="/alexandru2.webp"
                  alt="Alexandru Perussi"
                  fallbackSrc="/alexandru2.jpg"
                  className="h-64 w-64 md:h-80 md:w-80 rounded-2xl object-cover shadow-lg shadow-zinc-300/40 dark:shadow-black/40"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PageHeader from "../../../components/PageHeader";
import PageFooter from "../../../components/PageFooter";

export default function NotifySuccessPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      <PageHeader />

      <section className="relative z-10 flex-1">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-16 md:pt-24 pb-20">
          <div className="max-w-2xl">
            <CheckCircle2 className="h-12 w-12 text-green-400 mb-6" />
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              You&apos;re on the list!
            </h1>
            <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Thanks for signing up! We&apos;ll email you when Parohia is ready.
            </p>

            <div className="mt-10">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </main>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "../../components/Icon";
import PageFooter from "../../components/PageFooter";
import PageHeader from "../../components/PageHeader";
import { Reveal } from "../../components/Reveal";

export default function NotifyPage() {
  const [submitting, setSubmitting] = useState(false);

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmitting(true);
    try {
      await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as any).toString(),
      });
      window.location.assign("/notify/success");
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <div className="ambient-glow pointer-events-none fixed inset-0" aria-hidden />
      <PageHeader />

      <section className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-16 md:pt-24 lg:px-8">
          <Reveal className="max-w-2xl">
            <h1 className="font-display text-5xl leading-[1.04] tracking-[-0.015em] md:text-7xl">Join the waitlist</h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Parohia is still in development. Leave us your email and we&apos;ll let you know about updates, beta tests, and the public release.
            </p>

            <form name="notify" onSubmit={handleFormSubmit} className="mt-10">
              <input type="hidden" name="form-name" value="notify" />
              <p className="hidden">
                <label>
                  Don&apos;t fill this out if you&apos;re human:
                  <input name="bot-field" />
                </label>
              </p>
              <label htmlFor="notify-email" className="mb-2 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Email address
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="notify-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-12 flex-1 rounded-full border border-zinc-200 bg-white px-5 text-[15px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-brand-red/60 focus:ring-4 focus:ring-brand-red/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-600"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-7 text-sm font-semibold text-white shadow-lg shadow-brand-red/25 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-70"
                >
                  {submitting ? "Sending..." : "Notify me"}
                </button>
              </div>
              <p className="mt-3 text-sm text-zinc-500">No spam. Only news about Parohia.</p>
            </form>

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

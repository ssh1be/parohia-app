import type { Metadata } from "next";
import PageFooter from "../../components/PageFooter";
import PageHeader from "../../components/PageHeader";

export const metadata: Metadata = {
  title: "Delete your Parohia account | Parohia",
  description:
    "How to delete your Parohia account and what personal data is removed or retained when you do.",
};

export default function DeleteAccountPage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col">
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      <PageHeader />

      <div className="relative z-10 mx-auto flex-1 max-w-3xl px-6 py-12 md:py-16 lg:px-8">
        <p className="mb-4 font-sans text-sm font-medium tracking-widest text-brand-red uppercase">Parohia</p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-[-0.015em] md:text-6xl">Delete your account</h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          This page explains how to request deletion of your <strong className="font-semibold text-zinc-900 dark:text-white">Parohia</strong>{" "}
          account and associated data. Parohia is the Orthodox parish companion app published by Parohia.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-[28px] leading-tight">How to delete your account</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            The fastest way is to delete from inside the app or web dashboard while signed in:
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>
              <strong className="text-zinc-900 dark:text-white">On mobile (iOS or Android):</strong> Open Parohia → Profile / Settings →{" "}
              <em>Delete account</em> (parish administrators see <em>Delete account &amp; parish</em>). Confirm when prompted.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">On the web dashboard:</strong> Sign in at{" "}
              <a href="/login" className="underline underline-offset-4 decoration-zinc-300 hover:text-brand-red dark:decoration-white/20">
                parohia.app/login
              </a>{" "}
              → Settings → <em>Delete account</em> (or <em>Delete parish account</em> if you administer a parish). Confirm when prompted.
            </li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[28px] leading-tight">Request deletion by email</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            If you cannot access the app, email{" "}
            <a
              href="mailto:support@parohia.app?subject=Delete%20Parohia%20account"
              className="font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:text-brand-red dark:text-white dark:decoration-white/20"
            >
              support@parohia.app
            </a>{" "}
            from the address on your Parohia account. Include:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>The subject line <strong className="text-zinc-900 dark:text-white">Delete Parohia account</strong></li>
            <li>The email address used to sign in</li>
            <li>Your full name as shown in the app (if you remember it)</li>
          </ul>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            We verify ownership of the account, then delete it. We aim to complete email requests within{" "}
            <strong className="text-zinc-900 dark:text-white">30 days</strong>.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[28px] leading-tight">Data that is deleted</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">When your account is deleted, we remove:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>Your authentication account (email/password login)</li>
            <li>Your profile (name, email, phone number, user type)</li>
            <li>Your parish membership connection</li>
            <li>Push notification tokens for your devices</li>
            <li>Your confession reservations and bulletin / volunteer responses</li>
            <li>Bulletin posts and related content you authored</li>
            <li>Channel subscriptions and channel-manager assignments tied to you</li>
            <li>On-device preferences stored by the app on that device after you sign out or reinstall</li>
          </ul>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <strong className="text-zinc-900 dark:text-white">If you are a parish administrator</strong> and you delete your parish account, we also
            delete that parish record and parish-managed data (schedules, bulletin channels and posts for the parish, confession schedules, and
            member connections to that parish). Other members keep their personal accounts and are asked to choose a parish again on next sign-in.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-[28px] leading-tight">Data that may be kept</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>
              <strong className="text-zinc-900 dark:text-white">Limited operational logs</strong> (for example security or server logs) may be retained
              for a short period for safety and abuse prevention, then deleted or aggregated so they no longer identify you.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Backups</strong> may briefly contain deleted data until rotated. We do not use backup
              copies to restore a deleted account once deletion is complete.
            </li>
            <li>
              <strong className="text-zinc-900 dark:text-white">Anonymous performance metrics</strong> (for example app startup timings via our
              infrastructure partners) are not tied to your name or email and are retained only for a limited diagnostic window.
            </li>
            <li>
              Content others still need for the parish may remain in anonymized or detached form where it was never solely your personal account data
              (for example another member&apos;s post). Your authored posts are removed as described above.
            </li>
          </ul>
        </section>

        <section className="mt-12 mb-12">
          <h2 className="font-display text-[28px] leading-tight">Contact</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Questions about account deletion:{" "}
            <a
              href="mailto:support@parohia.app"
              className="font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:text-brand-red dark:text-white dark:decoration-white/20"
            >
              support@parohia.app
            </a>
            . See also our{" "}
            <a href="/privacy" className="underline underline-offset-4 decoration-zinc-300 hover:text-brand-red dark:decoration-white/20">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </div>

      <PageFooter />
    </main>
  );
}

import PageHeader from "../../components/PageHeader";
import PageFooter from "../../components/PageFooter";

export const metadata = {
  title: "Privacy Policy — Parohia",
  description:
    "Parohia Privacy Policy (WIP). How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen flex flex-col">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 ambient-glow" aria-hidden />

      <PageHeader />

      <div className="relative z-10 flex-1 mx-auto max-w-3xl px-6 lg:px-8 py-12 md:py-16">
        <p className="text-sm font-medium text-brand-red tracking-wide uppercase mb-4">
          Legal
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          <strong>Effective Date:</strong>{" "}
          <span className="text-zinc-400">August 20, 2025</span>
        </p>

        <p className="mt-8 text-zinc-300 leading-relaxed">
          Parohia (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us&rdquo;) respects your
          privacy. This Privacy Policy explains how we collect, use, and protect
          your information.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-300 leading-relaxed">
            <li>
              <strong className="text-white">Account Information:</strong> When you
              create an account, we collect details such as your name, email, and
              parish information.
            </li>
            <li>
              <strong className="text-white">User Content:</strong> Any content you
              create or upload in the app.
            </li>
            <li>
              <strong className="text-white">Usage Data:</strong> Basic technical data
              such as device type and app usage statistics.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">2. How We Use Information</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-300 leading-relaxed">
            <li>To provide and improve the app&apos;s functionality.</li>
            <li>To manage accounts and user content.</li>
            <li>To ensure community safety and prevent misuse.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. Data Storage</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-300 leading-relaxed">
            <li>
              We store and process data via <strong className="text-white">Supabase</strong>,
              a third-party cloud service provider.
            </li>
            <li>
              We do not sell, rent, or share your data with advertisers or other
              third parties.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">4. Data Sharing</h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            We may share data only when required by law, regulation, or legal
            process.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">5. Security</h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            We take reasonable measures to protect your information, but no
            system is 100% secure. Use the app at your own risk.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Children&apos;s Privacy</h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            Parohia is not intended for children under 13. We do not knowingly
            collect information from children under this age.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            Depending on your location, you may have rights to access, update,
            or delete your data. You may request these by contacting us.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            We may update this Privacy Policy from time to time. Updates will be
            posted in the app with a new effective date.
          </p>
        </section>

        <section className="mt-10 mb-12">
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p className="mt-4 text-zinc-300 leading-relaxed">
            For any questions about this Privacy Policy, contact us by email:{" "}
            <a
              href="mailto:support@parohia.app"
              className="text-white hover:text-brand-red transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-brand-red/50"
            >
              support@parohia.app
            </a>
          </p>
        </section>
      </div>

      <PageFooter />
    </main>
  );
}

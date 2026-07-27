import PageHeader from "../../components/PageHeader";
import PageFooter from "../../components/PageFooter";

export const metadata = {
  title: "Terms of Service — Parohia",
  description:
    "Parohia Terms of Service (WIP). Please read these terms before using the app.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          <strong>Effective Date:</strong>{" "}
          <span className="text-zinc-600 dark:text-zinc-400">August 20, 2025</span>
        </p>

        <p className="mt-8 text-zinc-700 dark:text-zinc-300 leading-relaxed">
          Welcome to <strong className="text-zinc-900 dark:text-white">Parohia</strong>. By using our
          app, you agree to these Terms of Service (&ldquo;Terms&rdquo;). Please
          read them carefully before using Parohia.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Eligibility</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            You must be at least 13 years old to use Parohia. By creating an
            account, you represent that you meet this age requirement.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">2. Accounts</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>To use certain features, you must create an account.</li>
            <li>
              You are responsible for maintaining the confidentiality of your
              login information.
            </li>
            <li>
              You are responsible for all activities that occur under your
              account.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. User Content</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>
              You may create, upload, or share content (including text, images,
              or other materials).
            </li>
            <li>You retain ownership of your content.</li>
            <li>
              By submitting content, you grant Parohia a worldwide,
              non-exclusive, royalty-free license to use, store, and display it
              solely for the app&apos;s functionality.
            </li>
            <li>You agree not to post unlawful, harmful, or abusive content.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            4. Feedback &amp; Suggestions
          </h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            If you provide feedback, ideas, or suggestions, you agree that we
            may use them without compensation, credit, or obligation to you.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">5. Prohibited Uses</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            You agree not to:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <li>Violate any applicable law or regulation.</li>
            <li>
              Upload malicious code or attempt to disrupt the service.
            </li>
            <li>Misuse the platform for spam or abuse.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Termination</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate
            these Terms or disrupt the platform.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            7. Disclaimer of Warranties
          </h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Parohia is provided &ldquo;as is&rdquo; without warranties of any
            kind. We do not guarantee uninterrupted or error-free service.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            8. Limitation of Liability
          </h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            To the maximum extent permitted by law, Parohia and its owner are
            not liable for any damages resulting from use of the app.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">9. Governing Law</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            These Terms are governed by the laws of the{" "}
            <strong className="text-zinc-900 dark:text-white">State of Oregon, USA</strong>, without
            regard to conflict of law principles.
          </p>
        </section>

        <section className="mt-10 mb-12">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p className="mt-4 text-zinc-700 dark:text-zinc-300 leading-relaxed">
            For any questions about these Terms, contact us by email:{" "}
            <a
              href="mailto:support@parohia.app"
              className="text-zinc-900 dark:text-white hover:text-brand-red transition-colors underline underline-offset-4 decoration-zinc-300 dark:decoration-white/20 hover:decoration-brand-red/50"
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

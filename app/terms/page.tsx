export const metadata = {
  title: 'Terms of Service — Parohia',
  description: 'Parohia Terms of Service (WIP). Please read these terms before using the app.'
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="pointer-events-none absolute inset-0 red-glow" aria-hidden />
      <header className="relative">
        <div className="mx-auto max-w-7xl container-padding py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/App_store_1024_1x.png" alt="Parohia icon" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-semibold tracking-tight">Parohia</span>
          </a>
        </div>
      </header>
      <div className="relative mx-auto max-w-3xl container-padding py-8 md:py-12">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-zinc-400"><strong>Effective Date:</strong> <span className="text-white/70">August 20, 2025</span></p>

        <p className="mt-8 text-zinc-200">
          Welcome to <strong>Parohia</strong>. By using our app, you agree to these Terms of Service (“Terms”). Please read them carefully before using Parohia.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Eligibility</h2>
          <p className="mt-4 text-zinc-200">You must be at least 13 years old to use Parohia. By creating an account, you represent that you meet this age requirement.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">2. Accounts</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
            <li>To use certain features, you must create an account.</li>
            <li>You are responsible for maintaining the confidentiality of your login information.</li>
            <li>You are responsible for all activities that occur under your account.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. User Content</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
            <li>You may create, upload, or share content (including text, images, or other materials).</li>
            <li>You retain ownership of your content.</li>
            <li>By submitting content, you grant Parohia a worldwide, non-exclusive, royalty-free license to use, store, and display it solely for the app’s functionality.</li>
            <li>You agree not to post unlawful, harmful, or abusive content.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">4. Feedback & Suggestions</h2>
          <p className="mt-4 text-zinc-200">If you provide feedback, ideas, or suggestions, you agree that we may use them without compensation, credit, or obligation to you.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">5. Prohibited Uses</h2>
          <p className="mt-4 text-zinc-200">You agree not to:</p>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
            <li>Violate any applicable law or regulation.</li>
            <li>Upload malicious code or attempt to disrupt the service.</li>
            <li>Misuse the platform for spam or abuse.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Termination</h2>
          <p className="mt-4 text-zinc-200">We reserve the right to suspend or terminate accounts that violate these Terms or disrupt the platform.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">7. Disclaimer of Warranties</h2>
          <p className="mt-4 text-zinc-200">Parohia is provided “as is” without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">8. Limitation of Liability</h2>
          <p className="mt-4 text-zinc-200">To the maximum extent permitted by law, Parohia and its owner are not liable for any damages resulting from use of the app.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">9. Governing Law</h2>
          <p className="mt-4 text-zinc-200">These Terms are governed by the laws of the <strong>State of Oregon, USA</strong>, without regard to conflict of law principles.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">10. Contact</h2>
          <p className="mt-4 text-zinc-200">For any questions about these Terms, contact us by email: <strong>support@parohia.app</strong></p>
        </section>
        <footer className="mb-12"/>
      </div>
      <footer id="contact" className="relative z-10 border-t border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <div className="mx-auto max-w-7xl container-padding py-10 text-sm text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2">
              <img src="/App_store_1024_1x.png" alt="Parohia icon" className="h-8 w-8 rounded-lg" />
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-semibold tracking-tight text-white">Parohia</span>
              </div>
            </a>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="mailto:support@parohia.app" className="hover:text-white">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}



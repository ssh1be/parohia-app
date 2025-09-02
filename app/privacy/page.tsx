export const metadata = {
  title: 'Privacy Policy — Parohia',
  description: 'Parohia Privacy Policy (WIP). How we collect, use, and protect your information.'
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-zinc-400"><strong>Effective Date:</strong> <span className="text-white/70">August 20, 2025</span></p>

        <p className="mt-8 text-zinc-200">
          Parohia (“we,” “our,” “us”) respects your privacy. This Privacy Policy explains how we collect, use, and protect your information.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">1. Information We Collect</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
            <li><strong>Account Information:</strong> When you create an account, we collect details such as your name, email, and parish information.</li>
            <li><strong>User Content:</strong> Any content you create or upload in the app.</li>
            <li><strong>Usage Data:</strong> Basic technical data such as device type and app usage statistics.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">2. How We Use Information</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
            <li>To provide and improve the app’s functionality.</li>
            <li>To manage accounts and user content.</li>
            <li>To ensure community safety and prevent misuse.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">3. Data Storage</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-200">
            <li>We store and process data via <strong>Supabase</strong>, a third-party cloud service provider.</li>
            <li>We do not sell, rent, or share your data with advertisers or other third parties.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">4. Data Sharing</h2>
          <p className="mt-4 text-zinc-200">We may share data only when required by law, regulation, or legal process.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">5. Security</h2>
          <p className="mt-4 text-zinc-200">We take reasonable measures to protect your information, but no system is 100% secure. Use the app at your own risk.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">6. Children’s Privacy</h2>
          <p className="mt-4 text-zinc-200">Parohia is not intended for children under 13. We do not knowingly collect information from children under this age.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p className="mt-4 text-zinc-200">Depending on your location, you may have rights to access, update, or delete your data. You may request these by contacting us.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
          <p className="mt-4 text-zinc-200">We may update this Privacy Policy from time to time. Updates will be posted in the app with a new effective date.</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">9. Contact</h2>
          <p className="mt-4 text-zinc-200">For any questions about this Privacy Policy, contact us by email: <strong>support@parohia.app</strong></p>
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



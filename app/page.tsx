
import StackCarousel from "../components/StackCarousel";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 red-glow" aria-hidden />

      <header className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding py-6 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/App_store_1024_1x.png" alt="Parohia icon" className="h-12 w-12 rounded-lg" />
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold tracking-tight">Parohia</span>
              <span className="text-xs text-white/70">Embrace the Orthodox faith</span>
            </div>
          </a>
          {/* <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#community" className="hover:text-white">Community</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </nav> */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/features"
              className="rounded-md bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
            >
              Learn more
            </a>
            <a
              href="/notify"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
              style={{ background: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)' }}
            >
              Notify me
            </a>
          </div>
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-3xl">
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              A Modern Companion for an Ancient Faith.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-zinc-300">
              Parohia helps you connect to your Orthodox community, learn about the faith, and stay on top of services and events — wherever you are.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/notify"
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)' }}
              >
                Notify me
              </a>
              <a
                href="/features"
                className="inline-flex items-center justify-center rounded-md bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10"
              >
                Explore features
              </a>
            </div>
          </div>
        </div>
        
          <div className="mt-10 md:hidden">
            <img
              src="/mockup1.png"
              alt="Parohia preview"
              className="mx-auto w-full max-w-sm"
            />
          </div>
         <div className="hidden md:block absolute right-0 top-0 -translate-x-1/2 translate-y-0 -z-30">
             <img
               src="/mockup1.png"
               alt="Parohia preview"
               className="w-full max-w-lg"
             />
         </div>
        
      </section>

      <section id="features" className="relative z-10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl container-padding pt-16 md:pt-24 pb-10 md:pb-16">
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              title="Orthodox Calendar"
              description="Fast days, feasts, saints — beautifully presented alongside daily readings."
              iconName="calendar-outline"
            />
            <FeatureCard
              title="Parish Connection"
              description="Follow announcements, schedule confessions, volunteer, and stay involved in your community."
              iconName="people-outline"
            />
            <FeatureCard
              title="Daily Reminders"
              description="Receive customizable daily notifications for services, parish events, and more."
              iconName="notifications-outline"
            />
          </div>
        </div>
        {/* <div className="hidden md:block absolute right-1/2 top-0 -z-30 -translate-x-20 translate-y-20">
            <img
              src="/mockup2.png"
              alt="Parohia preview"
              className="w-full max-w-2xl"
            />
        </div>
        <div className="hidden md:block absolute right-0 top-0 -z-30 -translate-x-64 translate-y-48">
            <img
              src="/mockup32.png"
              alt="Parohia preview"
              className="w-full max-w-3xl"
            />
        </div> */}
        
      </section>

      <section id="screenshots" className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding py-8 md:py-6">
          <StackCarousel
            images={[
              { src: "/home.png", alt: "Home screen" },
              { src: "/calendar.png", alt: "Orthodox calendar view" },
              { src: "/calendar2.png", alt: "Calendar details and readings" },
              { src: "/events.png", alt: "Parish events list" },
              { src: "/events2.png", alt: "Event details screen" },
            ]}
          />
        </div>
      </section>
      <section id="cta" className="relative z-10">
        <div className="mx-auto max-w-5xl container-padding py-16 md:py-24">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-sm">
            <h2 className="text-2xl md:text-3xl font-bold">We want to hear from you.</h2>
            <p className="mt-3 text-zinc-300">
              Feedback and suggestions from Orthodox clergy and parishioners alike is invaluable to us.<br />
              Please share your thoughts and ideas at <a href="mailto:support@parohia.app" className="text-white">support@parohia.app</a>
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="/notify"
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)' }}
              >
                Join our newsletter
              </a>
              <a
                href="/about"
                className="inline-flex items-center justify-center rounded-md bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10"
              >
                About us
              </a>
            </div>
          </div>
        </div>
      </section>
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

function FeatureCard({ title, description, iconName}: { title: string; description: string; iconName: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="mb-4 h-10 w-10 rounded-md flex items-center justify-center text-white"
           style={{ background: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)' }}
           aria-hidden>
        <ion-icon name={iconName} className="h-6 w-6 md hydrated" role="img"></ion-icon>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
    </div>
  )
}



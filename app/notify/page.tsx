"use client";

import { useState } from "react";

export default function NotifyPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        setStatus("success");
        setMessage("Thanks! We'll email you when Parohia is ready.");
        setEmail("");
      } else {
        const data = await response.json().catch(() => ({}));
        setStatus("error");
        setMessage(data?.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 red-glow" aria-hidden />

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl container-padding pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="max-w-2xl">
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">Get notified about Parohia!</h1>
            <p className="mt-6 text-lg text-zinc-300">
              Parohia is still in development. Leave your email and we'll let you know about
              updates and the public release.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full sm:w-auto flex-1 rounded-md bg-white/5 px-4 py-3 text-sm text-white placeholder-white/50 outline-none ring-1 ring-inset ring-white/10 focus:ring-white/20"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #FA433F 0%, #8D0300 100%)" }}
              >
                {status === "loading" ? "Submitting…" : "Notify me"}
              </button>
            </form>

            {message && (
              <p className={`mt-4 text-sm ${status === "error" ? "text-red-300" : "text-green-300"}`}>
                {message}
              </p>
            )}

            <div className="mt-8">
              <a href="/" className="inline-flex items-center gap-1 text-sm text-zinc-300 hover:text-white">
                <ion-icon name="arrow-back" className="h-4 w-4 hydrated md" role="img"></ion-icon>
                Back to home
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}



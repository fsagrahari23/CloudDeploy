"use client";
import { signIn } from "next-auth/react";
import { useSession } from "next-auth/react";
import Reveal from "@/components/Reveal";
import Link from "next/link";
import { Sparkles, Zap, ArrowRight } from "lucide-react";

export default function Hero() {
  const { data: session } = useSession();
  const signedIn = Boolean(session);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-card shadow-xl">
      {/* Enhanced background effects */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_top,oklch(1_0_0/20%)_0%,transparent_50%)] dark:[background:radial-gradient(ellipse_at_top,oklch(0.2_0_0/40%)_0%,transparent_50%)]" />
      
      {/* Animated gradient mesh */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-blob" />
        <div className="absolute top-0 -right-4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_49%,oklch(0_0_0/3%)_50%,transparent_51%,transparent_100%)] bg-size-[20px_100%]" />
      
      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32 text-center">
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm">
            <Sparkles size={16} className="animate-pulse-soft" />
            <span>Deploy in Seconds, Not Hours</span>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mx-auto max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Ship Your{" "}
            <span className="bg-linear-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Websites Instantly
            </span>
            {" "}from GitHub
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground/90 leading-relaxed">
            Connect your repository, deploy with one click, and watch your site go live in real-time. 
            No complex setup. No waiting. Just pure deployment magic.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {signedIn ? (
              <Link 
                href="/dashboard" 
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
              >
                Go to Dashboard
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signIn("google", { callbackUrl: "/dashboard", redirect: true });
                  } catch (e) {
                    window.location.href = "/api/auth/signin";
                  }
                }}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
              >
                <Zap size={18} className="animate-pulse-soft" />
                Get Started Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <a 
              href="#features" 
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-8 text-base font-medium backdrop-blur-sm transition-all hover:scale-105 hover:bg-accent"
            >
              Explore Features
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Deploy in 30 seconds</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

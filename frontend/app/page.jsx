"use client";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-20 py-12 sm:py-16">
          <Hero />
          <Features />
        </div>
      </div>
    </div>
  );
}

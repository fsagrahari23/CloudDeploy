import { Lock, Github, Globe, TerminalSquare, Rocket, Palette } from "lucide-react";
import Reveal from "@/components/Reveal";

const items = [
  {
    icon: Lock,
    title: "Secure Authentication",
    desc: "Enterprise-grade security powered by NextAuth with OAuth 2.0.",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    desc: "Seamlessly connect and browse all your repositories in one place.",
  },
  {
    icon: Rocket,
    title: "One-Click Deploy",
    desc: "Deploy any project instantly with a single click. No configuration needed.",
  },
  {
    icon: TerminalSquare,
    title: "Live Build Logs",
    desc: "Watch your deployment happen in real-time with streaming logs.",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    desc: "Automatic preview URLs with support for custom domain mapping.",
  },
  {
    icon: Palette,
    title: "Beautiful Themes",
    desc: "Stunning light and dark modes designed for optimal visibility.",
  },
];

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6">
      <div className="mb-12 text-center">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need to Deploy
          </h2>
        </Reveal>
        <Reveal delay={0.05}>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that make deployment effortless and enjoyable
          </p>
        </Reveal>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 0.05}>
            <div className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/50 hover:-translate-y-1">
              {/* Icon with gradient background */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10">
                <Icon size={24} className="text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {desc}
              </p>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

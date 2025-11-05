"use client";
import { Github, Twitter, Linkedin, Mail, Heart, Rocket } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Documentation", href: "#docs" },
      { name: "API", href: "#api" },
    ],
    company: [
      { name: "About", href: "#about" },
      { name: "Blog", href: "#blog" },
      { name: "Careers", href: "#careers" },
      { name: "Contact", href: "#contact" },
    ],
    legal: [
      { name: "Privacy", href: "#privacy" },
      { name: "Terms", href: "#terms" },
      { name: "Security", href: "#security" },
      { name: "Status", href: "#status" },
    ],
    social: [
      { name: "GitHub", icon: Github, href: "https://github.com" },
      { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
      { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com" },
      { name: "Email", icon: Mail, href: "mailto:support@clouddeploy.com" },
    ],
  };

  return (
    <footer className="relative mt-20 border-t border-border/50 bg-card">
      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-primary/5 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Rocket size={24} className="text-primary" />
                </div>
                <span className="text-lg font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Cloud_Deploy
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Deploy your projects instantly with our modern, fast, and reliable platform.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {footerLinks.social.map(({ name, icon: Icon, href }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent hover:border-primary/50 transition-all"
                    aria-label={name}
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © {currentYear} Cloud_Deploy. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse-soft" /> by developers, for developers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

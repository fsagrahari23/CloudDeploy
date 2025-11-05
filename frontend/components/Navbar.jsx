"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { signIn, signOut, useSession } from "next-auth/react";
import { Sun, Moon, LogIn, LogOut, Menu, X } from "lucide-react";

export default function Navbar() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  if (!mounted) {
    // Avoid SSR/extension attribute mismatches by rendering nothing until mounted
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ⚙︎ C L ⦾ U D ⚙︎ D E P L O Y ◆
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {session ? (
              <>
                <a 
                  href="/dashboard" 
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Dashboard
                </a>
                <a 
                  href="/projects" 
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  Projects
                </a>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent inline-flex items-center gap-2 transition-colors"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut size={16} />
                  <span className="hidden lg:inline">Sign out</span>
                </button>
              </>
            ) : (
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
                onClick={async () => {
                  try {
                    await signIn("google", { callbackUrl: "/dashboard", redirect: true });
                  } catch (e) {
                    window.location.href = "/api/auth/signin";
                  }
                }}
              >
                <LogIn size={16} /> Sign in
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {currentTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              aria-label="Toggle menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {session ? (
              <>
                <a 
                  href="/dashboard" 
                  className="block px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
                <a 
                  href="/projects" 
                  className="block px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Projects
                </a>
                <button
                  className="w-full px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent inline-flex items-center gap-2 transition-colors"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </>
            ) : (
              <button
                className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground inline-flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  try {
                    await signIn("google", { callbackUrl: "/dashboard", redirect: true });
                  } catch (e) {
                    window.location.href = "/api/auth/signin";
                  }
                }}
              >
                <LogIn size={16} /> Sign in
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

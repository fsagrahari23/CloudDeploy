"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReduxProvider } from "@/store";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ReduxProvider>{children}</ReduxProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

import "./globals.css";
import Providers from "@/providers/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "⚙︎ CL⦾UD ⚙︎ DEPLOY ◆",
  description: "Professional deployment platform - Deploy your projects instantly",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

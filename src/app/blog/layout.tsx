import type { Metadata } from "next";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { BLOG_CATEGORIES } from "@/types/blog";

export const metadata: Metadata = {
  title: {
    template: "%s | GamerHub Blog",
    default: "GamerHub Blog - Gaming News, Guides & Analysis",
  },
  description:
    "The latest gaming news, pro player guides, strategy analysis, and esports coverage for Valorant, CS2, PUBG, Free Fire and more.",
  openGraph: {
    siteName: "GamerHub",
    type: "website",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Public blog header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-xl font-bold text-primary hover:text-primary-dark transition-colors"
          >
            <Gamepad2 className="w-6 h-6" />
            <span>
              GamerHub <span className="text-text font-normal">Blog</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Home
            </Link>
            <Link
              href="/community"
              className="text-sm text-text-secondary hover:text-text transition-colors"
            >
              Community
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

      {/* Footer with SEO internal links */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <Link
                href="/blog"
                className="flex items-center gap-2 text-lg font-bold text-primary mb-3"
              >
                <Gamepad2 className="w-5 h-5" />
                GamerHub Blog
              </Link>
              <p className="text-text-muted text-sm leading-relaxed">
                Gaming news, guides, and analysis from the community. Join
                thousands of gamers sharing their knowledge.
              </p>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">
                Categories
              </h3>
              <ul className="space-y-2">
                {Object.entries(BLOG_CATEGORIES).map(([key, { label }]) => (
                  <li key={key}>
                    <Link
                      href={`/blog?category=${key}`}
                      className="text-sm text-text-muted hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h3 className="text-sm font-semibold text-text mb-3 uppercase tracking-wider">
                Join GamerHub
              </h3>
              <p className="text-text-muted text-sm mb-4">
                Create your profile, find teammates, and share your gaming
                knowledge with the community.
              </p>
              <Link
                href="/register"
                className="inline-block px-5 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dark transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border text-center text-text-dim text-xs">
            &copy; {new Date().getFullYear()} GamerHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Gamepad2,
  Star,
  ArrowRight,
  Shield,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Target,
  Crown,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/hooks/useAuth";
import { useGames } from "@/lib/hooks/useGames";

const features = [
  {
    icon: Star,
    title: "Peer Ratings",
    description:
      "Get rated by teammates and opponents. Build trust through positive feedback on teamwork, skill, and sportsmanship.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Trust Badges",
    description:
      "Earn badges that prove your reliability. Premium members get exclusive Trust Badges for credibility.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description:
      "Connect your game accounts and automatically sync stats. Watch your journey from amateur to pro.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const premiumBenefits = [
  "Trust Badge on your profile",
  "See who viewed your profile",
  "Featured in search results",
  "Export profile as PDF",
  "Custom profile themes",
  "Priority support",
];

export default function OnboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Fetch games from backend
  const { games, loading: gamesLoading } = useGames();

  // Dynamic stats based on actual game count
  const stats = [
    { value: "1st", label: "Indian Platform", sublabel: "For Amateur Gamers" },
    { value: `${games.length || 6}+`, label: "Games", sublabel: "Supported" },
    { value: "100%", label: "Free", sublabel: "To Start" },
  ];

  // Redirect logged-in users to home
  useEffect(() => {
    if (!loading && user) {
      router.replace("/community");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-glow-primary">GamerHub</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Create Profile</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-radial from-warning/5 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* India Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6">
              India&apos;s First Esports Identity Platform
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-text mb-6 leading-tight">
              Your Gaming Skills
              <br />
              <span className="text-primary text-glow-primary">Deserve Recognition</span>
            </h1>

            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-4">
              Build your gaming profile. Get rated by peers. Earn trust badges.
            </p>

            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-10">
              No more proving yourself in every lobby. Create a profile that showcases
              your real gaming journey - from casual to competitive.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  className="text-lg px-8"
                >
                  Create Your Profile - Free
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-5xl font-bold text-primary mb-1">
                  {stat.value}
                </p>
                <p className="text-text font-medium">{stat.label}</p>
                <p className="text-text-muted text-sm">{stat.sublabel}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-6">
              The Problem We&apos;re Solving
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <Card className="p-6 border-error/30 bg-error/5">
                <h3 className="text-lg font-semibold text-error mb-3">Current Reality</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <span className="text-error">x</span>
                    No one tracks amateur talent in India
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error">x</span>
                    You prove yourself from scratch in every game
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error">x</span>
                    Good players get no recognition
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error">x</span>
                    Toxic players face no consequences
                  </li>
                </ul>
              </Card>
              <Card className="p-6 border-success/30 bg-success/5">
                <h3 className="text-lg font-semibold text-success mb-3">With GamerHub</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    Build a verified gaming identity
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    Carry your reputation across games
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    Get recognized through peer ratings
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    Trust badges reward good behavior
                  </li>
                </ul>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Your Gaming Profile, Reimagined
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Everything you need to build and showcase your gaming identity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:border-primary/50 transition-colors p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-muted text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Connect Your Games
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Link your accounts and build a unified gaming profile.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {gamesLoading ? (
              // Loading skeleton
              [...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="px-4 py-2 rounded-full bg-surface-light border border-border animate-pulse"
                >
                  <span className="inline-block w-20 h-4 bg-surface rounded" />
                </div>
              ))
            ) : games.length === 0 ? (
              <p className="text-text-muted">Games coming soon...</p>
            ) : (
              games.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                >
                  <div className="px-4 py-2 rounded-full bg-surface-light border border-border hover:border-primary transition-colors cursor-default">
                    <span className="font-medium text-text">{game.name}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Peer Rating Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-text mb-6">
                Get Rated By Your Peers
              </h2>
              <p className="text-text-secondary mb-6">
                After playing together, teammates and opponents can rate you on:
              </p>
              <div className="space-y-4">
                {[
                  { label: "Teamwork", desc: "How well you collaborate" },
                  { label: "Communication", desc: "Clear callouts and coordination" },
                  { label: "Skill Level", desc: "Mechanical ability and game sense" },
                  { label: "Reliability", desc: "Showing up and being consistent" },
                  { label: "Sportsmanship", desc: "Grace in victory and defeat" },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text">{item.label}</p>
                      <p className="text-sm text-text-muted">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                    <Target className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-text">Reputation Score</h3>
                  <p className="text-text-muted">Your overall gaming reputation</p>
                </div>
                <div className="text-center">
                  <p className="text-6xl font-black text-primary mb-2">4.8</p>
                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-6 w-6 ${
                          star <= 4
                            ? "text-warning fill-warning"
                            : "text-warning/50 fill-warning/50"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-text-muted">Based on 47 peer ratings</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Premium Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-warning/5 via-surface to-primary/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/30 text-warning text-sm font-medium mb-4">
              <Crown className="h-4 w-4" />
              Premium Membership
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Stand Out From The Crowd
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Get exclusive features that showcase your dedication to gaming.
            </p>
          </div>

          <Card className="p-8 border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-warning" />
                  Premium Benefits
                </h3>
                <ul className="space-y-4">
                  {premiumBenefits.map((benefit, index) => (
                    <motion.li
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-warning" />
                      </div>
                      <span className="text-text">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col justify-center">
                <div className="text-center p-6 rounded-xl bg-surface border border-border">
                  <p className="text-text-muted mb-2">Starting at</p>
                  <p className="text-4xl font-black text-warning mb-1">
                    Rs. 99<span className="text-lg font-normal text-text-muted">/month</span>
                  </p>
                  <p className="text-text-muted text-sm mb-6">Cancel anytime</p>
                  <Link href="/register">
                    <Button
                      variant="outline"
                      className="border-warning text-warning hover:bg-warning hover:text-black w-full"
                    >
                      Get Started Free First
                    </Button>
                  </Link>
                  <p className="text-xs text-text-muted mt-3">
                    Create your free profile, upgrade when ready
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Join the Movement
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-4">
              Ready to Build Your Gaming Legacy?
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Join India&apos;s first platform that actually recognizes amateur gaming talent.
            </p>
            <Link href="/register">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="h-5 w-5" />}
                className="text-lg px-8"
              >
                Create Your Free Profile
              </Button>
            </Link>
            <p className="text-text-muted text-sm mt-4">
              No credit card required. Free forever for basic features.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">GamerHub</span>
            </div>
            <div className="flex gap-6 text-text-muted text-sm">
              <Link href="/about" className="hover:text-text transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-text transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-text transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-text transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-text-muted text-sm">
              2024 GamerHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

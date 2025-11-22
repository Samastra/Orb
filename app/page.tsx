/* eslint-disable react/no-unescaped-entities */

"use client";

import { useState } from "react";
import { PricingCard } from "@/components/pricing-card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { Brain, Search, Share2, Clock, Lightbulb, Zap, ArrowRight, Sparkles, Users, Star, Crown, Shield, CheckCircle, Command, TrendingUp, FileText, Video, Image, Globe } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import Link from "next/link";
import { PaymentModal } from "@/components/payment-modal";
import { useAuth, useUser } from "@clerk/nextjs";
import { loadPaddle, openPaddleCheckout } from '@/lib/paddle-loader';

export default function Home() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"lifetime" | "yearly">("lifetime");
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const handleGetLifetimeAccess = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    
    try {
      const loaded = await loadPaddle();
      if (!loaded) {
        throw new Error('Failed to load Paddle');
      }
      
      openPaddleCheckout(
        'pri_01kabghk4hhgbz2dnj353sv2td',
        user?.primaryEmailAddress?.emailAddress
      );
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  };

  const handleGetYearlyAccess = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    
    try {
      const loaded = await loadPaddle();
      if (!loaded) {
        throw new Error('Failed to load Paddle');
      }
      
      openPaddleCheckout(
        'pri_01kabgkj0y7cv0yae5c89730pa',
        user?.primaryEmailAddress?.emailAddress
      );
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    console.log("Payment successful!");
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        plan={selectedPlan}
      />
      
      <nav className="relative z-20">
        <Navbar />
      </nav>

      {/* Hero Section - Completely Rewritten */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Stop the Tab Chaos. Start Thinking.
                </span>
              </GlassCard>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Your Best Ideas Were
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dying in Browser Tabs
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Orblin is the AI whiteboard that researches with you. Get relevant websites, videos, and resources 
                <span className="font-semibold text-blue-600"> automatically as you work</span>—so you can think deeper, not search longer.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button 
                onClick={handleGetLifetimeAccess}
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-2xl shadow-blue-500/25"
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Lifetime Access - $99
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Link href="/boards/new">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-300 hover:border-blue-300 px-8 py-6 text-lg font-semibold rounded-2xl bg-white/50 backdrop-blur-sm"
                >
                  Try Free - See Magic
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Trusted by 1,000+ creators escaping tab chaos</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white" />
                  ))}
                </div>
                <span>Join the focused thinkers</span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-20"
          >
            <GlassCard className="p-1">
              <div className="w-full h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/30 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Watch ideas come alive with AI-curated research
                  </p>
                  <p className="text-sm text-gray-500">
                    (See how Orblin eliminates tab-hopping)
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Pain Point Section - NEW */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Sound Familiar?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <GlassCard className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">The Research Black Hole</h3>
                <p className="text-gray-600 text-sm">
                  "I spent 2 hours 'researching' and have nothing to show for it except 47 open tabs"
                </p>
              </GlassCard>

              <GlassCard className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Lost Brilliance</h3>
                <p className="text-gray-600 text-sm">
                  "I had this amazing idea, but lost it while searching for examples in another tab"
                </p>
              </GlassCard>

              <GlassCard className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Context Switching Hell</h3>
                <p className="text-gray-600 text-sm">
                  "By the time I find what I need, I've forgotten what I was building"
                </p>
              </GlassCard>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">There's a Better Way</h3>
              <p className="text-lg opacity-90">
                What if your whiteboard could bring the research to you? Automatically. As you think.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Completely Rewritten */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-20"
          >
            <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                How Orblin Saves Your Ideas
              </span>
            </GlassCard>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              The End of
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Research Overhead</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stop managing tabs. Start connecting ideas.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe className="w-6 h-6 text-white" />}
              title="AI Research Assistant"
              description="As you type or draw, get relevant websites, articles, and resources automatically surfaced. No more tab-hopping."
              delay={0.1}
              features={[
                "Automatic website suggestions",
                "Relevant video recommendations", 
                "Related research papers",
                "Curated image references"
              ]}
            />

            <FeatureCard
              icon={<Brain className="w-6 h-6 text-white" />}
              title="Context-Aware Suggestions"
              description="Orblin understands what you're working on and brings exactly what you need, when you need it."
              delay={0.2}
              features={[
                "Smart content matching",
                "Learning style adaptation",
                "Progressive refinement",
                "Cross-reference detection"
              ]}
            />

            <FeatureCard
              icon={<FileText className="w-6 h-6 text-white" />}
              title="Auto-Organized Research"
              description="Everything you discover gets organized alongside your ideas. Never lose a reference again."
              delay={0.3}
              features={[
                "Automatic categorization",
                "Searchable knowledge base",
                "Source tracking",
                "Exportable references"
              ]}
            />

            <FeatureCard
              icon={<Video className="w-6 h-6 text-white" />}
              title="Multi-Format Learning"
              description="Get information in the format that works best for you—videos, articles, images, or interactive content."
              delay={0.4}
              features={[
                "Video explanations",
                "Text deep-dives",
                "Visual examples",
                "Interactive demos"
              ]}
            />

            <FeatureCard
              icon={<Share2 className="w-6 h-6 text-white" />}
              title="Shareable Understanding"
              description="Collaborate with context. Share not just your board, but all the research behind your thinking."
              delay={0.5}
              features={[
                "Research-backed collaboration",
                "Shared knowledge base",
                "Comment with references",
                "Team learning sessions"
              ]}
            />

            <FeatureCard
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              title="Learning Acceleration"
              description="Go from curious to expert faster with AI-curated learning paths and progressive difficulty."
              delay={0.6}
              features={[
                "Adaptive difficulty",
                "Learning path suggestions",
                "Knowledge gap detection",
                "Progress tracking"
              ]}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-16"
          >
            <GlassCard className="inline-block p-8 max-w-2xl">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Ready to Escape Tab Chaos?
                </h3>
                <p className="text-gray-600">
                  Join creators and learners who save 10+ hours weekly by letting Orblin handle the research overhead.
                </p>
                <Button 
                  onClick={handleGetLifetimeAccess}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4"
                >
                  Start Thinking, Not Searching
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section - NEW */}
      <section className="relative z-10 py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Who Gets Their Time Back?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  role: "Course Creators",
                  problem: "Spend more time researching than creating",
                  solution: "Build curriculum 3x faster with auto-curated materials"
                },
                {
                  role: "Students & Researchers", 
                  problem: "Drown in literature review chaos",
                  solution: "Connect sources automatically as you write"
                },
                {
                  role: "Content Creators",
                  problem: "Waste hours researching for 10-minute videos",
                  solution: "Go from idea to script with AI-curated references"
                },
                {
                  role: "Lifelong Learners",
                  problem: "Start learning, end up in tab rabbit holes",
                  solution: "Stay focused with progressively challenging content"
                }
              ].map((item, index) => (
                <GlassCard key={index} className="p-6 text-center">
                  <h3 className="font-bold text-gray-900 mb-3">{item.role}</h3>
                  <p className="text-sm text-gray-600 mb-3">{item.problem}</p>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <ArrowRight className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-sm text-green-600 font-semibold mt-3">{item.solution}</p>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section - Copy Enhanced */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-b from-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-20"
          >
            <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
              <Crown className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Stop Paying with Your Time
              </span>
            </GlassCard>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Your Time is Worth
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> More Than This</span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              What's 10 hours of research time worth to you? Get it back every month.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Lifetime Focus"
              description="Never pay again for the privilege of thinking without distraction."
              price="$99"
              originalPrice="$499"
              period="One-time • Never pay for focus again"
              features={[
                "Unlimited AI research assistance",
                "All content types: websites, videos, images", 
                "Priority AI processing",
                "Lifetime updates & improvements",
                "Commercial usage rights",
                "Export all research data",
                "Custom learning paths",
                "Early access to new AI features"
              ]}
              featured={true}
              popular={true}
              ctaText="Get Lifetime Focus"
              onCtaClick={handleGetLifetimeAccess}
              href="#"
              delay={0.1}
            />

            <PricingCard
              title="Yearly Deep Work"
              description="Perfect for experiencing distraction-free thinking."
              price="$60"
              period="Per year • Cancel tab chaos anytime"
              features={[
                "All AI research features included",
                "Auto-website & video curation", 
                "Real-time content suggestions",
                "Searchable knowledge base",
                "Basic customer support",
                "Regular AI improvements",
                "5GB research storage",
                "Community templates"
              ]}
              featured={false}
              ctaText="Start Deep Work"
              onCtaClick={handleGetYearlyAccess}
              href="#"
              delay={0.3}
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <GlassCard className="inline-block p-8 max-w-3xl">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  The Math of Focus
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">10+ Hours Monthly</h4>
                    <p className="text-sm text-gray-600">
                      Average time saved on research overhead
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">3x Faster Learning</h4>
                    <p className="text-sm text-gray-600">
                      Accelerated understanding with AI-curated content
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Zero Idea Loss</h4>
                    <p className="text-sm text-gray-600">
                      Never lose brilliant connections to tab chaos
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">Time-Sensitive Opportunity</span>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Lifetime access at this price ends soon. Your future self will thank you.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section - Completely Rewritten */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <GlassCard className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 border-white/20">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-medium text-sm">
                  Your Ideas Deserve Better Than Browser Tabs
                </span>
              </GlassCard>

              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Stop Letting Tabs
                  <br />
                  <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                    Steal Your Genius
                  </span>
                </h2>
                
                <p className="text-xl text-blue-100 leading-relaxed">
                  Every minute spent tab-hopping is a minute stolen from deep thinking. 
                  Get back 10+ hours monthly and actually build what you imagine.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-4 text-white/80">
                  <Shield className="w-5 h-5 text-blue-300" />
                  <span>Your research, always organized</span>
                </div>
                <div className="flex items-center gap-4 text-white/80">
                  <Users className="w-5 h-5 text-purple-300" />
                  <span>Join 1,000+ focused creators</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <GlassCard className="p-8 bg-gradient-to-br from-white/20 to-white/10 border-white/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-300" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Lifetime Focus</h3>
                      <p className="text-blue-100 text-sm">Never pay for distraction again</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">$99</span>
                      <span className="text-lg text-blue-200 line-through">$599</span>
                      <span className="bg-green-500/20 text-green-300 text-sm px-2 py-1 rounded-full">
                        Launch Price
                      </span>
                    </div>

                    <Button 
                      onClick={handleGetLifetimeAccess}
                      size="lg"
                      className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold py-4 text-lg rounded-2xl shadow-2xl shadow-yellow-500/25"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Claim Lifetime Access
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-blue-200 text-sm">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Your ideas are safe from tab chaos
                    </p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6 bg-white/5 border-white/20">
                <div className="text-center space-y-3">
                  <p className="text-blue-200 text-sm">
                    Not ready for lifetime? Test the focus.
                  </p>
                  <Button 
                    onClick={handleGetYearlyAccess}
                    variant="outline" 
                    size="lg"
                    className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold py-3 rounded-xl"
                  >
                    Try Yearly - $60
                  </Button>
                  <p className="text-blue-200/70 text-xs">
                    Cancel anytime • Experience tab-free thinking
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 text-center"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/80 text-sm max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <Brain className="w-8 h-8 text-yellow-300 mx-auto" />
                <div className="font-semibold text-white">Think Deeper</div>
                <div>No more context switching kills creativity</div>
              </div>
              <div className="text-center space-y-2">
                <Clock className="w-8 h-8 text-green-300 mx-auto" />
                <div className="font-semibold text-white">Save Time</div>
                <div>10+ hours monthly back in your pocket</div>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-purple-300 mx-auto" />
                <div className="font-semibold text-white">Learn Faster</div>
                <div>AI-curated content accelerates understanding</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Command className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Orblin</span>
          </div>
          <p className="text-gray-400">
            Your ideas deserve better than browser tabs • © 2024 Orblin. All rights reserved.
          </p>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <Link href="/terms" className="text-gray-400 hover:text-white text-sm">
            Terms
          </Link>
          <Link href="/privacy" className="text-gray-400 hover:text-white text-sm">
            Privacy
          </Link>
          <Link href="/refunds" className="text-gray-400 hover:text-white text-sm">
            Refunds
          </Link>
        </div>
      </footer>
    </main>
  );
}
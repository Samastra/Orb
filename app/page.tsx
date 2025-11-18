/* eslint-disable react/no-unescaped-entities */

"use client";

import { useState } from "react";
import { PricingCard } from "@/components/pricing-card";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { Brain, Search, Share2, Clock, Lightbulb } from "lucide-react";
import { FeatureCard } from "@/components/feature-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowRight, Sparkles, Zap, Users, Star, Crown, Shield, CheckCircle, Command, TrendingUp } from "lucide-react";
import Link from "next/link";
import { PaymentModal } from "@/components/payment-modal";
import { useAuth, useUser } from "@clerk/nextjs";
import { loadPaddle } from '@/lib/paddle-loader';

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
    await loadPaddle();
    
    window.Paddle.Checkout.open({
      items: [
        {
          priceId: 'pro_01kab5k19nxxqbjnr848wd2pa2', // Your lifetime product ID
          quantity: 1,  
        }
      ],
      customer: {
        email: user?.primaryEmailAddress?.emailAddress, // This will work now
      },
      settings: {
        successUrl: `${window.location.origin}/payment-success`,
      }
    });
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
    await loadPaddle();
    
    window.Paddle.Checkout.open({
      items: [
        {
          priceId: 'pro_01kab5mnpcb64a0a3vzx5gzj4m', // Your yearly product ID
          quantity: 1,
        }
      ],
      customer: {
        email: user?.primaryEmailAddress?.emailAddress,
      },
      settings: {
        successUrl: `${window.location.origin}/payment-success`,
      }
    });
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
      
      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        plan={selectedPlan}
      />
      
      {/* Navigation */}
      <nav className="relative z-20">
        <Navbar />
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Limited Time: Lifetime Access Available
                </span>
              </GlassCard>
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                Transform Chaotic Ideas into{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Actionable Plans
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Orblin is the intelligent whiteboard that helps teams and individuals organize complex ideas, 
                collaborate in real-time, and turn brainstorming sessions into concrete action plans.
              </p>
            </motion.div>

            {/* CTA Buttons */}
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
                  Start Free Session
                </Button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Trusted by 1,000+ creators and teams</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full border-2 border-white" />
                  ))}
                </div>
                <span>Join the community</span>
              </div>
            </motion.div>
          </div>

          {/* Hero Preview */}
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
                    Interactive Whiteboard Preview
                  </p>
                  <p className="text-sm text-gray-500">
                    (Video demo coming soon)
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
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
                Why Teams Love Orblin
              </span>
            </GlassCard>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Think Better
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to transform how you brainstorm, collaborate, and execute ideas.
            </p>
          </motion.div>

          {/* Feature Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-white" />}
              title="AI-Powered Insights"
              description="Get smart suggestions and connections as you brainstorm. Orblin's AI helps you see patterns and opportunities you might have missed."
              delay={0.1}
              features={[
                "Smart idea connections",
                "Content recommendations", 
                "Pattern recognition",
                "Research suggestions"
              ]}
            />

            <FeatureCard
              icon={<Users className="w-6 h-6 text-white" />}
              title="Real-time Collaboration"
              description="Work together seamlessly with your team. See changes instantly, chat in context, and build ideas together in real-time."
              delay={0.2}
              features={[
                "Live cursor presence",
                "Instant updates",
                "Comment threads",
                "Version history"
              ]}
            />

            <FeatureCard
              icon={<Share2 className="w-6 h-6 text-white" />}
              title="Public Knowledge Hub"
              description="Share your work with the world or explore boards from other creators. Learn from thousands of public brainstorming sessions."
              delay={0.3}
              features={[
                "Public board sharing",
                "Community discovery",
                "Template library",
                "Knowledge exchange"
              ]}
            />

            <FeatureCard
              icon={<Search className="w-6 h-6 text-white" />}
              title="Smart Organization"
              description="Never lose an idea again. Orblin automatically organizes your sessions and makes everything searchable and accessible."
              delay={0.4}
              features={[
                "Auto-categorization",
                "Advanced search",
                "Quick filters",
                "Session templates"
              ]}
            />

            <FeatureCard
              icon={<Clock className="w-6 h-6 text-white" />}
              title="Always in Sync"
              description="Pick up right where you left off. Your boards sync automatically across all devices, so your ideas are always with you."
              delay={0.5}
              features={[
                "Cross-device sync",
                "Offline access",
                "Auto-backup",
                "Quick recovery"
              ]}
            />

            <FeatureCard
              icon={<Lightbulb className="w-6 h-6 text-white" />}
              title="Visual Thinking"
              description="Turn abstract ideas into clear visual plans. Use shapes, connectors, and templates designed for creative thinking."
              delay={0.6}
              features={[
                "Drag & drop interface",
                "Multiple board types",
                "Custom templates",
                "Export options"
              ]}
            />
          </div>

          {/* Bottom CTA */}
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
                  Ready to Transform Your Brainstorming?
                </h3>
                <p className="text-gray-600">
                  Join thousands of creators and teams who are already building better ideas with Orblin.
                </p>
                <Button 
                  onClick={handleGetLifetimeAccess}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-b from-blue-50/30 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
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
                Limited Time Offers
              </span>
            </GlassCard>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Orblin Journey
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get in early and secure lifetime access at a fraction of the future price.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Lifetime Deal - Featured */}
            <PricingCard
              title="Lifetime Access"
              description="Never pay again. Get unlimited access to all current and future Orblin features forever."
              price="$99"
              originalPrice="$499"
              period="One-time payment • Never pay again"
              features={[
                "Unlimited boards and sessions",
                "All AI features included", 
                "Priority customer support",
                "Early access to new features",
                "Commercial usage rights",
                "Lifetime updates & upgrades",
                "Export all your data anytime",
                "Custom templates library"
              ]}
              featured={true}
              popular={true}
              ctaText="Get Lifetime Access"
              href="#" // We'll handle this via onClick
              delay={0.1}
            />

            {/* Yearly Deal */}
            <PricingCard
              title="Yearly Plan"
              description="Perfect for trying out Orblin with our special launch discount."
              price="$60"
              period="Per year • Cancel anytime"
              features={[
                "All core features included",
                "AI-powered insights", 
                "Real-time collaboration",
                "Public board sharing",
                "Basic customer support",
                "Regular updates",
                "5GB storage included",
                "Community templates"
              ]}
              featured={false}
              ctaText="Start Yearly Plan"
              href="#" // We'll handle this via onClick
              delay={0.3}
            />
          </div>

          {/* Comparison & Value Proposition */}
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
                  Why Lifetime Access is the Smart Choice
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6 text-left">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Pay Once, Use Forever</h4>
                    <p className="text-sm text-gray-600">
                      No recurring fees. Your investment is protected forever.
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Star className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Best Value</h4>
                    <p className="text-sm text-gray-600">
                      Save $670+ compared to 3 years of yearly payments.
                    </p>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Crown className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Founder Benefits</h4>
                    <p className="text-sm text-gray-600">
                      Early adopter perks and priority feature requests.
                    </p>
                  </div>
                </div>

                {/* Urgency Element */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-800">Limited Time Offer</span>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Lifetime access is only available during our launch period. Price increases to $999 soon.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-32 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-48 bg-white/5 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              {/* Badge */}
              <GlassCard className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 border-white/20">
                <Zap className="w-4 h-4 text-yellow-300" />
                <span className="text-white font-medium text-sm">
                  Founding Member Opportunity
                </span>
              </GlassCard>

              {/* Headline */}
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  Be Among The
                  <br />
                  <span className="bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent">
                    First To Build
                  </span>
                </h2>
                
                <p className="text-xl text-blue-100 leading-relaxed">
                  Join Orblin during our launch period and secure lifetime access at a special 
                  founder's price. Perfect time to get in on the ground floor.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white/80">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-4 text-white/80">
                  <Shield className="w-5 h-5 text-blue-300" />
                  <span>Secure & encrypted data</span>
                </div>
                <div className="flex items-center gap-4 text-white/80">
                  <Users className="w-5 h-5 text-purple-300" />
                  <span>Founding member benefits</span>
                </div>
              </div>

              {/* Urgency Timer */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-red-300" />
                  <span className="text-white font-semibold">Launch Special Ending Soon</span>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white">24</div>
                    <div className="text-xs text-blue-200">Hours</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white">59</div>
                    <div className="text-xs text-blue-200">Minutes</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold text-white">59</div>
                    <div className="text-xs text-blue-200">Seconds</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - CTA Cards */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              {/* Lifetime Deal Card */}
              <GlassCard className="p-8 bg-gradient-to-br from-white/20 to-white/10 border-white/30">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-300" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Founder's Deal</h3>
                      <p className="text-blue-100 text-sm">Lifetime Access</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">$99</span>
                      <span className="text-lg text-blue-200 line-through">$599</span>
                      <span className="bg-green-500/20 text-green-300 text-sm px-2 py-1 rounded-full">
                        Founder's Price
                      </span>
                    </div>

                    <Button 
                      onClick={handleGetLifetimeAccess}
                      size="lg"
                      className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-bold py-4 text-lg rounded-2xl shadow-2xl shadow-yellow-500/25"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Become a Founding Member
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>

                  <div className="text-center">
                    <p className="text-blue-200 text-sm">
                      <Shield className="w-4 h-4 inline mr-1" />
                      30-day money-back guarantee
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Yearly Alternative */}
              <GlassCard className="p-6 bg-white/5 border-white/20">
                <div className="text-center space-y-3">
                  <p className="text-blue-200 text-sm">
                    Want to try first?
                  </p>
                  <Button 
                    onClick={handleGetYearlyAccess}
                    variant="outline" 
                    size="lg"
                    className="w-full border-white/30 text-white hover:bg-white/10 hover:text-white font-semibold py-3 rounded-xl"
                  >
                    Launch Yearly Plan - $60
                  </Button>
                  <p className="text-blue-200/70 text-xs">
                    Cancel anytime • Perfect for testing
                  </p>
                </div>
              </GlassCard>

              {/* Authentic Launch Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-center"
              >
                <GlassCard className="p-4 bg-white/10 border-white/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-yellow-300">
                      <Zap className="w-4 h-4" />
                      <span className="font-semibold text-sm">Launch Week</span>
                    </div>
                    <p className="text-blue-200 text-xs">
                      Be among the first to experience Orblin and shape its future
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          </div>

          {/* Authentic Value Props */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-16 text-center"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-white/80 text-sm max-w-2xl mx-auto">
              <div className="text-center space-y-2">
                <Lightbulb className="w-8 h-8 text-yellow-300 mx-auto" />
                <div className="font-semibold text-white">Shape The Product</div>
                <div>Your feedback directly influences new features</div>
              </div>
              <div className="text-center space-y-2">
                <Crown className="w-8 h-8 text-purple-300 mx-auto" />
                <div className="font-semibold text-white">Founder Perks</div>
                <div>Special benefits for early supporters</div>
              </div>
              <div className="text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-green-300 mx-auto" />
                <div className="font-semibold text-white">Best Price Ever</div>
                <div>Lowest price that will never be offered again</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="relative z-10 py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Command className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Orblin</span>
          </div>
          <p className="text-gray-400">
            Transform your ideas into reality • © 2024 Orblin. All rights reserved.
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
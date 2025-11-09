"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { 
  Mail, 
  MessageCircle, 
  Twitter, 
  Github,
  Send,
  ArrowRight,
  Zap
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"

export default function ContactPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                We&apos;d Love to Hear From You
              </span>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Get in{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Have questions, feedback, or want to collaborate? 
              We&apos;re here to help and would love to connect with you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <GlassCard className="p-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                  
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <input 
                        type="email" 
                        className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Message</label>
                      <textarea 
                        rows={6}
                        className="w-full px-4 py-3 bg-white/50 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Tell us what's on your mind..."
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold rounded-2xl"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </div>
              </GlassCard>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <GlassCard className="p-8">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Other Ways to Connect</h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Email Us</h3>
                        <p className="text-gray-600">hello@orblin.com</p>
                        <p className="text-sm text-gray-500">We typically reply within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Twitter className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Twitter</h3>
                        <p className="text-gray-600">@orblin</p>
                        <p className="text-sm text-gray-500">Follow us for updates and tips</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-gray-200">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Github className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">GitHub</h3>
                        <p className="text-gray-600">github.com/orblin</p>
                        <p className="text-sm text-gray-500">Open source components and issues</p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* FAQ Quick Links */}
              <GlassCard className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Quick Help</h3>
                  <div className="space-y-2">
                    <Link href="/help" className="block text-blue-600 hover:text-blue-700 transition-colors">
                      • Getting Started Guide
                    </Link>
                    <Link href="/help" className="block text-blue-600 hover:text-blue-700 transition-colors">
                      • Common Questions
                    </Link>
                    <Link href="/help" className="block text-blue-600 hover:text-blue-700 transition-colors">
                      • Feature Requests
                    </Link>
                    <Link href="/help" className="block text-blue-600 hover:text-blue-700 transition-colors">
                      • Bug Reports
                    </Link>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-12 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join Orblin today and start transforming your ideas into reality.
              </p>
              <Link href="/sign-up">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </main>
  )
}
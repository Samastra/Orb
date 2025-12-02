/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { 
  Mail, MessageCircle, Twitter, Github, Send, 
  ArrowRight, Zap, HelpCircle, MapPin
} from "lucide-react";

// --- VISUAL ASSETS (MATCHING LANDING PAGE) ---

const ScribbleHighlight = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-3 text-yellow-300 -z-10 opacity-60" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
     <path d="M2.00025 7.00001C30.5003 3.00001 100.001 -2.99999 198.001 5.00002" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

const RichSticker = ({ icon: Icon, color, rotate, className, delay = 0 }: any) => (
  <motion.div
    initial={{ scale: 0, rotate: 0 }}
    animate={{ scale: 1, rotate: rotate }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay }}
    whileHover={{ scale: 1.1, rotate: rotate + 10 }}
    className={`absolute z-20 flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white ${className}`}
  >
    <div className={`w-full h-full rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-7 h-7 text-white fill-current" strokeWidth={2.5} />
    </div>
  </motion.div>
);

const ContactCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white">
        
        {/* Decorative Stickers */}
        <RichSticker 
          icon={Mail} 
          color="bg-blue-500" 
          rotate={-12} 
          className="top-32 left-[15%] hidden lg:flex" 
          delay={0.2}
        />
        <RichSticker 
          icon={MessageCircle} 
          color="bg-purple-500" 
          rotate={12} 
          className="top-40 right-[15%] hidden lg:flex" 
          delay={0.4}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-blue-600 mb-8">
              <MessageCircle className="w-3 h-3" />
              <span>We'd love to hear from you</span>
            </div>

            <h1 className="relative text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-gray-900">
              Get in <br className="md:hidden" />
              <span className="relative inline-block ml-3">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Touch.</span>
                <ScribbleHighlight />
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
              Have questions about the December Sale? Found a bug? Just want to say hi? 
              We read every message.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- CONTACT GRID --- */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* LEFT: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <ContactCard className="relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Send us a message</h2>
                    <p className="text-gray-500 mt-2">Fill out the form below and we'll get back to you within 24 hours.</p>
                  </div>
                  
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Subject</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600">
                        <option>General Inquiry</option>
                        <option>Support / Bug Report</option>
                        <option>Billing Question</option>
                        <option>Partnership</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Message</label>
                      <textarea 
                        rows={5}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gray-900 hover:bg-black text-white py-6 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </div>
              </ContactCard>
            </motion.div>

            {/* RIGHT: Info & Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="space-y-8"
            >
              {/* Other Ways Card */}
              <ContactCard>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Other ways to connect</h2>
                <div className="space-y-6">
                  
                  {/* Item 1 */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Email Support</h3>
                      <a href="mailto:hello@orblin.cloud" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">hello@orblin.cloud</a>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0">
                      <Twitter className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Twitter (X)</h3>
                      <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">@orblin_app</a>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
                      <Github className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">GitHub</h3>
                      <a href="#" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">/orblin-community</a>
                    </div>
                  </div>

                </div>
              </ContactCard>

              {/* FAQ / Help Card */}
              <ContactCard className="bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-gray-600" />
                  <h3 className="font-bold text-gray-900">Quick Help</h3>
                </div>
                <ul className="space-y-3">
                  <li>
                    <Link href="/help" className="flex items-center justify-between text-gray-600 hover:text-blue-600 font-medium group bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-all">
                      <span>How does the AI search work?</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="flex items-center justify-between text-gray-600 hover:text-blue-600 font-medium group bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-all">
                      <span>Can I export my boards?</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="flex items-center justify-between text-gray-600 hover:text-blue-600 font-medium group bg-white p-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-all">
                      <span>Refund Policy</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </Link>
                  </li>
                </ul>
              </ContactCard>

            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-gray-200 text-center text-gray-500 text-sm bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-md" />
            <span className="font-bold text-gray-900">Orblin</span>
          </div>
          
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            <a href="mailto:hello@orblin.cloud" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
          
          <p>© 2025 Orblin Inc.</p>
        </div>
      </footer>
    </main>
  );
}
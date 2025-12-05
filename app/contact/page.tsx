/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { 
  Mail, MessageCircle, Twitter, Github, Send, 
  ArrowRight, Zap, HelpCircle, MapPin, Sparkles, Brain
} from "lucide-react";

// --- GLOBAL STYLES (Same as landing page) ---
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Inter:wght@400;500;600;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    
    .font-hand { font-family: 'Patrick Hand', cursive; }
    .font-serif-heading { font-family: 'Libre Baskerville', serif; }
    
    .bg-dot-grid {
      background-image: radial-gradient(#94A3B8 1.5px, transparent 1.5px);
      background-size: 24px 24px;
    }

    @keyframes shimmer {
      from { background-position: 0 0; }
      to { background-position: -200% 0; }
    }
    .animate-shimmer {
      background: linear-gradient(to right, #4d4d4dff 0%, #4d4d4dff 20%, #4d4d4dff 40%, #4d4d4dff 100%);
      background-size: 200% auto;
      animation: shimmer 3s linear infinite;
    }
  `}</style>
);

// --- VISUAL ASSETS (Updated to match landing page) ---

const ScribbleHighlight = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-200 -z-10 opacity-60" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
     <path d="M2.00025 7.00001C30.5003 3.00001 100.001 -2.99999 198.001 5.00002" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

// Updated to match brand colors
const RichSticker = ({ icon: Icon, rotate, className, delay = 0 }: any) => (
  <motion.div
    initial={{ scale: 0, rotate: 0 }}
    animate={{ scale: 1, rotate: rotate }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay }}
    whileHover={{ scale: 1.1, rotate: rotate + 10 }}
    className={`absolute z-20 flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-md border-2 border-gray-100 ${className}`}
  >
    <div className="w-full h-full rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
      <Icon className="w-7 h-7 text-blue-600" strokeWidth={2.5} />
    </div>
  </motion.div>
);

// FIXED: ContactCard now accepts id and other HTML props
const ContactCard = ({ children, className, ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    {...props}
    className={`bg-white border border-gray-200 rounded-3xl p-8 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

// --- SPECIAL "LIFETIME" BUTTON (Same as landing page) ---
const ShimmerButton = ({ onClick, children, className }: any) => (
  <button
    onClick={onClick}
    className={`
      relative h-14 rounded-full text-white font-semibold text-lg overflow-hidden group
      bg-black/90 hover:bg-black transition-all duration-300
      shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
      ${className}
    `}
  >
    {/* Shimmer effect */}
    <div className="absolute inset-0 animate-shimmer opacity-30" />
    {/* Subtle blue hover glow */}
    <div className="absolute inset-0 bg-blue-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    {/* Button Content */}
    <span className="relative z-10 flex items-center justify-center gap-2 px-8">
      {children}
    </span>
  </button>
);

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      <GlobalStyles />
      <Navbar />

      {/* --- HERO SECTION (Updated to match landing page) --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-[#F8F9FA] border-b border-gray-200">
        
        {/* Decorative Stickers with brand colors */}
        <RichSticker 
          icon={Mail} 
          rotate={-12} 
          className="top-32 left-[15%] hidden lg:flex" 
          delay={0.2}
        />
        <RichSticker 
          icon={MessageCircle} 
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
            {/* Badge - matches landing page */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 backdrop-blur-sm border border-blue-100 text-xs font-semibold text-blue-700 mb-8">
              <Brain className="w-3 h-3" />
              <span>We'd love to hear from you</span>
            </div>

            {/* Heading - matches landing page font */}
            <h1 className="relative text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-gray-900 font-serif-heading">
              Get in <br className="md:hidden" />
              <span className="relative inline-block ml-3">
                <span className="relative z-10 text-blue-600">Touch.</span>
                <ScribbleHighlight />
              </span>
            </h1>
            
            {/* Subtext - matches landing page style */}
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
              Have questions about the December Sale? Found a bug? Just want to say hi? 
              We read every message.
            </p>

            {/* CTA Buttons - matches landing page */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <Link href="/boards/new">
                <Button variant="ghost" className="h-14 px-8 rounded-full text-gray-700 font-semibold text-lg border border-gray-200 shadow-sm transition-all bg-white/50 hover:bg-white/80 hover:text-black">
                  Try Demo Board
                </Button>
              </Link>
              
              <a href="#contact-form">
                <ShimmerButton>
                  <Send className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span>Send Message</span>
                </ShimmerButton>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- CONTACT GRID (Updated to match landing page) --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {/* LEFT: Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* FIXED: Now accepts id prop */}
              <ContactCard className="relative overflow-hidden" id="contact-form">
                <div className="relative z-10 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif-heading">Send us a message</h2>
                    <p className="text-gray-600 mt-2 font-medium">Fill out the form below and we'll get back to you within 24 hours.</p>
                  </div>
                  
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email</label>
                        <input 
                          type="email" 
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                          placeholder="jane@example.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Subject</label>
                      <select className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-700">
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
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>
                    
                    <ShimmerButton className="w-full">
                      <Send className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                      Send Message
                    </ShimmerButton>
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
                <h2 className="text-xl font-bold text-gray-900 font-serif-heading mb-6">Other ways to connect</h2>
                <div className="space-y-6">
                  
                  {/* Item 1 */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0 border border-blue-100">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Email Support</h3>
                      <a href="mailto:support@orblin.cloud" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">support@orblin.cloud</a>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0 border border-blue-100">
                      <Twitter className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Twitter (X)</h3>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">@orblin_app</a>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-4 group">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors shrink-0 border border-blue-100">
                      <Github className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">GitHub</h3>
                      <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">/orblin-community</a>
                    </div>
                  </div>

                </div>
              </ContactCard>

              {/* FAQ / Help Card */}
              <ContactCard className="bg-blue-50 border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-blue-100">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Quick Help</h3>
                    <p className="text-sm text-gray-600">Common questions answered</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  <li>
                    <Link href="/help" className="flex items-center justify-between text-gray-700 hover:text-blue-600 font-medium group bg-white p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all hover:shadow-sm">
                      <span>How does the AI search work?</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-600" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="flex items-center justify-between text-gray-700 hover:text-blue-600 font-medium group bg-white p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all hover:shadow-sm">
                      <span>Can I export my boards?</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-600" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/help" className="flex items-center justify-between text-gray-700 hover:text-blue-600 font-medium group bg-white p-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all hover:shadow-sm">
                      <span>Refund Policy</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-blue-600" />
                    </Link>
                  </li>
                </ul>
              </ContactCard>

            </motion.div>
          </div>
        </div>
      </section>

      {/* --- QUICK CTA SECTION (Matches landing page pattern) --- */}
      <section className="py-24 px-6 bg-[#F8F9FA] border-t border-gray-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-3xl p-12 border border-gray-200 shadow-sm relative overflow-hidden">
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 font-serif-heading">
                Ready to stop tab-hopping?
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
                Join thousands of solo creators who've found their flow with Orblin.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/sign-up">
                  <ShimmerButton>
                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    <span>Start Thinking Free</span>
                  </ShimmerButton>
                </Link>
                
                <Link href="/boards/new">
                  <Button variant="ghost" className="h-14 px-8 rounded-full text-gray-700 font-semibold text-lg border border-gray-200 shadow-sm transition-all bg-white/50 hover:bg-white/80 hover:text-black">
                    Try Demo Board
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER (Matches landing page exactly) --- */}
      <footer className="py-12 border-t border-gray-200 text-center text-gray-500 text-sm bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 grayscale opacity-50">
              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-blue-400 rounded-md" />
            </div>
            <span className="font-bold text-gray-400 font-serif-heading">Orblin Inc.</span>
          </div>
          
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
            <a href="mailto:support@orblin.cloud" className="hover:text-black transition-colors">Support</a>
          </div>
          
          <p>© 2025 All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
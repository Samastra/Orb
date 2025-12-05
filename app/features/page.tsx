/* eslint-disable react/no-unescaped-entities */
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { 
  Brain, Search, Share2, 
  Zap, Shield, Globe, Sparkles, ArrowRight,
  Database, CloudLightning, Command, 
  Video, Maximize, FolderKanban, CheckCircle2
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
  `}</style>
);

// --- VISUAL ASSETS (Updated to match landing page) ---

const ScribbleHighlight = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-200 -z-10 opacity-60" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
     <path d="M2.00025 7.00001C30.5003 3.00001 100.001 -2.99999 198.001 5.00002" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

// Updated to match your brand colors
const RichSticker = ({ icon: Icon, rotate, className, delay = 0 }: any) => (
  <motion.div
    initial={{ scale: 0, rotate: 0 }}
    animate={{ scale: 1, rotate: rotate }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay }}
    whileHover={{ scale: 1.1, rotate: rotate + 10 }}
    className={`absolute z-20 flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-md border-2 border-gray-100 ${className}`}
  >
    <div className="w-full h-full rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100">
      <Icon className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
    </div>
  </motion.div>
);

// Updated BentoCard to match landing page style
const BentoCard = ({ children, className, title, description, icon: Icon }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 hover:shadow-lg hover:border-blue-200 transition-all duration-300 h-full flex flex-col ${className}`}
  >
    <div className="mb-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 bg-white border border-blue-100">
        <Icon className="w-7 h-7 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-gray-600 leading-relaxed font-medium mb-6">{description}</p>
    </div>
    <div className="mt-auto pt-6 border-t border-gray-100">
      {children}
    </div>
  </motion.div>
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

// --- FEATURE DATA (Updated to match your brand colors) ---

const features = [
  {
    icon: Brain,
    title: "Context-Aware AI",
    description: "The whiteboard that researches with you. Orblin analyzes your notes and automatically fetches relevant articles, papers, and data.",
    details: ["Auto-suggested sources", "Relevant content matching", "Research while you type"]
  },
  {
    icon: Globe,
    title: "Live Web Embeds",
    description: "Stop tab-hopping. Interact with live websites directly on your canvas. Scroll, click, and read without breaking flow.",
    details: ["Full browser interactivity", "No context switching", "Visual bookmarking"]
  },
  {
    icon: Share2,
    title: "Public Knowledge Hub",
    description: "Build in public. Publish your boards to the community or browse thousands of templates from other solo creators for inspiration.",
    details: ["Publish read-only boards", "Community templates", "Discover trending ideas"]
  },
  {
    icon: Video,
    title: "Video Player Mode",
    description: "Watch tutorials, lectures, or references side-by-side with your notes. The perfect setup for deep learning.",
    details: ["Picture-in-picture style", "YouTube integration", "Note-taking mode"]
  },
  {
    icon: Maximize,
    title: "Infinite Solo Canvas",
    description: "No pages, no boundaries. Just endless space to map out your brain using shapes, connectors, and sticky notes.",
    details: ["Pan and zoom freely", "Rich visual tools", "Focus mode"]
  },
  {
    icon: FolderKanban,
    title: "Smart Organization",
    description: "Messy thinkers welcome. Orblin automatically categorizes your research and boards so you can find anything later.",
    details: ["Auto-tagging", "Global search", "Topic clustering"]
  }
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      <GlobalStyles />
      <Navbar />

      {/* --- HERO SECTION (Updated to match landing page) --- */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-[#F8F9FA] border-b border-gray-200">
        
        {/* Floating Stickers with brand colors */}
        <RichSticker 
          icon={Zap} 
          rotate={-12} 
          className="top-40 left-[10%] hidden lg:flex" 
          delay={0.2}
        />
        <RichSticker 
          icon={Brain} 
          rotate={12} 
          className="top-32 right-[10%] hidden lg:flex" 
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
              <Sparkles className="w-3 h-3" />
              <span>Built for the Solo Mind</span>
            </div>

            {/* Heading - matches landing page font */}
            <h1 className="relative text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-gray-900 font-serif-heading">
              Your Second Brain,<br className="md:hidden" />
              <span className="relative inline-block ml-3">
                <span className="relative z-10 text-blue-600">Visualized.</span>
                <ScribbleHighlight />
              </span>
            </h1>
            
            {/* Subtext - matches landing page style */}
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed font-medium">
              We stripped away the team chats and permissions to give you 
              pure, uninterrupted thinking space.
            </p>

            {/* CTA Buttons - matches landing page */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
              <Link href="/sign-up">
                <ShimmerButton>
                  <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span>Get Started Free</span>
                </ShimmerButton>
              </Link>
              
              <Link href="/boards/new">
                <Button variant="ghost" className="h-14 px-8 rounded-full text-gray-700 font-semibold text-lg border border-gray-200 shadow-sm transition-all bg-white/50 hover:bg-white/80 hover:text-black">
                  Try Demo Board
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID (Updated to match landing page) --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 font-serif-heading">Designed for Deep Focus</h2>
            <p className="text-gray-500 mt-4">Every feature removes friction, so you can think without interruption.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <BentoCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              >
                <ul className="space-y-3">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* --- TECH SPECS (Updated to match landing page) --- */}
      <section className="py-24 px-6 bg-[#F8F9FA] border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 font-serif-heading mb-4">Solo doesn't mean "Small"</h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-medium">
              Orblin is built on enterprise-grade infrastructure to handle your most ambitious ideas.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Private by Default", desc: "No team leaks" },
              { icon: CloudLightning, title: "Instant Sync", desc: "Phone to Laptop" },
              { icon: Database, title: "Data Export", desc: "You own your data" },
              { icon: Command, title: "Weekly Updates", desc: "New solo tools" },
            ].map((tech, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <tech.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{tech.title}</h3>
                <p className="text-sm text-gray-600">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION (Updated to match landing page) --- */}
      <section className="py-24 px-6 bg-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-[32px] p-12 border border-gray-200 shadow-xl relative overflow-hidden">
            
            {/* Background Decorations - subtle like landing page */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-30" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 font-serif-heading">
                Ready to find your flow?
              </h2>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto font-medium">
                Stop managing browser tabs and start building your ideas. 
                Join the solo brainstorming revolution.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/sign-up">
                  <ShimmerButton>
                    <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    <span>Get Started Free</span>
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

      {/* --- FOOTER (Updated to match landing page) --- */}
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
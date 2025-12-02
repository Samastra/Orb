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
  Video, Maximize, FolderKanban
} from "lucide-react";

// --- VISUAL ASSETS ---

const ScribbleHighlight = () => (
  <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-200 -z-10 opacity-60" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
     <path d="M2.00025 7.00001C30.5003 3.00001 100.001 -2.99999 198.001 5.00002" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
  </svg>
);

const RichSticker = ({ icon: Icon, color, rotate, className, delay = 0 }: any) => (
  <motion.div
    initial={{ scale: 0, rotate: 0 }}
    animate={{ scale: 1, rotate: rotate }}
    transition={{ type: "spring", stiffness: 260, damping: 20, delay: delay }}
    whileHover={{ scale: 1.1, rotate: rotate + 10 }}
    className={`absolute z-20 flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white ${className}`}
  >
    <div className={`w-full h-full rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-8 h-8 text-white fill-current" strokeWidth={2.5} />
    </div>
  </motion.div>
);

const BentoCard = ({ children, className, title, description, icon: Icon, iconColor }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 h-full flex flex-col ${className}`}
  >
    <div className="mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300 ${iconColor}`}>
        {Icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{title}</h3>
      <p className="text-gray-500 leading-relaxed font-medium mb-6">{description}</p>
    </div>
    <div className="mt-auto pt-6 border-t border-gray-100">
      {children}
    </div>
  </motion.div>
);

// --- FEATURE DATA (SOLO FOCUSED) ---

const features = [
  {
    icon: <Brain className="w-7 h-7 text-white" />,
    color: "bg-purple-500",
    title: "Context-Aware AI",
    description: "The whiteboard that researches with you. Orblin analyzes your notes and automatically fetches relevant articles, papers, and data.",
    details: ["Auto-suggested sources", "Relevant content matching", "Research while you type"]
  },
  {
    icon: <Globe className="w-7 h-7 text-white" />,
    color: "bg-blue-500",
    title: "Live Web Embeds",
    description: "Stop tab-hopping. Interact with live websites directly on your canvas. Scroll, click, and read without breaking flow.",
    details: ["Full browser interactivity", "No context switching", "Visual bookmarking"]
  },
  {
    icon: <Share2 className="w-7 h-7 text-white" />,
    color: "bg-green-500",
    title: "Public Knowledge Hub",
    description: "Build in public. Publish your boards to the community or browse thousands of templates from other solo creators for inspiration.",
    details: ["Publish read-only boards", "Community templates", "Discover trending ideas"]
  },
  {
    icon: <Video className="w-7 h-7 text-white" />,
    color: "bg-red-500",
    title: "Video Player Mode",
    description: "Watch tutorials, lectures, or references side-by-side with your notes. The perfect setup for deep learning.",
    details: ["Picture-in-picture style", "YouTube integration", "Note-taking mode"]
  },
  {
    icon: <Maximize className="w-7 h-7 text-white" />,
    color: "bg-indigo-500",
    title: "Infinite Solo Canvas",
    description: "No pages, no boundaries. Just endless space to map out your brain using shapes, connectors, and sticky notes.",
    details: ["Pan and zoom freely", "Rich visual tools", "Focus mode"]
  },
  {
    icon: <FolderKanban className="w-7 h-7 text-white" />,
    color: "bg-orange-500",
    title: "Smart Organization",
    description: "Messy thinkers welcome. Orblin automatically categorizes your research and boards so you can find anything later.",
    details: ["Auto-tagging", "Global search", "Topic clustering"]
  }
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white">
        
        {/* Floating Stickers */}
        <RichSticker 
          icon={Zap} 
          color="bg-yellow-400" 
          rotate={-12} 
          className="top-40 left-[10%] hidden lg:flex" 
          delay={0.2}
        />
        <RichSticker 
          icon={Brain} 
          color="bg-purple-500" 
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-blue-600 mb-8">
              <Sparkles className="w-3 h-3" />
              <span>Built for the Solo Mind</span>
            </div>

            <h1 className="relative text-5xl md:text-6xl font-extrabold tracking-tight mb-8 text-gray-900">
              Your Second Brain,<br className="md:hidden" />
              <span className="relative inline-block ml-3">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Visualized.</span>
                <ScribbleHighlight />
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
              We stripped away the team chats and permissions to give you 
              pure, uninterrupted thinking space.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES GRID --- */}
      <section className="pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <BentoCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                iconColor={feature.color}
              >
                <ul className="space-y-3">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* --- TECH SPECS (Slate Background) --- */}
      <section className="py-24 px-6 bg-slate-50 border-y border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Solo doesn't mean "Small"</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Orblin is built on enterprise-grade infrastructure to handle your most ambitious ideas.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: "Private by Default", desc: "No team leaks", color: "text-blue-600" },
              { icon: CloudLightning, title: "Instant Sync", desc: "Phone to Laptop", color: "text-yellow-600" },
              { icon: Database, title: "Data Export", desc: "You own your data", color: "text-green-600" },
              { icon: Command, title: "Weekly Updates", desc: "New solo tools", color: "text-purple-600" },
            ].map((tech, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-12 h-12 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <tech.icon className={`w-6 h-6 ${tech.color}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{tech.title}</h3>
                <p className="text-xs text-gray-500">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-[32px] p-12 border border-blue-100 shadow-xl relative overflow-hidden">
            
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">
                Ready to find your flow?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
                Stop managing browser tabs and start building your ideas. 
                Join the solo brainstorming revolution.
              </p>
              <Link href="/sign-up">
                <Button 
                  size="lg" 
                  className="bg-gray-900 hover:bg-black text-white px-10 py-7 text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-gray-200 text-center text-gray-500 text-sm bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-md" />
            <span className="font-bold text-gray-900">Orblin</span>
          </div>
          
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link>
            <a href="mailto:support@orblin.cloud" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
          
          <p>© 2025 Orblin Inc.</p>
        </div>
      </footer>
    </main>
  );
}
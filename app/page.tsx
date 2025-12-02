/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar"; 
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { loadPaddle, openPaddleCheckout } from '@/lib/paddle-loader';
import { 
  ArrowRight, Sparkles, Zap, Globe, MousePointer2, 
  Search, Layers, Brain, CheckCircle, Shield, Gift, Snowflake, Play, 
  Type, Square, Image as ImageIcon, PenTool, Eraser, LayoutGrid,
  ThumbsUp, Heart, Flame, Smile, Lightbulb
} from "lucide-react";

// --- RICH STICKER COMPONENT ---
// This creates the "Physical Sticker" look with a white border and shadow
const RichSticker = ({ icon: Icon, color, rotate, className, delay = 0 }: any) => (
  <motion.div
    initial={{ scale: 0, rotate: 0 }}
    animate={{ scale: 1, rotate: rotate }}
    transition={{ 
      type: "spring",
      stiffness: 260,
      damping: 20,
      delay: delay 
    }}
    whileHover={{ scale: 1.1, rotate: rotate + 10 }}
    className={`absolute z-20 flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-4 border-white ${className}`}
  >
    <div className={`w-full h-full rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-8 h-8 text-white fill-current" strokeWidth={2.5} />
    </div>
  </motion.div>
);

// --- HERO UI COMPONENT ---
const HeroInterface = () => {
  return (
    <div className="relative w-full max-w-6xl mx-auto mt-20 perspective-1000">
      
      {/* STICKER 1: THUMBS UP (Validation) */}
      <RichSticker 
        icon={ThumbsUp} 
        color="bg-blue-500" 
        rotate={12} 
        className="-top-6 -right-6 hidden md:flex" 
        delay={0.8}
      />

      {/* STICKER 2: LIGHTBULB (Idea) */}
      <RichSticker 
        icon={Lightbulb} 
        color="bg-yellow-400" 
        rotate={-12} 
        className="-top-6 -left-6 hidden md:flex" 
        delay={1}
      />

      <motion.div 
        initial={{ rotateX: 5, y: 40, opacity: 0 }}
        animate={{ rotateX: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden aspect-[16/10] md:aspect-[16/9]"
      >
        {/* Browser Header */}
        <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
             <div className="flex gap-1.5">
               <div className="w-3 h-3 rounded-full bg-red-400/80" />
               <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
               <div className="w-3 h-3 rounded-full bg-green-400/80" />
             </div>
             <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-xs text-gray-500 font-medium">Orblin / Business /</span>
                <span className="text-xs text-gray-900 font-bold">Integrating AI Workflow</span>
             </div>
          </div>
          <div className="text-xs text-gray-400 font-mono">orblin.cloud</div>
        </div>

        {/* Main Board Area */}
        <div className="relative h-full w-full bg-[#F9FAFB] flex">
            
            {/* Left Toolbar */}
            <div className="w-14 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-20 shadow-sm">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><MousePointer2 className="w-5 h-5" /></div>
                <div className="p-2 text-gray-400 hover:text-gray-600"><LayoutGrid className="w-5 h-5" /></div>
                <div className="p-2 text-gray-400 hover:text-gray-600"><Type className="w-5 h-5" /></div>
                <div className="p-2 text-gray-400 hover:text-gray-600"><Square className="w-5 h-5" /></div>
                <div className="p-2 text-gray-400 hover:text-gray-600"><ImageIcon className="w-5 h-5" /></div>
                <div className="mt-auto p-2 text-gray-400 hover:text-gray-600"><Eraser className="w-5 h-5" /></div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
                {/* Dot Grid Background */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#D1D5DB 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>

                {/* THE "SCANNING" TOAST */}
                <motion.div 
                   initial={{ y: -50, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 1 }}
                   className="absolute top-6 right-6 bg-white p-3 rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-3 z-30 w-72"
                >
                   <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center animate-pulse">
                      <Search className="w-4 h-4 text-blue-600" />
                   </div>
                   <div className="flex-1 space-y-1">
                      <div className="text-xs font-semibold text-gray-700">Scanning your board...</div>
                      <div className="h-1.5 w-3/4 bg-gray-100 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ x: "-100%" }}
                           animate={{ x: "100%" }}
                           transition={{ duration: 1.5, repeat: Infinity }}
                           className="h-full w-1/2 bg-blue-500 rounded-full" 
                         />
                      </div>
                   </div>
                </motion.div>

                {/* Central Node */}
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute top-[30%] left-[30%] bg-white border-2 border-blue-500 rounded-xl p-4 shadow-lg w-64 z-10"
                >
                   <p className="text-sm font-bold text-gray-800">Content Strategy Q1</p>
                   <p className="text-xs text-gray-500 mt-1">Focus on AI-driven workflows</p>
                </motion.div>

                {/* Connector Line */}
                <svg className="absolute inset-0 pointer-events-none">
                   <path d="M 450 250 C 550 250, 600 200, 650 150" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="6 6" />
                </svg>

                {/* Sticky Note 1 (Yellow) */}
                <motion.div 
                  initial={{ scale: 0, rotate: -5 }} 
                  animate={{ scale: 1, rotate: -3 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-[15%] left-[55%] w-48 h-48 bg-[#FEF3C7] shadow-sm p-4 transform"
                >
                   <div className="font-handwriting text-gray-700 leading-relaxed text-sm">
                      <span className="font-bold">Idea:</span><br/>
                      Use Orblin to auto-find competitor articles while we brainstorm!
                   </div>
                </motion.div>

                {/* Sticky Note 2 (Pink) */}
                <motion.div 
                  initial={{ scale: 0, rotate: 5 }} 
                  animate={{ scale: 1, rotate: 3 }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-[10%] left-[45%] w-40 h-40 bg-[#FCE7F3] shadow-sm p-4"
                >
                   <div className="font-handwriting text-gray-700 text-sm">
                      Check video sources tab.
                   </div>
                </motion.div>

                {/* Simulated Cursor */}
                <motion.div
                   animate={{ x: [0, 180, 220], y: [0, -100, -80] }}
                   transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
                   className="absolute bottom-[20%] left-[20%] z-40 pointer-events-none"
                >
                   <MousePointer2 className="w-5 h-5 text-gray-900 fill-black stroke-white" />
                   <div className="ml-4 -mt-2 px-2 py-0.5 bg-green-500 text-white text-[10px] rounded-full font-bold shadow-sm">Sarah</div>
                </motion.div>
            </div>
        </div>
      </motion.div>
      
      {/* Soft Glow behind the board */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-blue-500/10 blur-3xl -z-10 rounded-[3rem]" />
    </div>
  );
};

// --- BENTO CARD ---
const BentoCard = ({ children, className, title, subtitle, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 ${className}`}
  >
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-6">{children}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium">{subtitle}</p>
    </div>
  </motion.div>
);


// --- MAIN PAGE ---

export default function Home() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const containerRef = useRef(null);

  // --- PADDLE LOGIC ---
  const handleGetLifetimeAccess = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    try {
      const loaded = await loadPaddle();
      if (!loaded) throw new Error('Failed to load Paddle');
      openPaddleCheckout('pri_01kabghk4hhgbz2dnj353sv2td', user?.primaryEmailAddress?.emailAddress);
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
      if (!loaded) throw new Error('Failed to load Paddle');
      openPaddleCheckout('pri_01kabgkj0y7cv0yae5c89730pa', user?.primaryEmailAddress?.emailAddress);
    } catch (error) {
      console.error('Failed to open checkout:', error);
    }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-white border-b border-gray-100">
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-blue-600 mb-8 hover:scale-105 transition-transform cursor-default">
              <Sparkles className="w-3 h-3" />
              <span>The research assistant for solo founders</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="relative text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-gray-900">
              Stop Thinking <br />
              <span className="relative inline-block">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Alone.</span>
                {/* SVG Underline */}
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-yellow-300 -z-10 opacity-60" viewBox="0 0 200 9" fill="none" preserveAspectRatio="none">
                   <path d="M2.00025 7.00001C30.5003 3.00001 100.001 -2.99999 198.001 5.00002" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Orblin is the whiteboard that researches <em>with</em> you. It watches your workflow and quietly pulls up the tabs, videos, and papers you need.
            </p>
            
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button 
                onClick={handleGetLifetimeAccess}
                className="h-12 px-8 rounded-full bg-gray-900 text-white hover:bg-black text-base font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 z-10"
              >
                Get Lifetime Access <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link href="/boards/new">
                <Button variant="outline" className="h-12 px-8 rounded-full text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 font-semibold">
                  Try Demo Board
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* HERO UI with STICKERS */}
          <HeroInterface />
        </div>
      </section>

      {/* --- THE PROBLEM --- */}
      <section className="py-32 px-6 bg-slate-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto text-center relative">
          
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-gray-900">The "47-Tab Syndrome" is killing your flow.</h2>
          
          <div className="grid md:grid-cols-2 gap-8 text-left">
            {/* Problem Card */}
            <div className="group bg-white p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-6 text-red-500">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">The Research Chaos</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    You open a tab to check a fact. Then another for examples. Then another. 20 minutes later, your whiteboard is empty.
                  </p>
               </div>
            </div>

            {/* Solution Card */}
            <div className="group bg-white p-8 rounded-3xl border border-blue-100 shadow-sm hover:shadow-lg transition-all relative overflow-hidden ring-1 ring-blue-500/10">
               {/* STICKER 3: SMILEY (Happy Solution) */}
               <RichSticker 
                  icon={Smile} 
                  color="bg-green-500" 
                  rotate={-10} 
                  className="-top-4 -right-4 w-12 h-12" 
               />

               <div className="relative z-10">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">The Orblin Flow</h3>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    Stay on the canvas. As you type "marketing strategy," Orblin silently pins relevant case studies to the sidebar.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto relative">
          {/* STICKER 4: HEART (Love for Solo Founders) */}
          <RichSticker 
            icon={Heart} 
            color="bg-pink-500" 
            rotate={15} 
            className="top-0 left-[20%] w-14 h-14 hidden lg:flex" 
            delay={0.5}
          />

          <div className="text-center mb-20">
             <h2 className="text-4xl font-bold text-gray-900">
               Built for the Solo Mind
             </h2>
             <p className="text-gray-500 mt-4 text-lg">Everything you need to think deeply, in one place.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1 */}
            <BentoCard 
              className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-50/50 to-white"
              title="Context-Aware Research AI"
              subtitle="The engine that reads your mind. Orblin analyzes the text, shapes, and connections on your board to fetch highly relevant YouTube videos, academic papers, and websites."
            >
              <div className="absolute top-8 right-8 p-4 bg-white rounded-xl border border-gray-200 w-64 shadow-xl transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <div className="flex gap-3 items-center mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-500">Scanning your board...</span>
                </div>
                <div className="space-y-2">
                   <div className="h-2 w-full bg-gray-100 rounded animate-pulse" />
                   <div className="h-2 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </BentoCard>

            {/* Feature 2 */}
            <BentoCard 
              className="md:row-span-2 relative bg-white"
              title="Infinite Canvas"
              subtitle="No borders. No pages. Just endless space to map out your entire brain."
            >
               <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:16px_16px]" />
            </BentoCard>

            {/* Feature 3 */}
            <BentoCard 
              title="Web Embeds"
              subtitle="Don't just link it. See it. Interact with live websites directly on your board."
            >
               <Globe className="w-10 h-10 text-blue-500 mb-4" />
            </BentoCard>

            {/* Feature 4 */}
            <BentoCard 
              title="Video Player Mode"
              subtitle="Watch tutorials and take notes side-by-side without split-screening."
            >
               <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mb-4 text-red-500 font-bold shadow-sm">▶</div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* --- DECEMBER SALE PRICING --- */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-b from-slate-50 to-white border-t border-gray-200">
         <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white border border-gray-200 rounded-[32px] p-8 md:p-16 text-center relative overflow-hidden shadow-2xl"
            >
               {/* STICKER 5: FLAME (Hot Deal) */}
               <RichSticker 
                  icon={Flame} 
                  color="bg-orange-500" 
                  rotate={-6} 
                  className="top-8 right-8 w-20 h-20" 
                  delay={0.2}
               />

               {/* Festive Background Effect */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-red-50 rounded-full blur-[80px] pointer-events-none opacity-50" />
               <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-50 rounded-full blur-[80px] pointer-events-none opacity-50" />

               <div className="relative z-10">
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-bold uppercase tracking-widest mb-6 border border-red-200">
                   <Snowflake className="w-4 h-4" /> December Holiday Sale
                 </div>
                 
                 <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-gray-900">Pay Once. Think Forever.</h2>
                 <p className="text-gray-500 mb-10 max-w-lg mx-auto text-lg font-medium">
                   Start your new year with focus. Get full lifetime access for a single price.
                 </p>

                 <div className="flex items-baseline justify-center gap-3 mb-12 relative inline-flex">
                   <span className="text-7xl font-extrabold text-gray-900 tracking-tighter">$299</span>
                   <div className="flex flex-col items-start z-10">
                     <span className="text-gray-400 text-lg line-through">$599</span>
                     <span className="text-red-600 text-sm font-bold bg-red-50 px-2 py-0.5 rounded">50% OFF</span>
                   </div>
                 </div>

                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                   <Button 
                    onClick={handleGetLifetimeAccess}
                    className="w-full sm:w-auto px-12 h-16 rounded-2xl text-lg font-bold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white transition-all shadow-xl shadow-red-500/20 transform hover:-translate-y-1"
                   >
                     <Gift className="w-5 h-5 mr-2" /> Get December Deal
                   </Button>
                   <Button 
                    onClick={handleGetYearlyAccess}
                    variant="outline"
                    className="w-full sm:w-auto px-8 h-16 rounded-2xl text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all"
                   >
                     Or Pay $60/Year
                   </Button>
                 </div>
                 
                 <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> 30-day money-back guarantee</span>
                    <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> Secure payment</span>
                 </div>
               </div>
            </motion.div>
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
            <a href="mailto:support@orblin.cloud" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
          
          <p>© 2025 Orblin Inc.</p>
        </div>
      </footer>
    </main>
  );
}
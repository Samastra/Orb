"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Zap, Menu, X, Sparkles, Globe,
  PlayCircle, Brain,
  CheckCircle2, ShieldCheck, Gift, FileText, PieChart, Share2
} from "lucide-react";
import { loadPaddle, openPaddleCheckout } from '@/lib/paddle-loader';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// --- 1. GLOBAL STYLES ---
const GlobalStyles = () => (
  <style jsx global>{`
    @import url('https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Inter:wght@400;500;600;800&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
    
    .font-hand { font-family: 'Patrick Hand', cursive; }
    .font-serif-heading { font-family: 'Libre Baskerville', serif; }
    
    /* Dots: Darker gray (#94A3B8) and 2px size */
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

    /* Removed unused pulse animations */
    
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    .animate-cursor {
      animation: blink 1s step-end infinite;
    }
  `}</style>
);

// --- 2. FLOATING STICKY NOTES BACKGROUND ---
const stickyNotesData = [
  { text: "Q3 Growth Strategy: Focus on SEO & Content partnerships.", color: "bg-yellow-100 border-yellow-200", top: "5%", left: "2%", rotate: -3 },
  { text: "Edu cohort launching Sept 15th. Need curriculum review.", color: "bg-blue-100 border-blue-200", top: "10%", left: "85%", rotate: 5 },
  { text: "User Interview Key Takeaway: &apos;Too many clicks to start a board&apos;.", color: "bg-pink-100 border-pink-200", top: "75%", left: "5%", rotate: 2 },
  { text: "Machine Learning model update - improve citation accuracy.", color: "bg-green-100 border-green-200", top: "60%", left: "88%", rotate: -4 },
  { text: "Brainstorm: How to reduce onboarding friction?", color: "bg-yellow-50 border-yellow-100", top: "90%", left: "30%", rotate: 6 },
];

const FloatingStickyNotes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      <div className="absolute inset-0 bg-dot-grid opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white opacity-80" />

      {stickyNotesData.map((note, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute p-6 shadow-md w-56 h-auto flex items-center justify-center font-hand text-lg text-gray-700 text-center leading-tight rounded-sm border-2 opacity-90",
            note.color
          )}
          style={{ top: note.top, left: note.left }}
          initial={{ rotate: note.rotate, x: 0, y: 0 }}
          animate={{
            x: ["0%", `${(Math.random() - 0.5) * 15}%`, "0%"],
            y: ["0%", `${(Math.random() - 0.5) * 15}%`, "0%"],
            rotate: [note.rotate, note.rotate + (Math.random() * 6 - 3), note.rotate],
          }}
          transition={{
            duration: 15 + Math.random() * 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {note.text}
        </motion.div>
      ))}
    </div>
  );
};


// --- 3. TYPEWRITER COMPONENT ---
const Typewriter = ({ words, delay = 3000 }: { words: string[], delay?: number }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeout2 = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(timeout2);
  }, []);

  useEffect(() => {
    if (index === words.length) return;

    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => {
        setReverse(true);
      }, 1000);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, Math.random() * 50));

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, words]);

  return (
    <span className="inline-block min-w-[120px] text-left text-blue-600">
      {`${words[index].substring(0, subIndex)}`}
      <span className={cn("inline-block w-[3px] h-8 md:h-12 bg-blue-600 ml-1 align-middle", blink ? "opacity-100" : "opacity-0")}></span>
    </span>
  );
};

// --- 4. SPECIAL "LIFETIME" BUTTON (Cleaned up, sized to match secondary button) ---
const ShimmerButton = ({ onClick, children, className }: any) => (
  <button
    onClick={onClick}
    className={cn(
      // Base Structure - Matched size (h-14) and font (text-lg font-semibold) to secondary button
      "relative h-14 rounded-full text-white font-semibold text-lg overflow-hidden group",
      // Simpler dark background
      "bg-black/90 hover:bg-black transition-all duration-300",
      // Much subtler shadow and hover lift
      "shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0",
      // Allow external override (e.g., for w-full in pricing)
      className
    )}
  >
    {/* Shimmer effect (reduced opacity for cleaner look) */}
    <div className="absolute inset-0 animate-shimmer opacity-30" />
    {/* Subtle blue hover glow */}
    <div className="absolute inset-0 bg-blue-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    {/* Button Content - Matched padding (px-8) */}
    <span className="relative z-10 flex items-center justify-center gap-2 px-8">
      {children}
    </span>
  </button>
);

// --- 5. HERO WITH YOUR IMAGE ---
const HeroInterface = () => {
  return (
    <div className="relative w-full max-w-6xl mx-auto mt-20 perspective-1000">

      <motion.div
        initial={{ rotateX: 5, y: 40, opacity: 0 }}
        animate={{ rotateX: 0, y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative bg-white/95 backdrop-blur-sm rounded-[2rem] border border-gray-200/80 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden group"
      >
        {/* Browser Top Bar */}
        <div className="h-12 bg-gradient-to-b from-[#FAFAFA] to-[#F1F1F1] border-b border-gray-200/80 flex items-center px-6 justify-between z-20 relative">
          <div className="flex gap-2.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]/60" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]/60" />
            <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]/60" />
          </div>
          <div className="flex items-center gap-2 px-6 py-1.5 bg-white rounded-full border border-gray-200/80 shadow-sm">
            <span className="text-sm font-medium text-gray-600">orblin.cloud</span>
          </div>
          <div className="w-16" />
        </div>

        {/* IMAGE CONTAINER */}
        <div className="relative aspect-[16/8] w-full bg-gray-50">
          <Image
            src="/dashboard-preview.png"
            alt="Orblin Interface"
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Floating Context Element */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
        className="absolute -right-10 top-1/3 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] border border-white/50 z-30 hidden md:block"
      >
        <div className="flex items-center gap-4">
          <div className="bg-blue-100/80 p-3 rounded-xl"><Sparkles className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-sm font-bold text-gray-900">Context Engine</p>
            <p className="text-xs text-gray-500 font-medium">Found 3 relevant papers</p>
          </div>
        </div>
      </motion.div>

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-blue-400/15 blur-[120px] -z-10 rounded-full pointer-events-none" />
    </div>
  );
};

// --- 6. INTERACTIVE TAB CHAOS SIMULATION ---
const TabChaosSimulation = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { title: "Research Paper.pdf", color: "bg-blue-50", border: "border-blue-100" },
    { title: "YouTube Tutorial", color: "bg-gray-50", border: "border-gray-200" },
    { title: "Wikipedia", color: "bg-gray-100", border: "border-gray-300" },
    { title: "GitHub Repo", color: "bg-blue-50", border: "border-blue-100" },
    { title: "Medium Article", color: "bg-gray-50", border: "border-gray-200" },
    { title: "Google Scholar", color: "bg-blue-50", border: "border-blue-100" },
    { title: "Stack Overflow", color: "bg-gray-100", border: "border-gray-300" },
    { title: "Data Set.csv", color: "bg-gray-50", border: "border-gray-200" },
    { title: "Twitter Thread", color: "bg-blue-50", border: "border-blue-100" },
    { title: "Documentation", color: "bg-gray-100", border: "border-gray-300" },
    { title: "Academic Journal", color: "bg-gray-50", border: "border-gray-200" },
    { title: "Product Hunt", color: "bg-blue-50", border: "border-blue-100" },
  ];

  return (
    <div className="relative w-full aspect-[4/3] bg-white rounded-2xl shadow-xl border border-gray-200 p-6 overflow-hidden">
      {/* Browser Top Bar with Tabs */}
      <div className="flex items-end gap-2 mb-6 overflow-x-auto pb-2">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-20 h-8 rounded-t-lg relative cursor-pointer transition-all duration-300 min-w-[80px]",
              i === activeTab 
                ? "bg-white shadow-sm border-t border-x border-gray-300" 
                : "bg-gray-200 hover:bg-gray-300"
            )}
            whileHover={{ y: -2 }}
            onClick={() => setActiveTab(i)}
          >
            <div className={cn(
              "absolute inset-0 rounded-t-lg",
              i === activeTab 
                ? "bg-white" 
                : "bg-gray-200"
            )} />
            {i === activeTab && (
              <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
            )}
            <div className="relative p-2 flex items-center gap-1.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                i === activeTab ? "bg-gray-400" : "bg-gray-500"
              )} />
              <span className="text-[10px] font-medium truncate">
                Tab {i + 1}
              </span>
            </div>
          </motion.div>
        ))}
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors ml-2">
          <span className="text-gray-600 font-bold text-sm">+</span>
        </div>
      </div>

      {/* Tab Content Chaos Grid */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map((tab, i) => (
          <motion.div
            key={i}
            className={cn(
              `${tab.color} p-3 rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-all duration-300`,
              tab.border,
              i === activeTab % tabs.length && "ring-2 ring-blue-400 ring-offset-1"
            )}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => setActiveTab(i)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full" />
              <span className="text-xs font-medium truncate">{tab.title}</span>
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-gray-300 rounded-full w-full" />
              <div className="h-1 bg-gray-300 rounded-full w-3/4" />
              <div className="h-1 bg-gray-300 rounded-full w-1/2" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overlay Message - Appears after interaction */}
      <motion.div
        className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center p-8">
          <div className="text-5xl mb-4">😵‍💫</div>
          <motion.div
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl font-bold text-2xl shadow-2xl"
            initial={{ rotate: -5, scale: 0.9 }}
            whileHover={{ rotate: 0, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Tab Overload!
          </motion.div>
          <p className="mt-6 text-gray-700 max-w-xs text-lg font-medium">
            Can&apos;t find what you need?<br/>
            That&apos;s the problem.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- NAVBAR COMPONENT ---
const Navbar = () => {
  const { isSignedIn } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-6 pointer-events-none"
    >
      <div
        className={cn(
          "pointer-events-auto flex items-center justify-between transition-all duration-300",
          "rounded-2xl px-6 py-3 w-full max-w-5xl",
          scrolled
            ? "bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-sm"
            : "bg-transparent border border-transparent"
        )}
      >
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8">
            <Image src="/Asset1.png" alt="Orblin Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
            Orblin
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Contact", "Features"].map((item) => (
            <Link key={item} href={`${item.toLowerCase()}`} className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {item}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href={isSignedIn ? "/boards" : "/sign-in"}>
            <span className="text-sm font-medium text-gray-600 hover:text-black px-3 py-2">
              {isSignedIn ? "Dashboard" : "Log in"}
            </span>
          </Link>
          <Link href={isSignedIn ? "/boards" : "/sign-up"}>
            <Button className="rounded-xl bg-black text-white hover:bg-gray-800 h-9 text-xs px-4 font-semibold shadow-lg shadow-black/10">
              Start Thinking <Zap className="w-3 h-3 ml-2" />
            </Button>
          </Link>
        </div>

        <button className="md:hidden text-gray-900" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>
    </motion.header>
  );
};


// --- MAIN PAGE ---
export default function Home() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const handleCheckout = async (priceId: string) => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    try {
      const loaded = await loadPaddle();
      if (loaded && user?.primaryEmailAddress?.emailAddress) {
        openPaddleCheckout(priceId, user.primaryEmailAddress.emailAddress);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 overflow-x-hidden relative">
      <GlobalStyles />
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">

        {/* BACKGROUND LAYER */}
        <FloatingStickyNotes />

        <div className="max-w-7xl mx-auto text-center relative z-10 flex flex-col items-center">

          {/* BADGE */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/90 backdrop-blur-sm border border-blue-100 text-xs font-semibold text-blue-700 mb-8 mx-auto"
          >
            <Brain className="w-3 h-3" />
            <span>AI-Powered Whiteboard</span>
          </motion.div>

          {/* HEADLINE */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1] font-serif-heading min-h-[160px] md:min-h-[180px]">
            The research assistant for <br />
            <Typewriter
              words={["Solo Founders.", "Deep Thinkers.", "Researchers.", "Content Creators.", "Students."]}
            />
          </h1>

          {/* SUBTEXT */}
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            Eliminate &quot;research chaos.&quot; Orblin watches you brainstorm and quietly pulls up the relevant papers, videos, and data you need—so you stay in flow.
          </p>

          {/* BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 relative z-20">
            {/* ShimmerButton now matches size of secondary button and has subtle shadow */}
            <ShimmerButton onClick={() => handleCheckout('pri_01kabghk4hhgbz2dnj353sv2td')}>
              <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span>Get Lifetime Access</span>
            </ShimmerButton>

            <Link href="/boards/new">
              <Button variant="ghost" className="h-14 px-8 rounded-full text-gray-700 font-semibold text-lg border border-gray-200/50 shadow-sm transition-all backdrop-blur-sm bg-white/50 hover:bg-white/80 hover:text-black">
                Try Demo Board
              </Button>
            </Link>
          </div>

          <HeroInterface />
        </div>
      </section>


      {/* --- THE PHILOSOPHY (Problem) - UPDATED WITH INTERACTIVE SIMULATION --- */}
      <section id="philosophy" className="py-32 px-6 bg-[#F8F9FA] border-y border-gray-200 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold font-serif-heading mb-6">The &quot;47-Tab Syndrome&quot;</h2>
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                You know the feeling. You start with one idea. Then you open a tab to fact-check. Then another for a video.
                <br /><br />
                <span className="font-bold text-gray-900 text-xl">
                  20 minutes later, you&apos;re lost.
                </span>
                <br /><br />
                Your whiteboard is empty, but your browser is full. The cognitive cost of switching contexts is killing your ability to think deeply.
                <br /><br />
                <span className="italic text-gray-500">
                  Click on the tabs to experience the chaos ↓
                </span>
              </p>
              <div className="flex items-center gap-2 text-sm text-blue-600 font-hand text-xl rotate-2 mt-8">
                <span className="transform scale-x-[-1] inline-block">➥</span>
                <span>This stops today.</span>
              </div>
            </div>
            
            {/* Replace the old static grid with the interactive simulation */}
            <TabChaosSimulation />
          </div>
        </div>
      </section>

     {/* --- FEATURES --- */}
<section id="features" className="py-32 px-6 bg-white relative z-10">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-20">
      <h2 className="text-4xl font-bold text-gray-900 font-serif-heading">Your Silent Partner</h2>
      <p className="text-gray-500 mt-4">Orblin sits in the background, only speaking when it has something valuable to add.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Feature - The &quot;Aha!&quot; Generator */}
      <div className="md:col-span-2 bg-blue-50/50 rounded-3xl p-8 border border-blue-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-blue-100">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">The &quot;Aha!&quot; Generator</h3>
              <p className="text-blue-600 text-sm font-medium">No more dead-end research</p>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed text-lg">
            Remember that moment when connecting two ideas suddenly made everything click? 
            <span className="font-bold text-gray-900"> That&apos;s what happens automatically.</span>
            <br /><br />
            While you&apos;re sketching your startup idea, Orblin quietly pulls up the exact case studies, 
            competitor data, and market research you need—before you even realize you need it.
          </p>
          <div className="mt-6 p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gray-600">LIVE EXAMPLE</span>
            </div>
            <p className="text-sm text-gray-700 mt-2 italic">
              &quot;Writing about &apos;remote work productivity&apos;? Here are 3 recent studies showing the optimal team size.&quot;
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-3/4 border-l border-y border-gray-200 bg-white rounded-l-xl shadow-lg p-4 translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
          <div className="flex gap-2 items-center mb-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400">INSIGHT DELIVERED</span>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-50 p-2 rounded text-[10px] text-gray-500 border-l-2 border-blue-500">
              &quot;Based on your &apos;SaaS&apos; note...&quot;
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-[11px] text-blue-700 font-bold border border-blue-100">
              <div className="font-bold mb-1">🎯 Pattern Found:</div>
              <div>Successful B2B SaaS companies...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: Never Lose That Perfect Source */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
        <div className="mb-6">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-gray-200">
            <Globe className="w-6 h-6 text-gray-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Never Lose That Perfect Source</h3>
          <p className="text-blue-600 text-sm font-medium">The end of bookmark chaos</p>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          How many brilliant articles have you bookmarked... only to forget why they mattered?
          <br /><br />
          <span className="font-bold text-gray-900">
            See websites, PDFs, and data visualizations directly on your board—right next to the idea they inspired.
          </span>
          <br /><br />
          Your research stays <span className="italic">connected to your thinking</span>, not lost in a sea of tabs.
        </p>
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 font-medium">
            💡 Pro tip: Right-click any link → &quot;Add to Orblin board&quot;
          </p>
        </div>
      </div>

      {/* Feature 3: Learn Without Losing Flow */}
      <div className="bg-white rounded-3xl p-8 border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
        <div className="mb-6">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm border border-gray-200">
            <PlayCircle className="w-6 h-6 text-gray-900" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Learn Without Losing Flow</h3>
          <p className="text-blue-600 text-sm font-medium">Watch, think, and create—simultaneously</p>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          That tutorial you keep rewinding? That lecture where you miss key points while scrambling for notes?
          <br /><br />
          <span className="font-bold text-gray-900">
            Watch videos side-by-side with your notes. Orblin transcribes, summarizes, and lets you timestamp your insights.
          </span>
          <br /><br />
          Finally, <span className="italic">learn deeply</span> instead of just watching passively.
        </p>
        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 font-medium">
            🎯 Bonus: AI finds relevant timestamps based on what you&apos;re working on
          </p>
        </div>
      </div>

      {/* Feature 4: Infinite Canvas for Infinite Ideas */}
      <div className="md:col-span-2 bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700 shadow-sm">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Infinite Canvas for Infinite Ideas</h3>
              <p className="text-gray-400 text-sm font-medium">Where all your thinking lives—forever</p>
            </div>
          </div>
          <p className="text-gray-300 max-w-lg text-lg leading-relaxed">
            Your brain doesn&apos;t work in isolated documents. Why should your tools?
            <br /><br />
            <span className="font-bold text-white">
              Connect your Q4 planning with customer research from 6 months ago. See how that side project idea relates to your main business.
            </span>
            <br /><br />
            Everything you think about lives in one connected space that grows with you.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Projects</div>
              <div className="text-sm font-bold">Unlimited boards</div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Connections</div>
              <div className="text-sm font-bold">Auto-linked ideas</div>
            </div>
          </div>
        </div>
        {/* Subtle grid pattern in background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800/30 rounded-full blur-3xl -mr-16 -mt-16 opacity-30" />
      </div>
    </div>

    {/* Callout at the bottom of features */}
    <div className="mt-20 text-center">
      <div className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
        <Brain className="w-5 h-5 text-blue-600" />
        <span className="text-gray-700 font-medium">
          Stop managing tabs. Start connecting ideas. 
          <span className="text-blue-600 font-bold ml-2">Try it risk-free →</span>
        </span>
      </div>
    </div>
  </div>
</section>

      {/* --- PRICING (SALE) --- */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-white to-gray-50 overflow-hidden relative border-t border-gray-200 relative z-10">
        <div className="max-w-5xl mx-auto relative z-10 text-center">

          <div className="inline-block px-4 py-1.5 rounded-full bg-red-100 text-red-600 text-xs font-bold tracking-widest mb-8 border border-red-200">
            <Gift className="w-3 h-3 inline mr-1" /> LIMITED HOLIDAY DEAL
          </div>

          <h2 className="text-4xl md:text-6xl font-bold font-serif-heading mb-6 text-gray-900">
            Pay Once. Think Forever.
          </h2>
          <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto">
            Stop renting your tools. Get full access to Orblin&apos;s AI, unlimited boards, and future updates for a single one-time payment.
          </p>

          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-white border border-gray-200 p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg mx-auto">
              <div className="flex justify-center items-center gap-4 mb-2">
                <span className="text-6xl font-bold text-gray-900">$299</span>
                <div className="text-left">
                  <span className="block text-gray-400 line-through text-lg">$599</span>
                  <span className="block text-red-500 font-bold text-sm bg-red-50 px-2 rounded">50% OFF</span>
                </div>
              </div>
              <p className="text-gray-500 mb-8 font-medium">One-time payment. Lifetime access.</p>

              <ShimmerButton className="w-full" onClick={() => handleCheckout('pri_01kabghk4hhgbz2dnj353sv2td')}>
                Get Lifetime Access
              </ShimmerButton>

              <div className="mt-6 flex flex-col gap-3 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" /> <span>Secure checkout via Paddle</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-gray-200 text-center text-gray-500 text-sm bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="relative w-6 h-6 grayscale opacity-50">
              <Image src="/Asset1.png" alt="Logo" fill className="object-contain" />
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
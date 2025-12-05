"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Zap, Menu, X, Sparkles, Globe,
  PlayCircle, Brain, ChevronLeft, ChevronRight,
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

// --- 4.5 FEATURES CAROUSEL COMPONENT ---
const FeaturesCarousel = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const features = [
    {
      id: 'ai-insights',
      label: 'AI-Powered Insights',
      title: 'The "Aha!" Generator',
      description: 'While you brainstorm, Orblin quietly finds the exact case studies, competitor data, and research you need—before you realize you need it.',
      icon: Brain,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      id: 'source-embedding',
      label: 'Source Embedding',
      title: 'Never Lose That Perfect Source',
      description: 'See websites, PDFs, and data visualizations directly on your board—right next to the idea they inspired. Your research stays connected.',
      icon: Globe,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
    },
    {
      id: 'video-learning',
      label: 'Video Learning',
      title: 'Learn Without Losing Flow',
      description: 'Watch videos side-by-side with your notes. Orblin transcribes, summarizes, and lets you timestamp your insights automatically.',
      icon: PlayCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      id: 'infinite-canvas',
      label: 'Infinite Canvas',
      title: 'Infinite Canvas for Infinite Ideas',
      description: 'Connect your Q4 planning with research from 6 months ago. Everything you think about lives in one connected space that grows with you.',
      icon: Sparkles,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
    },
  ];

  // Auto-switch features every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, features.length]);

  const goToPrev = () => {
    setActiveFeature((prev) => (prev - 1 + features.length) % features.length);
  };

  const goToNext = () => {
    setActiveFeature((prev) => (prev + 1) % features.length);
  };

  const currentFeature = features[activeFeature];
  const IconComponent = currentFeature.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main Card */}
      <div className="relative bg-[#111111] rounded-3xl border border-gray-800 overflow-hidden">
        {/* Subtle glow effect */}
        <div className={`absolute top-0 right-0 w-96 h-96 ${currentFeature.bgColor} rounded-full blur-3xl opacity-30 transition-all duration-700`} />

        <div className="relative grid md:grid-cols-2 gap-8 p-8 md:p-12">
          {/* Left Side - Feature List & Content */}
          <div className="space-y-8">
            {/* Feature Navigation List */}
            <div className="space-y-2">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(index)}
                  className={cn(
                    "flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl transition-all duration-300",
                    index === activeFeature
                      ? "bg-white/5 border border-white/10"
                      : "hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === activeFeature ? "bg-blue-500" : "bg-gray-600"
                  )} />
                  <span className={cn(
                    "text-sm font-medium transition-all duration-300",
                    index === activeFeature ? "text-white" : "text-gray-500"
                  )}>
                    {feature.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Feature Content */}
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              {/* Icon */}
              <div className={cn(
                "inline-flex items-center justify-center w-12 h-12 rounded-xl",
                currentFeature.bgColor,
                currentFeature.borderColor,
                "border"
              )}>
                <IconComponent className={cn("w-6 h-6", currentFeature.color)} />
              </div>

              {/* Title */}
              <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                {currentFeature.title}
              </h3>

              {/* Description */}
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                {currentFeature.description}
              </p>

              {/* CTA */}
              <Link href="/boards/new">
                <button className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
                  Get started
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right Side - Illustration */}
          <div className="relative flex items-center justify-center">
            <motion.div
              key={`illustration-${activeFeature}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                "relative w-64 h-64 md:w-80 md:h-80 rounded-3xl",
                currentFeature.bgColor,
                currentFeature.borderColor,
                "border backdrop-blur-xl flex items-center justify-center"
              )}
            >
              {/* Main Icon */}
              <IconComponent className={cn("w-24 h-24 md:w-32 md:h-32", currentFeature.color)} />

              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gray-800/80 backdrop-blur rounded-full border border-gray-700 flex items-center justify-center">
                <div className="w-5 h-5 bg-gray-600 rounded" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-gray-800/80 backdrop-blur rounded-full border border-gray-700 flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-600 rounded-full" />
              </div>

              {/* Glow lines */}
              <div className={cn("absolute inset-0 rounded-3xl", currentFeature.borderColor, "border opacity-50")} />
            </motion.div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <motion.div
            key={`progress-${activeFeature}`}
            className="h-full bg-blue-500"
            initial={{ width: "0%" }}
            animate={{ width: isPaused ? "0%" : "100%" }}
            transition={{ duration: 5, ease: "linear" }}
          />
        </div>
      </div>

      {/* Glass Navigation Arrows */}
      <button
        onClick={goToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
        aria-label="Previous feature"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
        aria-label="Next feature"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveFeature(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === activeFeature
                ? "w-8 bg-blue-500"
                : "bg-gray-600 hover:bg-gray-500"
            )}
            aria-label={`Go to feature ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

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
            Can&apos;t find what you need?<br />
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
            <ShimmerButton onClick={() => handleCheckout('pri_01kaeh8pqxqtdamn0h7z4dnbaa')}>
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

      {/* --- FEATURES CAROUSEL --- */}
      <section id="features" className="py-32 px-6 bg-[#0a0a0a] relative z-10 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.08)_0%,_transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif-heading">
              Your Silent Partner
            </h2>
            <p className="text-gray-500 text-lg">
              Orblin sits in the background, only speaking when it has something valuable to add.
            </p>
          </div>

          {/* Features Carousel Component */}
          <FeaturesCarousel />
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 px-6 bg-gradient-to-b from-[#0a0a0a] to-[#111111] overflow-hidden relative border-t border-gray-800">
        {/* Subtle gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif-heading">
              Simple and Affordable
              <br />
              <span className="text-gray-400">Pricing Plans</span>
            </h2>
            <p className="text-gray-500 text-lg">
              Start brainstorming and organizing your ideas with Orblin
            </p>
          </div>

          {/* Pricing Cards Container */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">

            {/* Yearly Card */}
            <div className="relative bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
              {/* Most Popular Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/25">
                  Most Popular
                </span>
              </div>

              <div className="pt-4">
                <h3 className="text-xl font-semibold text-white mb-6">Pro Yearly</h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-5xl font-bold text-white">$79</span>
                  <span className="text-gray-500 text-lg">/year</span>
                </div>

                <p className="text-gray-500 text-sm mb-8">
                  Best for creators and researchers who want full access at the best value.
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout('pri_01kaehgc2qw3vkd42763qrrewe')}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
                >
                  Get Pro Yearly
                </button>

                {/* Features */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Features</p>
                  <ul className="space-y-3">
                    {[
                      "Unlimited boards",
                      "AI-powered suggestions",
                      "Priority support",
                      "Advanced collaboration",
                      "Export to PDF & more"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Lifetime Card */}
            <div className="relative bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
              {/* Best Value Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/25">
                  Best Value
                </span>
              </div>

              <div className="pt-4">
                <h3 className="text-xl font-semibold text-white mb-6">Lifetime</h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-5xl font-bold text-white">$299</span>
                  <div className="flex flex-col">
                    <span className="text-gray-600 line-through text-sm">$599</span>
                    <span className="text-red-400 text-xs font-bold">50% OFF</span>
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-8">
                  Pay once, own forever. Perfect for power users who want lifetime access.
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout('pri_01kaeh8pqxqtdamn0h7z4dnbaa')}
                  className="w-full py-3.5 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all duration-300 shadow-lg"
                >
                  Get Lifetime Access
                </button>

                {/* Features */}
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Features</p>
                  <ul className="space-y-3">
                    {[
                      "Everything in Pro Yearly",
                      "Lifetime updates & upgrades",
                      "Priority feature requests",
                      "Early access to new features",
                      "Founding member badge"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-gray-400 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span>Secure checkout via Paddle</span>
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
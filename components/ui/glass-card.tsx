"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = "", hover = true }: GlassCardProps) {
  return (
    <motion.div
      className={`
        backdrop-blur-md bg-white/20 border border-white/30 
        rounded-2xl shadow-2xl shadow-blue-500/10
        ${hover ? "hover:bg-white/30 hover:border-white/40 transition-all duration-300" : ""}
        ${className}
      `}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </motion.div>
  )
}
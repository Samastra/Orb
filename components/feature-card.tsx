"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { GlassCard } from "@/components/ui/glass-card"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  delay?: number
  features?: string[]
}

export function FeatureCard({ icon, title, description, delay = 0, features = [] }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
    >
      <GlassCard className="p-8 h-full group cursor-pointer">
        <div className="space-y-6">
          {/* Icon */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            
            <p className="text-gray-600 leading-relaxed text-lg">
              {description}
            </p>

            {/* Feature List */}
            {features.length > 0 && (
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-center gap-3 text-gray-700"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: delay + 0.2 + (index * 0.1) }}
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          {/* Hover Effect Line */}
          <div className="w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-full" />
        </div>
      </GlassCard>
    </motion.div>
  )
}
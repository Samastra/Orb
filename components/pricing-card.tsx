"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Check, Star, Zap, Crown } from "lucide-react"
import Link from "next/link"

interface PricingCardProps {
  title: string
  description: string
  price: string
  period: string
  originalPrice?: string
  features: string[]
  featured?: boolean
  ctaText: string
  href: string
  delay?: number
  popular?: boolean
}

export function PricingCard({ 
  title, 
  description, 
  price, 
  period, 
  originalPrice,
  features, 
  featured = false, 
  ctaText, 
  href, 
  delay = 0,
  popular = false 
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <GlassCard className="px-4 py-2 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-semibold text-gray-900">Most Popular</span>
          </GlassCard>
        </div>
      )}

      <GlassCard className={`p-8 h-full relative overflow-hidden ${featured ? 'border-2 border-blue-500/50' : ''}`}>
        {/* Featured Gradient Overlay */}
        {featured && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-full -translate-y-16 translate-x-16" />
        )}

        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {featured && <Zap className="w-5 h-5 text-blue-600" />}
              <h3 className={`text-2xl font-bold ${featured ? 'text-gray-900' : 'text-gray-800'}`}>
                {title}
              </h3>
            </div>
            
            <p className="text-gray-600 leading-relaxed">
              {description}
            </p>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900">{price}</span>
                {originalPrice && (
                  <span className="text-lg text-gray-500 line-through">{originalPrice}</span>
                )}
              </div>
              <p className="text-gray-500 text-sm">{period}</p>
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <motion.li 
                key={index}
                className="flex items-center gap-3 text-gray-700"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: delay + 0.1 + (index * 0.05) }}
              >
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm">{feature}</span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <Link href={href} className="block">
            <Button 
              className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                featured 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl shadow-blue-500/25' 
                  : 'bg-white/50 border-2 border-gray-300 hover:border-blue-300 text-gray-900 hover:bg-white/70'
              }`}
              size="lg"
            >
              {ctaText}
            </Button>
          </Link>

          {/* Value Proposition */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: delay + 0.5 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <Star className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Save 80% vs yearly
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
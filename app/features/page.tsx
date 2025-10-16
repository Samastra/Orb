"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { 
  Brain, 
  Users, 
  Share2, 
  Search, 
  Clock, 
  Lightbulb,
  Zap,
  Shield,
  Globe,
  Lock,
  Sparkles,
  ArrowRight
} from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/navbar"

const features = [
  {
    icon: <Brain className="w-8 h-8 text-white" />,
    title: "AI-Powered Insights",
    description: "Get smart suggestions and connections as you brainstorm. Our AI helps you see patterns and opportunities you might have missed.",
    details: [
      "Automatic idea connections",
      "Content recommendations from trusted sources",
      "Pattern recognition across your boards",
      "Research suggestions based on your topics"
    ]
  },
  {
    icon: <Users className="w-8 h-8 text-white" />,
    title: "Real-time Collaboration",
    description: "Work together seamlessly with your team. See changes instantly, chat in context, and build ideas together in real-time.",
    details: [
      "Live cursor presence and activity indicators",
      "Instant updates across all devices",
      "Built-in comment threads and feedback",
      "Complete version history and restore points"
    ]
  },
  {
    icon: <Share2 className="w-8 h-8 text-white" />,
    title: "Public Knowledge Hub",
    description: "Share your work with the world or explore boards from other creators. Learn from thousands of public brainstorming sessions.",
    details: [
      "Publish boards to the community",
      "Discover trending topics and ideas",
      "Template library from successful sessions",
      "Knowledge exchange and inspiration"
    ]
  },
  {
    icon: <Search className="w-8 h-8 text-white" />,
    title: "Smart Organization",
    description: "Never lose an idea again. Orb automatically organizes your sessions and makes everything searchable and accessible.",
    details: [
      "Auto-categorization by topic and type",
      "Advanced search across all content",
      "Quick filters and smart tags",
      "Custom session templates"
    ]
  },
  {
    icon: <Clock className="w-8 h-8 text-white" />,
    title: "Always in Sync",
    description: "Pick up right where you left off. Your boards sync automatically across all devices, so your ideas are always with you.",
    details: [
      "Cross-device synchronization",
      "Offline access and editing",
      "Automatic cloud backup",
      "Quick recovery and version control"
    ]
  },
  {
    icon: <Lightbulb className="w-8 h-8 text-white" />,
    title: "Visual Thinking Tools",
    description: "Turn abstract ideas into clear visual plans. Use shapes, connectors, and templates designed for creative thinking.",
    details: [
      "Drag & drop interface with precision",
      "Multiple board types and layouts",
      "Custom template creation",
      "Multiple export and sharing options"
    ]
  }
]

const techFeatures = [
  {
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    title: "Enterprise Security",
    description: "End-to-end encryption and secure data handling"
  },
  {
    icon: <Globe className="w-6 h-6 text-green-600" />,
    title: "Global Performance",
    description: "Fast loading times with worldwide CDN coverage"
  },
  {
    icon: <Lock className="w-6 h-6 text-purple-600" />,
    title: "Data Privacy",
    description: "Your data belongs to you. We never sell your information"
  },
  {
    icon: <Sparkles className="w-6 h-6 text-amber-600" />,
    title: "Regular Updates",
    description: "Continuous improvements and new features monthly"
  }
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassCard className="inline-flex items-center gap-2 px-4 py-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Everything You Need to Think Better
              </span>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Modern Thinkers
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Orb brings together the best tools for brainstorming, collaboration, 
              and organization in one beautiful, intuitive platform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Link href="/sign-up">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-2xl shadow-blue-500/25"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Building Ideas
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="relative z-10 py-20 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <GlassCard className="p-8 h-full group cursor-pointer">
                  <div className="space-y-6">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Feature Details */}
                      <ul className="space-y-2">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-gray-700 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-4xl font-bold text-gray-900">
              Built with Modern Technology
            </h2>
            <p className="text-xl text-gray-600">
              Orb is built on a robust, scalable infrastructure that ensures 
              reliability, security, and performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {techFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center space-y-3"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GlassCard className="p-12">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ready to Transform Your Ideas?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of creators and teams who are already building 
                better ideas with Orb's powerful features.
              </p>
              <Link href="/sign-up">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold"
                >
                  Get Started Free
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </main>
  )
}
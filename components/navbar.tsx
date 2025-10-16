"use client"

import Link from "next/link"
import { Button } from "./ui/button"
import { SignOutButton, useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import { Command, Zap } from "lucide-react"

const Navbar = () => {
  const { isSignedIn } = useUser()

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border border-white/30 shadow-2xl shadow-blue-500/10 rounded-2xl mx-6 mt-6"
    >
      {/* Left Side - Logo & Navigation */}
      <div className="flex items-center gap-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Command className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Orb
          </h1>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-gray-700">
          <Link 
            href="/features" 
            className="hover:text-blue-600 transition-colors duration-300 font-medium relative group"
          >
            Features
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link 
            href="/help" 
            className="hover:text-blue-600 transition-colors duration-300 font-medium relative group"
          >
            Help
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
          </Link>
          <Link 
            href="/contact" 
            className="hover:text-blue-600 transition-colors duration-300 font-medium relative group"
          >
            Contact
            <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300" />
          </Link>
        </div>
      </div>

      {/* Right Side - Auth Buttons */}
      <div className="flex items-center gap-4">
        {isSignedIn ? (
          <>
            <Link href="/boards">
              <Button 
                variant="outline" 
                className="border-gray-300 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-300"
              >
                My Boards
              </Button>
            </Link>
            <SignOutButton>
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
              >
                Sign Out
              </Button>
            </SignOutButton>
          </>
        ) : (
          <>
            <Link href="/boards">
              <Button 
                variant="ghost" 
                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                Explore Boards
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button 
                variant="outline" 
                className="border-gray-300 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 transition-all duration-300"
              >
                <Zap className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar
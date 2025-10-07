// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google" 
import { ClerkProvider } from "@clerk/nextjs";
import { RecommendationsProvider } from '@/context/RecommendationsContext';
import "./globals.css";

export const metadata: Metadata = {
  title: "Orb - AI Brainstorming",
  description: "A Community driven brainstorming platform powered by AI",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <RecommendationsProvider>
            {children}
          </RecommendationsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
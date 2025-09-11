// app/layout.tsx
import type { Metadata } from "next";
import {Inter} from "next/font/google" 
import "./globals.css"; // <-- Tailwind/global styles

export const metadata: Metadata = {
  title: "Orb - AI Brainstorming",
  description: "A Community driven brainstorming platform powered by AI",
};

const inter = Inter({
  subsets: ["latin"], // you can also add "latin-ext" if needed
  weight: [
    "100", // Thin
    "200", // Extra Light
    "300", // Light
    "400", // Regular
    "500", // Medium
    "600", // Semi Bold
    "700", // Bold
    "800", // Extra Bold
    "900", // Black
  ], // pick the weights you’ll use
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

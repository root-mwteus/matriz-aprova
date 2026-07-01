"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Sidebar from "@/components/Sidebar"

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
      }}
    >
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:block h-screen overflow-y-auto bg-surface border-r border-card-border sticky top-0">
        <Sidebar />
      </aside>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-[220px] bg-surface border-r border-card-border lg:hidden"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex flex-col min-h-screen overflow-hidden">
        {/* MOBILE TOPBAR */}
        <div className="lg:hidden flex items-center justify-between px-4 h-12 border-b border-card-border bg-surface flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold tracking-widest text-accent">MATRIZ APROVA</span>
          <div className="w-5" />
        </div>

        <main className="flex-1 px-10 py-8 max-w-[960px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

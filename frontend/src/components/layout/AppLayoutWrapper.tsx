"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/landing/Footer";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

/**
 * Global layout wrapper enforcing unified Header & Footer
 * 
 * Deliberate exceptions:
 * - /viewer/*: Fullscreen dual-pane document & AI assistant workspace
 * - /focus: Distraction-free Pomodoro study chamber
 * - /admin/*: Dedicated administrative portal with standalone sidebar layout
 */
export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname() || "";

  const isFullScreenException =
    pathname.startsWith("/viewer") ||
    pathname.startsWith("/focus") ||
    pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      <div className="flex-1">
        {children}
      </div>
      {!isFullScreenException && <Footer />}
    </div>
  );
}

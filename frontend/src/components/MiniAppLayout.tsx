"use client";

import { ReactNode } from "react";
import { useFarcaster } from "@/context/FarcasterContext";

interface MiniAppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MiniAppLayout({ children, className = "" }: MiniAppLayoutProps) {
  const { isFarcasterMiniApp } = useFarcaster();

  if (isFarcasterMiniApp) {
    return (
      <div className={`min-h-screen w-full max-w-[424px] mx-auto bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 ${className}`}>
      {children}
    </div>
  );
}
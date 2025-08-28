"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFarcaster } from "@/context/FarcasterContext";
import { Share2 } from "lucide-react";

interface SocialShareProps {
  message: string;
  url?: string;
  className?: string;
}

export function SocialShare({ message, url, className = "" }: SocialShareProps) {
  const { isFarcasterMiniApp, shareToFeed } = useFarcaster();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!isFarcasterMiniApp) {
      // Fallback for non-MiniApp users
      if (navigator.share) {
        await navigator.share({
          title: 'cPiggyFX',
          text: message,
          url: url || window.location.href,
        });
      } else {
        // Copy to clipboard as fallback
        const shareText = `${message} ${url || window.location.href}`;
        await navigator.clipboard.writeText(shareText);
        alert('Link copied to clipboard!');
      }
      return;
    }

    setIsSharing(true);
    try {
      const embeds = url ? [url] : [];
      await shareToFeed(message, embeds);
    } catch (error) {
      console.error('Failed to share:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className}`}
    >
      <Share2 className="w-4 h-4" />
      {isSharing ? 'Sharing...' : 'Share'}
    </Button>
  );
}

// Pre-built share messages for common actions
export const ShareMessages = {
  piggyCreated: (amount: string, duration: string) => 
    `🐷 Just created a new piggy with ${amount} cCOP for ${duration} days on cPiggyFX! Growing my savings with FX diversification 💰`,
  
  piggyCompleted: (amount: string, profit: string) => 
    `🎉 My cPiggyFX piggy just matured! Started with ${amount} cCOP and ended with ${profit} profit through smart FX diversification! 📈`,
  
  joinApp: () => 
    `💡 Discovered cPiggyFX - the easiest way to save in cCOP while gaining FX exposure! Perfect for growing savings with currency diversification 🌍`,
};
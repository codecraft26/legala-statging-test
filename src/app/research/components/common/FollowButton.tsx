"use client";

import React from "react";
import { Loader2, Star } from "lucide-react";

interface FollowButtonProps {
  isFollowing: boolean;
  loading?: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function FollowButton({
  isFollowing,
  loading,
  onClick,
  compact,
}: FollowButtonProps) {
  return (
    <button
      className={`flex items-center justify-center whitespace-nowrap ${
        compact
          ? "px-2 h-7 text-xs min-w-[92px]"
          : "px-4 h-9 text-sm min-w-[120px]"
      } font-medium rounded-md border transition-colors ${
        isFollowing
          ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 dark:border-yellow-800"
          : "text-foreground bg-secondary hover:bg-secondary/80 border-border"
      }`}
      onClick={onClick}
      disabled={!!loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Star
            size={compact ? 12 : 16}
            className={
              isFollowing
                ? "text-yellow-600 fill-yellow-500 dark:text-yellow-400 dark:fill-yellow-400"
                : ""
            }
          />
          <span className={compact ? "hidden sm:inline ml-1" : "ml-1"}>
            {isFollowing ? "Following" : "Follow"}
          </span>
        </>
      )}
    </button>
  );
}

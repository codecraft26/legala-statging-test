"use client";

import React from "react";
import { Loader2, Star } from "lucide-react";

interface FollowButtonProps {
  isFollowing: boolean;
  loading?: boolean;
  onClick: () => void;
  compact?: boolean;
}

export default function FollowButton({ isFollowing, loading, onClick, compact }: FollowButtonProps) {
  return (
    <button
      className={`flex items-center justify-center ${compact ? "px-2 py-1 text-xs" : "px-4 py-2 text-sm"} font-medium rounded ${
        isFollowing
          ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
          : "text-gray-700 bg-gray-100 hover:bg-gray-200"
      }`}
      onClick={onClick}
      disabled={!!loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Star size={compact ? 12 : 16} className={isFollowing ? "text-yellow-600 fill-yellow-500" : ""} />
          <span className={compact ? "hidden sm:inline ml-1" : "ml-1"}>{isFollowing ? "Following" : "Follow"}</span>
        </>
      )}
    </button>
  );
}



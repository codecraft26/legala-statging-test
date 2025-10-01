"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";
  // return (
  //   <button
  //     type="button"
  //     aria-label="Toggle theme"
  //     className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-gray-400 cursor-not-allowed opacity-60"
  //     onClick={(e) => e.preventDefault()}
  //     disabled
  //   >
  //     {isDark ? <Sun size={16} /> : <Moon size={16} />}
  //     <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
  //   </button>
  // );
  return null;
}

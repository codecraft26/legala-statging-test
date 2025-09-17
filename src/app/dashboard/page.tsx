"use client";

import React, { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  Shield,
  Users as UsersIcon,
  Star,
  ArrowRight,
  Lightbulb,
  Zap,
  Target,
  Brain,
  PenTool,
} from "lucide-react";

export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setAuthed(!!token);
  }, []);

  useEffect(() => {
    if (authed) {
      const t = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [authed]);

  if (!authed)
    return (
      <main className="max-w-3xl mx-auto p-8">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <ThemeToggle />
        </header>
        <div className="rounded-lg border p-6">
          <p className="text-muted-foreground">User is not logged in.</p>
          <div className="mt-4">
            <a
              href="/login"
              className="rounded-md border px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Go to login
            </a>
          </div>
        </div>
      </main>
    );

  return (
    <main className="max-w-6xl mx-auto p-8 space-y-6">
      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Documents Processed",
            value: "10,247",
            icon: <FileText size={18} />,
            gradient: "from-blue-500 to-blue-600",
          },
          {
            label: "Time Saved",
            value: "1,200hrs",
            icon: <Clock size={18} />,
            gradient: "from-emerald-500 to-emerald-600",
          },
          {
            label: "Accuracy Rate",
            value: "99.2%",
            icon: <Shield size={18} />,
            gradient: "from-amber-500 to-amber-600",
          },
          {
            label: "Active Users",
            value: "847",
            icon: <UsersIcon size={18} />,
            gradient: "from-purple-500 to-purple-600",
          },
        ].map((s, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-lg border p-5 transition-all ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div
              className={`absolute inset-0 opacity-10 bg-gradient-to-br ${s.gradient}`}
            />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xl font-semibold">{s.value}</div>
              </div>
              <div
                className={`rounded-md text-white p-2 bg-gradient-to-br ${s.gradient}`}
              >
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section className="space-y-6">
        <div
          className={`text-center transition-all ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent to-blue-500" />
            <Target className="w-5 h-5 text-blue-600" />
            <div className="w-10 h-0.5 bg-gradient-to-l from-transparent to-blue-500" />
          </div>
          <h2 className="text-2xl font-semibold">
            Choose Your AI-Powered Solution
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover our suite of AI tools to streamline your workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            {
              id: "extract",
              title: "Smart Extract",
              subtitle: "AI Document Processing",
              iconBg: "from-blue-500 to-blue-600",
              icon: <FileText size={20} />,
              description:
                "Extract key information from legal documents with precision AI.",
              points: [
                "Automated text extraction",
                "Clause identification",
                "Summarization",
              ],
              url: "/extract",
              buttonColor: "from-blue-500 to-blue-600",
              trending: true,
            },
            {
              id: "research",
              title: "Research Memo",
              subtitle: "Legal Intelligence Hub",
              iconBg: "from-emerald-500 to-teal-600",
              icon: <Brain size={20} />,
              description:
                "Generate comprehensive legal research memos with AI.",
              points: [
                "Case law analysis",
                "Jurisdiction-specific",
                "Real-time updates",
              ],
              url: "/research",
              buttonColor: "from-emerald-500 to-emerald-600",
            },
            {
              id: "autodraft",
              title: "AutoDraft Pro",
              subtitle: "Intelligent Document Creation",
              iconBg: "from-purple-500 to-violet-600",
              icon: <PenTool size={20} />,
              description:
                "Automated drafting with smart templates and AI suggestions.",
              points: ["Templates", "Clause library", "Collaboration"],
              url: "/drafting",
              buttonColor: "from-purple-500 to-purple-600",
              trending: true,
            },
          ].map((page, idx) => (
            <div
              key={page.id}
              className="rounded-2xl border p-6 relative overflow-hidden"
            >
              {page.trending ? (
                <div className="absolute top-3 right-3 text-xs font-medium bg-red-500 text-white px-2 py-1 rounded">
                  <Star className="w-3 h-3 inline mr-1" /> Trending
                </div>
              ) : null}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs bg-zinc-100 dark:bg-zinc-900/40 text-muted-foreground px-2 py-1 rounded">
                  {page.subtitle}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg text-white bg-gradient-to-br ${page.iconBg}`}
                >
                  {page.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{page.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {page.subtitle}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {page.description}
              </p>
              <div className="mb-4">
                <h4 className="text-xs uppercase text-muted-foreground mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" /> Key Features
                </h4>
                <ul className="space-y-1">
                  {page.points.map((pt) => (
                    <li key={pt} className="text-sm flex gap-2 items-start">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-zinc-400" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                className={`w-full text-white bg-gradient-to-r ${page.buttonColor}`}
                onClick={() => router.push(page.url)}
              >
                <Zap className="w-4 h-4" /> Launch {page.title}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

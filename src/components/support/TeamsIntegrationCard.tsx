"use client";

import React from "react";
import { Copy, ExternalLink, Check, Bot, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function Copyable({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
      <code className="text-xs font-mono break-all text-foreground/90">{text}</code>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="sr-only">Copy command</span>
      </Button>
    </div>
  );
}

const COMMANDS: Array<{ name: string; usage: string; description: string }> = [
  { name: "/search", usage: "/search <filename>", description: "Search for filenames (fuzzy match supported)." },
  { name: "/list", usage: "/list", description: "List all files in the current workspace." },
  { name: "/get", usage: "/get <file_name>", description: "Retrieve a file from InfraHive storage." },
  { name: "/teams", usage: "/teams", description: "List Microsoft Teams where the bot is installed." },
  { name: "/channels", usage: "/channels <team name>", description: "List channels within a specific team." },
];

export default function TeamsIntegrationCard() {
  return (
    <Card className="h-full border-muted shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/10">
          <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">InfraHive AI Assistant</CardTitle>
          <CardDescription>Use InfraHive directly inside Microsoft Teams.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Search, list, and retrieve workspace documents without leaving Teams. Install the InfraHive assistant to make collaboration fast and context-rich.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Command className="h-3 w-3" />
            Slash commands
          </Badge>
          <Badge variant="outline">Secure login</Badge>
          <Badge variant="outline">Workspace aware</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Setup guide</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Microsoft Teams setup</DialogTitle>
              <DialogDescription>
                Follow these steps to install and start using the InfraHive assistant in Teams.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-medium text-foreground">1. Install the bot</h3>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Open Microsoft Teams and go to the Apps section.</li>
                  <li>Search for <span className="font-medium text-foreground">InfraHive AI Assistant</span> and click Install.</li>
                  <li>Optionally pin the bot to your left navigation rail for quick access.</li>
                </ol>
              </section>

              <section className="space-y-3">
                <h3 className="font-medium text-foreground">2. Authenticate</h3>
                <p className="text-muted-foreground">
                  In the bot chat, send the login command and follow the authentication flow:
                </p>
                <Copyable text="/login" />
              </section>

              <section className="space-y-3">
                <h3 className="font-medium text-foreground">3. Try these commands</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {COMMANDS.map((command) => (
                    <div key={command.name} className="rounded-md border bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-foreground">{command.name}</p>
                      <p className="mt-1 font-mono text-[11px] text-foreground/90">{command.usage}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{command.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <DialogClose asChild>
                <Button variant="outline" size="sm" className="mt-2 self-start">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          size="sm"
          variant="outline"
          asChild
          className="gap-1"
        >
          <a href="https://teams.microsoft.com/" target="_blank" rel="noopener noreferrer">
            Open Teams
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}



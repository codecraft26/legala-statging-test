"use client";

import React from "react";
import { Copy, Check, Command } from "lucide-react";
import Image from "next/image";
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
  { name: "/draft", usage: "/draft <template_name>", description: "Generate a document draft using a template." },
  { name: "/search", usage: "/search <filename>", description: "Search for filenames in your workspace." },
  { name: "/list", usage: "/list", description: "List all files in the current workspace." },
  { name: "/get", usage: "/get <file_name>", description: "Retrieve a file from InfraHive storage." },
  { name: "/refine", usage: "/refine <instructions>", description: "Refine or edit the current document with AI." },
];

export default function DocumentIntegrationCard() {
  return (
    <Card className="border-muted shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10 p-2">
          <Image 
            src="/msDocs.svg" 
            alt="Microsoft Word" 
            width={32} 
            height={32} 
            className="object-contain"
          />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">MS Docs Integration</CardTitle>
          <CardDescription>Use InfraHive within Microsoft Document to automate drafting.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          Automate document drafting, search, and refine documents directly within Microsoft Word. Install the InfraHive add-in to streamline your document workflow.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Command className="h-3 w-3" />
            Slash commands
          </Badge>
          <Badge variant="outline">Secure login</Badge>
          <Badge variant="outline">Workspace aware</Badge>
          <Badge variant="outline">AI-powered drafting</Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">Setup guide</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Microsoft Document setup</DialogTitle>
              <DialogDescription>
                Follow these steps to install and start using the InfraHive assistant in Microsoft Word.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="font-medium text-foreground">1. Install the add-in</h3>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Open Microsoft Word and go to the Insert tab.</li>
                  <li>Click on <span className="font-medium text-foreground">Get Add-ins</span> or <span className="font-medium text-foreground">Office Add-ins</span>.</li>
                  <li>Search for <span className="font-medium text-foreground">InfraHive AI Assistant</span> and click Add.</li>
                  <li>The add-in will appear in your ribbon for quick access.</li>
                </ol>
              </section>

              <section className="space-y-3">
                <h3 className="font-medium text-foreground">2. Authenticate</h3>
                <p className="text-muted-foreground">
                  Click on the InfraHive add-in icon and sign in with your credentials to connect to your workspace:
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
      </CardFooter>
    </Card>
  );
}


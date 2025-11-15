"use client";

import React from "react";
import { Command } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <a 
          href="mailto:kunal@infrahive.ai"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Contact team
        </a>
      </CardFooter>
    </Card>
  );
}


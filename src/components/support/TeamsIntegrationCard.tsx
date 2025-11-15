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

export default function TeamsIntegrationCard() {
  return (
    <Card className="border-muted shadow-sm">
      <CardHeader className="flex flex-row items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/10 p-2">
          <Image 
            src="/teamLogo.svg" 
            alt="Microsoft Teams" 
            width={32} 
            height={32} 
            className="object-contain"
          />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base">MS Teams Integration</CardTitle>
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



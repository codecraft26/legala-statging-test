"use client";

import React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onDeny: () => void | Promise<void>;
  onInsert: () => void | Promise<void>;
  canInsert: boolean;
  isBusy?: boolean;
};

export default function AIModalFooter({ onDeny, onInsert, canInsert, isBusy }: Props) {
  return (
    <div className="px-4 py-3 border-t bg-white">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">AI-generated content</div>
        <div className="flex items-center gap-2">
          <Button onClick={onDeny} variant="outline" className="px-3 py-1.5 text-sm">
            Deny
          </Button>
          <Button
            onClick={onInsert}
            disabled={!canInsert || !!isBusy}
            className="px-3 py-1.5 bg-black text-white hover:bg-gray-900 disabled:opacity-50 text-sm"
          >
            Insert Content
          </Button>
        </div>
      </div>
    </div>
  );
}



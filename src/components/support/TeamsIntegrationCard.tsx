"use client";

import React from "react";

function Copyable({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="group flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 dark:bg-zinc-900 dark:border-zinc-800">
      <code className="text-xs font-mono break-all text-gray-800 dark:text-zinc-100">{text}</code>
      <button
        className="ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-800 text-xs"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {}
        }}
        type="button"
      >
        📋
      </button>
      <span className="text-[10px] text-gray-500 dark:text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
        {copied ? "Copied!" : "Copy"}
      </span>
    </div>
  );
}

export default function TeamsIntegrationCard() {
  const [open, setOpen] = React.useState(false);
  const commands = [
    { name: "/search", usage: "/search <filename>", description: "search for filename (not exact match)" },
    { name: "/list", usage: "/list", description: "list all files in workspace" },
    { name: "/get", usage: "/get <file_name>", description: "fetch file from InfraHive DB" },
    { name: "/teams", usage: "/teams", description: "list available teams" },
    { name: "/channels", usage: "/channels <team name>", description: "list channels in a team" },
  ];

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center gap-3">
        <img
          className="h-10 w-10"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg/1200px-Microsoft_Office_Teams_%282018%E2%80%93present%29.svg.png"
          alt="Microsoft Teams"
        />
        <div>
          <h3 className="text-base font-semibold">InfraHive AI Assistant</h3>
          <p className="text-xs text-muted-foreground">Microsoft Teams integration</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-3">
        Use InfraHive within Microsoft Teams to search, list, and retrieve workspace files.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-2 rounded-md bg-black text-white text-xs hover:bg-zinc-800"
          type="button"
        >
          Setup guide
        </button>
        <a
          href="https://teams.microsoft.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-md border text-xs hover:bg-gray-50 dark:hover:bg-zinc-800"
        >
          Open Teams
        </a>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)}></div>
          <div className="relative bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Teams Bot Setup</h4>
                <p className="text-xs text-muted-foreground">Install, login, and use the assistant</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-xl" type="button">×</button>
            </div>

            <div className="p-5 space-y-6 text-sm">
              <section>
                <h5 className="font-medium mb-2">1) Install the Bot</h5>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Open Microsoft Teams and go to Apps</li>
                  <li>Search for "InfraHive AI Assistant" and click Install</li>
                  <li>Pin the bot to your left rail (optional)</li>
                </ol>
              </section>
              <section>
                <h5 className="font-medium mb-2">2) Login</h5>
                <p className="text-muted-foreground">
                  In the bot chat, send <span className="font-mono">/login</span> and follow the prompts. Copy the token if requested:
                </p>
                <div className="mt-2">
                  <Copyable text="/login" />
                </div>
              </section>
              <section>
                <h5 className="font-medium mb-2">3) Useful Commands</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {commands.map((c) => (
                    <div key={c.name} className="rounded-md border p-3">
                      <div className="text-xs font-semibold">{c.name}</div>
                      <div className="text-xs font-mono mt-1">{c.usage}</div>
                      <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



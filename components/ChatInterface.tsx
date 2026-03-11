"use client";

import { useChat } from "ai/react";
import { Send, BookOpen, Menu, Copy, Check, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import StatsPanel from "@/components/StatsPanel";
import TypingIndicator from "@/components/TypingIndicator";

const SUGGESTIONS = [
  { label: "#1 Paid book?",           query: "What is the #1 paid book?" },
  { label: "Highest rated books",     query: "Show me the highest rated books" },
  { label: "Most reviewed free book", query: "Which free books have the most reviews?" },
  { label: "Top 5 paid books",        query: "List the top 5 paid books with ratings" },
  { label: "Cheapest paid book",      query: "What is the cheapest paid book?" },
  { label: "Authors with 2+ books",   query: "Which authors appear more than once in the dataset?" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity
                     text-zinc-600 hover:text-zinc-300 hover:bg-transparent"
          onClick={copy}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="text-xs py-1 bg-zinc-800 border-zinc-700 text-zinc-200"
      >
        {copied ? "Copied!" : "Copy"}
      </TooltipContent>
    </Tooltip>
  );
}

function MessageTime() {
  const [time] = useState(
    () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  return (
    <span className="text-[10px] text-zinc-600 select-none">{time}</span>
  );
}

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({ api: "/api/chat" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fireSuggestion = useCallback(
    (query: string) => {
      setInput(query);
      setTimeout(() => {
        const form = document.getElementById("chat-form") as HTMLFormElement;
        form?.requestSubmit();
      }, 0);
    },
    [setInput]
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">

        {/* Stats sidebar */}
        <StatsPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />

        {/* Main chat area */}
        <main className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">

          {/* Header */}
          <header className="shrink-0 flex items-center gap-3 px-4 py-3
                             border-b border-zinc-800/70 bg-[#0d0d0d]">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 text-zinc-500 hover:text-zinc-200 h-8 w-8"
              onClick={() => setPanelOpen(true)}
            >
              <Menu size={17} />
            </Button>

            {/* Logo icon */}
            <div className="shrink-0 p-2 rounded-xl bg-zinc-800 border border-zinc-700
                            animate-glow-pulse">
              <BookOpen size={17} className="text-zinc-300" />
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gradient-white text-base leading-tight truncate">
                Kindle Paranormal Romance
              </h1>
              <p className="text-zinc-600 text-xs truncate">
                200-book bestsellers · AI-powered analysis
              </p>
            </div>

            {/* Live badge */}
            <Badge
              variant="secondary"
              className="shrink-0 hidden sm:flex items-center gap-1.5
                         bg-emerald-500/10 text-emerald-400 border border-emerald-900/50 text-[10px]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </Badge>

            <Sparkles size={14} className="shrink-0 text-zinc-700 hidden md:block" />
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-[#0a0a0a]">
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

              {/* Empty state */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[65vh]
                                gap-7 text-center">
                  {/* Hero card */}
                  <div className="rounded-2xl p-8 max-w-md border border-zinc-800
                                  bg-zinc-900/60 animate-fade-up">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700
                                    flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
                      <BookOpen size={26} className="text-zinc-300" />
                    </div>
                    <h2 className="text-gradient-white font-bold text-xl mb-2">
                      Ask About the Dataset
                    </h2>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      I can answer questions about the Top 100 Paid and Top 100 Free
                      Kindle Paranormal Romance bestsellers — rankings, ratings,
                      reviews, prices, and authors.
                    </p>
                  </div>

                  {/* Suggestion chips */}
                  <div className="w-full max-w-xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
                    <p className="text-[10px] text-zinc-700 uppercase tracking-widest
                                  font-semibold mb-3">
                      Try asking
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SUGGESTIONS.map(({ label, query }) => (
                        <button
                          key={query}
                          type="button"
                          onClick={() => fireSuggestion(query)}
                          className={cn(
                            "text-xs px-3.5 py-2 rounded-full transition-all duration-200",
                            "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800",
                            "hover:border-zinc-600 text-zinc-400 hover:text-zinc-200"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((m, idx) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-2.5 animate-fade-up",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                  style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
                >
                  {/* AI avatar */}
                  {m.role === "assistant" && (
                    <div className="shrink-0 mt-1 w-8 h-8 rounded-full bg-zinc-800
                                    border border-zinc-700 flex items-center justify-center">
                      <BookOpen size={14} className="text-zinc-400" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "group relative max-w-[80%] rounded-2xl text-sm leading-relaxed",
                      m.role === "user"
                        /* User: white bubble, black text — clean & premium */
                        ? "bg-white text-zinc-900 px-4 py-3 rounded-tr-sm shadow-md shadow-black/40"
                        /* AI: dark card with subtle border */
                        : "bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-tl-sm text-zinc-200"
                    )}
                  >
                    {m.role === "user" ? (
                      <p>{m.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="mb-2 last:mb-0">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside space-y-1 mb-2 ml-1">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside space-y-1 mb-2 ml-1">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-zinc-300">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-white font-semibold">{children}</strong>
                          ),
                          code: ({ children }) => (
                            <code className="bg-zinc-800 border border-zinc-700 rounded
                                            px-1.5 py-0.5 text-xs text-zinc-300 font-mono">
                              {children}
                            </code>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-300 underline underline-offset-2 hover:text-white"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    )}

                    {/* Footer row */}
                    <div
                      className={cn(
                        "flex items-center gap-1.5 mt-1.5",
                        m.role === "user" ? "justify-end" : "justify-between"
                      )}
                    >
                      <MessageTime />
                      {m.role === "assistant" && <CopyButton text={m.content} />}
                    </div>
                  </div>

                  {/* User avatar */}
                  {m.role === "user" && (
                    <div className="shrink-0 mt-1 w-8 h-8 rounded-full bg-zinc-800
                                    border border-zinc-700 flex items-center justify-center
                                    text-xs font-bold text-zinc-400">
                      U
                    </div>
                  )}
                </div>
              ))}

              {isLoading && <TypingIndicator />}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <footer className="shrink-0 px-4 pb-4 pt-2 border-t border-zinc-800/60 bg-[#0d0d0d]">
            <form
              id="chat-form"
              onSubmit={handleSubmit}
              className={cn(
                "max-w-3xl mx-auto flex items-center gap-2 rounded-2xl px-3 py-2.5",
                "bg-zinc-900 border border-zinc-800 input-glow transition-all duration-300"
              )}
            >
              <BookOpen size={15} className="text-zinc-700 shrink-0" />
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about rankings, ratings, prices, authors…"
                disabled={isLoading}
                className="flex-1 bg-transparent border-0 focus-visible:ring-0
                           focus-visible:ring-offset-0 text-zinc-200
                           placeholder:text-zinc-700 text-sm h-auto py-0.5 px-0"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "shrink-0 h-8 w-8 rounded-xl",
                  "bg-white hover:bg-zinc-200 text-zinc-900",
                  "disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed",
                  "transition-all duration-200"
                )}
              >
                <Send size={13} />
              </Button>
            </form>
            <p className="text-center text-zinc-700 text-[10px] mt-2">
              Answers based solely on the Kindle Paranormal Romance bestsellers dataset
            </p>
          </footer>

        </main>
      </div>
    </TooltipProvider>
  );
}

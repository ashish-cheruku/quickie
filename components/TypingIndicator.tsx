import { BookOpen } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 animate-fade-up">
      <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700
                      flex items-center justify-center">
        <BookOpen size={14} className="text-zinc-400" />
      </div>
      <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-dot-bounce w-2 h-2 rounded-full bg-zinc-500"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

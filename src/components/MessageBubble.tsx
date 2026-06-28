import React from 'react';

interface Metrics {
  tokens: number;
  tps: number;
  time: number;
  energy: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metrics?: Metrics;
}

export const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isBot = message.role === 'assistant';

  return (
    <div className={`w-full py-6 px-4 ${isBot ? 'bg-zinc-900/30 border-y border-zinc-900' : 'bg-transparent'}`}>
      <div className="max-w-3xl mx-auto flex gap-4 items-start">
        {/* Odświeżone avatary użytkownika i bota */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${isBot ? 'bg-zinc-900 border border-zinc-800 text-zinc-200' : 'bg-zinc-900/50 text-zinc-400 border border-zinc-900'}`}>
          {isBot ? '🤖' : '👤'}
        </div>
        
        <div className="flex-1 space-y-3 min-w-0">
          <div className="text-zinc-200 text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </div>
          
          {/* Powrót zbalansowanych ikon w sekcji metryk wydajności */}
          {isBot && message.metrics && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-3 text-[11px] sm:text-xs text-zinc-500 font-mono border-t border-zinc-900/80">
              <span className="flex items-center gap-1.5 bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900">
                📊 <span>{message.metrics.tokens} tok</span>
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900">
                ⚡ <span>{message.metrics.tps} tok/s</span>
              </span>
              <span className="flex items-center gap-1.5 bg-zinc-900/40 px-2 py-0.5 rounded border border-zinc-900">
                ⏱️ <span>{message.metrics.time}s</span>
              </span>
              <span className="flex items-center gap-1.5 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 text-emerald-500/90">
                🔋 <span>{message.metrics.energy} Wh</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

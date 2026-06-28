import React from 'react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="flex flex-col p-4 space-y-6 overflow-y-auto">
        {/* Nagłówek Sidebaru */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 animate-pulse" />
          <span className="font-semibold tracking-tight text-zinc-200">Bez Filtra</span>
        </div>

        {/* Nawigacja główna */}
        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 transition-all">
            <span>💬</span> <span>Nowy czat</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-900 transition-all">
            <span>🧠</span> <span>Moje persony</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent hover:border-zinc-900 transition-all">
            <span>⚙️</span> <span>Ustawienia systemu</span>
          </button>
        </nav>

        {/* Historia czatów */}
        <div className="space-y-2 pt-4 border-t border-zinc-900">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 px-3 block">Ostatnie rozmowy</span>
          <div className="space-y-0.5">
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg text-left truncate hover:bg-zinc-900/30">
              <span>📝</span> <span className="truncate">Skrypt automatyzacji bash</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg text-left truncate hover:bg-zinc-900/30">
              <span>🔓</span> <span className="truncate">Analiza geopolityczna bez cenzury</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profil dolny */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl border border-zinc-900/50 bg-zinc-900/20">
          <div className="text-sm">👤</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-300 truncate">Piotr Prosiński</p>
            <p className="text-[10px] font-mono text-zinc-500 truncate">Root Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

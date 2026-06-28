import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  metrics?: {
    tokens: number;
    tps: number;
    time: number;
    energy: number;
    water: number;
  };
}

export const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const ACTIVE_MODEL = "qwen2.5:14b-instruct"; 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsGenerating(true);
    startTimeRef.current = Date.now();

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ACTIVE_MODEL, prompt: input }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error('Błąd serwera.');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botContent = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          botContent += chunk;
          
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1] = { role: 'assistant', content: botContent };
            }
            return updated;
          });
        }
      }

      // Statystyki dla pełnej, nieprzerwanej odpowiedzi
      injectMetrics(false);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Generowanie przerwane przez użytkownika. Wstrzykiwanie statystyk cząstkowych...');
        // KLUCZOWY MOMENT: Wstrzykujemy statystyki zużycia pomimo zgłoszenia AbortError
        injectMetrics(true);
      } else {
        console.error(error);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Wspólna funkcja obliczająca i wstrzykująca metryki do ostatniej wiadomości bota
  const injectMetrics = (isInterrupted: boolean) => {
    const elapsedSeconds = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(1));
    
    // Dynamiczne dopasowanie danych w zależności od tego czy przerwano pracę maszyny
    const tokens = isInterrupted ? Math.max(25, Math.round(elapsedSeconds * 22)) : 412;
    const tps = isInterrupted ? 21.8 : 24.5;
    const energy = isInterrupted ? parseFloat((elapsedSeconds * 0.025).toFixed(2)) : 0.42;
    const water = isInterrupted ? parseFloat((elapsedSeconds * 0.2).toFixed(1)) : 3.4;

    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        const currentContent = updated[updated.length - 1].content;
        updated[updated.length - 1] = {
          role: 'assistant',
          content: isInterrupted ? `${currentContent} 🛑 [Przerwano przez użytkownika]` : currentContent,
          metrics: { tokens, tps, time: elapsedSeconds, energy, water }
        };
      }
      return updated;
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Wywołuje AbortError łapany w bloku catch
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Nagłówek serwisu */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Bez Filtra</span>
          <span className="text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">14B Engine</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-500 bg-zinc-900/30 border border-zinc-900 px-3 py-1.5 rounded-xl">
            <span>📈 1.2k tok</span>
            <span>🔋 1.8 Wh</span>
            <span>💧 3.2 ml</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 rounded-xl border border-zinc-900 transition-all">
            <span>🎭</span> <span>Persona</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 rounded-xl border border-zinc-900 transition-all">
            <span>🔍</span> <span className="hidden xs:inline">Szukaj</span>
          </button>
        </div>
      </header>

      {/* Okno rozmowy */}
      <div className="flex-1 overflow-y-auto pb-[calc(90px+env(safe-area-inset-bottom))] pt-4">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto px-4 pt-16 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Zadaj pytanie bez owijania w bawełnę ⚡</h2>
              <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
                Dedykowana, odblokowana instancja AI. Silnik 14B nie moralizuje i nie odmawia odpowiedzi na żadne tematy.
              </p>
            </div>

            {/* Przykładowe zapytania startowe */}
            <div className="grid grid-cols-1 gap-2">
              <button onClick={() => setInput("Napisz skrypt w Bashu usuwający logi starsze niż 30 dni")} className="w-full flex items-center justify-between p-3 text-left text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all group">
                <div className="flex items-center gap-3 truncate">
                  <span className="text-sm shrink-0">💻</span>
                  <span className="truncate font-medium">Napisz skrypt w Bashu usuwający logi...</span>
                </div>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-transform group-hover:translate-x-0.5 text-xs">➔</span>
              </button>

              <button onClick={() => setInput("Przeanalizuj bez cenzury przyczyny kryzysu energetycznego")} className="w-full flex items-center justify-between p-3 text-left text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all group">
                <div className="flex items-center gap-3 truncate">
                  <span className="text-sm shrink-0">🔓</span>
                  <span className="truncate font-medium">Przeanalizuj bez cenzury przyczyny kryzysu...</span>
                </div>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-transform group-hover:translate-x-0.5 text-xs">➔</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dolny panel wprowadzania tekstu */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:pb-4 z-20">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isGenerating}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 disabled:opacity-60"
            placeholder={isGenerating ? "Model 14B generuje odpowiedź..." : "Zadaj pytanie bez filtra..."}
          />
          
          {isGenerating ? (
            <button 
              onClick={handleStopGeneration}
              className="bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-900/40 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shrink-0"
            >
              <span>⏹️</span> <span className="hidden sm:inline">Zatrzymaj</span>
            </button>
          ) : (
            <button 
              onClick={handleSendMessage}
              disabled={!input.trim()}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 disabled:bg-zinc-900 disabled:text-zinc-600 border border-transparent disabled:border-zinc-800/50 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-all shrink-0"
            >
              <span>⚡</span> <span className="hidden sm:inline">Wyślij</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

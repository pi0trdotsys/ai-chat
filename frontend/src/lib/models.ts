// Kuratorskie opisy modeli - krótko, prosto, do czego się nadaje.
// Dopasowanie po prefiksie nazwy (np. "llama3.1:8b" -> "llama3.1").

export interface ModelMeta {
  label: string
  desc: string
  tags: string[]
  greeting: string
  emoji: string
}

interface ModelRule {
  match: string
  meta: ModelMeta
}

const RULES: ModelRule[] = [
  {
    match: 'dolphin-pl',
    meta: {
      label: 'Dolphin PL (8B)',
      desc: 'Szybki - odpowiada w kilka sekund. Bez cenzury, bez ograniczeń, po polsku.',
      tags: ['bez cenzury', 'po polsku', 'szybki'],
      greeting: 'Cześć! Dolphin PL - szybki, bez hamulców i zawsze po polsku. Pytaj o cokolwiek.',
      emoji: '🐬',
    },
  },
  {
    match: 'huihui_ai/dolphin3-abliterated',
    meta: {
      label: 'Dolphin 3 Abliterated (8B)',
      desc: 'Najswobodniejszy z dostępnych. Odpowie dosłownie na wszystko, dobrze po polsku.',
      tags: ['bez cenzury', 'po polsku'],
      greeting: 'Cześć! Jestem Dolphin 3 bez żadnych hamulców. Pytaj o naprawdę cokolwiek - nie odmawiam.',
      emoji: '🐬',
    },
  },
  {
    match: 'huihui_ai/qwen2.5-abliterate',
    meta: {
      label: 'Qwen 2.5 Abliterated (14B)',
      desc: 'Najmądrzejszy - lepsze odpowiedzi, głębsza analiza. Wolniejszy, warto poczekać.',
      tags: ['bez cenzury', 'najmądrzejszy', 'wolniejszy'],
      greeting: 'Cześć! Jestem największym i najbystrzejszym modelem tutaj. Rzucaj trudnymi pytaniami - poradzę sobie.',
      emoji: '🧠',
    },
  },
  {
    match: 'dolphin3',
    meta: {
      label: 'Dolphin 3 (8B)',
      desc: 'Swobodny i bez cenzury, dobrze mówi po polsku. Dobry do każdej rozmowy.',
      tags: ['bez cenzury', 'po polsku'],
      greeting: 'Hej! Dolphin 3 na pokładzie. Odpowiem swobodnie na każdy temat.',
      emoji: '🐬',
    },
  },
  {
    match: 'dolphin-mistral',
    meta: {
      label: 'Dolphin Mistral (7B)',
      desc: 'Lżejszy i bez cenzury. Polski słabszy, ale bywa szybszy.',
      tags: ['bez cenzury', 'szybszy'],
      greeting: 'Cześć! Jestem lekki i bez cenzury. Lecimy z pytaniami.',
      emoji: '⚡',
    },
  },
  {
    match: 'SpeakLeash/bielik',
    meta: {
      label: 'Bielik 11B (PL)',
      desc: 'Najlepsza polszczyzna i wiedza o Polsce. Wolniejszy i ostrożniejszy w tematach.',
      tags: ['po polsku', 'wolniejszy'],
      greeting: 'Dzień dobry! Jestem Bielik - mówię najlepszą polszczyzną ze wszystkich tutaj.',
      emoji: '🦅',
    },
  },
  {
    match: 'llama3.1',
    meta: {
      label: 'Llama 3.1 (8B)',
      desc: 'Solidny i rzeczowy, dobry do analiz. Bywa ostrożny w drażliwych tematach.',
      tags: ['rzeczowy'],
      greeting: 'Cześć! Llama 3.1 do usług - konkretnie i na temat.',
      emoji: '🦙',
    },
  },
  {
    match: 'llama3',
    meta: {
      label: 'Llama 3',
      desc: 'Starszy, ogólny model. Stabilny, ale słabszy od nowszych.',
      tags: ['ogólny'],
      greeting: 'Hej! Llama 3 słucha. W czym mogę pomóc?',
      emoji: '🦙',
    },
  },
  {
    match: 'qwen',
    meta: {
      label: 'Qwen (7B)',
      desc: 'Najlepszy do kodu i matematyki. Po polsku radzi sobie słabiej.',
      tags: ['kod', 'matematyka'],
      greeting: 'Cześć! Najmocniejszy jestem w kodzie i liczbach. Rzuć mi wyzwanie.',
      emoji: '🧮',
    },
  },
  {
    match: 'mistral',
    meta: {
      label: 'Mistral (7B)',
      desc: 'Szybki i zwięzły, do prostych zadań. Polski przeciętny.',
      tags: ['szybki'],
      greeting: 'Hej! Szybko i na temat - o co chodzi?',
      emoji: '💨',
    },
  },
]

export function describeModel(name: string): ModelMeta {
  const rule = RULES.find(r => name.toLowerCase().startsWith(r.match.toLowerCase()))
  if (rule) return rule.meta
  return { label: name, desc: 'Model lokalny.', tags: [], greeting: 'Cześć! Gotowy do rozmowy.', emoji: '🤖' }
}

export interface ModelEntry {
  name: string
  sizeMB: number
}

export async function fetchModels(): Promise<{ models: ModelEntry[]; default: string }> {
  const res = await fetch('/api/models', {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
  if (!res.ok) throw new Error('Nie udało się pobrać listy modeli')
  return res.json()
}

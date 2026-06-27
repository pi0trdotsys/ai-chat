// Kuratorskie opisy modeli - do czego dany model nadaje się najlepiej.
// Dopasowanie po prefiksie nazwy (np. "llama3.1:8b" -> "llama3.1").

export interface ModelMeta {
  label: string
  desc: string
  tags: string[]
}

interface ModelRule {
  match: string
  meta: ModelMeta
}

const RULES: ModelRule[] = [
  {
    match: 'huihui_ai/dolphin3-abliterated',
    meta: {
      label: 'Dolphin 3 Abliterated (8B)',
      desc: 'Dolphin 3 z usuniętym na poziomie wag odruchem odmowy (abliteration). Ta sama polszczyzna, jakość i prędkość co Dolphin 3, ale praktycznie nigdy nie odmawia odpowiedzi. Najbardziej uncensored wybór na tym sprzęcie.',
      tags: ['max uncensored', 'polski', 'uniwersalny'],
    },
  },
  {
    match: 'dolphin3',
    meta: {
      label: 'Dolphin 3 (8B)',
      desc: 'Uniwersalny i bez cenzury. Oparty na Llama 3.1 - dobra polszczyzna i sensowne rozumowanie. Najlepszy domyślny wybór do swobodnych rozmów na każdy temat.',
      tags: ['bez cenzury', 'polski', 'uniwersalny'],
    },
  },
  {
    match: 'dolphin-mistral',
    meta: {
      label: 'Dolphin Mistral (7B)',
      desc: 'Bez cenzury, lekki i szybki (baza Mistral). Polszczyzna słabsza niż Dolphin 3. Wybierz, gdy najbardziej zależy Ci na szybkości odpowiedzi.',
      tags: ['bez cenzury', 'szybki'],
    },
  },
  {
    match: 'SpeakLeash/bielik',
    meta: {
      label: 'Bielik 11B (PL)',
      desc: 'Polski model SpeakLeash. Najlepsza polszczyzna i wiedza o Polsce. Ocenzurowany i cięższy (11B = wolniejszy). Do treści po polsku wymagających naturalnego języka.',
      tags: ['polski', 'najlepszy PL', 'wolniejszy'],
    },
  },
  {
    match: 'llama3.1',
    meta: {
      label: 'Llama 3.1 (8B)',
      desc: 'Ogólny model Meta. Solidne rozumowanie i szeroka wiedza, przyzwoity polski. Ocenzurowany. Dobry do analiz i rzeczowych pytań.',
      tags: ['uniwersalny', 'rozumowanie'],
    },
  },
  {
    match: 'llama3',
    meta: {
      label: 'Llama 3',
      desc: 'Starsza wersja Llamy 3. Stabilny ogólniak, ale słabszy od 3.1 w rozumowaniu i znajomości polskiego.',
      tags: ['uniwersalny'],
    },
  },
  {
    match: 'qwen',
    meta: {
      label: 'Qwen (7B)',
      desc: 'Model Alibaby. Mocny w matematyce, kodzie i językach azjatyckich. Polszczyzna słabsza. Wybierz do zadań technicznych i programowania.',
      tags: ['kod', 'matematyka'],
    },
  },
  {
    match: 'mistral',
    meta: {
      label: 'Mistral (7B)',
      desc: 'Klasyczny Mistral. Szybki i zwięzły, dobry do prostych, krótkich zadań. Polszczyzna przeciętna, ocenzurowany.',
      tags: ['szybki', 'zwięzły'],
    },
  },
]

export function describeModel(name: string): ModelMeta {
  const rule = RULES.find(r => name.toLowerCase().startsWith(r.match.toLowerCase()))
  if (rule) return rule.meta
  return { label: name, desc: 'Model lokalny Ollama.', tags: [] }
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

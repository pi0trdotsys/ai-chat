import { useEffect, useState } from 'react'
import { fetchModels, type ModelEntry } from '@/lib/models'

export function useModels() {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [defaultModel, setDefaultModel] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchModels()
      .then(data => {
        if (cancelled) return
        setModels(data.models)
        setDefaultModel(data.default)
      })
      .catch(() => {
        // brak listy - picker pokaże pustą listę, czat działa na domyślnym
      })
    return () => { cancelled = true }
  }, [])

  return { models, defaultModel }
}

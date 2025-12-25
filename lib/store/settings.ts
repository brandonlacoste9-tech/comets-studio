import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'fr-QC' | 'en-US'
export type Model = 'llama-3.1-sonar-large-128k-online'

interface SettingsState {
  model: Model
  temperature: number
  maxTokens: number
  language: Language
  setModel: (model: Model) => void
  setTemperature: (temp: number) => void
  setMaxTokens: (tokens: number) => void
  setLanguage: (lang: Language) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      model: 'llama-3.1-sonar-large-128k-online',
      temperature: 0.7,
      maxTokens: 1000,
      language: 'fr-QC', // Default to Quebecois as requested
      artisteMode: false,
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setLanguage: (language) => set({ language }),
      setArtisteMode: (artisteMode) => set({ artisteMode }),
    }),
    {
      name: 'comet-settings-storage',
    }
  )
)

'use client'

import { useSettings } from '@/lib/store/settings'
import { locales } from '@/lib/locales'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@radix-ui/react-label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SettingsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsPanel({ open, onOpenChange }: SettingsPanelProps) {
  const {
    temperature,
    maxTokens,
    setTemperature,
    setMaxTokens,
    language,
    setLanguage,
    artisteMode,
    setArtisteMode,
  } = useSettings()

  const t = locales[language]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.settings}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="language">{t.language}</Label>
            <Select
              value={language}
              onValueChange={(val: any) => setLanguage(val)}
            >
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr-QC">Français (Québec) ⚜️</SelectItem>
                <SelectItem value="en-US">English (US) 🇺🇸</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="temperature">{t.temperature}</Label>
            <div className="flex items-center gap-4">
              <Input
                id="temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxTokens">{t.maxTokens}</Label>
            <Input
              id="maxTokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            />
          </div>

          {/* Artiste Mode Toggle */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
            <div className="space-y-0.5">
              <Label htmlFor="artiste-mode" className="text-base font-medium text-white">
                AI Artiste Mode 🎨
              </Label>
              <p className="text-xs text-slate-400">
                Enable high-end studio features & live preview
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="artiste-mode"
                onClick={() => setArtisteMode(!artisteMode)}
                className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                  artisteMode ? 'bg-purple-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    artisteMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

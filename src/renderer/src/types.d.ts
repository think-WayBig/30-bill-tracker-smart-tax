export {}

declare global {
  interface Window {
    electronAPI: {
      saveEntry: (entry: {
        name: string
        pan: string
      }) => Promise<{ success: boolean; error?: string }>
      loadEntries: () => Promise<{ name: string; pan: string }[]>
      saveEntries: (
        entries: { name: string; pan: string; group?: string }[]
      ) => Promise<{ success: boolean; error?: string }>
    }
    api: {
      selectFolder: () => Promise<string | null>
    }
    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

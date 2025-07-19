export {}

declare global {
  interface Window {
    electronAPI: {
      saveEntry: (entry: {
        name: string
        pan: string
      }) => Promise<{ success: boolean; error?: string }>
      loadEntries: () => Promise<{ name: string; pan: string }[]>
    }
    api: {
      selectFolder: () => Promise<string | null>
    }
    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

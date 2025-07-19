export {}

declare global {
  interface Window {
    electronAPI: {
      saveEntry: (entry: {
        name: string
        pan: string
        ackno?: string
        billingStatus?: 'Due' | 'Paid'
        filePath?: string
        group?: string
      }) => Promise<{ success: boolean; error?: string }>

      loadEntries: () => Promise<
        {
          name: string
          pan: string
          ackno?: string
          billingStatus?: 'Due' | 'Paid'
          filePath?: string
          group?: string
        }[]
      >

      saveEntries: (
        entries: {
          name: string
          pan: string
          ackno?: string
          billingStatus?: 'Due' | 'Paid'
          filePath?: string
          group?: string
        }[]
      ) => Promise<{ success: boolean; error?: string }>

      updateBillingStatus: (
        pan: string,
        billingStatus: 'Due' | 'Paid'
      ) => Promise<{ success: boolean; error?: string }>

      saveGroup: (group: string) => Promise<{ success: boolean; error?: string }>

      loadGroups: () => Promise<string[]>

      assignUserToGroup: (payload: {
        pan: string
        group: string
      }) => Promise<{ success: boolean; error?: string }>

      deleteEntry: (pan: string) => Promise<{ success: boolean; error?: string }>

      getAcknoFromFile: (
        pan: string,
        directory: string
      ) => Promise<{ success: boolean; ackno?: string; error?: string; filePath?: string }>

      updateEntryAckno: (
        pan: string,
        ackno: string
      ) => Promise<{ success: boolean; error?: string }>

      openContainingFolder: (filePath: string) => Promise<void>
    }

    api: {
      selectFolder: () => Promise<string | null>
    }

    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

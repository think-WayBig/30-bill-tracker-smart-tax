export {}

declare global {
  interface Window {
    electronAPI: {
      saveEntry: (entry: {
        name: string
        fileCode: string
        pan: string
        ackno?: string
        billingStatus?: 'Not started' | 'Pending' | 'Paid'
        filePath?: string
        group?: string
      }) => Promise<{ success: boolean; error?: string }>

      loadEntries: () => Promise<
        {
          name: string
          fileCode: string
          pan: string
          ackno?: string
          billingStatus?: 'Not started' | 'Pending' | 'Paid'
          filePath?: string
          group?: string
        }[]
      >

      saveEntries: (
        entries: {
          name: string
          fileCode: string
          pan: string
          ackno?: string
          billingStatus?: 'Not started' | 'Pending' | 'Paid'
          filePath?: string
          group?: string
        }[]
      ) => Promise<{ success: boolean; error?: string }>

      updateBillingStatus: (
        pan: string,
        billingStatus: 'Not started' | 'Pending' | 'Paid'
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
        ackno: string,
        filePath: string
      ) => Promise<{ success: boolean; error?: string }>

      openContainingFolder: (filePath: string) => Promise<void>
    }

    api: {
      selectFolder: () => Promise<string | null>
    }

    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

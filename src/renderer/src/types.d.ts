export {}

declare global {
  interface Entry {
    name: string
    fileCode: string
    pan: string
    startYear: string
    endYear?: string

    ackno?: { num: string; year: string; filePath: string }[]
    ackDate?: { date: string; year: string }[] // ✅ Year-wise ackDate

    billingStatus?: { status: 'Not started' | 'Pending' | 'Paid'; year: string }[]
    group?: string
    remarks?: { remark: string; year: string }[]
    docsComplete?: { value: boolean; year: string }[]
  }

  interface Window {
    electronAPI: {
      saveEntry: (entry: Entry) => Promise<{ success: boolean; error?: string }>

      updateEndYear: (
        fileCode: string,
        endYear: string
      ) => Promise<{ success: boolean; error?: string }>

      loadEntries: () => Promise<Entry[]>
      saveEntries: (entries: Entry[]) => Promise<{ success: boolean; error?: string }>

      updateRemarks: (
        pan: string,
        remarks: { remark: string; year: string }[]
      ) => Promise<{ success: boolean; error?: string }>

      updateBillingStatus: (
        pan: string,
        billingStatus: { status: 'Not started' | 'Pending' | 'Paid'; year: string },
        year: string
      ) => Promise<{ success: boolean; error?: string }>

      updateDocsComplete: (
        pan: string,
        docsComplete: { value: boolean; year: string }[]
      ) => Promise<{ success: boolean; error?: string }>

      saveGroup: (group: string) => Promise<{ success: boolean; error?: string }>
      loadGroups: () => Promise<string[]>
      deleteGroup: (group: string) => Promise<{ success: boolean; error?: string }>

      assignUserToGroup: (payload: {
        pan: string
        group: string
      }) => Promise<{ success: boolean; error?: string }>

      deleteEntry: (fileCode: string) => Promise<{ success: boolean; error?: string }>

      getAcknoFromFile: (
        pan: string,
        directory: string,
        year: string
      ) => Promise<{
        success: boolean
        ackno?: { num: string; year: string; filePath: string }
        error?: string
      }>

      updateEntryAckno: (
        pan: string,
        ackno?: { num: string; year: string; filePath: string }[]
      ) => Promise<{ success: boolean; error?: string }>

      updateEntryAckDate: (
        pan: string,
        ackDate: { date: string; year: string }[]
      ) => Promise<{ success: boolean; error?: string }>

      openContainingFolder: (filePath: string) => Promise<void>
    }

    api: {
      selectFolder: () => Promise<string | null>
    }

    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

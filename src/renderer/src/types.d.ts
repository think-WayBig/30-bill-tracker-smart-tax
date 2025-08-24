export {}

declare global {
  interface Entry {
    name: string
    fileCode: string
    pan: string
    startYear: string
    endYear?: string

    ackno?: { num: string; year: string; filePath: string }[]
    ackDate?: { date: string; year: string }[]

    billingStatus?: { status: 'Not started' | 'Pending' | 'Paid'; year: string }[]
    group?: string
    remarks?: { remark: string; year: string }[]
    docsComplete?: { value: boolean; year: string }[]
  }

  interface Notice {
    name: string
    date: string
    dueDate: string
    type: 'GST' | 'ITR'
    year: string
    done?: boolean
  }

  /**
   * Bill type definition
   * - GST Bills: Have gstNumber, can be Yearly or Monthly
   * - TDS Bills: Have pan, can be Yearly or QuarterlyD
   */
  interface Bill {
    name: string
    gstNumber?: string
    pan?: string
    paymentType: PaymentType
    bill?: {
      year: number
      amount: number | MonthlyAmount[] | QuarterlyAmount[]
      date: string
      remarks?: string
    }
    type: 'GST' | 'TDS'
  }

  const paymentType = ['Yearly', 'Monthly', 'Quarterly'] as const

  type PaymentType = (typeof paymentType)[number]

  interface MonthlyAmount {
    month: string
    value: number
  }

  interface QuarterlyAmount {
    quarter: string
    value: number
  }

  interface Window {
    electronAPI: {
      // Entry-related APIs
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

      // Group-related APIs
      saveGroup: (group: string) => Promise<{ success: boolean; error?: string }>
      loadGroups: () => Promise<string[]>
      deleteGroup: (group: string) => Promise<{ success: boolean; error?: string }>
      assignUserToGroup: (
        pan: string,
        group: string
      ) => Promise<{ success: boolean; error?: string }>

      // Notice-related APIs
      saveGstNotice: (notice: Omit<Notice, 'type'>) => Promise<{ success: boolean; error?: string }>
      saveItrNotice: (notice: Omit<Notice, 'type'>) => Promise<{ success: boolean; error?: string }>
      loadNotices: () => Promise<Notice[]>
      updateNotice: (notice: Notice) => Promise<{ success: boolean; error?: string }>
      deleteNotice: (notice: Notice) => Promise<{ success: boolean; error?: string }>

      // Bills-related APIs
      saveGstBill: (bill: Bill) => Promise<{ success: boolean; error?: string }>
      saveTdsBill: (bill: Bill) => Promise<{ success: boolean; error?: string }>
      loadBills: () => Promise<Bill[]>
    }

    api: {
      selectFolder: () => Promise<string | null>
    }

    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

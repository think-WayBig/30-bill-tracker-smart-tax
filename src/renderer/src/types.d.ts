export { }

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
    auditCase?: { value: boolean; year: string }[]
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
    paymentType: 'Yearly' | 'Monthly' | 'Quarterly'
    bill?: BillBill[]
    type: 'GST' | 'TDS'
  }

  type BillBill = {
    year: string
    amount: YearlyAmount | MonthlyAmount[] | QuarterlyAmount[]
  }

  interface YearlyAmount {
    value: string
    date: string
    remarks?: string
  }

  interface MonthlyAmount {
    month: string
    value: string
    date: string
    remarks?: string
  }

  interface QuarterlyAmount {
    quarter: string
    value: string
    date: string
    remarks?: string
  }

  interface DeleteBillPayload {
    type: 'GST' | 'TDS'
    gstNumber?: string
    pan?: string
  }

  interface BankStatementRow {
    id: string
    date: string
    narration: string
    chqNo: string
    valueDt: string
    withdrawal: string
    deposit: string
    closing: string
    name: string
    txnType: string
    deleted?: boolean

    gstFee: string
    itFee: string
    tdsFee: string
    auditFee: string
  }

  interface YearlyAuditData {
    lastYearFee?: number
    sentToCA?: string
    sentOn?: string
    receivedOn?: string
    dateOfUpload?: string
    itrFiledOn?: string
    fee?: number
    feeDate?: string
    accountant?: string
    dscExpiry?: string
  }

  interface AuditEntry {
    pan: string
    name: string
    accounts: {
      [year: number]: YearlyAuditData
    }
  }

  type CurrentFeeEntry = {
    name: string
    gstFee: string
    itFee: string
    tdsFee: string
    auditFee: string
  }

  type FeeMap = Record<string, CurrentFeeEntry> // nameKey -> entry


  interface Window {
    electronAPI: {
      // Entry-related APIs
      saveEntry: (entry: Entry) => Promise<{ success: boolean; error?: string }>
      updateEndYear: (
        fileCode: string,
        endYear: string
      ) => Promise<{ success: boolean; error?: string }>
      updateName: (
        fileCode: string,
        newName: string
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
      updateAuditCase: (
        pan: string,
        auditCase: { value: boolean; year: string }[]
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
      updateBill: (bill: Bill) => Promise<{ success: boolean; error?: string }>
      deleteBill: (
        payload: DeleteBillPayload
      ) => Promise<{ success: boolean; removed?: number; error?: string }>

      // Statements-related APIs
      saveStatement: (
        statement: Omit<BankStatementRow, 'id'>
      ) => Promise<{ success: boolean; data?: BankStatementRow; error?: string }>

      loadStatements: () => Promise<BankStatementRow[]>

      updateStatement: (
        statement: BankStatementRow
      ) => Promise<{ success: boolean; data?: BankStatementRow; error?: string }>

      deleteStatement: (
        id: string
      ) => Promise<{ success: boolean; removed?: number; error?: string }>

      // Savings Statements-related APIs
      saveStatement2: (
        statement: Omit<BankStatementRow, 'id'>
      ) => Promise<{ success: boolean; data?: BankStatementRow; error?: string }>

      loadStatements2: () => Promise<BankStatementRow[]>

      updateStatement2: (
        statement: BankStatementRow
      ) => Promise<{ success: boolean; data?: BankStatementRow; error?: string }>

      deleteStatement2: (
        id: string
      ) => Promise<{ success: boolean; removed?: number; error?: string }>

      // Personal Statements-related APIs
      saveStatement3: (
        statement: Omit<BankStatementRow, 'id'>
      ) => Promise<{ success: boolean; data?: BankStatementRow; error?: string }>

      loadStatements3: () => Promise<BankStatementRow[]>

      updateStatement3: (
        statement: BankStatementRow
      ) => Promise<{ success: boolean; data?: BankStatementRow; error?: string }>

      deleteStatement3: (
        id: string
      ) => Promise<{ success: boolean; removed?: number; error?: string }>

      // Audits-related APIs
      saveAudit: (
        entry: AuditEntry
      ) => Promise<{ success: boolean; data: AuditEntry; error?: string }>

      loadAudits: () => Promise<AuditEntry[]>

      updateAudit: (
        entry: AuditEntry
      ) => Promise<{ success: boolean; data: AuditEntry; error?: string }>

      deleteAudit: (pan: string) => Promise<{ success: boolean; removed?: number; error?: string }>

      // Current Fee Entries-related APIs
      loadCurrentFeeEntries: () => Promise<CurrentFeeEntry[]>

      upsertCurrentFeeEntry: (
        entry: CurrentFeeEntry
      ) => Promise<{ success: boolean; error?: string }>
    }

    api: {
      selectFolder: () => Promise<string | null>
    }

    electron: (typeof import('@electron-toolkit/preload'))['electronAPI']
  }
}

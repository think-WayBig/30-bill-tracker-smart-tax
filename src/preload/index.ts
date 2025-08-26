import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Typed interfaces for better clarity and consistency
interface Ackno {
  num: string
  year: string
  filePath: string
}

interface BillingStatus {
  status: 'Not started' | 'Pending' | 'Paid'
  year: string
}

interface Remark {
  remark: string
  year: string
}

interface DocsComplete {
  value: boolean
  year: string
}

interface Entry {
  name: string
  fileCode: string
  pan: string
  startYear: string
  endYear?: string
  ackno?: Ackno[]
  billingStatus?: BillingStatus[]
  group?: string
  remarks?: Remark[]
  docsComplete?: DocsComplete[]
}

type Notice = {
  name: string
  dueDate: string
  date: string
  type: 'GST' | 'ITR'
  year: string
  done?: boolean
}

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

const api = {
  selectFolder: () => ipcRenderer.invoke('select-folder')
}

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (entry: Entry) => ipcRenderer.invoke('save-entry', entry),

  updateEndYear: (fileCode: string, endYear: string) =>
    ipcRenderer.invoke('update-end-year', fileCode, endYear),

  loadEntries: (): Promise<Entry[]> => ipcRenderer.invoke('load-entries'),

  saveEntries: (entries: Entry[]): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('save-multiple-entries', entries),

  updateRemarks: (pan: string, remarks: Remark[]) =>
    ipcRenderer.invoke('update-remarks', pan, remarks),

  updateBillingStatus: (pan: string, billingStatus: BillingStatus, year: string) =>
    ipcRenderer.invoke('update-billing-status', pan, billingStatus, year),

  updateDocsComplete: (pan: string, docsComplete: DocsComplete[]) =>
    ipcRenderer.invoke('update-docs-complete', pan, docsComplete),

  saveGroup: (group: string) => ipcRenderer.invoke('save-group', group),
  deleteGroup: (group: string) => ipcRenderer.invoke('delete-group', group),
  loadGroups: () => ipcRenderer.invoke('load-groups'),
  assignUserToGroup: (pan: string, group: string) =>
    ipcRenderer.invoke('assign-user-to-group', pan, group),

  getAcknoFromFile: (pan: string, directory: string, year: string) =>
    ipcRenderer.invoke('get-ackno-from-file', pan, directory, year),

  updateEntryAckno: (pan: string, ackno?: Ackno[]) =>
    ipcRenderer.invoke('update-entry-ackno', pan, ackno),

  updateEntryAckDate: (pan, ackDate) => ipcRenderer.invoke('update-entry-ack-date', pan, ackDate),

  deleteEntry: (fileCode: string) => ipcRenderer.invoke('delete-entry', fileCode),

  openContainingFolder: (filePath: string) =>
    ipcRenderer.invoke('open-containing-folder', filePath),

  /** Notices Code */
  saveGstNotice: (notice: { name: string; date: string }) =>
    ipcRenderer.invoke('save-gst-notice', notice),

  saveItrNotice: (notice: { name: string; date: string }) =>
    ipcRenderer.invoke('save-itr-notice', notice),

  loadNotices: (): Promise<{ name: string; date: string; type: 'GST' | 'ITR' }[]> =>
    ipcRenderer.invoke('load-notices'),

  updateNotice: (notice: Notice) => ipcRenderer.invoke('update-notice', notice),

  deleteNotice: (notice: Notice) => ipcRenderer.invoke('deleteNotice', notice),

  /** Bills Code */
  saveGstBill: (bill: Bill) => ipcRenderer.invoke('save-gst-bill', bill),

  saveTdsBill: (bill: Bill) => ipcRenderer.invoke('save-tds-bill', bill),

  loadBills: () => ipcRenderer.invoke('load-bills'),

  updateBill: (bill: Bill) => ipcRenderer.invoke('update-bill', bill),

  deleteBill: (bill: DeleteBillPayload) => ipcRenderer.invoke('delete-bill', bill)
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

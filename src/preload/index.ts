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

  saveGroup: (group: string) => ipcRenderer.invoke('save-group', group),
  deleteGroup: (group: string) => ipcRenderer.invoke('delete-group', group),
  loadGroups: () => ipcRenderer.invoke('load-groups'),

  getAcknoFromFile: (pan: string, directory: string, year: string) =>
    ipcRenderer.invoke('get-ackno-from-file', pan, directory, year),

  updateEntryAckno: (pan: string, ackno?: Ackno[]) =>
    ipcRenderer.invoke('update-entry-ackno', pan, ackno),

  deleteEntry: (fileCode: string) => ipcRenderer.invoke('delete-entry', fileCode),

  openContainingFolder: (filePath: string) => ipcRenderer.invoke('open-containing-folder', filePath)
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

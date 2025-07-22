import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  selectFolder: () => ipcRenderer.invoke('select-folder')
}

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (entry: { name: string; pan: string }) => ipcRenderer.invoke('save-entry', entry),
  loadEntries: () => ipcRenderer.invoke('load-entries'),
  saveEntries: (entries: Array<any>) => ipcRenderer.invoke('save-multiple-entries', entries),
  updateRemarks: (pan: string, remarks: { remark: string; year: string }[]) =>
    ipcRenderer.invoke('update-remarks', pan, remarks),
  updateBillingStatus: (pan, billingStatus, year) =>
    ipcRenderer.invoke('update-billing-status', pan, billingStatus, year),
  saveGroup: (group) => ipcRenderer.invoke('save-group', group),
  loadGroups: () => ipcRenderer.invoke('load-groups'),
  getAcknoFromFile: (pan: string, directory: string, year: string) =>
    ipcRenderer.invoke('get-ackno-from-file', pan, directory, year),
  updateEntryAckno: (pan, ackno, filePath) =>
    ipcRenderer.invoke('update-entry-ackno', pan, ackno, filePath),
  deleteEntry: (pan) => ipcRenderer.invoke('delete-entry', pan),
  openContainingFolder: (filePath: string) => ipcRenderer.invoke('open-containing-folder', filePath)
})

// Expose Electron APIs based on context isolation
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

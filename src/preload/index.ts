import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  selectFolder: () => ipcRenderer.invoke('select-folder')
}

contextBridge.exposeInMainWorld('electronAPI', {
  saveEntry: (entry: { name: string; pan: string }) => ipcRenderer.invoke('save-entry', entry),
  loadEntries: () => ipcRenderer.invoke('load-entries'),
  saveEntries: (entries: Array<any>) => ipcRenderer.invoke('save-multiple-entries', entries),
  updateBillingStatus: (pan, billingStatus) =>
    ipcRenderer.invoke('update-billing-status', pan, billingStatus),
  saveGroup: (group) => ipcRenderer.invoke('save-group', group),
  loadGroups: () => ipcRenderer.invoke('load-groups'),
  getAcknoFromFile: (pan: string, directory: string) =>
    ipcRenderer.invoke('get-ackno-from-file', pan, directory),
  updateEntryAckno: (pan, ackno, filePath) =>
    ipcRenderer.invoke('update-entry-ackno', pan, ackno, filePath),
  deleteEntry: (pan) => ipcRenderer.invoke('delete-entry', pan),
  openContainingFolder: (filePath: string) => ipcRenderer.invoke('open-containing-folder', filePath)
})

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}

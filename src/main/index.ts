import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { dialog } from 'electron'

import fs from 'fs'
import path from 'path'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    title: 'Smart Tax - Bill Tracker'
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('save-entry', async (_event, entry) => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'entries.json')

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : []

    // Check if PAN already exists (case-insensitive match)
    const panExists = existing.some((e: any) => e.pan?.toLowerCase() === entry.pan?.toLowerCase())

    if (panExists) {
      return {
        success: false,
        error: 'Entry with this PAN already exists.'
      }
    }

    existing.push(entry)
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('load-entries', async () => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'entries.json')

    if (!fs.existsSync(filePath)) return []

    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error loading entries:', error)
    return []
  }
})

// Save or create a group
ipcMain.handle('save-group', async (_event, group) => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'groups.json')

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : []

    // Check if group already exists (case-insensitive)
    const alreadyExists = existing.some((g: string) => g.toLowerCase() === group.toLowerCase())
    if (alreadyExists) {
      return { success: false, error: 'Group already exists.' }
    }

    const updated = [...existing, group]
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// Load all groups
ipcMain.handle('load-groups', async () => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'groups.json')

    if (!fs.existsSync(filePath)) return []

    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error('Error loading groups:', error)
    return []
  }
})

// Update user's group assignment
ipcMain.handle('assign-user-to-group', async (_event, { pan, group }) => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'entries.json')

    if (!fs.existsSync(filePath)) return { success: false, error: 'Entries file not found' }

    const users = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    const index = users.findIndex((user: any) => user.pan === pan)
    if (index === -1) return { success: false, error: 'User not found' }

    users[index].group = group // only modify the group field
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('save-multiple-entries', async (_event, newEntries) => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'entries.json')

    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : []

    const updated = existing.map((entry: any) => {
      const updatedEntry = newEntries.find((e: any) => e.pan === entry.pan)
      return updatedEntry ? { ...entry, ...updatedEntry } : entry
    })

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update-billing-status', async (_event, pan, billingStatus) => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'entries.json')
    if (!fs.existsSync(filePath)) throw new Error('Entries file does not exist')

    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    const updated = existing.map((entry) =>
      entry.pan === pan ? { ...entry, billingStatus } : entry
    )

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('delete-entry', async (_event, pan) => {
  try {
    const dir = path.join(app.getPath('userData'), 'data')
    const filePath = path.join(dir, 'entries.json')

    if (!fs.existsSync(filePath)) return { success: false, error: 'Entries file not found' }

    const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    const match = existing.find((entry: any) => entry.pan?.toLowerCase() === pan.toLowerCase())
    if (!match) {
      return { success: false, error: 'Entry does not exist' }
    }

    const updated = existing.filter((entry: any) => entry.pan?.toLowerCase() !== pan.toLowerCase())
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

function findFileRecursive(dir: string, targetFile: string): string | null {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isFile() && entry.name === targetFile) {
      return fullPath
    } else if (entry.isDirectory()) {
      const result = findFileRecursive(fullPath, targetFile)
      if (result) return result
    }
  }

  return null
}

ipcMain.handle('get-ackno-from-file', async (_event, pan: string, directory: string) => {
  try {
    const fileName = `${pan}_ITRV.txt`

    const filePath = findFileRecursive(directory, fileName)

    if (!filePath) {
      return { success: false, error: 'File not found in any subfolder' }
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(content)

    if (!Array.isArray(jsonData)) {
      return { success: false, error: 'Invalid file format' }
    }

    const latest = jsonData.reduce((prev, curr) => {
      return +curr.assmentYear > +prev.assmentYear ? curr : prev
    })

    return { success: true, ackno: latest.ackNum, filePath }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

ipcMain.handle('update-entry-ackno', async (_, pan: string, ackno: string, filePath: string) => {
  try {
    const entriesPath = path.join(app.getPath('userData'), 'data', 'entries.json')

    if (!fs.existsSync(entriesPath)) {
      return { success: false, error: 'Entries file not found.' }
    }

    const content = JSON.parse(fs.readFileSync(entriesPath, 'utf-8'))

    let found = false
    const updated = content.map((entry) => {
      if (entry.pan === pan) {
        found = true
        return { ...entry, ackno, filePath }
      }
      return entry
    })

    if (!found) {
      return { success: false, error: 'PAN not found in entries.' }
    }

    fs.writeFileSync(entriesPath, JSON.stringify(updated, null, 2))
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('open-containing-folder', async (_event, filePath: string) => {
  try {
    await shell.showItemInFolder(filePath)
    return { success: true }
  } catch (error: any) {
    console.error('Error opening folder:', error)
    return { success: false, error: error.message }
  }
})

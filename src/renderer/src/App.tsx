declare global {
  interface Window {
    api: {
      selectFolder: () => Promise<string | null>
    }
  }
}

import MainView from './components/MainView'
import FolderSelector from './components/FolderSelector'
import './App.css'

function App() {
  return (
    <>
      <MainView />
      <FolderSelector />
    </>
  )
}

export default App

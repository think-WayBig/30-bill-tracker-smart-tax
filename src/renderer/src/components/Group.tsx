import { useEffect, useMemo, useState } from 'react'
import Layout from './Layout'

interface User {
  name: string
  pan: string
  fileCode: string
  startYear: string
  group?: string
}

const Group = () => {
  const [groups, setGroups] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newGroup, setNewGroup] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showGroupsPanel, setShowGroupsPanel] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const loadedUsers = await window.electronAPI.loadEntries()
      setUsers(loadedUsers)

      const loadedGroups = await window.electronAPI.loadGroups()
      setGroups(loadedGroups)
    }

    fetchData()
  }, [])

  const handleCreateGroup = async () => {
    const trimmed = newGroup.trim()
    if (!trimmed) return

    const res = await window.electronAPI.saveGroup(trimmed)
    if (res.success) {
      const updatedGroups = await window.electronAPI.loadGroups()
      setGroups(updatedGroups)
      setNewGroup('')
      alert('Group created successfully!')
    } else {
      alert(res.error || 'Failed to create group')
    }
  }

  const handleGroupChange = (pan: string, group: string) => {
    const updatedUsers = users.map((u) => (u.pan === pan ? { ...u, group } : u))
    setUsers((prev) => prev.map((u) => (u.group === group ? { ...u, group: undefined } : u)))
    window.electronAPI.saveEntries(updatedUsers)
  }

  const handleDeleteGroup = async (group: string) => {
    if (
      confirm(
        `Are you sure you want to delete the group "${group}"? This will also remove it from all users.`
      )
    ) {
      const res = await window.electronAPI.deleteGroup(group)
      if (res.success) {
        const updatedGroups = await window.electronAPI.loadGroups()
        const updatedUsers = await window.electronAPI.loadEntries()
        setGroups(updatedGroups)
        setUsers(updatedUsers)
      } else {
        alert(res.error || 'Failed to delete group')
      }
    }
  }

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase()
    return users.filter(
      (user) =>
        user.fileCode.toLowerCase().includes(search) ||
        user.name.toLowerCase().includes(search) ||
        user.pan.toLowerCase().includes(search) ||
        (user.group?.toLowerCase() || '').includes(search)
    )
  }, [users, searchTerm])

  const [sortKey, setSortKey] = useState<'fileCode' | 'name' | 'pan' | 'group' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers]
    if (!sortKey) return sorted

    return sorted.sort((a, b) => {
      const aVal = (a[sortKey] || '').toString()
      const bVal = (b[sortKey] || '').toString()
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' })
        : bVal.localeCompare(aVal, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [filteredUsers, sortKey, sortOrder])

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    )
  }, [groups])

  return (
    <Layout title="📂 Manage Groups">
      {/* Expansion Panel */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', borderRadius: '6px' }}>
        <div
          onClick={() => setShowGroupsPanel(!showGroupsPanel)}
          style={{
            background: '#ecececff',
            padding: '12px 16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📁 Manage Groups {showGroupsPanel ? '▲' : '▼'}
        </div>

        {showGroupsPanel && (
          <div style={{ padding: '16px' }}>
            {/* Create Group */}
            <form
              style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateGroup()
              }}
            >
              <input
                type="text"
                placeholder="Enter new group name"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                style={{
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  flex: '1 1 200px'
                }}
                required
              />
              <button
                type="submit"
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Create Group
              </button>
            </form>

            {/* Group Member Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: 'white',
                marginBottom: '20px'
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
                  <th style={thStyle}>Group</th>
                  <th style={thStyle}>Members</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const members = users.filter((u) => u.group === group)
                  return (
                    <tr key={group}>
                      <td style={tdStyle}>{group}</td>
                      <td style={tdStyle}>
                        {members.length > 0 ? (
                          <ol style={{ margin: 0, paddingLeft: '20px' }}>
                            {members.map((m) => (
                              <li key={m.pan}>
                                {m.name} ({m.fileCode})
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <span style={{ color: '#999' }}>No members</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleDeleteGroup(group)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign User to Group */}
      <div
        style={{
          display: 'flex',
          top: '80px',
          position: 'sticky',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          marginBottom: '20px'
        }}
      >
        <input
          type="text"
          placeholder="Search Entry"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            outline: 'none',
            width: '100%'
          }}
        />

        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
            fontSize: '15px',
            fontWeight: 500,
            color: '#374151',
            display: 'inline-block',
            flexShrink: 0
          }}
        >
          <b>Total entries:</b> {sortedUsers.length}
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            {['fileCode', 'name', 'pan', 'group'].map((key) => (
              <th
                key={key}
                style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort(key as typeof sortKey)}
              >
                {key === 'fileCode' ? 'File Code' : key.charAt(0).toUpperCase() + key.slice(1)}
                {sortKey === key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedUsers.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No data available
              </td>
            </tr>
          ) : (
            sortedUsers.map((user) => (
              <tr key={user.pan} className="group-row">
                <td style={tdStyle}>{user.fileCode}</td>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.pan}</td>
                <td style={tdStyle}>
                  <select
                    value={user.group || ''}
                    onChange={(e) => handleGroupChange(user.pan, e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="">Select Group</option>
                    {sortedGroups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Layout>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 'bold'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  verticalAlign: 'top'
}

export default Group

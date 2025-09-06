// Group.tsx
import { useEffect, useMemo, useState, useTransition } from 'react'
import Layout from './helpers/Layout'
import { GroupList } from './GroupList'
import type { ListChildComponentProps } from 'react-window'

interface User {
  name: string
  pan: string
  fileCode: string
  startYear: string
  group?: string
}

const ROW_HEIGHT = 44
const COLS = {
  fileCode: 140,
  name: '1fr',
  pan: 180,
  group: 240
}
const GRID = `${COLS.fileCode}px ${COLS.name} ${COLS.pan}px ${COLS.group}px`

const Group = () => {
  const [groups, setGroups] = useState<string[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newGroup, setNewGroup] = useState('')
  const [rawSearchTerm, setRawSearchTerm] = useState('')
  const [searchTerm, setSearchTerm] = useState('') // debounced
  const [showGroupsPanel, setShowGroupsPanel] = useState(false)

  const [sortKey, setSortKey] = useState<'fileCode' | 'name' | 'pan' | 'group' | ''>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isPending, startTransition] = useTransition()

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      const loadedUsers = await window.electronAPI.loadEntries()
      setUsers(loadedUsers)
      const loadedGroups = await window.electronAPI.loadGroups()
      setGroups(loadedGroups)
    }
    fetchData()
  }, [])

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setSearchTerm(rawSearchTerm.trim().toLowerCase()), 200)
    return () => clearTimeout(id)
  }, [rawSearchTerm])

  // Precompute search index
  type IndexedUser = User & { __idx: string }
  const indexedUsers = useMemo<IndexedUser[]>(
    () =>
      users.map((u) => ({
        ...u,
        __idx: `${u.fileCode} ${u.name} ${u.pan} ${u.group ?? ''}`.toLowerCase()
      })),
    [users]
  )

  const filteredUsers: IndexedUser[] = useMemo(() => {
    if (!searchTerm) return indexedUsers
    return indexedUsers.filter((u) => u.__idx.includes(searchTerm))
  }, [indexedUsers, searchTerm])

  // Sorting
  const collator = useMemo(
    () => new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }),
    []
  )

  const sortedUsers: IndexedUser[] = useMemo(() => {
    const arr = filteredUsers.slice()
    if (!sortKey) return arr
    return arr.sort((a, b) => {
      const aVal = (a[sortKey] ?? '').toString()
      const bVal = (b[sortKey] ?? '').toString()
      return sortOrder === 'asc' ? collator.compare(aVal, bVal) : collator.compare(bVal, aVal)
    })
  }, [filteredUsers, sortKey, sortOrder, collator])

  const sortedGroups = useMemo(() => {
    const arr = groups.slice()
    arr.sort((a, b) => collator.compare(a, b))
    return arr
  }, [groups, collator])

  // Group -> members (avoid O(U×G) in render)
  const groupMembers = useMemo(() => {
    const map = new Map<string, User[]>()
    for (const u of users) {
      if (!u.group) continue
      if (!map.has(u.group)) map.set(u.group, [])
      map.get(u.group)!.push(u)
    }
    return map
  }, [users])

  // Create group
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

  // Delete group
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

  // Assign user to group — uses existing API
  const handleGroupChange = async (pan: string, group: string) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.pan === pan)
      if (idx === -1) return prev
      const next = prev.slice()
      next[idx] = { ...next[idx], group: group || undefined }
      return next
    })
    const res = await window.electronAPI.assignUserToGroup(pan, group)
    if (!res.success) {
      alert(res.error || 'Failed to assign group')
      const fresh = await window.electronAPI.loadEntries()
      setUsers(fresh)
    }
  }

  const handleSort = (key: typeof sortKey) => {
    startTransition(() => {
      if (sortKey === key) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortKey(key)
        setSortOrder('asc')
      }
    })
  }

  return (
    <Layout title="📂 Manage Groups">
      {/* Expansion Panel */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', borderRadius: '6px' }}>
        <div
          onClick={() => setShowGroupsPanel((v) => !v)}
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
                  const members = groupMembers.get(group) ?? []
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

      {/* Search + Count */}
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
          value={rawSearchTerm}
          onChange={(e) => setRawSearchTerm(e.target.value)}
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
          <b>Total entries:</b> {sortedUsers.length} {isPending ? '…' : ''}
        </div>
      </div>

      {/* HEADER TABLE (fixed) */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <colgroup>
          {[
            <col key="fileCode" style={{ width: COLS.fileCode }} />,
            <col key="name" />,
            <col key="pan" style={{ width: COLS.pan }} />,
            <col key="group" style={{ width: COLS.group }} />
          ]}
        </colgroup>

        <thead>
          <tr style={{ backgroundColor: '#4f46e5', color: 'white' }}>
            {(['fileCode', 'name', 'pan', 'group'] as const).map((key) => (
              <th
                key={key}
                style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => handleSort(key)}
                title="Click to sort"
              >
                {key === 'fileCode' ? 'File Code' : key.charAt(0).toUpperCase() + key.slice(1)}
                {sortKey === key && (sortOrder === 'asc' ? ' ↓' : ' ↑')}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* VIRTUALIZED BODY (grid, not inside <tbody>) */}
      <div style={{ width: '100%', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {sortedUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>No data</div>
        ) : (
          <GroupList
            height={Math.min(700, sortedUsers.length * ROW_HEIGHT)}
            itemCount={sortedUsers.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            itemData={{ sortedUsers, sortedGroups, handleGroupChange }}
          >
            {RowGrid}
          </GroupList>
        )}
      </div>
    </Layout>
  )
}

// Virtualized grid row
function RowGrid({ index, style, data }: ListChildComponentProps) {
  const user = data.sortedUsers[index] as User
  const sortedGroups = data.sortedGroups as string[]
  const handleGroupChange = data.handleGroupChange as (pan: string, group: string) => void

  return (
    <div
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: GRID,
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        padding: '0 16px',
        boxSizing: 'border-box',
        height: ROW_HEIGHT
      }}
      key={user.pan}
    >
      <div style={cellStyle}>{user.fileCode}</div>
      <div style={cellStyle} title={user.name}>
        {user.name}
      </div>
      <div style={cellStyle}>{user.pan}</div>
      <div style={cellStyle}>
        <select
          value={user.group || ''}
          onChange={(e) => handleGroupChange(user.pan, e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
        >
          <option value="">Select Group</option>
          {sortedGroups.map((g: string) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '0 16px',
  textAlign: 'left',
  fontWeight: 'bold',
  height: 44,
  lineHeight: '44px'
}

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  verticalAlign: 'top'
}

const cellStyle: React.CSSProperties = {
  padding: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap'
}

export default Group

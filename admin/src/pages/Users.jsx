import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Shield, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { Alert, Badge, ConfirmDialog, EmptyState, Modal, PageTitle, Spinner, TableShell } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'roles', label: 'Roles & permissions' },
]

export default function Users() {
  const { can, user: currentUser } = useAuth()
  const writable = can('users.write')

  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editingRole, setEditingRole] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userList, roleList, permissionList] = await Promise.all([api.users(), api.roles(), api.permissions()])
      setUsers(userList)
      setRoles(roleList)
      setPermissions(permissionList)
    } catch (err) {
      setError(err.status === undefined ? 'Cannot reach the API.' : err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const act = async (operation) => {
    setBusy(true)
    setError('')

    try {
      await operation()
      setEditingUser(null)
      setEditingRole(null)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner label="Loading users" />

  return (
    <>
      <PageTitle
        title="Users & Roles"
        subtitle="Back-office access. Guests are not users — reservations are keyed by email."
        actions={
          writable && (
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                tab === 'users'
                  ? setEditingUser({ email: '', fullName: '', phone: '', roleId: roles[0]?.id ?? '', isActive: true, password: '' })
                  : setEditingRole({ name: '', description: '', permissions: [] })
              }
            >
              <Plus className="h-4 w-4" />
              {tab === 'users' ? 'New user' : 'New role'}
            </button>
          )
        }
      />

      <Alert onDismiss={() => setError('')}>{error}</Alert>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => setTab(entry.key)}
            aria-pressed={tab === entry.key}
            className={`rounded-lg px-4 py-2 text-[13px] transition-colors ${
              tab === entry.key
                ? 'bg-brand/12 font-medium text-brand-ink'
                : 'text-text-secondary hover:bg-background-warm hover:text-text-primary'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <TableShell>
          <thead>
            <tr className="border-b border-line">
              <th className="table-head">Name</th>
              <th className="table-head">Email</th>
              <th className="table-head">Role</th>
              <th className="table-head">Last signed in</th>
              <th className="table-head">Status</th>
              {writable && <th className="table-head text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((entry) => (
              <tr key={entry.id} className="border-b border-line-soft last:border-0 hover:bg-background-warm">
                <td className="table-cell text-text-primary">
                  {entry.fullName}
                  {entry.id === currentUser?.id && <span className="ml-2 text-[11px] text-brand-ink">you</span>}
                </td>
                <td className="table-cell">{entry.email}</td>
                <td className="table-cell">
                  <Badge tone={entry.permissions.includes('*') ? 'gold' : 'neutral'} icon={Shield}>
                    {entry.roleName}
                  </Badge>
                </td>
                <td className="table-cell whitespace-nowrap">{entry.lastLoginAt ? formatDateTime(entry.lastLoginAt) : 'Never'}</td>
                <td className="table-cell">
                  <Badge tone={entry.isActive ? 'good' : 'critical'}>{entry.isActive ? 'Active' : 'Disabled'}</Badge>
                </td>
                {writable && (
                  <td className="table-cell text-right">
                    <span className="inline-flex gap-1">
                      <button
                        type="button"
                        aria-label={`Edit ${entry.fullName}`}
                        onClick={() =>
                          setEditingUser({
                            ...entry,
                            roleId: roles.find((role) => role.name === entry.roleName)?.id ?? roles[0]?.id,
                            password: '',
                          })
                        }
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-brand-ink"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${entry.fullName}`}
                        onClick={() => setDeleting({ kind: 'user', ...entry })}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-warm hover:text-state-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}

      {tab === 'roles' && (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <article key={role.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-text-primary">{role.name}</h3>
                  <p className="mt-1 text-[12px] text-text-secondary">{role.description}</p>
                </div>
                <Badge tone={role.isSystem ? 'gold' : 'neutral'}>
                  {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {role.permissions.includes('*') ? (
                  <Badge tone="gold">Full access</Badge>
                ) : (
                  role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-text-secondary"
                    >
                      {permission}
                    </span>
                  ))
                )}
              </div>

              {writable && !role.isSystem && (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => setEditingRole({ ...role, permissions: [...role.permissions] })}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => setDeleting({ kind: 'role', ...role })}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}

              {role.isSystem && (
                <p className="mt-4 text-[11px] text-text-secondary">
                  Built-in role — locked so the system always has a way back in.
                </p>
              )}
            </article>
          ))}

          {roles.length === 0 && (
            <div className="card md:col-span-2">
              <EmptyState title="No roles" message="Seed the database to create the default roles." />
            </div>
          )}
        </div>
      )}

      {/* ---------------- User form ---------------- */}
      {editingUser && (
        <Modal
          open
          onClose={() => setEditingUser(null)}
          title={editingUser.id ? `Edit ${editingUser.fullName}` : 'New user'}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" form="user-form" className="btn-primary" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </>
          }
        >
          <form
            id="user-form"
            onSubmit={(event) => {
              event.preventDefault()
              const payload = { ...editingUser, roleId: Number(editingUser.roleId) }
              act(() => (editingUser.id ? api.updateUser(editingUser.id, payload) : api.createUser(payload)))
            }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label htmlFor="u-name" className="field-label">
                Full name *
              </label>
              <input
                id="u-name"
                className="field"
                value={editingUser.fullName}
                onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="u-email" className="field-label">
                Email *
              </label>
              <input
                id="u-email"
                type="email"
                className="field"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="u-phone" className="field-label">
                Phone
              </label>
              <input
                id="u-phone"
                className="field"
                value={editingUser.phone}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="u-role" className="field-label">
                Role *
              </label>
              <select
                id="u-role"
                className="field"
                value={editingUser.roleId}
                onChange={(e) => setEditingUser({ ...editingUser, roleId: e.target.value })}
                required
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="u-password" className="field-label">
                {editingUser.id ? 'New password (leave blank to keep the current one)' : 'Password *'}
              </label>
              <input
                id="u-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                className="field"
                value={editingUser.password}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                required={!editingUser.id}
              />
              <p className="mt-1 text-[11px] text-text-secondary">At least 8 characters.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-text-secondary sm:col-span-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                checked={editingUser.isActive}
                onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
              />
              Account active
            </label>
          </form>
        </Modal>
      )}

      {/* ---------------- Role form ---------------- */}
      {editingRole && (
        <Modal
          open
          onClose={() => setEditingRole(null)}
          title={editingRole.id ? `Edit ${editingRole.name}` : 'New role'}
          description="Tick the modules this role may reach."
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditingRole(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" form="role-form" className="btn-primary" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </button>
            </>
          }
        >
          <form
            id="role-form"
            onSubmit={(event) => {
              event.preventDefault()
              act(() => (editingRole.id ? api.updateRole(editingRole.id, editingRole) : api.createRole(editingRole)))
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="ro-name" className="field-label">
                Role name *
              </label>
              <input
                id="ro-name"
                className="field"
                value={editingRole.name}
                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label htmlFor="ro-desc" className="field-label">
                Description
              </label>
              <input
                id="ro-desc"
                className="field"
                value={editingRole.description}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
              />
            </div>

            <fieldset>
              <legend className="field-label">Permissions</legend>
              <div className="grid gap-1.5 rounded-lg border border-line bg-background-warm p-3 sm:grid-cols-2">
                {permissions.map((permission) => (
                  <label key={permission} className="flex cursor-pointer items-center gap-2.5 font-mono text-[12px] text-text-secondary">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-line-strong bg-background-soft accent-brand-bronze"
                      checked={editingRole.permissions.includes(permission)}
                      onChange={() =>
                        setEditingRole({
                          ...editingRole,
                          permissions: editingRole.permissions.includes(permission)
                            ? editingRole.permissions.filter((existing) => existing !== permission)
                            : [...editingRole.permissions, permission],
                        })
                      }
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleting?.kind === 'role' ? `Delete role ${deleting?.name}?` : `Delete ${deleting?.fullName}?`}
        message={
          deleting?.kind === 'role'
            ? 'Roles with users attached cannot be deleted — reassign those users first.'
            : 'The account is removed immediately. The last active administrator cannot be deleted.'
        }
        busy={busy}
        onClose={() => setDeleting(null)}
        onConfirm={() => act(() => (deleting.kind === 'role' ? api.deleteRole(deleting.id) : api.deleteUser(deleting.id)))}
      />
    </>
  )
}

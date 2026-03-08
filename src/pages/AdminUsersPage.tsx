import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

interface UserRow {
    id: string
    user_id: string
    full_name: string | null
    role: 'user' | 'superadmin'
    is_seeker: boolean
    is_landlord: boolean
    onboarded: boolean
    created_at: string
}

/**
 * Superadmin User Management
 */
export default function AdminUsersPage() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<UserRow[]>([])
    const [loadingUsers, setLoadingUsers] = useState(true)

    const [email, setEmail] = useState('')
    const [newRole, setNewRole] = useState<'user' | 'superadmin'>('user')
    const [isSeekerNew, setIsSeekerNew] = useState(true)
    const [isLandlordNew, setIsLandlordNew] = useState(false)
    const [creating, setCreating] = useState(false)
    const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

    const [search, setSearch] = useState('')

    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<UserRow>>({})
    const [savingId, setSavingId] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoadingUsers(true)
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
        setUsers((data as UserRow[]) ?? [])
        setLoadingUsers(false)
    }

    async function handleEditStart(user: UserRow) {
        setEditingUserId(user.user_id)
        setEditForm({
            full_name: user.full_name,
            role: user.role,
            is_seeker: user.is_seeker,
            is_landlord: user.is_landlord
        })
    }

    async function handleEditCancel() {
        setEditingUserId(null)
        setEditForm({})
    }

    async function handleEditSave(userId: string) {
        setSavingId(userId)

        const isSelfDowngrade = userId === currentUser?.id && editForm.role === 'user'

        if (isSelfDowngrade) {
            const confirmed = window.confirm(
                "WARNING: You are about to remove your own Superadmin rights.\n\n" +
                "You will immediately lose access to this admin dashboard, and you will not be able to get these rights back unless another Superadmin approves it for you.\n\n" +
                "Are you absolutely sure you want to proceed?"
            )
            if (!confirmed) {
                setSavingId(null)
                return
            }
        }

        const updates = {
            full_name: editForm.full_name,
            role: editForm.role,
            is_seeker: editForm.is_seeker,
            is_landlord: editForm.is_landlord
        }

        const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId)

        if (!error) {
            setUsers(prev => prev.map(u =>
                u.user_id === userId ? { ...u, ...updates } as UserRow : u
            ))
            setEditingUserId(null)
        }
        setSavingId(null)
    }

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        setCreateMsg(null)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                emailRedirectTo: `${window.location.origin}/dashboard`,
            },
        })

        if (error) {
            setCreateMsg({ type: 'err', text: error.message })
            setCreating(false)
            return
        }

        setTimeout(async () => {
            const { data } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('full_name', email)
                .single()

            if (data) {
                await supabase.from('profiles').update({
                    role: newRole,
                    is_seeker: isSeekerNew,
                    is_landlord: isLandlordNew,
                }).eq('user_id', data.user_id)
            }

            setCreateMsg({
                type: 'ok',
                text: `Invite sent to ${email}.`,
            })
            setEmail('')
            setNewRole('user')
            setCreating(false)
            fetchUsers()
        }, 1000)
    }

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.user_id.includes(search)
    )

    return (
        <div className="max-w-6xl mx-auto px-6 py-8 animate-[fadeIn_0.25s_ease-out] space-y-10">

            <section>
                <h2 className="text-lg font-extrabold mb-1">Create / invite a user</h2>
                <p className="text-xs text-paragraph mb-5">
                    An invite email with a magic link will be sent. Role is applied when they sign in.
                </p>

                <form onSubmit={handleCreateUser} className="flex flex-col gap-4 max-w-md">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="new-email" className="text-xs font-semibold text-paragraph uppercase tracking-widest">
                            Email address
                        </label>
                        <input
                            id="new-email"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="px-4 py-2.5 rounded-sm border border-secondary/25 bg-background text-sm text-headline placeholder:text-paragraph/40 focus:outline-none focus:ring-2 focus:ring-highlight transition-all"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-paragraph uppercase tracking-widest">Platform role</p>
                        <div className="flex gap-3">
                            {(['user', 'superadmin'] as const).map(r => (
                                <label key={r} className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="newRole"
                                        value={r}
                                        checked={newRole === r}
                                        onChange={() => setNewRole(r)}
                                        className="accent-highlight"
                                    />
                                    <span className="text-sm capitalize">{r === 'superadmin' ? 'Superadmin' : 'Normal user'}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-semibold text-paragraph uppercase tracking-widest">View access</p>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={isSeekerNew}
                                    onChange={e => setIsSeekerNew(e.target.checked)}
                                    className="accent-highlight" />
                                <span className="text-sm">Seeker</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" checked={isLandlordNew}
                                    onChange={e => setIsLandlordNew(e.target.checked)}
                                    className="accent-highlight" />
                                <span className="text-sm">Landlord</span>
                            </label>
                        </div>
                    </div>

                    {createMsg && (
                        <p className={`text-xs font-medium ${createMsg.type === 'ok' ? 'text-highlight' : 'text-red-500'}`}>
                            {createMsg.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={creating || !email}
                        className="w-fit px-6 py-2.5 rounded-sm bg-button text-button-text text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                        {creating ? 'Sending invite…' : 'Send invite'}
                    </button>
                </form>
            </section>

            <hr className="border-secondary/10" />
            <section>
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-extrabold">All users ({users.length})</h2>
                    <input
                        type="search"
                        placeholder="Search by name or ID…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-sm border border-secondary/20 bg-background text-headline placeholder:text-paragraph/40 focus:outline-none focus:ring-2 focus:ring-highlight w-44"
                    />
                </div>

                <div className="rounded-sm border border-secondary/15 overflow-hidden overflow-x-auto">
                    {loadingUsers ? (
                        <p className="px-4 py-6 text-sm text-paragraph animate-pulse text-center">Loading users…</p>
                    ) : filtered.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-paragraph text-center">No users found.</p>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/5 text-xs font-semibold text-paragraph uppercase tracking-wider border-b border-secondary/10 hover:bg-transparent">
                                    <th className="px-4 py-3 font-semibold">User</th>
                                    <th className="px-4 py-3 font-semibold">Access</th>
                                    <th className="px-4 py-3 font-semibold w-24">Onboarded</th>
                                    <th className="px-4 py-3 font-semibold w-28 text-left">Role</th>
                                    <th className="px-4 py-3 font-semibold w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u) => {
                                    const isEditing = editingUserId === u.user_id;

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`border-b border-secondary/10 last:border-b-0 transition-colors ${isEditing ? 'bg-secondary/5' : 'hover:bg-secondary/5'}`}
                                        >
                                            <td className="px-4 py-3 min-w-[200px]">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.full_name || ''}
                                                        onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                                        placeholder="Full Name"
                                                        className="w-full text-sm px-2 py-1 rounded-sm border border-secondary/20 bg-background text-headline focus:outline-none focus:ring-1 focus:ring-highlight mb-1"
                                                    />
                                                ) : (
                                                    <p className="font-semibold text-headline truncate">
                                                        {u.full_name ?? '—'}
                                                    </p>
                                                )}
                                                <p className="text-xs text-paragraph truncate font-mono">{u.user_id.slice(0, 12)}…</p>
                                            </td>

                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.is_seeker}
                                                                onChange={e => setEditForm({ ...editForm, is_seeker: e.target.checked })}
                                                                className="accent-highlight"
                                                            /> Seeker
                                                        </label>
                                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={editForm.is_landlord}
                                                                onChange={e => setEditForm({ ...editForm, is_landlord: e.target.checked })}
                                                                className="accent-highlight"
                                                            /> Landlord
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {u.is_seeker && <Badge label="Seeker" color="highlight" />}
                                                        {u.is_landlord && <Badge label="Landlord" color="secondary" />}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-semibold ${u.onboarded ? 'text-highlight' : 'text-paragraph/50'}`}>
                                                    {u.onboarded ? '✓ Yes' : 'Pending'}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3 text-left">
                                                {isEditing ? (
                                                    <select
                                                        value={editForm.role}
                                                        onChange={e => setEditForm({ ...editForm, role: e.target.value as 'user' | 'superadmin' })}
                                                        className="text-xs px-2 py-1 rounded-sm border border-secondary/20 bg-background text-headline focus:outline-none focus:ring-1 focus:ring-highlight"
                                                    >
                                                        <option value="user" className="bg-background text-headline">User</option>
                                                        <option value="superadmin" className="bg-background text-headline">Superadmin</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-xs font-semibold capitalize bg-secondary/10 px-2 py-1 rounded-sm">
                                                        {u.role === 'superadmin' ? 'Superadmin' : 'User'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right">
                                                {isEditing ? (
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={handleEditCancel}
                                                            disabled={savingId === u.user_id}
                                                            className="text-xs font-semibold text-paragraph hover:text-headline px-2 py-1"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditSave(u.user_id)}
                                                            disabled={savingId === u.user_id}
                                                            className="text-xs font-semibold bg-highlight text-white px-3 py-1 rounded-sm hover:opacity-90 transition-opacity"
                                                        >
                                                            {savingId === u.user_id ? 'Saving…' : 'Save'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEditStart(u)}
                                                        className="text-xs font-semibold px-3 py-1 rounded-sm border border-secondary/20 text-paragraph hover:border-highlight/40 hover:text-highlight transition-colors duration-150"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>
        </div>
    )
}

function Badge({ label, color }: { label: string; color: 'highlight' | 'secondary' }) {
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-sm bg-${color}/10 text-${color}`}>
            {label}
        </span>
    )
}

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabaseClient'

export type ActiveView = 'seeker' | 'landlord'

export interface Profile {
    id: string
    user_id: string
    role: 'user' | 'superadmin'
    is_seeker: boolean
    is_landlord: boolean
    active_view: ActiveView
    onboarded: boolean
    full_name: string | null
    phone: string | null
}

interface UseProfileReturn {
    profile: Profile | null
    loading: boolean
    /** Saves active_view to DB and updates local state */
    setActiveView: (view: ActiveView) => Promise<void>
    /** Marks onboarding complete and sets initial is_seeker / is_landlord / full_name */
    completeOnboarding: (opts: { is_seeker: boolean; is_landlord: boolean; active_view: ActiveView; full_name: string }) => Promise<void>
}

/**
 * Fetches the current user's full profile from the `profiles` table.
 *
 * Usage:
 *   const { profile, loading, setActiveView } = useProfile()
 */
export function useProfile(): UseProfileReturn {
    const { user } = useAuth()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setProfile(null)
            setLoading(false)
            return
        }

        supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
            .then(({ data }) => {
                setProfile(data as Profile ?? null)
                setLoading(false)
            })
    }, [user])

    async function setActiveView(view: ActiveView) {
        if (!user) return
        setProfile(prev => prev ? { ...prev, active_view: view } : prev)
        await supabase.from('profiles').update({ active_view: view }).eq('user_id', user.id)
    }

    async function completeOnboarding(opts: { is_seeker: boolean; is_landlord: boolean; active_view: ActiveView; full_name: string }) {
        if (!user) return
        const updates = { ...opts, onboarded: true }
        setProfile(prev => prev ? { ...prev, ...updates } : prev)
        await supabase.from('profiles').update(updates).eq('user_id', user.id)
    }

    return { profile, loading, setActiveView, completeOnboarding }
}

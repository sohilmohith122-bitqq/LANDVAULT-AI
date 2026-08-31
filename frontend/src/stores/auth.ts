import { create } from 'zustand'
import { authApi } from '@/lib/api'
import type { User, RoleCode } from '@/types'

/** Session state persisted to localStorage; tokens authenticate against the FastAPI backend. */
const STORAGE_KEY = 'landvault:session'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: () => boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

function loadSession(): { user: User | null; token: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore corrupt session */
  }
  return { user: null, token: null }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadSession(),

  isAuthenticated: () => Boolean(get().token),

  login: async (username: string, password: string) => {
    const { user, token } = await authApi.login(username, password)
    set({ user, token })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
  },

  logout: () => {
    const { token } = get()
    // Best-effort server-side revocation BEFORE clearing the stored session
    // (the request reads the bearer token from localStorage). Never blocks UI.
    if (token) void authApi.logout().catch(() => undefined)
    set({ user: null, token: null })
    localStorage.removeItem(STORAGE_KEY)
  },
}))

/** Role-based capability helpers (frontend visibility only — backend enforces real authz) */
export const PERMISSIONS = {
  ADMIN: ['upload', 'edit', 'verify', 'resolve', 'users', 'settings', 'audit', 'export'],
  OFFICER: ['upload', 'edit', 'verify', 'resolve', 'export'],
  VERIFIER: ['edit', 'verify', 'resolve'],
  VIEWER: [],
} satisfies Record<RoleCode, readonly string[]>

export type Permission = (typeof PERMISSIONS)[RoleCode][number]

export function can(user: User | null, permission: Permission): boolean {
  if (!user) return false
  const allowed = PERMISSIONS[user.role] as readonly string[]
  return allowed.includes(permission)
}
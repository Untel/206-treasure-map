export type PlayerSession = {
  playerId: string
  name: string
  server: string
  level: number
  avatar: string
}

const SESSION_KEY = 'treasure-map-session'

const API_BASE = 'https://topheroes.store.kopglobal.com/api/v2/store/player-info'
const PROJECT_ID = '1028637'
const SITE_ID = '1028526'

export async function fetchPlayerInfo(playerId: string): Promise<PlayerSession> {
  const url = `${API_BASE}?project_id=${PROJECT_ID}&player_id=${encodeURIComponent(playerId)}&site_id=${SITE_ID}`

  const response = await fetch(url, {
    headers: {
      accept: 'application/json, text/plain, */*',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }

  const json = await response.json()

  if (json.code !== 1 || !json.data?.user) {
    throw new Error('Player not found')
  }

  const user = json.data.user
  return {
    playerId: String(user.id),
    name: user.name ?? '',
    server: user.server ?? '',
    level: Number(user.level ?? 0),
    avatar: user.avatar ?? '',
  }
}

export function saveSession(session: PlayerSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): PlayerSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlayerSession
  } catch {
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

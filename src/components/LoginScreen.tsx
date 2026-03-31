import { useState } from 'react'
import { fetchPlayerInfo, saveSession, type PlayerSession } from '../lib/auth'
import { LOCALE_FLAGS, LOCALES, t, type Locale } from '../lib/i18n'

type LoginScreenProps = {
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onLogin: (session: PlayerSession) => void
}

export function LoginScreen({ locale, onLocaleChange, onLogin }: LoginScreenProps) {
  const [playerId, setPlayerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = playerId.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      const session = await fetchPlayerInfo(trimmed)
      saveSession(session)
      onLogin(session)
    } catch {
      setError(t(locale, 'loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-backdrop">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{t(locale, 'loginTitle')}</h1>
          <p className="login-subtitle">{t(locale, 'loginSubtitle')}</p>
          <p className="login-explain">{t(locale, 'loginExplain')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="login-input"
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder={t(locale, 'loginPlaceholder')}
            autoFocus
            disabled={loading}
          />
          <button className="login-button" type="submit" disabled={loading || !playerId.trim()}>
            {loading ? t(locale, 'loginConnecting') : t(locale, 'loginConnect')}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}

        <div className="login-locale">
          <select
            className="locale-select"
            value={locale}
            onChange={(e) => onLocaleChange(e.target.value as Locale)}
          >
            {LOCALES.map((option) => (
              <option key={option} value={option}>
                {LOCALE_FLAGS[option]} {option.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

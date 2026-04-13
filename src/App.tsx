import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapCanvas } from './components/MapCanvas'
import { LoginScreen } from './components/LoginScreen'
import { loadSession, clearSession, type PlayerSession } from './lib/auth'
import { detectLatestPeriod, getCollectionName, resolveServer, savePosition, softDeletePosition, subscribeToPositions } from './lib/firebase'
import { availableItems, itemImageUrl, itemLabel } from './lib/items'
import { LOCALE_FLAGS, LOCALES, t, type Locale } from './lib/i18n'
import {
  clampXCoordinate,
  clampYCoordinate,
  coveragePercentage,
  getPromisingAreas,
  isPlacementValid,
  suggestNextZone,
} from './lib/map'
import { MAP_HEIGHT, MAP_WIDTH, type PositionDraft, type PositionRecord } from './types/map'

const THEMES = ['s1', 's2', 's3', 's4'] as const

const initialPoint = { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) }

function App() {
  const [session, setSession] = useState<PlayerSession | null>(loadSession)
  const [locale, setLocale] = useState<Locale>('en')

  if (!session) {
    return (
      <LoginScreen
        locale={locale}
        onLocaleChange={setLocale}
        onLogin={setSession}
      />
    )
  }

  return (
    <MapApp
      session={session}
      locale={locale}
      onLocaleChange={setLocale}
      onLogout={() => {
        clearSession()
        setSession(null)
      }}
    />
  )
}

type MapAppProps = {
  session: PlayerSession
  locale: Locale
  onLocaleChange: (locale: Locale) => void
  onLogout: () => void
}

function MapApp({ session, locale, onLocaleChange, onLogout }: MapAppProps) {
  const [positions, setPositions] = useState<PositionRecord[]>([])
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [selectedPoint, setSelectedPoint] = useState(initialPoint)
  const [xInput, setXInput] = useState(String(initialPoint.x))
  const [yInput, setYInput] = useState(String(initialPoint.y))
  const [status, setStatus] = useState<'found' | 'scrap' | 'nothing'>('nothing')
  const [item, setItem] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<(typeof THEMES)[number]>('s1')
  const MAX_PERIODS = 4

  const [period, setPeriodRaw] = useState<number>(() => {
    const saved = localStorage.getItem('map-selected-period')
    const n = saved ? Number(saved) : 0
    return n >= 1 && n <= MAX_PERIODS ? n : 0
  })

  const setPeriod = useCallback((p: number) => {
    setPeriodRaw(p)
    if (p >= 1) localStorage.setItem('map-selected-period', String(p))
  }, [])

  // If no saved preference, detect the latest period
  useEffect(() => {
    if (period >= 1) return
    let cancelled = false
    detectLatestPeriod(theme, session.server).then((latest) => {
      if (!cancelled) setPeriod(latest)
    })
    return () => { cancelled = true }
  }, [theme, session.server, period, setPeriod])

  const collectionName = useMemo(
    () => period > 0 ? getCollectionName(theme, period, session.server) : '',
    [theme, period, session.server],
  )

  const activePositions = useMemo(
    () => positions.filter((p) => !p.deletedAt),
    [positions],
  )

  useEffect(() => {
    if (!collectionName) return
    setPositions([])
    setSelectedRecordId(null)
    setError('')
    const unsubscribe = subscribeToPositions(collectionName, setPositions, setError)
    return unsubscribe
  }, [collectionName])

  const suggestion = useMemo(() => suggestNextZone(activePositions), [activePositions])
  const promisingAreas = useMemo(() => getPromisingAreas(activePositions), [activePositions])
  const coverage = useMemo(() => coveragePercentage(activePositions), [activePositions])
  const foundItems = useMemo(
    () => activePositions.filter((p) => p.status === 'found').map((p) => p.item),
    [activePositions],
  )
  const itemOptions = useMemo(() => availableItems(foundItems, theme, period), [foundItems, theme, period])
  const selectedRecord = useMemo(
    () => activePositions.find((p) => p.id === selectedRecordId) ?? null,
    [activePositions, selectedRecordId],
  )

  useEffect(() => {
    if (status !== 'found') return
    if (!itemOptions.some((o) => o.labels.en === item)) {
      setItem(itemOptions[0]?.labels.en ?? '')
    }
  }, [item, itemOptions, status])

  useEffect(() => {
    setXInput(String(selectedPoint.x))
    setYInput(String(selectedPoint.y))
  }, [selectedPoint.x, selectedPoint.y])

  const candidate: PositionDraft = {
    x: clampXCoordinate(selectedPoint.x),
    y: clampYCoordinate(selectedPoint.y),
    status,
    item: status === 'found' ? item || null : null,
    nickname: session.name,
    playerId: session.playerId,
    note: note.trim(),
  }

  const candidateIsValid = isPlacementValid(candidate, activePositions)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const clampedPoint = {
      x: clampXCoordinate(selectedPoint.x),
      y: clampYCoordinate(selectedPoint.y),
    }
    setSelectedPoint(clampedPoint)

    try {
      setIsSaving(true)
      setError('')
      await savePosition(collectionName, {
        ...candidate,
        x: clampedPoint.x,
        y: clampedPoint.y,
      })
      setNote('')
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'Unable to save the position.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(positionId: string) {
    try {
      setError('')
      await softDeletePosition(collectionName, positionId, session.playerId)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Unable to delete the position.',
      )
    }
  }

  return (
    <main className="app-shell">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <h1 className="header-title">{t(locale, 'appTitle')}</h1>
          <span className="header-tagline">{t(locale, 'appTagline')}</span>
        </div>
        <div className="header-right">
          <span className="player-badge">
            {session.name} <span className="player-level">Lv.{session.level}</span>
          </span>
          <button className="ghost-button" type="button" onClick={onLogout}>
            {t(locale, 'logout')}
          </button>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label">
            {t(locale, 'theme')}
            <select value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}>
              {THEMES.map((th) => (
                <option key={th} value={th}>{th.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <label className="toolbar-label">
            {t(locale, 'period')}
            <select value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
              {Array.from({ length: MAX_PERIODS }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <span className="server-badge">{resolveServer(session.server)}</span>
        </div>

        <div className="toolbar-group">
          <div className="stat-pill">
            <span>{t(locale, 'recordedZones')}</span>
            <strong>{activePositions.length}</strong>
          </div>
          <div className="stat-pill">
            <span>{t(locale, 'coveredArea')}</span>
            <strong>{coverage.toFixed(1)}%</strong>
          </div>
          <label className="toolbar-label">
            {t(locale, 'locale')}
            <select value={locale} onChange={(e) => onLocaleChange(e.target.value as Locale)}>
              {LOCALES.map((option) => (
                <option key={option} value={option}>{LOCALE_FLAGS[option]} {option.toUpperCase()}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* ── Tutorial ── */}
      <div className="tutorial-bar">
        <span className="tutorial-icon">!</span>
        <span>{t(locale, 'tutorialWarning')}</span>
      </div>

      {/* ── Workspace ── */}
      <section className="workspace">
        <div className="map-panel">
          <div className="panel-header">
            <div>
              <h2>{t(locale, 'canvasMap')}</h2>
              <p>{t(locale, 'clickHint')}</p>
            </div>
            {suggestion ? (
              <button
                className="suggestion-button"
                type="button"
                onClick={() => setSelectedPoint({ x: suggestion.x, y: suggestion.y })}
              >
                {t(locale, 'jumpToSuggestion')} ({suggestion.x}, {suggestion.y})
              </button>
            ) : null}
          </div>

          <MapCanvas
            locale={locale}
            positions={activePositions}
            suggestion={suggestion}
            promisingAreas={promisingAreas}
            selectedPoint={candidate}
            selectedRecordId={selectedRecordId}
            onSelectPoint={setSelectedPoint}
            onSelectRecord={(record) => setSelectedRecordId(record?.id ?? null)}
          />

          <div className="legend">
            <span className="legend-item">
              <i className="swatch swatch-found" />
              {t(locale, 'foundObject')}
            </span>
            <span className="legend-item">
              <i className="swatch swatch-scrap" />
              {t(locale, 'scrap')}
            </span>
            <span className="legend-item">
              <i className="swatch swatch-empty" />
              {t(locale, 'nothingFound')}
            </span>
            <span className="legend-item">
              <i className="swatch swatch-suggested" />
              {t(locale, 'suggestedZone')}
            </span>
          </div>
        </div>

        <aside className="side-panel">
          {/* ── Register ── */}
          <section className="card">
            <div className="panel-header">
              <div>
                <h2>{t(locale, 'registerPosition')}</h2>
                <p>{t(locale, 'registerHint')}</p>
              </div>
            </div>

            <form className="entry-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  {t(locale, 'xPosition')}
                  <input
                    type="number"
                    min={0}
                    max={MAP_WIDTH}
                    step={1}
                    value={xInput}
                    onChange={(e) => {
                      setXInput(e.target.value)
                      if (e.target.value === '') return
                      const next = Number(e.target.value)
                      if (Number.isFinite(next)) {
                        setSelectedPoint((c) => ({ ...c, x: next }))
                      }
                    }}
                    onBlur={() => {
                      const next = clampXCoordinate(xInput === '' ? selectedPoint.x : Number(xInput))
                      setSelectedPoint((c) => ({ ...c, x: next }))
                      setXInput(String(next))
                    }}
                  />
                </label>
                <label>
                  {t(locale, 'yPosition')}
                  <input
                    type="number"
                    min={0}
                    max={MAP_HEIGHT}
                    step={1}
                    value={yInput}
                    onChange={(e) => {
                      setYInput(e.target.value)
                      if (e.target.value === '') return
                      const next = Number(e.target.value)
                      if (Number.isFinite(next)) {
                        setSelectedPoint((c) => ({ ...c, y: next }))
                      }
                    }}
                    onBlur={() => {
                      const next = clampYCoordinate(yInput === '' ? selectedPoint.y : Number(yInput))
                      setSelectedPoint((c) => ({ ...c, y: next }))
                      setYInput(String(next))
                    }}
                  />
                </label>
              </div>

              <label>
                {t(locale, 'result')}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'found' | 'scrap' | 'nothing')}
                >
                  <option value="found">{t(locale, 'foundObject')}</option>
                  <option value="scrap">{t(locale, 'scrap')}</option>
                  <option value="nothing">{t(locale, 'nothingFound')}</option>
                </select>
              </label>

              {status === 'found' ? (
                <label>
                  {t(locale, 'item')}
                  <div className={`item-picker ${itemOptions.length === 0 ? 'is-disabled' : ''}`}>
                    {itemOptions.map((option) => {
                      const selected = item === option.labels.en
                      return (
                        <button
                          key={option.id}
                          className={`item-card ${selected ? 'is-selected' : ''}`}
                          type="button"
                          onClick={() => setItem(option.labels.en)}
                          disabled={itemOptions.length === 0}
                        >
                          <img
                            className="item-card-img"
                            src={itemImageUrl(option.id)}
                            alt={option.labels[locale]}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                          <span className="item-card-label">{option.labels[locale]}</span>
                        </button>
                      )
                    })}
                  </div>
                </label>
              ) : null}

              <label>
                {t(locale, 'note')}
                <textarea
                  rows={2}
                  placeholder={t(locale, 'notePlaceholder')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={isSaving || (status === 'found' && itemOptions.length === 0)}
              >
                {isSaving ? t(locale, 'saving') : t(locale, 'savePosition')}
              </button>
            </form>

            {!candidateIsValid ? (
              <p className="warning-text">{t(locale, 'overlapHint')}</p>
            ) : null}
            {status === 'found' && itemOptions.length === 0 ? (
              <p className="info-text">{t(locale, 'allFound')}</p>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
          </section>

          {/* ── Selected Point ── */}
          <section className="card">
            <div className="panel-header">
              <div>
                <h2>{t(locale, 'selectedPoint')}</h2>
              </div>
            </div>

            {selectedRecord ? (
              <div className="suggestion-box selected-record">
                <strong>
                  {selectedRecord.item
                    ? itemLabel(selectedRecord.item, locale)
                    : selectedRecord.status === 'scrap'
                      ? t(locale, 'scrap')
                      : t(locale, 'nothingFound')}
                </strong>
                <span>
                  {selectedRecord.x}, {selectedRecord.y}
                </span>
                {selectedRecord.nickname ? (
                  <span className="record-meta">
                    {t(locale, 'recordedBy')}: {selectedRecord.nickname}
                  </span>
                ) : null}
                {selectedRecord.note ? <span className="record-note">{selectedRecord.note}</span> : null}
                {selectedRecord.playerId === session.playerId && (
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => handleDelete(selectedRecord.id)}
                  >
                    {t(locale, 'deletePosition')}
                  </button>
                )}
              </div>
            ) : (
              <p className="info-text">{t(locale, 'selectedPointHint')}</p>
            )}
          </section>

          {/* ── History ── */}
          <section className="card history-card">
            <div className="panel-header">
              <div>
                <h2>{t(locale, 'latestPositions')}</h2>
              </div>
            </div>

            <div className="history-list">
              {activePositions.length === 0 ? (
                <p className="info-text">{t(locale, 'noPositions')}</p>
              ) : (
                activePositions.map((position) => (
                  <article
                    className={`history-item ${selectedRecordId === position.id ? 'is-selected' : ''}`}
                    key={position.id}
                    onClick={() => {
                      setSelectedRecordId(position.id)
                      setSelectedPoint({ x: position.x, y: position.y })
                    }}
                  >
                    <div className="history-content">
                      <strong>
                        {position.item
                          ? itemLabel(position.item, locale)
                          : position.status === 'scrap'
                            ? t(locale, 'scrap')
                            : t(locale, 'nothingFound')}
                      </strong>
                      {position.nickname ? (
                        <p className="history-meta">{position.nickname}</p>
                      ) : null}
                      <p className="history-coords">
                        {position.x}, {position.y}
                      </p>
                    </div>
                    <div className="history-actions">
                      <span className={`pill ${position.status}`}>
                        {position.status === 'found'
                          ? t(locale, 'found')
                          : position.status === 'scrap'
                            ? t(locale, 'scrap')
                            : t(locale, 'nothingFound')}
                      </span>
                      {position.playerId === session.playerId && (
                        <button
                          className="delete-icon-button"
                          type="button"
                          title={t(locale, 'deletePosition')}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(position.id)
                          }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

export default App

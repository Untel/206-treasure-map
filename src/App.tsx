import { useEffect, useMemo, useState } from 'react'
import { MapCanvas } from './components/MapCanvas'
import { isFirebaseReady, savePosition, subscribeToPositions } from './lib/firebase'
import { availableItems, itemLabel } from './lib/items'
import { LOCALES, t, type Locale } from './lib/i18n'
import {
  clampXCoordinate,
  clampYCoordinate,
  coveragePercentage,
  isPlacementValid,
  suggestNextZone,
} from './lib/map'
import { MAP_HEIGHT, MAP_WIDTH, type PositionDraft, type PositionRecord } from './types/map'

const initialPoint = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 }

function App() {
  const [positions, setPositions] = useState<PositionRecord[]>([])
  const [selectedPoint, setSelectedPoint] = useState(initialPoint)
  const [xInput, setXInput] = useState(String(initialPoint.x))
  const [yInput, setYInput] = useState(String(initialPoint.y))
  const [locale, setLocale] = useState<Locale>('en')
  const [status, setStatus] = useState<'found' | 'scrap' | 'nothing'>('found')
  const [item, setItem] = useState('')
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToPositions(setPositions, setError)
    return unsubscribe
  }, [])

  const suggestion = useMemo(() => suggestNextZone(positions), [positions])
  const coverage = useMemo(() => coveragePercentage(positions), [positions])
  const foundItems = useMemo(
    () => positions.filter((position) => position.status === 'found').map((position) => position.item),
    [positions],
  )
  const itemOptions = useMemo(() => availableItems(foundItems), [foundItems])

  useEffect(() => {
    if (status !== 'found') {
      return
    }

    if (!itemOptions.some((option) => option.labels.en === item)) {
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
    note: note.trim(),
  }

  const candidateIsValid = isPlacementValid(candidate, positions)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSelectedPoint({
      x: clampXCoordinate(selectedPoint.x),
      y: clampYCoordinate(selectedPoint.y),
    })
    if (!candidateIsValid) {
      setError(t(locale, 'overlapError'))
      return
    }

    try {
      setIsSaving(true)
      setError('')
      await savePosition(candidate)
      setNote('')
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'Unable to save the position.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell">
      <section className="tutorial-panel">
        <div className="tutorial-mark">?</div>
        <div>
          <p className="eyebrow">{t(locale, 'tutorialTitle')}</p>
          <p className="tutorial-copy">{t(locale, 'tutorialStep')}</p>
        </div>
        <div className="history-demo">
          <span className="history-icon">?</span>
          <span>{t(locale, 'tutorialWarning')}</span>
        </div>
      </section>

      <section className="hero-panel">
        <div>
          <p className="eyebrow">{t(locale, 'appTagline')}</p>
          <h1>{t(locale, 'appTitle')}</h1>
          <p className="hero-copy">{t(locale, 'appCopy')}</p>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <span>{t(locale, 'recordedZones')}</span>
            <strong>{positions.length}</strong>
          </article>
          <article className="summary-card">
            <span>{t(locale, 'coveredArea')}</span>
            <strong>{coverage.toFixed(2)}%</strong>
          </article>
          <article className="summary-card">
            <span>{t(locale, 'firebase')}</span>
            <strong>{isFirebaseReady() ? t(locale, 'live') : t(locale, 'localFallback')}</strong>
          </article>
          <article className="summary-card">
            <span>{t(locale, 'locale')}</span>
            <select
              className="locale-select"
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              {LOCALES.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </article>
        </div>
      </section>

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
                {t(locale, 'jumpToSuggestion')} {suggestion.x}, {suggestion.y}
              </button>
            ) : null}
          </div>

          <MapCanvas
            locale={locale}
            positions={positions}
            suggestion={suggestion}
            selectedPoint={candidate}
            onSelectPoint={setSelectedPoint}
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
          <section className="card">
            <div className="panel-header">
              <div>
                <h2>{t(locale, 'registerPosition')}</h2>
                <p>{t(locale, 'registerHint')}</p>
              </div>
            </div>

            <form className="entry-form" onSubmit={handleSubmit}>
              <label>
                {t(locale, 'xPosition')}
                <input
                  type="number"
                  min={0}
                  max={MAP_WIDTH}
                  step={1}
                  value={xInput}
                  onChange={(event) => {
                    setXInput(event.target.value)
                    if (event.target.value === '') {
                      return
                    }

                    const next = Number(event.target.value)
                    if (Number.isFinite(next)) {
                      setSelectedPoint((current) => ({
                        ...current,
                        x: next,
                      }))
                    }
                  }}
                  onBlur={() => {
                    const next = clampXCoordinate(xInput === '' ? selectedPoint.x : Number(xInput))
                    setSelectedPoint((current) => ({
                      ...current,
                      x: next,
                    }))
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
                  onChange={(event) => {
                    setYInput(event.target.value)
                    if (event.target.value === '') {
                      return
                    }

                    const next = Number(event.target.value)
                    if (Number.isFinite(next)) {
                      setSelectedPoint((current) => ({
                        ...current,
                        y: next,
                      }))
                    }
                  }}
                  onBlur={() => {
                    const next = clampYCoordinate(yInput === '' ? selectedPoint.y : Number(yInput))
                    setSelectedPoint((current) => ({
                      ...current,
                      y: next,
                    }))
                    setYInput(String(next))
                  }}
                />
              </label>

              <label>
                {t(locale, 'result')}
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as 'found' | 'scrap' | 'nothing')}
                >
                  <option value="found">{t(locale, 'foundObject')}</option>
                  <option value="scrap">{t(locale, 'scrap')}</option>
                  <option value="nothing">{t(locale, 'nothingFound')}</option>
                </select>
              </label>

              <label>
                {t(locale, 'item')}
                <div
                  className={`item-picker ${status !== 'found' || itemOptions.length === 0 ? 'is-disabled' : ''}`}
                >
                  {itemOptions.map((option) => {
                    const selected = item === option.labels.en
                    return (
                      <button
                        key={option.id}
                        className={`item-card ${selected ? 'is-selected' : ''}`}
                        type="button"
                        onClick={() => setItem(option.labels.en)}
                        disabled={status !== 'found' || itemOptions.length === 0}
                      >
                        <span className="item-card-label">{option.labels[locale]}</span>
                      </button>
                    )
                  })}
                </div>
              </label>

              <label>
                {t(locale, 'note')}
                <textarea
                  rows={3}
                  placeholder={t(locale, 'notePlaceholder')}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>

              <button
                className="primary-button"
                type="submit"
                disabled={isSaving || !candidateIsValid || (status === 'found' && itemOptions.length === 0)}
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
            {!isFirebaseReady() ? (
              <p className="info-text">{t(locale, 'firebaseHint')}</p>
            ) : null}
          </section>

          <section className="card">
            <div className="panel-header">
              <div>
                <h2>{t(locale, 'nextSuggestion')}</h2>
                <p>{t(locale, 'nextSuggestionHint')}</p>
              </div>
            </div>

            {suggestion ? (
              <div className="suggestion-box">
                <strong>
                  ({suggestion.x}, {suggestion.y})
                </strong>
                <span>
                  {t(locale, 'clearanceScore')}: {suggestion.clearance.toFixed(1)}
                </span>
              </div>
            ) : (
              <p className="info-text">{t(locale, 'noValidSquare')}</p>
            )}
          </section>

          <section className="card history-card">
            <div className="panel-header">
              <div>
                <h2>{t(locale, 'latestPositions')}</h2>
                <p>{t(locale, 'latestPositionsHint')}</p>
              </div>
            </div>

            <div className="history-list">
              {positions.length === 0 ? (
                <p className="info-text">{t(locale, 'noPositions')}</p>
              ) : (
                positions.map((position) => (
                  <article className="history-item" key={position.id}>
                    <div>
                      <strong>
                        {position.item
                          ? itemLabel(position.item, locale)
                          : position.status === 'scrap'
                            ? t(locale, 'scrap')
                            : t(locale, 'nothingFound')}
                      </strong>
                      <p>
                        {position.x}, {position.y}
                      </p>
                    </div>
                    <span className={`pill ${position.status}`}>
                      {position.status === 'found'
                        ? t(locale, 'found')
                        : position.status === 'scrap'
                          ? t(locale, 'scrap')
                          : t(locale, 'nothingFound')}
                    </span>
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

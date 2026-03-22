import { useEffect, useMemo, useState } from 'react'
import { MapCanvas } from './components/MapCanvas'
import { isFirebaseReady, savePosition, subscribeToPositions } from './lib/firebase'
import { ITEM_OPTIONS } from './lib/items'
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
  const [status, setStatus] = useState<'found' | 'empty'>('found')
  const [item, setItem] = useState(ITEM_OPTIONS[0])
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToPositions(setPositions, setError)
    return unsubscribe
  }, [])

  const suggestion = useMemo(() => suggestNextZone(positions), [positions])
  const coverage = useMemo(() => coveragePercentage(positions), [positions])

  const candidate: PositionDraft = {
    x: Math.round(clampXCoordinate(selectedPoint.x) * 10) / 10,
    y: Math.round(clampYCoordinate(selectedPoint.y) * 10) / 10,
    status,
    item: status === 'found' ? item : null,
    note: note.trim(),
  }

  const candidateIsValid = isPlacementValid(candidate, positions)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!candidateIsValid) {
      setError('This 25x25 zone overlaps an existing position. Pick another point.')
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
      <section className="hero-panel">
        <div>
          <p className="eyebrow">509 x 1021 research board</p>
          <h1>Map coverage tracker</h1>
          <p className="hero-copy">
            Register found objects and empty runs, block the 25x25 zone around each record, and
            let the app propose the next high-value search square.
          </p>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <span>Recorded zones</span>
            <strong>{positions.length}</strong>
          </article>
          <article className="summary-card">
            <span>Covered area</span>
            <strong>{coverage.toFixed(2)}%</strong>
          </article>
          <article className="summary-card">
            <span>Firebase</span>
            <strong>{isFirebaseReady() ? 'Live' : 'Local fallback'}</strong>
          </article>
        </div>
      </section>

      <section className="workspace">
        <div className="map-panel">
          <div className="panel-header">
            <div>
              <h2>Canvas map</h2>
              <p>Click anywhere to position the next 25x25 research square.</p>
            </div>
            {suggestion ? (
              <button
                className="suggestion-button"
                type="button"
                onClick={() => setSelectedPoint({ x: suggestion.x, y: suggestion.y })}
              >
                Jump to suggested zone {suggestion.x}, {suggestion.y}
              </button>
            ) : null}
          </div>

          <MapCanvas
            positions={positions}
            suggestion={suggestion}
            selectedPoint={candidate}
            onSelectPoint={setSelectedPoint}
          />

          <div className="legend">
            <span className="legend-item">
              <i className="swatch swatch-found" />
              Found object
            </span>
            <span className="legend-item">
              <i className="swatch swatch-empty" />
              Scrap
            </span>
            <span className="legend-item">
              <i className="swatch swatch-suggested" />
              Suggested next zone
            </span>
          </div>
        </div>

        <aside className="side-panel">
          <section className="card">
            <div className="panel-header">
              <div>
                <h2>Register a position</h2>
                <p>Coordinates are the center of the blocked 25x25 square.</p>
              </div>
            </div>

            <form className="entry-form" onSubmit={handleSubmit}>
              <label>
                X position
                <input
                  type="number"
                  min={0}
                  max={MAP_WIDTH}
                  step={0.5}
                  value={candidate.x}
                  onChange={(event) =>
                    setSelectedPoint((current) => ({
                      ...current,
                      x: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                Y position
                <input
                  type="number"
                  min={0}
                  max={MAP_HEIGHT}
                  step={0.5}
                  value={candidate.y}
                  onChange={(event) =>
                    setSelectedPoint((current) => ({
                      ...current,
                      y: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                Result
                <select value={status} onChange={(event) => setStatus(event.target.value as 'found' | 'empty')}>
                  <option value="found">Found object</option>
                  <option value="empty">Nothing found</option>
                </select>
              </label>

              <label>
                Item
                <select
                  value={item}
                  onChange={(event) => setItem(event.target.value)}
                  disabled={status === 'empty'}
                >
                  {ITEM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Note
                <textarea
                  rows={3}
                  placeholder="Optional context"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>

              <button className="primary-button" type="submit" disabled={isSaving || !candidateIsValid}>
                {isSaving ? 'Saving...' : 'Save position'}
              </button>
            </form>

            {!candidateIsValid ? (
              <p className="warning-text">
                This square overlaps an existing blocked area. Move at least 25 units away on both
                axes.
              </p>
            ) : null}
            {error ? <p className="error-text">{error}</p> : null}
            {!isFirebaseReady() ? (
              <p className="info-text">
                Add your Firebase keys to <code>.env.local</code> to switch from local browser
                storage to live Firestore sync.
              </p>
            ) : null}
          </section>

          <section className="card">
            <div className="panel-header">
              <div>
                <h2>Next suggestion</h2>
                <p>The search scans the map for a valid 25x25 square with the best clearance.</p>
              </div>
            </div>

            {suggestion ? (
              <div className="suggestion-box">
                <strong>
                  ({suggestion.x}, {suggestion.y})
                </strong>
                <span>Clearance score: {suggestion.clearance.toFixed(1)}</span>
              </div>
            ) : (
              <p className="info-text">No valid 25x25 square remains.</p>
            )}
          </section>

          <section className="card history-card">
            <div className="panel-header">
              <div>
                <h2>Latest positions</h2>
                <p>Recent found objects and empty checks from Firestore.</p>
              </div>
            </div>

            <div className="history-list">
              {positions.length === 0 ? (
                <p className="info-text">No positions saved yet.</p>
              ) : (
                positions.map((position) => (
                  <article className="history-item" key={position.id}>
                    <div>
                      <strong>{position.item ?? 'Scrap'}</strong>
                      <p>
                        {position.x}, {position.y}
                      </p>
                    </div>
                    <span className={position.status === 'found' ? 'pill found' : 'pill empty'}>
                      {position.status === 'found' ? 'Found' : 'Scrap'}
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

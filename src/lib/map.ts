import {
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_RADIUS,
  ZONE_SIZE,
  type PromisingArea,
  type PositionRecord,
  type SuggestedZone,
} from '../types/map'

const SUGGESTION_STEP = 10
const TOP_SUGGESTION_COUNT = 5
const MIN_X = 0
const MAX_X = MAP_WIDTH - 1
const MIN_Y = 0
const MAX_Y = MAP_HEIGHT - 1

export function clampXCoordinate(value: number) {
  return Math.min(MAX_X, Math.max(MIN_X, Math.round(value)))
}

export function clampYCoordinate(value: number) {
  return Math.min(MAX_Y, Math.max(MIN_Y, Math.round(value)))
}

export function zoneBounds(x: number, y: number) {
  return {
    left: x - ZONE_RADIUS,
    right: x + ZONE_RADIUS + 1,
    top: y - ZONE_RADIUS,
    bottom: y + ZONE_RADIUS + 1,
  }
}

export function zonesOverlap(
  first: Pick<PositionRecord, 'x' | 'y'>,
  second: Pick<PositionRecord, 'x' | 'y'>,
) {
  return Math.abs(first.x - second.x) < ZONE_SIZE && Math.abs(first.y - second.y) < ZONE_SIZE
}

export function isPlacementValid(
  candidate: Pick<PositionRecord, 'x' | 'y'>,
  positions: Array<Pick<PositionRecord, 'x' | 'y'>>,
) {
  if (candidate.x < MIN_X || candidate.x > MAX_X || candidate.y < MIN_Y || candidate.y > MAX_Y) {
    return false
  }

  return positions.every((position) => !zonesOverlap(candidate, position))
}

/**
 * Farthest-point sampling: iteratively pick the valid cell whose minimum
 * distance to all occupied + already-picked points is the largest.
 * This naturally spreads suggestions across the biggest gaps on the map.
 */
function farthestPointSuggestions(positions: PositionRecord[]) {
  const cols = Math.floor((MAX_X - MIN_X) / SUGGESTION_STEP) + 1
  const rows = Math.floor((MAX_Y - MIN_Y) / SUGGESTION_STEP) + 1

  // Pre-compute which grid cells are valid placements
  const valid: boolean[] = new Array(rows * cols)
  for (let r = 0; r < rows; r++) {
    const y = MIN_Y + r * SUGGESTION_STEP
    for (let c = 0; c < cols; c++) {
      valid[r * cols + c] = isPlacementValid(
        { x: MIN_X + c * SUGGESTION_STEP, y },
        positions,
      )
    }
  }

  // minDist[i] = min distance from cell i to any occupied or picked point
  // Seed with distance to nearest border so edges don't dominate
  const minDist = new Float32Array(rows * cols)
  for (let r = 0; r < rows; r++) {
    const y = MIN_Y + r * SUGGESTION_STEP
    const borderY = Math.min(y - MIN_Y, MAX_Y - y)
    for (let c = 0; c < cols; c++) {
      const x = MIN_X + c * SUGGESTION_STEP
      const borderX = Math.min(x - MIN_X, MAX_X - x)
      minDist[r * cols + c] = Math.min(borderX, borderY)
    }
  }

  // Update with distances from existing positions
  for (const pos of positions) {
    for (let r = 0; r < rows; r++) {
      const y = MIN_Y + r * SUGGESTION_STEP
      const dy = y - pos.y
      for (let c = 0; c < cols; c++) {
        const x = MIN_X + c * SUGGESTION_STEP
        const dx = x - pos.x
        const d = Math.sqrt(dx * dx + dy * dy)
        const idx = r * cols + c
        if (d < minDist[idx]) minDist[idx] = d
      }
    }
  }

  const picked: SuggestedZone[] = []

  for (let n = 0; n < TOP_SUGGESTION_COUNT; n++) {
    // Find the valid cell with largest minDist
    let bestIdx = -1
    let bestDist = -Infinity
    for (let i = 0; i < rows * cols; i++) {
      if (valid[i] && minDist[i] > bestDist) {
        bestDist = minDist[i]
        bestIdx = i
      }
    }
    if (bestIdx < 0) break

    const r = Math.floor(bestIdx / cols)
    const c = bestIdx % cols
    const px = MIN_X + c * SUGGESTION_STEP
    const py = MIN_Y + r * SUGGESTION_STEP

    picked.push({ x: px, y: py, score: bestDist, clearance: bestDist, area: 0 })

    // Update minDist with the newly picked point
    for (let ri = 0; ri < rows; ri++) {
      const y = MIN_Y + ri * SUGGESTION_STEP
      const dy = y - py
      for (let ci = 0; ci < cols; ci++) {
        const x = MIN_X + ci * SUGGESTION_STEP
        const dx = x - px
        const d = Math.sqrt(dx * dx + dy * dy)
        const idx = ri * cols + ci
        if (d < minDist[idx]) minDist[idx] = d
      }
    }
  }

  const areas: PromisingArea[] = picked.map((zone, i) => {
    const bounds = zoneBounds(zone.x, zone.y)
    return {
      id: `suggest-${i}`,
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
      area: 0,
    }
  })

  return { best: picked[0] ?? null, areas }
}

export function suggestNextZone(positions: PositionRecord[]): SuggestedZone | null {
  return farthestPointSuggestions(positions).best
}

export function getPromisingAreas(positions: PositionRecord[]): PromisingArea[] {
  return farthestPointSuggestions(positions).areas
}

export function coveragePercentage(positions: PositionRecord[]) {
  const coveredArea = positions.length * ZONE_SIZE * ZONE_SIZE
  return Math.min(100, (coveredArea / (MAP_WIDTH * MAP_HEIGHT)) * 100)
}

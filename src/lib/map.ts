import {
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_RADIUS,
  ZONE_SIZE,
  type PositionRecord,
  type SuggestedZone,
} from '../types/map'

const SUGGESTION_STEP = 5
const MIN_X = ZONE_RADIUS
const MAX_X = MAP_WIDTH - ZONE_RADIUS
const MIN_Y = ZONE_RADIUS
const MAX_Y = MAP_HEIGHT - ZONE_RADIUS
const CENTER_X = MAP_WIDTH / 2
const CENTER_Y = MAP_HEIGHT / 2

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
  const bounds = zoneBounds(candidate.x, candidate.y)
  const inBounds =
    bounds.left >= 0 &&
    bounds.top >= 0 &&
    bounds.right <= MAP_WIDTH &&
    bounds.bottom <= MAP_HEIGHT

  if (!inBounds) {
    return false
  }

  return positions.every((position) => !zonesOverlap(candidate, position))
}

function nearestDistance(
  candidate: Pick<PositionRecord, 'x' | 'y'>,
  positions: Array<Pick<PositionRecord, 'x' | 'y'>>,
) {
  if (positions.length === 0) {
    return Math.hypot(MAP_WIDTH, MAP_HEIGHT)
  }

  return Math.min(
    ...positions.map((position) =>
      Math.hypot(candidate.x - position.x, candidate.y - position.y),
    ),
  )
}

function centerBias(candidate: Pick<PositionRecord, 'x' | 'y'>) {
  return Math.hypot(candidate.x - CENTER_X, candidate.y - CENTER_Y)
}

export function suggestNextZone(positions: PositionRecord[]): SuggestedZone | null {
  let best: SuggestedZone | null = null

  for (
    let y = MIN_Y;
    y <= MAX_Y;
    y += SUGGESTION_STEP
  ) {
    for (
      let x = MIN_X;
      x <= MAX_X;
      x += SUGGESTION_STEP
    ) {
      const candidate = { x, y }
      if (!isPlacementValid(candidate, positions)) {
        continue
      }

      const clearance = nearestDistance(candidate, positions)
      const score = 625 + clearance * 0.1 - centerBias(candidate) * 0.01

      if (
        !best ||
        score > best.score ||
        (score === best.score && clearance > best.clearance)
      ) {
        best = { x, y, score, clearance }
      }
    }
  }

  return best
}

export function coveragePercentage(positions: PositionRecord[]) {
  const coveredArea = positions.length * ZONE_SIZE * ZONE_SIZE
  return Math.min(100, (coveredArea / (MAP_WIDTH * MAP_HEIGHT)) * 100)
}

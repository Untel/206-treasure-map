import {
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_RADIUS,
  ZONE_SIZE,
  type PositionRecord,
  type SuggestedZone,
} from '../types/map'

const SUGGESTION_STEP = 5
const TOP_SUGGESTION_COUNT = 5
const SUGGESTION_SEPARATION_DISTANCE = ZONE_SIZE * 2
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

function nearestPositionDistance(
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

function borderDistance(candidate: Pick<PositionRecord, 'x' | 'y'>) {
  const bounds = zoneBounds(candidate.x, candidate.y)

  return Math.min(
    bounds.left,
    bounds.top,
    MAP_WIDTH - bounds.right,
    MAP_HEIGHT - bounds.bottom,
  )
}

function nearestConstraintDistance(
  candidate: Pick<PositionRecord, 'x' | 'y'>,
  positions: Array<Pick<PositionRecord, 'x' | 'y'>>,
) {
  return Math.min(nearestPositionDistance(candidate, positions), borderDistance(candidate))
}

function candidateDistance(
  first: Pick<PositionRecord, 'x' | 'y'>,
  second: Pick<PositionRecord, 'x' | 'y'>,
) {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

function centerBias(candidate: Pick<PositionRecord, 'x' | 'y'>) {
  return Math.hypot(candidate.x - CENTER_X, candidate.y - CENTER_Y)
}

export function suggestNextZone(positions: PositionRecord[]): SuggestedZone | null {
  const columns = Math.floor((MAX_X - MIN_X) / SUGGESTION_STEP) + 1
  const rows = Math.floor((MAX_Y - MIN_Y) / SUGGESTION_STEP) + 1
  const validCells: boolean[][] = Array.from({ length: rows }, () => Array<boolean>(columns).fill(false))

  for (let row = 0; row < rows; row += 1) {
    const y = MIN_Y + row * SUGGESTION_STEP
    for (let column = 0; column < columns; column += 1) {
      const x = MIN_X + column * SUGGESTION_STEP
      validCells[row][column] = isPlacementValid({ x, y }, positions)
    }
  }

  const visited: boolean[][] = Array.from({ length: rows }, () => Array<boolean>(columns).fill(false))
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const
  const candidates: SuggestedZone[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (!validCells[row][column] || visited[row][column]) {
        continue
      }

      const queue: Array<[number, number]> = [[row, column]]
      const component: Array<[number, number]> = []
      visited[row][column] = true

      while (queue.length > 0) {
        const current = queue.shift()!
        component.push(current)

        for (const [rowOffset, columnOffset] of directions) {
          const nextRow = current[0] + rowOffset
          const nextColumn = current[1] + columnOffset

          if (
            nextRow < 0 ||
            nextRow >= rows ||
            nextColumn < 0 ||
            nextColumn >= columns ||
            visited[nextRow][nextColumn] ||
            !validCells[nextRow][nextColumn]
          ) {
            continue
          }

          visited[nextRow][nextColumn] = true
          queue.push([nextRow, nextColumn])
        }
      }

      const componentArea = component.length * SUGGESTION_STEP * SUGGESTION_STEP

      for (const [componentRow, componentColumn] of component) {
        const candidate = {
          x: MIN_X + componentColumn * SUGGESTION_STEP,
          y: MIN_Y + componentRow * SUGGESTION_STEP,
        }
        const clearance = nearestConstraintDistance(candidate, positions)
        const score = componentArea + clearance * 2 - centerBias(candidate) * 0.03

        candidates.push({ ...candidate, score, clearance, area: componentArea })
      }
    }
  }

  if (candidates.length === 0) {
    return null
  }

  candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score
    }

    if (right.area !== left.area) {
      return right.area - left.area
    }

    return right.clearance - left.clearance
  })

  const topZones: SuggestedZone[] = []

  for (const candidate of candidates) {
    const isDistinct = topZones.every(
      (selected) => candidateDistance(candidate, selected) >= SUGGESTION_SEPARATION_DISTANCE,
    )

    if (isDistinct) {
      topZones.push(candidate)
    }

    if (topZones.length === TOP_SUGGESTION_COUNT) {
      break
    }
  }

  const pool = topZones.length > 0 ? topZones : candidates.slice(0, TOP_SUGGESTION_COUNT)
  return pool[Math.floor(Math.random() * pool.length)] ?? null
}

export function coveragePercentage(positions: PositionRecord[]) {
  const coveredArea = positions.length * ZONE_SIZE * ZONE_SIZE
  return Math.min(100, (coveredArea / (MAP_WIDTH * MAP_HEIGHT)) * 100)
}

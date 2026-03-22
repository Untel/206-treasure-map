export const MAP_WIDTH = 509
export const MAP_HEIGHT = 1021
export const ZONE_SIZE = 25
export const ZONE_RADIUS = Math.floor(ZONE_SIZE / 2)

export type PositionStatus = 'found' | 'scrap' | 'nothing'

export type PositionRecord = {
  id: string
  x: number
  y: number
  status: PositionStatus
  item: string | null
  note: string
  createdAt: string
}

export type PositionDraft = Omit<PositionRecord, 'id' | 'createdAt'>

export type SuggestedZone = {
  x: number
  y: number
  score: number
  clearance: number
}

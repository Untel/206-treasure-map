export const MAP_SIZE = 1000
export const ZONE_SIZE = 25
export const ZONE_HALF_SIZE = ZONE_SIZE / 2

export type PositionStatus = 'found' | 'empty'

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

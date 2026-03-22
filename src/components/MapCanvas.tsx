import { useEffect, useRef } from 'react'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_SIZE,
  type PositionRecord,
  type SuggestedZone,
} from '../types/map'
import { itemLabel } from '../lib/items'
import type { Locale } from '../lib/i18n'
import { zoneBounds } from '../lib/map'

const CANVAS_WIDTH = 760
const CANVAS_HEIGHT = Math.round((CANVAS_WIDTH * MAP_HEIGHT) / MAP_WIDTH)
const SCALE_X = CANVAS_WIDTH / MAP_WIDTH
const SCALE_Y = CANVAS_HEIGHT / MAP_HEIGHT

type MapCanvasProps = {
  positions: PositionRecord[]
  suggestion: SuggestedZone | null
  selectedPoint: { x: number; y: number }
  selectedRecordId: string | null
  locale: Locale
  onSelectPoint: (point: { x: number; y: number }) => void
  onSelectRecord: (record: PositionRecord | null) => void
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = 'rgba(76, 88, 56, 0.16)'
  ctx.lineWidth = 1

  for (let x = 0; x <= MAP_WIDTH; x += 100) {
    const scaledX = x * SCALE_X
    ctx.beginPath()
    ctx.moveTo(scaledX, 0)
    ctx.lineTo(scaledX, CANVAS_HEIGHT)
    ctx.stroke()
  }

  for (let y = 0; y <= MAP_HEIGHT; y += 100) {
    const scaledY = y * SCALE_Y
    ctx.beginPath()
    ctx.moveTo(0, scaledY)
    ctx.lineTo(CANVAS_WIDTH, scaledY)
    ctx.stroke()
  }

  ctx.restore()
}

function createHatchPattern(ctx: CanvasRenderingContext2D) {
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = 12
  patternCanvas.height = 12
  const patternContext = patternCanvas.getContext('2d')
  if (!patternContext) {
    return null
  }

  patternContext.strokeStyle = 'rgba(82, 70, 48, 0.3)'
  patternContext.lineWidth = 1.5
  patternContext.beginPath()
  patternContext.moveTo(0, 12)
  patternContext.lineTo(12, 0)
  patternContext.stroke()
  patternContext.beginPath()
  patternContext.moveTo(-4, 12)
  patternContext.lineTo(4, 4)
  patternContext.stroke()
  patternContext.beginPath()
  patternContext.moveTo(8, 12)
  patternContext.lineTo(12, 8)
  patternContext.stroke()

  return ctx.createPattern(patternCanvas, 'repeat')
}

function drawZones(
  ctx: CanvasRenderingContext2D,
  positions: PositionRecord[],
  locale: Locale,
  selectedRecordId: string | null,
) {
  const hatchPattern = createHatchPattern(ctx)
  positions
    .slice()
    .reverse()
    .forEach((position) => {
      const bounds = zoneBounds(position.x, position.y)
      const x = bounds.left * SCALE_X
      const y = bounds.top * SCALE_Y
      const width = ZONE_SIZE * SCALE_X
      const height = ZONE_SIZE * SCALE_Y
      const markerFill =
        position.status === 'found'
          ? 'rgba(60, 174, 55, 0.95)'
          : position.status === 'scrap'
            ? 'rgba(110, 110, 110, 0.95)'
            : 'rgba(185, 44, 44, 0.95)'
      const zoneStroke = position.id === selectedRecordId ? '#1e4f45' : 'rgba(82, 70, 48, 0.55)'

      ctx.fillStyle = 'rgba(255, 250, 239, 0.2)'
      ctx.fillRect(x, y, width, height)
      if (hatchPattern) {
        ctx.fillStyle = hatchPattern
        ctx.fillRect(x, y, width, height)
      }
      ctx.strokeStyle = zoneStroke
      ctx.lineWidth = position.id === selectedRecordId ? 2.5 : 1.6
      ctx.strokeRect(x, y, width, height)

      ctx.beginPath()
      ctx.fillStyle = markerFill
      ctx.arc(position.x * SCALE_X, position.y * SCALE_Y, position.id === selectedRecordId ? 5.5 : 4.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 248, 231, 0.8)'
      ctx.lineWidth = 1.2
      ctx.stroke()

      if (position.item) {
        const label = itemLabel(position.item, locale)
        ctx.font = '600 12px "Trebuchet MS", sans-serif'
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(54, 42, 18, 0.75)'
        ctx.strokeText(label, position.x * SCALE_X + 8, position.y * SCALE_Y - 8)
        ctx.fillStyle = '#f5ea93'
        ctx.fillText(label, position.x * SCALE_X + 8, position.y * SCALE_Y - 8)
      }
    })
}

function drawSuggestion(ctx: CanvasRenderingContext2D, suggestion: SuggestedZone | null) {
  if (!suggestion) {
    return
  }

  const bounds = zoneBounds(suggestion.x, suggestion.y)
  const x = bounds.left * SCALE_X
  const y = bounds.top * SCALE_Y
  const width = ZONE_SIZE * SCALE_X
  const height = ZONE_SIZE * SCALE_Y

  ctx.save()
  ctx.fillStyle = 'rgba(43, 122, 98, 0.16)'
  ctx.strokeStyle = '#0c6f5f'
  ctx.setLineDash([8, 6])
  ctx.lineWidth = 3
  ctx.fillRect(x, y, width, height)
  ctx.strokeRect(x, y, width, height)
  ctx.beginPath()
  ctx.arc(suggestion.x * SCALE_X, suggestion.y * SCALE_Y, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#0c6f5f'
  ctx.fill()
  ctx.restore()
}

function drawSelection(ctx: CanvasRenderingContext2D, point: { x: number; y: number }) {
  ctx.save()
  ctx.strokeStyle = 'rgba(54, 42, 18, 0.8)'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(point.x * SCALE_X, 0)
  ctx.lineTo(point.x * SCALE_X, CANVAS_HEIGHT)
  ctx.moveTo(0, point.y * SCALE_Y)
  ctx.lineTo(CANVAS_WIDTH, point.y * SCALE_Y)
  ctx.stroke()
  ctx.restore()
}

export function MapCanvas({
  positions,
  suggestion,
  selectedPoint,
  selectedRecordId,
  locale,
  onSelectPoint,
  onSelectRecord,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const background = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    background.addColorStop(0, '#d9bc7f')
    background.addColorStop(1, '#c39a60')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawGrid(ctx)
    drawSuggestion(ctx, suggestion)
    drawZones(ctx, positions, locale, selectedRecordId)
    drawSelection(ctx, selectedPoint)
  }, [locale, positions, selectedPoint, selectedRecordId, suggestion])

  return (
    <canvas
      className="map-canvas"
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = Math.round(((event.clientX - rect.left) / rect.width) * MAP_WIDTH)
        const y = Math.round(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT)
        const hit = positions.find(
          (position) => Math.hypot(position.x - x, position.y - y) <= 12,
        )
        if (hit) {
          onSelectRecord(hit)
          onSelectPoint({ x: hit.x, y: hit.y })
          return
        }
        onSelectRecord(null)
        onSelectPoint({ x, y })
      }}
    />
  )
}

import { useEffect, useRef } from 'react'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_SIZE,
  type PromisingArea,
  type PositionRecord,
  type SuggestedZone,
} from '../types/map'
import { itemLabel } from '../lib/items'
import { t, type Locale } from '../lib/i18n'
import { zoneBounds } from '../lib/map'

const CANVAS_WIDTH = 760
const CANVAS_HEIGHT = Math.round((CANVAS_WIDTH * MAP_HEIGHT) / MAP_WIDTH)
const SCALE_X = CANVAS_WIDTH / MAP_WIDTH
const SCALE_Y = CANVAS_HEIGHT / MAP_HEIGHT

function regionCenter(region: PromisingArea) {
  return {
    x: Math.round((region.left + region.right - 1) / 2),
    y: Math.round((region.top + region.bottom - 1) / 2),
  }
}

type MapCanvasProps = {
  positions: PositionRecord[]
  suggestion: SuggestedZone | null
  promisingAreas: PromisingArea[]
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

function createHatchPattern(
  ctx: CanvasRenderingContext2D,
  color: string,
  background = 'transparent',
) {
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = 12
  patternCanvas.height = 12
  const patternContext = patternCanvas.getContext('2d')
  if (!patternContext) {
    return null
  }

  if (background !== 'transparent') {
    patternContext.fillStyle = background
    patternContext.fillRect(0, 0, patternCanvas.width, patternCanvas.height)
  }

  patternContext.strokeStyle = color
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
  const hatchPattern = createHatchPattern(ctx, 'rgba(82, 70, 48, 0.3)')
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

function drawPromisingAreas(
  ctx: CanvasRenderingContext2D,
  promisingAreas: PromisingArea[],
  locale: Locale,
) {
  ctx.save()
  const suggestionPattern = createHatchPattern(
    ctx,
    'rgba(35, 128, 68, 0.72)',
    'rgba(126, 208, 144, 0.24)',
  )
  for (const [index, region] of promisingAreas.entries()) {
    const x = region.left * SCALE_X
    const y = region.top * SCALE_Y
    const width = (region.right - region.left) * SCALE_X
    const height = (region.bottom - region.top) * SCALE_Y
    ctx.fillStyle = suggestionPattern ?? 'rgba(126, 208, 144, 0.28)'
    ctx.strokeStyle = index === 0 ? '#247d43' : 'rgba(36, 125, 67, 0.7)'
    ctx.lineWidth = index === 0 ? 3 : 2
    ctx.fillRect(x, y, width, height)
    ctx.strokeRect(x, y, width, height)
  }

  if (promisingAreas.length > 0) {
    const label = t(locale, 'mapGoodToStartDigging')
    const focusRegion = promisingAreas[0]
    const focusX = focusRegion.left * SCALE_X
    const focusY = focusRegion.top * SCALE_Y
    ctx.font = '700 13px "Trebuchet MS", sans-serif'
    const textWidth = ctx.measureText(label).width
    const paddingX = 10
    const paddingY = 7
    const badgeWidth = textWidth + paddingX * 2
    const badgeHeight = 30
    const preferredX = focusX + 24
    const preferredY = focusY - badgeHeight - 12
    const badgeX = Math.max(12, Math.min(CANVAS_WIDTH - badgeWidth - 12, preferredX))
    const badgeY = Math.max(12, preferredY)

    ctx.strokeStyle = '#247d43'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
    ctx.fillStyle = 'rgba(214, 247, 220, 0.96)'
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(badgeX + 24, badgeY + badgeHeight)
    ctx.lineTo(focusX + 8, focusY + 2)
    ctx.stroke()

    ctx.fillStyle = '#174c29'
    ctx.fillText(label, badgeX + paddingX, badgeY + badgeHeight - paddingY - 2)
  }
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
  promisingAreas,
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
    drawZones(ctx, positions, locale, selectedRecordId)
    drawPromisingAreas(ctx, promisingAreas, locale)
    if (suggestion) {
      ctx.save()
      ctx.beginPath()
      ctx.arc(suggestion.x * SCALE_X, suggestion.y * SCALE_Y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#f2b705'
      ctx.fill()
      ctx.strokeStyle = 'rgba(88, 60, 0, 0.8)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    }
    drawSelection(ctx, selectedPoint)
  }, [locale, positions, promisingAreas, selectedPoint, selectedRecordId, suggestion])

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
        const clickedPromisingArea = promisingAreas.find(
          (region) =>
            x >= region.left &&
            x < region.right &&
            y >= region.top &&
            y < region.bottom,
        )
        if (clickedPromisingArea) {
          onSelectRecord(null)
          onSelectPoint(regionCenter(clickedPromisingArea))
          return
        }
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

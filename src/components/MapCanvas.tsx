import { useEffect, useRef } from 'react'
import { MAP_SIZE, ZONE_SIZE, type PositionRecord, type SuggestedZone } from '../types/map'
import { zoneBounds } from '../lib/map'

const CANVAS_SIZE = 700
const SCALE = CANVAS_SIZE / MAP_SIZE

type MapCanvasProps = {
  positions: PositionRecord[]
  suggestion: SuggestedZone | null
  selectedPoint: { x: number; y: number }
  onSelectPoint: (point: { x: number; y: number }) => void
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = 'rgba(76, 88, 56, 0.16)'
  ctx.lineWidth = 1

  for (let index = 0; index <= 10; index += 1) {
    const value = index * 100 * SCALE
    ctx.beginPath()
    ctx.moveTo(value, 0)
    ctx.lineTo(value, CANVAS_SIZE)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, value)
    ctx.lineTo(CANVAS_SIZE, value)
    ctx.stroke()
  }

  ctx.restore()
}

function drawZones(ctx: CanvasRenderingContext2D, positions: PositionRecord[]) {
  positions
    .slice()
    .reverse()
    .forEach((position) => {
      const bounds = zoneBounds(position.x, position.y)
      const x = bounds.left * SCALE
      const y = bounds.top * SCALE
      const size = ZONE_SIZE * SCALE
      const fill = position.status === 'found' ? 'rgba(78, 232, 70, 0.18)' : 'rgba(235, 87, 87, 0.18)'
      const stroke = position.status === 'found' ? 'rgba(60, 174, 55, 0.9)' : 'rgba(184, 62, 62, 0.95)'

      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 2
      ctx.fillRect(x, y, size, size)
      ctx.strokeRect(x, y, size, size)

      ctx.beginPath()
      ctx.fillStyle = stroke
      ctx.arc(position.x * SCALE, position.y * SCALE, 4, 0, Math.PI * 2)
      ctx.fill()

      if (position.item) {
        ctx.font = '600 12px "Trebuchet MS", sans-serif'
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(54, 42, 18, 0.75)'
        ctx.strokeText(position.item, position.x * SCALE + 8, position.y * SCALE - 8)
        ctx.fillStyle = '#f5ea93'
        ctx.fillText(position.item, position.x * SCALE + 8, position.y * SCALE - 8)
      }
    })
}

function drawSuggestion(ctx: CanvasRenderingContext2D, suggestion: SuggestedZone | null) {
  if (!suggestion) {
    return
  }

  const bounds = zoneBounds(suggestion.x, suggestion.y)
  const x = bounds.left * SCALE
  const y = bounds.top * SCALE
  const size = ZONE_SIZE * SCALE

  ctx.save()
  ctx.fillStyle = 'rgba(43, 122, 98, 0.16)'
  ctx.strokeStyle = '#0c6f5f'
  ctx.setLineDash([8, 6])
  ctx.lineWidth = 3
  ctx.fillRect(x, y, size, size)
  ctx.strokeRect(x, y, size, size)
  ctx.beginPath()
  ctx.arc(suggestion.x * SCALE, suggestion.y * SCALE, 6, 0, Math.PI * 2)
  ctx.fillStyle = '#0c6f5f'
  ctx.fill()
  ctx.restore()
}

function drawSelection(ctx: CanvasRenderingContext2D, point: { x: number; y: number }) {
  ctx.save()
  ctx.strokeStyle = 'rgba(54, 42, 18, 0.8)'
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(point.x * SCALE, 0)
  ctx.lineTo(point.x * SCALE, CANVAS_SIZE)
  ctx.moveTo(0, point.y * SCALE)
  ctx.lineTo(CANVAS_SIZE, point.y * SCALE)
  ctx.stroke()
  ctx.restore()
}

export function MapCanvas({
  positions,
  suggestion,
  selectedPoint,
  onSelectPoint,
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

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    const background = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    background.addColorStop(0, '#d9bc7f')
    background.addColorStop(1, '#c39a60')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawGrid(ctx)
    drawSuggestion(ctx, suggestion)
    drawZones(ctx, positions)
    drawSelection(ctx, selectedPoint)
  }, [positions, selectedPoint, suggestion])

  return (
    <canvas
      className="map-canvas"
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * MAP_SIZE
        const y = ((event.clientY - rect.top) / rect.height) * MAP_SIZE
        onSelectPoint({ x, y })
      }}
    />
  )
}

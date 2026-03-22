import { useEffect, useRef } from 'react'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  ZONE_SIZE,
  type PositionRecord,
  type SuggestedZone,
} from '../types/map'
import { zoneBounds } from '../lib/map'

const CANVAS_WIDTH = 760
const CANVAS_HEIGHT = Math.round((CANVAS_WIDTH * MAP_HEIGHT) / MAP_WIDTH)
const SCALE_X = CANVAS_WIDTH / MAP_WIDTH
const SCALE_Y = CANVAS_HEIGHT / MAP_HEIGHT

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

function drawZones(ctx: CanvasRenderingContext2D, positions: PositionRecord[]) {
  positions
    .slice()
    .reverse()
    .forEach((position) => {
      const bounds = zoneBounds(position.x, position.y)
      const x = bounds.left * SCALE_X
      const y = bounds.top * SCALE_Y
      const width = ZONE_SIZE * SCALE_X
      const height = ZONE_SIZE * SCALE_Y
      const fill =
        position.status === 'found' ? 'rgba(78, 232, 70, 0.18)' : 'rgba(122, 122, 122, 0.2)'
      const stroke =
        position.status === 'found' ? 'rgba(60, 174, 55, 0.9)' : 'rgba(110, 110, 110, 0.95)'

      ctx.fillStyle = fill
      ctx.strokeStyle = stroke
      ctx.lineWidth = 2
      ctx.fillRect(x, y, width, height)
      ctx.strokeRect(x, y, width, height)

      ctx.beginPath()
      ctx.fillStyle = stroke
      ctx.arc(position.x * SCALE_X, position.y * SCALE_Y, 4, 0, Math.PI * 2)
      ctx.fill()

      if (position.item) {
        ctx.font = '600 12px "Trebuchet MS", sans-serif'
        ctx.lineWidth = 3
        ctx.strokeStyle = 'rgba(54, 42, 18, 0.75)'
        ctx.strokeText(position.item, position.x * SCALE_X + 8, position.y * SCALE_Y - 8)
        ctx.fillStyle = '#f5ea93'
        ctx.fillText(position.item, position.x * SCALE_X + 8, position.y * SCALE_Y - 8)
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

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const background = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    background.addColorStop(0, '#d9bc7f')
    background.addColorStop(1, '#c39a60')
    ctx.fillStyle = background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawGrid(ctx)
    drawSuggestion(ctx, suggestion)
    drawZones(ctx, positions)
    drawSelection(ctx, selectedPoint)
  }, [positions, selectedPoint, suggestion])

  return (
    <canvas
      className="map-canvas"
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * MAP_WIDTH
        const y = ((event.clientY - rect.top) / rect.height) * MAP_HEIGHT
        onSelectPoint({ x, y })
      }}
    />
  )
}

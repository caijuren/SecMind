"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import worldData from "@/data/world.json"

interface AttackPoint {
  id: string
  name: string
  lat: number
  lng: number
  severity: "critical" | "high" | "medium" | "low"
  type: "source" | "target"
  timestamp: number
}

interface AttackLine {
  from: AttackPoint
  to: AttackPoint
}

interface AttackMapProps {
  attacks: AttackPoint[]
}

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#fbbf24",
  low: "#22d3ee",
}

const SEVERITY_GLOW = {
  critical: "rgba(239,68,68,0.6)",
  high: "rgba(249,115,22,0.5)",
  medium: "rgba(251,191,36,0.4)",
  low: "rgba(34,211,238,0.4)",
}

function lngToX(lng: number, width: number): number {
  return ((lng + 180) / 360) * width
}

function latToY(lat: number, height: number): number {
  return ((90 - lat) / 180) * height
}

function useCanvasSize(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 800, height: 450 })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setSize({ width: rect.width, height: rect.height })
      }
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [containerRef])

  return size
}

export function AttackMap({ attacks }: AttackMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { width, height } = useCanvasSize(containerRef)
  const animRef = useRef(0)
  const [newAttackIds, setNewAttackIds] = useState<Set<string>>(new Set())

  const mapFeatures = useMemo(() => {
    return (worldData as any).features.filter(
      (f: any) => f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon"
    )
  }, [])

  const lines = useMemo<AttackLine[]>(() => {
    const sources = attacks.filter((a) => a.type === "source")
    const targets = attacks.filter((a) => a.type === "target")
    const result: AttackLine[] = []
    sources.forEach((s, idx) => {
      const t = targets[idx % targets.length]
      if (t) result.push({ from: s, to: t })
    })
    return result
  }, [attacks])

  useEffect(() => {
    if (attacks.length === 0) return
    const latest = attacks.reduce((max, a) => Math.max(max, a.timestamp), 0)
    const ids = new Set(
      attacks.filter((a) => a.timestamp === latest || a.timestamp > latest - 3000).map((a) => a.id)
    )
    setNewAttackIds(ids)
    const timer = setTimeout(() => setNewAttackIds(new Set()), 2000)
    return () => clearTimeout(timer)
  }, [attacks])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, width, height)

    const mapW = width * 0.92
    const mapH = height * 0.88
    const offsetX = (width - mapW) / 2
    const offsetY = (height - mapH) / 2

    ctx.save()
    ctx.translate(offsetX, offsetY)

    const bgGrad = ctx.createRadialGradient(mapW / 2, mapH / 2, 0, mapW / 2, mapH / 2, mapW * 0.6)
    bgGrad.addColorStop(0, "rgba(34,211,238,0.04)")
    bgGrad.addColorStop(1, "rgba(34,211,238,0)")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, mapW, mapH)

    const time = animRef.current * 0.02

    ctx.strokeStyle = "rgba(34,211,238,0.12)"
    ctx.lineWidth = 0.5
    ctx.fillStyle = "rgba(34,211,238,0.05)"

    mapFeatures.forEach((feature: any) => {
      const geomType = feature.geometry.type

      const drawPolygon = (coords: any) => {
        ctx.beginPath()
        coords.forEach((ring: any, ri: number) => {
          ring.forEach((pos: any, i: number) => {
            const lng = pos[0]
            const lat = pos[1]
            const x = lngToX(lng, mapW)
            const y = latToY(lat, mapH)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          if (ri === 0) ctx.closePath()
        })
      }

      if (geomType === "Polygon") {
        const coords = feature.geometry.coordinates
        drawPolygon(coords)
        ctx.fill()
        ctx.stroke()
      } else if (geomType === "MultiPolygon") {
        feature.geometry.coordinates.forEach((polygon: any) => {
          drawPolygon(polygon)
          ctx.fill()
          ctx.stroke()
        })
      }
    })

    ctx.strokeStyle = "rgba(255,255,255,0.03)"
    ctx.lineWidth = 0.3
    for (let i = 0; i < 5; i++) {
      const y = mapH * (0.15 + i * 0.18)
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(mapW, y)
      ctx.stroke()
    }
    for (let i = 0; i < 8; i++) {
      const x = mapW * (0.08 + i * 0.12)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, mapH)
      ctx.stroke()
    }

    lines.forEach((line, i) => {
      const x1 = lngToX(line.from.lng, mapW)
      const y1 = latToY(line.from.lat, mapH)
      const x2 = lngToX(line.to.lng, mapW)
      const y2 = latToY(line.to.lat, mapH)

      const progress = ((time * 80 + i * 20) % 100) / 100
      const cx = (x1 + x2) / 2
      const cy = Math.min(y1, y2) - 30

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.quadraticCurveTo(cx, cy, x2, y2)
      ctx.strokeStyle = "rgba(239,68,68,0.15)"
      ctx.lineWidth = 0.8
      ctx.setLineDash([3, 5])
      ctx.stroke()
      ctx.setLineDash([])

      const t = progress
      const dotX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2
      const dotY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2

      const dotGrad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 3)
      dotGrad.addColorStop(0, "rgba(239,68,68,0.9)")
      dotGrad.addColorStop(1, "rgba(239,68,68,0)")
      ctx.beginPath()
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2)
      ctx.fillStyle = dotGrad
      ctx.fill()
    })

    attacks.forEach((point) => {
      const x = lngToX(point.lng, mapW)
      const y = latToY(point.lat, mapH)
      const color = SEVERITY_COLORS[point.severity]
      const glow = SEVERITY_GLOW[point.severity]
      const isSource = point.type === "source"
      const isNew = newAttackIds.has(point.id)

      const pulse = Math.sin(time * 3 + x * 0.01) * 0.3 + 0.7
      const radius = isSource ? 4 : 3
      const pulseRadius = isNew ? radius * 2.5 : radius * 1.8

      const outerGlow = ctx.createRadialGradient(x, y, radius * 0.5, x, y, pulseRadius * pulse)
      outerGlow.addColorStop(0, glow)
      outerGlow.addColorStop(1, "rgba(0,0,0,0)")
      ctx.beginPath()
      ctx.arc(x, y, pulseRadius * pulse, 0, Math.PI * 2)
      ctx.fillStyle = outerGlow
      ctx.fill()

      const innerGlow = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5)
      innerGlow.addColorStop(0, color)
      innerGlow.addColorStop(0.5, color + "aa")
      innerGlow.addColorStop(1, "rgba(0,0,0,0)")
      ctx.beginPath()
      ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = innerGlow
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = "#ffffff"
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()

      if (isNew) {
        ctx.beginPath()
        ctx.arc(x, y, radius * 1.8, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.globalAlpha = 0.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      ctx.fillStyle = "rgba(255,255,255,0.5)"
      ctx.font = `${isSource ? 9 : 8}px monospace`
      ctx.textAlign = "center"
      ctx.fillText(point.name, x, y - radius - 4)
    })

    ctx.restore()

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.font = "10px monospace"
    ctx.fillText("攻击源", 16, height - 10)
    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(8, height - 14, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.fillText("攻击目标", 72, height - 10)
    ctx.fillStyle = "#3b82f6"
    ctx.beginPath()
    ctx.arc(64, height - 14, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.fillText("严重", 128, height - 10)
    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(120, height - 14, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.fillText("高危", 172, height - 10)
    ctx.fillStyle = "#f97316"
    ctx.beginPath()
    ctx.arc(164, height - 14, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.fillText("中危", 216, height - 10)
    ctx.fillStyle = "#fbbf24"
    ctx.beginPath()
    ctx.arc(208, height - 14, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(255,255,255,0.3)"
    ctx.fillText("低危", 260, height - 10)
    ctx.fillStyle = "#22d3ee"
    ctx.beginPath()
    ctx.arc(252, height - 14, 3, 0, Math.PI * 2)
    ctx.fill()
  }, [width, height, attacks, lines, mapFeatures, newAttackIds])

  useEffect(() => {
    let running = true
    const animate = () => {
      if (!running) return
      animRef.current++
      draw()
      requestAnimationFrame(animate)
    }
    animate()
    return () => { running = false }
  }, [draw])

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  )
}
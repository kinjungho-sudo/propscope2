'use client'

import { useEffect, useState } from 'react'

export default function BackendWarmup() {
  const [warming, setWarming] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    let timer: ReturnType<typeof setInterval> | null = null

    const ping = async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2000)
      try {
        const res = await fetch(`${apiUrl}/health`, { signal: controller.signal })
        clearTimeout(timeout)
        if (res.ok) {
          setWarming(false)
          return true
        }
      } catch {
        clearTimeout(timeout)
      }
      return false
    }

    const start = async () => {
      const ok = await ping()
      if (ok) return

      // 서버가 응답 없으면 웨이크업 모드 진입
      setWarming(true)
      setElapsed(0)
      let sec = 0
      timer = setInterval(() => {
        sec++
        setElapsed(sec)
      }, 1000)

      // 90초 동안 5초마다 retry
      for (let i = 0; i < 18; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const ok = await ping()
        if (ok) {
          if (timer) clearInterval(timer)
          setWarming(false)
          return
        }
      }
      if (timer) clearInterval(timer)
      setWarming(false)
    }

    start()
    return () => { if (timer) clearInterval(timer) }
  }, [])

  if (!warming) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-3 bg-slate-900 border border-slate-600 text-slate-300 text-xs px-4 py-3 rounded-xl shadow-2xl backdrop-blur-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <div>
        <p className="font-medium text-amber-300">서버 시작 중...</p>
        <p className="text-slate-500">{elapsed}초 경과 · 최대 60초 소요</p>
      </div>
    </div>
  )
}

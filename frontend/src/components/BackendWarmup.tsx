'use client'

import { useEffect } from 'react'

export default function BackendWarmup() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    fetch(`${apiUrl}/health`, { method: 'GET' }).catch(() => {})
  }, [])
  return null
}

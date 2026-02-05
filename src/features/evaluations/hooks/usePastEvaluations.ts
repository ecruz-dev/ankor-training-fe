import { useEffect, useState } from 'react'
import type { PastEvaluationRow } from '../types'

type UsePastEvaluationsParams = {
  orgId: string | null
  athleteId: string | null
  enabled: boolean
  limit?: number
  offset?: number
  scorecardName?: string
  coach?: string
  date?: string
}

type UsePastEvaluationsResult = {
  rows: PastEvaluationRow[]
  loading: boolean
  error: string | null
}

export function usePastEvaluations(
  params: UsePastEvaluationsParams,
): UsePastEvaluationsResult {
  const {
    orgId,
    athleteId,
    enabled,
    limit = 10,
    offset = 0,
    scorecardName,
    coach,
    date,
  } = params
  const [rows, setRows] = useState<PastEvaluationRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !athleteId || !orgId) {
      setRows([])
      setError(null)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { rows: data } = await listLatestEvaluations({
          orgId,
          athleteId,
          limit,
          offset,
          scorecardName,
          coach,
          date,
        })
        if (!cancelled) setRows(data ?? [])
      } catch (err) {
        if (cancelled) return
        console.error('Failed to load past evaluations', err)
        setRows([])
        setError('Failed to load past evaluations')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [athleteId, enabled, limit, orgId])

  return { rows, loading, error }
}

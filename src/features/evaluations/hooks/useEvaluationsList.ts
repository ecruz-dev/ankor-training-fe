import { useCallback, useEffect, useState } from 'react'
import { listEvaluations, type EvaluationListRow } from '../api/evaluationsApi'

export type UseEvaluationsListResult = {
  rows: EvaluationListRow[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useEvaluationsList(orgId: string | null): UseEvaluationsListResult {
  const [rows, setRows] = useState<EvaluationListRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) {
      setRows([])
      setError(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await listEvaluations({ orgId })
      setRows(data)
    } catch (err) {
      console.error('Failed to load evaluations list', err)
      setError('Failed to load evaluations list')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  return { rows, loading, error, reload: load }
}

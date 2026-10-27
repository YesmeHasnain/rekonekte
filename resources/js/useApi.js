import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api.js'

/**
 * Load data from the API on mount (and whenever `path` changes). Returns the
 * data, a loading flag, any error, a setter (for optimistic updates) and a
 * reload(). Keeps the whole app's screens short and consistent.
 */
export function useApi(path, { skip = false } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError] = useState(null)
  const alive = useRef(true)

  const load = useCallback(async () => {
    if (!path || skip) return
    setLoading(true)
    try {
      const r = await api(path)
      if (alive.current) { setData(r); setError(null) }
    } catch (e) {
      if (alive.current) setError(e)
    } finally {
      if (alive.current) setLoading(false)
    }
  }, [path, skip])

  useEffect(() => { alive.current = true; load(); return () => { alive.current = false } }, [load])

  return { data, setData, loading, error, reload: load }
}

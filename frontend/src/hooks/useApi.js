import { useEffect, useState } from 'react'

export function useFetch(fetchFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await fetchFn()
        if (isMounted) {
          setData(result.data)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || err.message)
          setData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [fetchFn])

  return { data, loading, error }
}

export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState('idle')
  const [value, setValue] = useState(null)
  const [error, setError] = useState(null)

  const execute = async (...args) => {
    setStatus('pending')
    setValue(null)
    setError(null)
    try {
      const response = await asyncFunction(...args)
      setValue(response.data)
      setStatus('success')
      return response.data
    } catch (err) {
      setError(err)
      setStatus('error')
      throw err
    }
  }

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [immediate])

  return { execute, status, value, error }
}

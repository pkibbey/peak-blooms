import { useEffect, useRef, useCallback } from "react"

/**
 * useDebouncedCallback
 * A small, reusable debounce hook which returns a stable function that delays
 * calling the provided callback until the specified delay has passed since the
 * last invocation.
 *
 * - Keeps a ref to the latest callback so closures don't go stale
 * - Cleans up the timeout on unmount
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // keep callback ref fresh
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...(args as any))
    }, delay)
  }, [delay])
}

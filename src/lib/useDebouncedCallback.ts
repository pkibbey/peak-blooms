import { useCallback, useEffect, useRef } from "react"

/**
 * useDebouncedCallback
 * A small, reusable debounce hook which returns a stable function that delays
 * calling the provided callback until the specified delay has passed since the
 * last invocation.
 *
 * - Keeps a ref to the latest callback so closures don't go stale
 * - Cleans up the timeout on unmount
 */
export function useDebouncedCallback<Args extends readonly unknown[], R>(
  callback: (...args: Args) => R,
  delay: number
): (...args: Args) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef<(...args: Args) => R>(callback)

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

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        // callbackRef.current is typed as (...args: Args) => R
        // We can call it directly with the captured args.
        ;(callbackRef.current as (...args: Args) => R)(...args)
      }, delay)
    },
    [delay]
  )
}

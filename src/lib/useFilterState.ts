import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export interface FilterStateOptions {
  searchParamNames: Record<string, string>
  basePath: string
}

export function useFilterState(options: FilterStateOptions) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigateWithParams = useCallback(
    (params: URLSearchParams) => {
      // Always reset to page 1 when filters change
      params.delete("page")

      router.push(`${options.basePath}?${params.toString()}`, { scroll: false })
    },
    [router, options.basePath]
  )

  const getParamsWithFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      return params
    },
    [searchParams]
  )

  const getParamsWithFilters = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      return params
    },
    [searchParams]
  )

  const clearAllFilters = useCallback(() => {
    router.push(options.basePath, { scroll: false })
  }, [router, options.basePath])

  return {
    searchParams,
    navigateWithParams,
    getParamsWithFilter,
    getParamsWithFilters,
    clearAllFilters,
  }
}

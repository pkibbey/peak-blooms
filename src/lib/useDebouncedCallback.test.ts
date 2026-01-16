import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDebouncedCallback } from "./useDebouncedCallback"

describe("useDebouncedCallback", () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runAllTimersAsync()
    vi.useRealTimers()
  })

  it("should debounce callback invocations", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current("test")
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith("test")
  })

  it("should cancel previous timeout on new invocation", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current("first")
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      result.current("second")
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith("second")
  })

  it("should pass correct arguments to callback", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))

    const testData = { id: 1, name: "test" }

    act(() => {
      result.current(testData)
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith(testData)
  })

  it("should support multiple arguments", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))

    act(() => {
      result.current("arg1", 42, true)
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledWith("arg1", 42, true)
  })

  it("should handle rapid successive calls", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current(`call-${i}`)
        vi.advanceTimersByTime(50)
      }
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith("call-9")
  })

  it("should clean up timeout on unmount", () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      unmount()
    })

    act(() => {
      vi.runAllTimersAsync()
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it("should clear pending timeout on unmount", () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

    act(() => {
      result.current("test")
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      unmount()
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(callback).not.toHaveBeenCalled()
  })

  it("should update callback reference without resetting delay", () => {
    let count = 0
    const callback1 = vi.fn(() => count++)
    const callback2 = vi.fn(() => count++)

    const { result, rerender } = renderHook(
      ({ callback, delay }: { callback: () => void; delay: number }) =>
        useDebouncedCallback(callback, delay),
      { initialProps: { callback: callback1, delay: 100 } }
    )

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(50)
    })

    // Update callback while timeout is pending
    rerender({ callback: callback2, delay: 100 })

    act(() => {
      vi.advanceTimersByTime(50)
    })

    // Should call the new callback with the original invocation
    expect(callback2).toHaveBeenCalledOnce()
    expect(callback1).not.toHaveBeenCalled()
  })

  it("should use updated delay on next invocation", () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(
      ({ delay }: { delay: number }) => useDebouncedCallback(callback, delay),
      { initialProps: { delay: 100 } }
    )

    act(() => {
      result.current()
    })

    rerender({ delay: 200 })

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(callback).toHaveBeenCalledOnce()
  })

  it("should return stable function reference", () => {
    const callback = vi.fn()
    const { result, rerender } = renderHook(() => useDebouncedCallback(callback, 100), {
      initialProps: undefined,
    })

    const firstFunction = result.current

    rerender()

    const secondFunction = result.current

    expect(firstFunction).toBe(secondFunction)
  })

  it("should handle no arguments", () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 100))

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith()
  })

  it("should handle different delay values", () => {
    const callback = vi.fn()
    const { result } = renderHook(
      ({ delay }: { delay: number }) => useDebouncedCallback(callback, delay),
      { initialProps: { delay: 50 } }
    )

    act(() => {
      result.current()
    })

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(callback).toHaveBeenCalledOnce()
  })

  it("should work with multiple hook instances", () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { result: result1 } = renderHook(() => useDebouncedCallback(callback1, 100))
    const { result: result2 } = renderHook(() => useDebouncedCallback(callback2, 150))

    act(() => {
      result1.current("call1")
      result2.current("call2")
    })

    act(() => {
      vi.advanceTimersByTime(100)
    })

    expect(callback1).toHaveBeenCalledOnce()
    expect(callback2).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(50)
    })

    expect(callback2).toHaveBeenCalledOnce()
  })
})

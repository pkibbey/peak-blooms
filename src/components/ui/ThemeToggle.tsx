"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { Button } from "./button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "system") {
      // If currently on system, toggle to the opposite of resolved
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    } else if (theme === "dark") {
      // If on dark, go to light
      setTheme("light")
    } else {
      // If on light, go back to system
      setTheme("system")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${
        theme === "system"
          ? resolvedTheme === "dark"
            ? "light"
            : "dark"
          : theme === "dark"
            ? "light"
            : "system"
      } mode`}
      className="relative h-9 w-9 transition-transform duration-200 hover:scale-110"
    >
      <div className="relative w-4 h-4">
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
            resolvedTheme === "dark" ? "rotate-90 scale-0" : "rotate-0 scale-100"
          }`}
          aria-hidden="true"
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 transition-all duration-300 ${
            resolvedTheme === "dark" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
          }`}
          aria-hidden="true"
        />
      </div>
      {theme === "system" && (
        <span
          className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </Button>
  )
}

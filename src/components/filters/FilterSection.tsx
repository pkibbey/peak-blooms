import { X } from "lucide-react"

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  onClear?: () => void
}

export function FilterSection({ title, children, onClear }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-700">{title}</p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            aria-label={`Clear ${title} filter`}
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

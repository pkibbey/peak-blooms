import type { FieldValues, UseFormReturn } from "react-hook-form"
import { toAppErrorClient } from "./error-utils"

/**
 * Utility function to handle save-on-blur for form fields.
 * Validates form, checks if values changed, and calls the provided save function.
 * Server validates the data - this is optimistic save on the client.
 *
 * @param options.form - React Hook Form instance
 * @param options.originalValues - Original form values to detect changes
 * @param options.onSave - Async function to call when changes detected and validated
 * @param options.fieldName - Name of the field that triggered blur (optional, for logging)
 */
export async function saveOnBlur<T extends FieldValues>({
  form,
  originalValues,
  onSave,
  fieldName,
}: {
  form: UseFormReturn<T>
  originalValues: T
  onSave: (data: T) => Promise<void>
  fieldName?: string
}): Promise<void> {
  const currentData = form.getValues()
  const hasChanged = JSON.stringify(currentData) !== JSON.stringify(originalValues)

  if (hasChanged) {
    // Validate the form before saving
    const isValid = await form.trigger()
    if (isValid) {
      try {
        await onSave(currentData)
      } catch (error) {
        toAppErrorClient(error, `Error saving ${fieldName || "field"}`)
      }
    }
  }
}

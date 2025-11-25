"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface InlineEditFieldProps {
  value: string | number;
  onSave: (value: string | number) => Promise<void>;
  type?: "text" | "number";
  className?: string;
  displayFormatter?: (value: string | number) => string;
}

export default function InlineEditField({
  value,
  onSave,
  type = "text",
  className = "",
  displayFormatter,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(String(value));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const newValue = type === "number" ? parseFloat(editValue) : editValue;
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
      setEditValue(String(value));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`rounded border border-border bg-background px-2 py-1 text-sm ${className}`}
          disabled={isSaving}
          step={type === "number" ? "0.01" : undefined}
        />
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer rounded px-2 py-1 text-left hover:bg-muted ${className}`}
      title="Click to edit"
    >
      {displayFormatter ? displayFormatter(value) : value}
    </button>
  );
}

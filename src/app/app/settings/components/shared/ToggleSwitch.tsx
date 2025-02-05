"use client";

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
}

export function ToggleSwitch({ enabled, onToggle }: ToggleSwitchProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        enabled ? "bg-primary" : "bg-muted"
      }`}
    >
      <span
        className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

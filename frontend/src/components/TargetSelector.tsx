import type { Target } from "../types/ws";

interface TargetSelectorProps {
  selectedTarget: Target;
  onTargetChange: (target: Target) => void;
  disabled?: boolean;
}

export function TargetSelector({
  selectedTarget,
  onTargetChange,
  disabled = false,
}: TargetSelectorProps) {
  return (
    <div className="target-selector">
      <button
        className={`target-btn interviewer ${selectedTarget === "interviewer" ? "active" : ""}`}
        onClick={() => onTargetChange("interviewer")}
        disabled={disabled}
      >
        面接官へ
      </button>
      <button
        className={`target-btn candidate ${selectedTarget === "candidate" ? "active" : ""}`}
        onClick={() => onTargetChange("candidate")}
        disabled={disabled}
      >
        求職者へ
      </button>
      <button
        className={`target-btn ${selectedTarget === "both" ? "active" : ""}`}
        onClick={() => onTargetChange("both")}
        disabled={disabled}
      >
        両方へ
      </button>
    </div>
  );
}

import type { UIPhase } from "../types/ws";

interface StepIndicatorProps {
  currentPhase: UIPhase;
}

const steps = [
  { id: "setup", label: "設定", number: 1 },
  { id: "interview", label: "面接", number: 2 },
  { id: "result", label: "結果", number: 3 },
] as const;

export function StepIndicator({ currentPhase }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentPhase);

  return (
    <div className="step-indicator">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentPhase;

        return (
          <div key={step.id} className="step-wrapper">
            {/* Connector line */}
            {index > 0 && (
              <div
                className={`step-connector ${
                  index <= currentIndex ? "active" : ""
                }`}
              />
            )}

            {/* Step */}
            <div
              className={`step-item ${isCurrent ? "current" : ""} ${
                isCompleted ? "completed" : ""
              }`}
            >
              <div className="step-circle">
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

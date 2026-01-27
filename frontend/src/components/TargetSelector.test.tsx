import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TargetSelector } from "./TargetSelector";

describe("TargetSelector", () => {
  it("should render all three target buttons", () => {
    render(
      <TargetSelector
        selectedTarget="both"
        onTargetChange={() => {}}
      />
    );

    expect(screen.getByText("面接官へ")).toBeInTheDocument();
    expect(screen.getByText("求職者へ")).toBeInTheDocument();
    expect(screen.getByText("両方へ")).toBeInTheDocument();
  });

  it("should highlight selected target", () => {
    render(
      <TargetSelector
        selectedTarget="interviewer"
        onTargetChange={() => {}}
      />
    );

    const interviewerBtn = screen.getByText("面接官へ");
    expect(interviewerBtn).toHaveClass("active");
  });

  it("should call onTargetChange when clicked", () => {
    const handleChange = vi.fn();
    render(
      <TargetSelector
        selectedTarget="both"
        onTargetChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText("面接官へ"));
    expect(handleChange).toHaveBeenCalledWith("interviewer");

    fireEvent.click(screen.getByText("求職者へ"));
    expect(handleChange).toHaveBeenCalledWith("candidate");

    fireEvent.click(screen.getByText("両方へ"));
    expect(handleChange).toHaveBeenCalledWith("both");
  });

  it("should disable buttons when disabled prop is true", () => {
    render(
      <TargetSelector
        selectedTarget="both"
        onTargetChange={() => {}}
        disabled={true}
      />
    );

    expect(screen.getByText("面接官へ")).toBeDisabled();
    expect(screen.getByText("求職者へ")).toBeDisabled();
    expect(screen.getByText("両方へ")).toBeDisabled();
  });
});

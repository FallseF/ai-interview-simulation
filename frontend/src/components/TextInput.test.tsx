import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  it("should render input and send button", () => {
    render(
      <TextInput
        target="both"
        onSend={() => {}}
      />
    );

    expect(screen.getByPlaceholderText("補足を入力...")).toBeInTheDocument();
    expect(screen.getByText("送信")).toBeInTheDocument();
  });

  it("should use custom placeholder", () => {
    render(
      <TextInput
        target="both"
        onSend={() => {}}
        placeholder="カスタムプレースホルダー"
      />
    );

    expect(screen.getByPlaceholderText("カスタムプレースホルダー")).toBeInTheDocument();
  });

  it("should call onSend with target and text when send button clicked", () => {
    const handleSend = vi.fn();
    render(
      <TextInput
        target="interviewer"
        onSend={handleSend}
      />
    );

    const input = screen.getByPlaceholderText("補足を入力...");
    fireEvent.change(input, { target: { value: "テストメッセージ" } });
    fireEvent.click(screen.getByText("送信"));

    expect(handleSend).toHaveBeenCalledWith("interviewer", "テストメッセージ");
  });

  it("should clear input after sending", () => {
    const handleSend = vi.fn();
    render(
      <TextInput
        target="both"
        onSend={handleSend}
      />
    );

    const input = screen.getByPlaceholderText("補足を入力...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "テスト" } });
    fireEvent.click(screen.getByText("送信"));

    expect(input.value).toBe("");
  });

  it("should send on Enter key", () => {
    const handleSend = vi.fn();
    render(
      <TextInput
        target="both"
        onSend={handleSend}
      />
    );

    const input = screen.getByPlaceholderText("補足を入力...");
    fireEvent.change(input, { target: { value: "Enterで送信" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleSend).toHaveBeenCalledWith("both", "Enterで送信");
  });

  it("should not send empty text", () => {
    const handleSend = vi.fn();
    render(
      <TextInput
        target="both"
        onSend={handleSend}
      />
    );

    fireEvent.click(screen.getByText("送信"));
    expect(handleSend).not.toHaveBeenCalled();
  });

  it("should not send whitespace-only text", () => {
    const handleSend = vi.fn();
    render(
      <TextInput
        target="both"
        onSend={handleSend}
      />
    );

    const input = screen.getByPlaceholderText("補足を入力...");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByText("送信"));

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("should disable input and button when disabled prop is true", () => {
    render(
      <TextInput
        target="both"
        onSend={() => {}}
        disabled={true}
      />
    );

    expect(screen.getByPlaceholderText("補足を入力...")).toBeDisabled();
    expect(screen.getByText("送信")).toBeDisabled();
  });
});

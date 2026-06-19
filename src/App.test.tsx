import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App notation controls", () => {
  it("renders enharmonic root choices through the notation policy UI", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "调内和弦" }));
    fireEvent.click(screen.getByRole("button", { name: "完整音阶" }));
    fireEvent.change(screen.getByLabelText("调中心"), { target: { value: "d-flat" } });

    expect(screen.getByText("Db Eb F Gb Ab Bb C")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("调中心"), { target: { value: "c-sharp" } });
    expect(screen.getByText("C# Eb F F# Ab Bb C")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "理论派" }));
    expect(screen.getByText("C# D# E# F# G# A# B#")).toBeTruthy();
  });
});

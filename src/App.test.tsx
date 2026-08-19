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

  it("keeps box range and tolerance controls out of the main surface", () => {
    render(<App />);

    expect(screen.queryByLabelText("起始弦")).toBeNull();
    expect(screen.queryByLabelText("结束弦")).toBeNull();
    expect(screen.queryByLabelText("起始品")).toBeNull();
    expect(screen.queryByLabelText("结束品")).toBeNull();
    expect(screen.queryByLabelText("宽容度")).toBeNull();
  });

  it("opens settings with box range and tolerance controls", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "设置" }));

    expect(screen.getByRole("dialog", { name: "设置" })).toBeTruthy();
    expect(screen.getByLabelText("起始弦")).toBeTruthy();
    expect(screen.getByLabelText("结束弦")).toBeTruthy();
    expect(screen.getByLabelText("起始品")).toBeTruthy();
    expect(screen.getByLabelText("结束品")).toBeTruthy();
    expect(screen.getByLabelText("宽容度")).toBeTruthy();
  });

  it("keeps diatonic degree windows and scale display toggle available", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "调内和弦" }));
    fireEvent.click(screen.getByRole("button", { name: "III" }));
    fireEvent.click(screen.getByRole("button", { name: "完整音阶" }));

    expect(screen.getByText("C D E F G A B")).toBeTruthy();
    expect(screen.getByRole("button", { name: "VII" })).toBeTruthy();
  });
});

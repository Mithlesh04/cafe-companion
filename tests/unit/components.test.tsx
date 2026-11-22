// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CartPanel } from "@/components/CartPanel";
import { PrefsEditor } from "@/components/PrefsEditor";
import { Stars } from "@/components/ui";

describe("CartPanel", () => {
  it("shows an empty state", () => {
    render(<CartPanel cart={[]} />);
    expect(screen.getByText(/Nothing yet/)).toBeInTheDocument();
  });

  it("adjusts quantities and removes at zero", () => {
    const onChange = vi.fn();
    render(<CartPanel cart={[{ itemId: "espresso", name: "Espresso", qty: 1, unitPriceCents: 18000 }]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("More Espresso"));
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ qty: 2 })]);
    fireEvent.click(screen.getByLabelText("Fewer Espresso"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe("PrefsEditor", () => {
  it("toggles dietary chips with aria-pressed", () => {
    const onChange = vi.fn();
    render(<PrefsEditor value={{ dietary: [], dislikes: [], favourites: [] }} onChange={onChange} />);
    const vegan = screen.getByRole("button", { name: "Vegan" });
    expect(vegan).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(vegan);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ dietary: ["vegan"] }));
  });
});

describe("Stars", () => {
  it("is a radiogroup when interactive", () => {
    const onChange = vi.fn();
    render(<Stars value={3} onChange={onChange} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("5 stars"));
    expect(onChange).toHaveBeenCalledWith(5);
  });
});

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QRDesignCustomizer, defaultDesignOptions } from "./QRDesignCustomizer";

vi.mock("./TemplateGallery", () => ({
  TemplateGallery: () => null,
}));

vi.mock("./DesignPresetManager", () => ({
  DesignPresetManager: () => null,
}));

afterEach(cleanup);

describe("QRDesignCustomizer frame caption", () => {
  const frameOptions = { ...defaultDesignOptions, frameStyle: "simple" as const };

  it("accepts a custom caption", () => {
    const onChange = vi.fn();
    render(<QRDesignCustomizer options={frameOptions} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Caption text"), { target: { value: "Visit our menu" } });

    expect(onChange).toHaveBeenLastCalledWith({ ...frameOptions, frameText: "Visit our menu" });
  });

  it("offers preset wording and a no-caption option", () => {
    const onChange = vi.fn();
    render(<QRDesignCustomizer options={frameOptions} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "CONNECT" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...frameOptions, frameText: "CONNECT" });

    fireEvent.click(screen.getByRole("button", { name: "No caption" }));
    expect(onChange).toHaveBeenLastCalledWith({ ...frameOptions, frameText: "" });
  });
});

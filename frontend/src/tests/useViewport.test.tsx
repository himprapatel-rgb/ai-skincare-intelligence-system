import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import {
  useViewport,
  isMobileViewport,
  isTabletViewport,
  isDesktopViewport,
} from "../hooks/useViewport";
import { MOBILE_MAX, TABLET_MAX, DESKTOP_MIN } from "../constants/viewport";

function setInnerWidth(w: number) {
  Object.defineProperty(window, "innerWidth", {
    value: w,
    configurable: true,
    writable: true,
  });
}

function ViewportLabel() {
  const viewport = useViewport();
  return <span data-testid="viewport">{viewport}</span>;
}

describe("useViewport", () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  it("returns mobile when innerWidth <= MOBILE_MAX (768)", () => {
    setInnerWidth(375);
    render(<ViewportLabel />);
    expect(screen.getByTestId("viewport")).toHaveTextContent("mobile");
  });

  it("returns mobile at exactly 768", () => {
    setInnerWidth(MOBILE_MAX);
    render(<ViewportLabel />);
    expect(screen.getByTestId("viewport")).toHaveTextContent("mobile");
  });

  it("returns tablet when innerWidth is between 769 and 1024", () => {
    setInnerWidth(800);
    render(<ViewportLabel />);
    expect(screen.getByTestId("viewport")).toHaveTextContent("tablet");
  });

  it("returns tablet at exactly 1024", () => {
    setInnerWidth(TABLET_MAX);
    render(<ViewportLabel />);
    expect(screen.getByTestId("viewport")).toHaveTextContent("tablet");
  });

  it("returns desktop when innerWidth >= DESKTOP_MIN (1025)", () => {
    setInnerWidth(1280);
    render(<ViewportLabel />);
    expect(screen.getByTestId("viewport")).toHaveTextContent("desktop");
  });

  it("returns desktop at exactly 1025", () => {
    setInnerWidth(DESKTOP_MIN);
    render(<ViewportLabel />);
    expect(screen.getByTestId("viewport")).toHaveTextContent("desktop");
  });
});

describe("isMobileViewport / isTabletViewport / isDesktopViewport", () => {
  it("isMobileViewport is true only for mobile", () => {
    expect(isMobileViewport("mobile")).toBe(true);
    expect(isMobileViewport("tablet")).toBe(false);
    expect(isMobileViewport("desktop")).toBe(false);
  });

  it("isTabletViewport is true only for tablet", () => {
    expect(isTabletViewport("tablet")).toBe(true);
    expect(isTabletViewport("mobile")).toBe(false);
    expect(isTabletViewport("desktop")).toBe(false);
  });

  it("isDesktopViewport is true only for desktop", () => {
    expect(isDesktopViewport("desktop")).toBe(true);
    expect(isDesktopViewport("mobile")).toBe(false);
    expect(isDesktopViewport("tablet")).toBe(false);
  });
});

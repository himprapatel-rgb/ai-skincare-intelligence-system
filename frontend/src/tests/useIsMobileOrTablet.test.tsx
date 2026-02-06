import { render, screen } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { useIsMobileOrTablet } from "../hooks/useIsMobileOrTablet";
import { MOBILE_MAX, TABLET_MAX, DESKTOP_MIN } from "../constants/viewport";

function setInnerWidth(w: number) {
  Object.defineProperty(window, "innerWidth", {
    value: w,
    configurable: true,
    writable: true,
  });
}

function MobileOrTabletLabel() {
  const isMobileOrTablet = useIsMobileOrTablet();
  return (
    <span data-testid="mobile-or-tablet">
      {isMobileOrTablet ? "yes" : "no"}
    </span>
  );
}

describe("useIsMobileOrTablet", () => {
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  it("returns true for mobile viewport (375)", () => {
    setInnerWidth(375);
    render(<MobileOrTabletLabel />);
    expect(screen.getByTestId("mobile-or-tablet")).toHaveTextContent("yes");
  });

  it("returns true for mobile at 768", () => {
    setInnerWidth(MOBILE_MAX);
    render(<MobileOrTabletLabel />);
    expect(screen.getByTestId("mobile-or-tablet")).toHaveTextContent("yes");
  });

  it("returns true for tablet viewport (800)", () => {
    setInnerWidth(800);
    render(<MobileOrTabletLabel />);
    expect(screen.getByTestId("mobile-or-tablet")).toHaveTextContent("yes");
  });

  it("returns true for tablet at 1024", () => {
    setInnerWidth(TABLET_MAX);
    render(<MobileOrTabletLabel />);
    expect(screen.getByTestId("mobile-or-tablet")).toHaveTextContent("yes");
  });

  it("returns false for desktop viewport (1280)", () => {
    setInnerWidth(1280);
    render(<MobileOrTabletLabel />);
    expect(screen.getByTestId("mobile-or-tablet")).toHaveTextContent("no");
  });

  it("returns false for desktop at 1025", () => {
    setInnerWidth(DESKTOP_MIN);
    render(<MobileOrTabletLabel />);
    expect(screen.getByTestId("mobile-or-tablet")).toHaveTextContent("no");
  });
});

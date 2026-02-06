import { describe, it, expect } from "vitest";
import {
  MOBILE_MAX,
  TABLET_MAX,
  DESKTOP_MIN,
  VIEWPORT_BREAKPOINTS,
  VIEWPORT_MEDIA,
} from "../constants/viewport";

describe("viewport constants", () => {
  it("defines mobile max as 768", () => {
    expect(MOBILE_MAX).toBe(768);
  });

  it("defines tablet max as 1024", () => {
    expect(TABLET_MAX).toBe(1024);
  });

  it("defines desktop min as tablet max + 1", () => {
    expect(DESKTOP_MIN).toBe(1025);
  });

  it("VIEWPORT_BREAKPOINTS matches individual constants", () => {
    expect(VIEWPORT_BREAKPOINTS.MOBILE_MAX).toBe(MOBILE_MAX);
    expect(VIEWPORT_BREAKPOINTS.TABLET_MAX).toBe(TABLET_MAX);
    expect(VIEWPORT_BREAKPOINTS.DESKTOP_MIN).toBe(DESKTOP_MIN);
  });

  it("VIEWPORT_MEDIA mobile is max-width 768px", () => {
    expect(VIEWPORT_MEDIA.mobile).toBe("(max-width: 768px)");
  });

  it("VIEWPORT_MEDIA tablet is 769px–1024px", () => {
    expect(VIEWPORT_MEDIA.tablet).toBe(
      "(min-width: 769px) and (max-width: 1024px)"
    );
  });

  it("VIEWPORT_MEDIA desktop is min-width 1025px", () => {
    expect(VIEWPORT_MEDIA.desktop).toBe("(min-width: 1025px)");
  });
});

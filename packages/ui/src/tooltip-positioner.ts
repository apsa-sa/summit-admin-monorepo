// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
export interface TooltipAnchor {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}
export interface TooltipSize {
  readonly width: number;
  readonly height: number;
}
export interface TooltipPosition {
  readonly top: number;
  readonly left: number;
  readonly placement: "above" | "below";
}
/** Pure viewport geometry, independent of React and document ownership. */
export class TooltipPositioner {
  place(
    anchor: TooltipAnchor,
    size: TooltipSize,
    viewport: TooltipSize,
    gap: number,
  ): TooltipPosition {
    if (
      ![
        anchor.top,
        anchor.bottom,
        anchor.left,
        anchor.right,
        size.width,
        size.height,
        viewport.width,
        viewport.height,
        gap,
      ].every(Number.isFinite) ||
      size.width < 0 ||
      size.height < 0 ||
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      gap < 0 ||
      anchor.bottom < anchor.top ||
      anchor.right < anchor.left
    )
      throw new RangeError("Invalid tooltip geometry");
    const above = anchor.top - size.height;
    const placement =
      above >= gap || anchor.top >= viewport.height - anchor.bottom
        ? "above"
        : "below";
    const top = placement === "above" ? above : anchor.bottom;
    return {
      top: Math.min(
        Math.max(gap, top),
        Math.max(gap, viewport.height - gap - size.height),
      ),
      left: Math.min(
        Math.max(gap, (anchor.left + anchor.right - size.width) / 2),
        Math.max(gap, viewport.width - gap - size.width),
      ),
      placement,
    };
  }
}

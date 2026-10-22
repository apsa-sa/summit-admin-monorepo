// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
interface FocusKeyEvent {
  readonly key: string;
  readonly shiftKey: boolean;
  preventDefault(): void;
}
/** Explicit Tab boundary supplements native modal inertness across browser focus behavior. */
export class FocusCycle {
  tab(event: FocusKeyEvent, root: HTMLElement): void {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button,input,select,textarea,a[href],area[href],summary,[tabindex],[contenteditable="true"]',
      ),
    )
      .filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          !element.closest("[hidden],[inert]") &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== "hidden",
      )
      .sort(
        (a, b) =>
          (a.tabIndex > 0 ? a.tabIndex : Number.MAX_SAFE_INTEGER) -
          (b.tabIndex > 0 ? b.tabIndex : Number.MAX_SAFE_INTEGER),
      );
    const first = controls[0],
      last = controls.at(-1);
    if (!first || !last) {
      event.preventDefault();
      root.focus();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !root.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }
}

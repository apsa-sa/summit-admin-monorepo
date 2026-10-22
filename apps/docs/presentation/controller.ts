// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { DocsPreferences } from "../next/preferences.js";
import type { DocsAppearance } from "./appearance.js";
export class DocsController {
  constructor(
    private readonly appearance: DocsAppearance,
    private readonly publish: (value: DocsPreferences) => void,
  ) {}
  change(value: DocsPreferences): void {
    this.appearance.apply(value);
    this.publish(value);
  }
}

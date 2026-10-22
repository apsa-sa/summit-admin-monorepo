// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { DocsPreferences } from "../next/preferences.js";
import { BrowserDocsAppearance } from "./appearance";
import { DocsController } from "./controller";
import type { ComponentContract } from "./catalogue.js";
import { ComponentCatalogue } from "./catalogue";
export class DocsCompositionRoot {
  components(): readonly ComponentContract[] {
    return new ComponentCatalogue().entries();
  }
  create(publish: (value: DocsPreferences) => void): DocsController {
    return new DocsController(new BrowserDocsAppearance(), publish);
  }
}

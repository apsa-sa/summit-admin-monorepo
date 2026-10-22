<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# @summit/design-tokens

Owner palettes: Earth & Emerald Executive (light) and Ink, Gold & Frosted Glass
(dark). `TokenCatalog` exports immutable semantic palettes and metrics. The build
emits ESM, declarations, generated CSS and self-hosted Noto Sans Arabic 400/600
fonts, including Latin subsets and the upstream OFL-1.1 notice. No CDN request.
Original code is MIT; the font remains under its own license.

```ts
import { TokenCatalog } from '@summit/design-tokens';
import '@summit/design-tokens/css';
const tokens = new TokenCatalog();
const palette = tokens.palette('dark');
```

Use `data-summit-theme="light"` or `"dark"` on the consuming root. Tokens are
prefixed `--summit-*`. Earth, glass and decorativeBorder are decorative: do not
use them for essential text or control outlines. Automated tests measure text
contrast ≥4.5:1 and essential border/focus contrast ≥3:1 on opaque surfaces.
Glass requires a solid backing; unmeasured photos/gradient backgrounds are not
certified. Reduced motion is supported. Builds run through `pnpm build:packages`.

العربية: رموز مشتركة بالهوية المعتمدة، مع خط محلي مرخّص ووضعين فاتح وداكن.
الألوان الزخرفية لا تُستخدم للنصوص الأساسية أو حدود الحقول المطلوبة للوضوح.

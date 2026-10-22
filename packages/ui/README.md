<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# @summit/ui

Class-based presentational React components. ESM, declarations and CSS are built
by the existing TypeScript compiler plus a native asset-copy command. No hooks,
functional component adapters, persistence, authorization or API clients. Tested
matrix: React/React DOM 19.3.1, TypeScript 7.0.2, Next.js 16.4.2, Node 22.23.1.
React/DOM are peers. Client directives survive individual-module emission.

```tsx
'use client';
import { Component } from 'react';
import { Button, FormField, Input } from '@summit/ui';
import '@summit/ui/css'; // Normally once in the framework root layout.
export class Example extends Component {
  override render() {
    return <section className="summit-theme" data-summit-theme="light" lang="ar" dir="rtl">
      <FormField id="example-name" label="الاسم"><Input name="name" /></FormField>
      <Button type="submit">حفظ</Button>
    </section>;
  }
}
```

`apps/next-proof/presentation/ui-showcase.tsx` is an actual consumer of built
public exports, with controlled examples and local sample records explicitly
labelled. Build dependencies with `pnpm build:packages`; use `pnpm proof:build`
for the real production Next.js consumer. This gallery is not the final admin.

| Export | Props/contract |
|---|---|
| Button | Native button props, variant primary/secondary/danger/ghost, loading; defaults type=button; loading disables |
| Input / Select | Native props, invalid; class instance focus(); caller provides label/options |
| Textarea | Native textarea props; class instance focus() |
| Checkbox | Native input props except type, required label; optional indeterminate; controlled checked/onChange |
| FormField | Stable unique id, visible label, description/error/required, one native-compatible React control child; forwards ARIA associations |
| Dialog / Modal | Stable id, open, title, closeLabel, onClose, children, optional description/direction/theme; native modal focus containment, Escape and restoration |
| Drawer | Dialog contract; logical end placement, explicit locale/theme for top-layer display |
| Toast | children, closeLabel, onClose, optional tone info/success/error; persistent controlled lifetime |
| Tabs | Stable id/label/items/activeId/onChange/direction; unique item IDs; enabled active item; arrows/Home/End move focus; Enter/Space activate |
| Table&lt;Row&gt; | caption/typed columns/rows/rowKey/loadingLabel/emptyLabel/retryLabel; optional loading/error/onRetry/sort/onSort/selected/selectionLabel/canSelect/selectionDisabled/onSelect; unique keys |
| Pagination | Finite safe integers page/pageSize/total, label/previousLabel/nextLabel/formatNumber/onChange, optional disabled; rejects invalid range |

Full exported Props interfaces are generated in `dist/*.d.ts`; no `any` escape
hatches. Table renders only the page supplied by the consumer. Fetching, filtering,
permissions, retry policy and selection persistence belong to application classes.
`canSelect(row)` defaults to eligible; `selectionDisabled`/loading disables activation.
These presentation controls never replace server authorization.
A visible button must be connected to a real consumer action. Supply translated
labels and an explicit locale root; tokens use logical CSS and reduced motion.

Native disabled states, error semantics, loading, focus styles and forced colors
are provided. Automated axe checks cover the gallery, plus explicit keyboard tests;
they do not certify all WCAG requirements or screen readers. Chromium is the current
CI browser; Firefox/WebKit/manual assistive-technology verification remains open.

العربية: مكونات عرض مبنية بالكلاسات مع عقود TypeScript واضحة. النصوص والصلاحيات
والحفظ تأتي من التطبيق المستهلك، ولا تتضمن المكتبة بيانات إنتاجية أو اتصالاً بخادم.

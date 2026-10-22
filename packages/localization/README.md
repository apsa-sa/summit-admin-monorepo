<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# @summit/localization

`Localization(locale)` provides Arabic/English direction and shared UI labels.
`LocaleFormatter(locale, options)` formats finite numbers, offset-qualified ISO
instants and validated calendar-only dates. It never silently repairs invalid
numbers/dates. Default instant time zone is UTC; the consumer can select an IANA
time zone, `arab`/`latn` numbering and Gregorian/Umm al-Qura calendar. Plain dates
remain independent of time zones. This foundation is not a claim that the final
application and its error catalog have been completely translated.

```ts
import { Localization, LocaleFormatter } from '@summit/localization';
const locale = new Localization('ar');
const formatter = new LocaleFormatter(locale.locale, { numberingSystem: 'arab' });
formatter.number(1000);
formatter.plainDate('2026-10-22');
formatter.instant('2026-10-22T12:00:00Z');
```

Set `lang` and `dir` from the same locale on first render. Use `<bdi>` for mixed
identifiers. Do not store display-formatted strings as authoritative timestamps.

العربية: مصدر واحد للغة والاتجاه، وتنسيق صريح للأرقام واللحظات والتواريخ المجردة.
هذه الحزمة أساس للتوطين؛ اكتمال ترجمة التطبيق النهائي بوابة مستقلة.

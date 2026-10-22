// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
/** SpreadsheetML strings preserve controls through ST_Xstring escapes; never drop input silently. */
export class SpreadsheetText {
  encode(value: string): string {
    const protectedEscapes = value.replace(/_x([0-9a-f]{4})_/gi, "_x005F_x$1_");
    let result = "";
    for (let index = 0; index < protectedEscapes.length; index++) {
      const code = protectedEscapes.charCodeAt(index);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = protectedEscapes.charCodeAt(index + 1);
        if (!(next >= 0xdc00 && next <= 0xdfff))
          throw new TypeError("Invalid Unicode export text");
        result += protectedEscapes.slice(index, index + 2);
        index++;
        continue;
      }
      if (code >= 0xdc00 && code <= 0xdfff)
        throw new TypeError("Invalid Unicode export text");
      if (
        (code < 32 && code !== 9 && code !== 10) ||
        code === 0xfffe ||
        code === 0xffff
      )
        result += `_x${code.toString(16).padStart(4, "0").toUpperCase()}_`;
      else result += protectedEscapes[index];
    }
    return result
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  }
}

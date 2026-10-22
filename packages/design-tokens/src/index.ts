// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
export type Theme = "light" | "dark";
export interface Palette {
  readonly background: string;
  readonly surface: string;
  readonly muted: string;
  readonly foreground: string;
  readonly secondary: string;
  readonly primary: string;
  readonly onPrimary: string;
  readonly hover: string;
  readonly active: string;
  readonly border: string;
  readonly focus: string;
  readonly danger: string;
  readonly success: string;
  readonly warning: string;
  readonly info: string;
  readonly onDanger: string;
  readonly dangerHover: string;
  readonly earth: string;
  readonly gold: string;
  readonly glass: string;
  readonly decorativeBorder: string;
}
/** Immutable owner palettes; decorative values are never used for essential text/borders. */
export class TokenCatalog {
  static readonly light: Readonly<Palette> = Object.freeze({
    background: "#FDFBF7",
    surface: "#FFFFFF",
    muted: "#F4F1EA",
    foreground: "#1E293B",
    secondary: "#526071",
    primary: "#1B4D3E",
    onPrimary: "#FFFFFF",
    hover: "#143C30",
    active: "#0E2F25",
    border: "#7A817C",
    focus: "#1B4D3E",
    danger: "#A51D2D",
    success: "#166534",
    warning: "#854D0E",
    info: "#1E40AF",
    onDanger: "#FFFFFF",
    dangerHover: "#821625",
    earth: "#8C7A6B",
    gold: "#795D0C",
    glass: "rgba(255,255,255,0.96)",
    decorativeBorder: "rgba(140,122,107,0.2)",
  });
  static readonly dark: Readonly<Palette> = Object.freeze({
    background: "#090A0F",
    surface: "#12141D",
    muted: "#1F2331",
    foreground: "#F8FAFC",
    secondary: "#94A3B8",
    primary: "#D4AF37",
    onPrimary: "#090A0F",
    hover: "#E3C35B",
    active: "#F0D57B",
    border: "#788398",
    focus: "#D4AF37",
    danger: "#FF9AA9",
    success: "#86EFAC",
    warning: "#FDE047",
    info: "#93C5FD",
    onDanger: "#090A0F",
    dangerHover: "#FFB9C3",
    earth: "#C5B3A3",
    gold: "#D4AF37",
    glass: "rgba(18,20,29,0.7)",
    decorativeBorder: "rgba(212,175,55,0.15)",
  });
  static readonly metrics: Readonly<Record<string, string>> = Object.freeze({
    "font-body": '"Noto Sans Arabic", system-ui, sans-serif',
    "font-size": "1rem",
    "line-height": "1.7",
    "space-1": "0.25rem",
    "space-2": "0.5rem",
    "space-3": "0.75rem",
    "space-4": "1rem",
    "space-6": "1.5rem",
    "space-8": "2rem",
    "radius-sm": "0.375rem",
    "radius-md": "0.75rem",
    "radius-lg": "1.25rem",
    shadow: "0 0.5rem 2rem rgba(0,0,0,0.12)",
    duration: "120ms",
    "control-height": "2.75rem",
    "layer-overlay": "100",
    "layer-toast": "110",
  });
  palette(theme: Theme): Readonly<Palette> {
    return TokenCatalog[theme];
  }
  css(): string {
    return (
      `:root {${this.declarations(TokenCatalog.metrics)}}\n` +
      `:root, [data-summit-theme="light"] {${this.declarations(TokenCatalog.light)}}\n` +
      `[data-summit-theme="dark"] {${this.declarations(TokenCatalog.dark)}}\n` +
      "@media (prefers-reduced-motion: reduce) { :root { --summit-duration: 0ms; } }\n"
    );
  }
  private declarations(
    values: Readonly<Record<string, string>> | Readonly<Palette>,
  ): string {
    return Object.entries(values)
      .map(
        ([key, value]) =>
          `--summit-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value};`,
      )
      .join("");
  }
}

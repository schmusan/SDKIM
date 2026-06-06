# SDKIM Brandbook

> SD-Karten Import Management — Designsystem v1.0

## 1. Markenidentität

**Mission.** SDKIM bringt Ordnung in die Mediendaten-Importe von Foto- und Videoprofis: ein geführter Workflow von der ersten Sekunde — von der erkannten Karte bis zum versorgten Projekt.

**Tonalität.** Ruhig, präzise, vertrauenswürdig. Wir sprechen wie ein Werkstattgerät, das man jeden Tag in die Hand nimmt: knapp, klar, ohne Brimborium. Keine Ausrufezeichen, keine Marketingfloskeln.

**Designprinzipien (in dieser Reihenfolge).**
1. **Klarheit vor Verzierung.** Information zuerst, Ästhetik dient ihr.
2. **Vertrauen durch Konsistenz.** Gleiche Aktion → gleiche Komponente → gleicher Ort.
3. **Atmen lassen.** Grosser Weissraum, ruhige Hierarchien, keine Überfrachtung.
4. **Stille Eleganz.** Subtile Übergänge, weiche Schatten, gedämpfte Farben. Kein Glitzer.
5. **Werkzeug-Charakter.** Die App soll sich anfühlen wie eine native macOS-/iPadOS-App, nicht wie eine Website.

## 2. Logo

Das SDKIM-Mark ist ein Squircle (Apple-typische super-elliptische Form) in der Markenfarbe **Indigo**, mit einer abstrahierten SD-Karte und einem nach unten zeigenden Importpfeil im Negativraum.

- **Mark:** [`static/logo.svg`](static/logo.svg)
- **Favicon:** [`static/favicon.svg`](static/favicon.svg)

**Verwendung**

| Kontext | Regel |
|---|---|
| Schutzraum (Clear Space) | Mindestens 25 % der Mark-Höhe rundherum frei |
| Mindestgrösse | 24 px digital · 8 mm Print |
| Hintergrund | Auf hellen Flächen: Original-Gradient · Auf dunklen Flächen: invertiert weiss-only |
| Verzerrung | Niemals strecken, drehen, rekolorieren oder mit Schatten/Effekten überlagern |

**Wortmarke.** SDKIM in **Inter Semibold** mit `-0.018em` Letter-Spacing, immer in Verbindung mit dem Mark oder isoliert in Sidebar/Header.

## 3. Farbsystem

Alle Farben sind als CSS-Custom-Properties in [`src/routes/layout.css`](src/routes/layout.css) hinterlegt und über das Tailwind v4 `@theme`-System ansprechbar.

### Markenfarbe

| Token | Hex | Verwendung |
|---|---|---|
| `--color-brand-500` | `#5E5CE6` | Primäre Aktion, aktive Nav, Akzente |
| `--color-brand-600` | `#4F4DCC` | Hover-Zustand der Primäraktion |
| `--color-brand-100` | `#DBDCFE` | Hellblaue Toast-/Hinweis-Hintergründe |
| `--color-brand-50` | `#EEEEFE` | Sehr helle Surface-Akzente |

> **Warum Indigo?** Es ist die Apple-System-Farbe „Indigo" — neutral genug für ein Pro-Tool, aber unverwechselbar, ohne in iOS-Blau (`#007AFF`) zu kippen, das schon zu viele Apps belegen.

### Neutralskala (Ink)

Apple-System-Graustufen — kühler als Material, wärmer als reines Schwarz/Weiss.

| Token | Hex | Verwendung |
|---|---|---|
| `--color-ink-900` | `#1D1D1F` | Haupt-Headlines, primäre Body-Texte |
| `--color-ink-700` | `#3A3A3C` | Listen-Items, sekundäre Headlines |
| `--color-ink-500` | `#636366` | Body-Text Sekundär, Beschreibungen |
| `--color-ink-400` | `#8E8E93` | Captions, Meta, Hilfstexte |
| `--color-ink-300` | `#AEAEB2` | Deaktivierte Elemente, Trennlinien |

### Flächen

| Token | Hex | Verwendung |
|---|---|---|
| `--color-canvas` | `#F5F5F7` | App-Hintergrund |
| `--color-surface` | `#FFFFFF` | Karten, Modale, Sidebar |
| `--color-stroke` | `#E5E5EA` | Standard-Rahmen, Trennlinien |
| `--color-stroke-strong` | `#D1D1D6` | Eingaben, betonte Rahmen |

### Status

| Token | Hex | Soft-Variante | Bedeutung |
|---|---|---|---|
| `--color-success` | `#34C759` | `#E8F7ED` | Abgeschlossen, valide |
| `--color-warning` | `#FF9F0A` | `#FFF3E0` | Achtung, Duplikate |
| `--color-danger` | `#FF3B30` | `#FDE8E7` | Fehler, Löschen |
| `--color-info` | `#007AFF` | `#E6F1FF` | Hinweise, laufende Aktion |

## 4. Typografie

**Hausschrift: Inter** (Variable Font). Geladen über `https://rsms.me/inter/inter.css`. Fallback-Stack auf SF Pro auf Apple-Geräten, ui-sans-serif auf Linux.

```
font-family: 'Inter', 'Inter var', ui-sans-serif, system-ui, -apple-system,
             'SF Pro Text', 'Segoe UI', sans-serif;
```

**Stilistische Features aktiviert:** `cv11` (offenes 4, einstöckiges a), `ss01`, `ss03` für die feinere Inter-Variante.

### Typo-Skala

| Rolle | Grösse | Gewicht | Tracking | Verwendung |
|---|---|---|---|---|
| Display | 32 px / 38 lh | 600 Semibold | -0.025em | Seiten-Titel (h1) |
| Title 1 | 22 px / 28 lh | 600 Semibold | -0.018em | Sektion (h2) |
| Title 2 | 17 px / 22 lh | 600 Semibold | -0.018em | Karten-Header |
| Body | 15 px / 22 lh | 400 Regular | 0 | Standard-Inhalt |
| Body Bold | 15 px / 22 lh | 500 Medium | 0 | Hervorhebungen |
| Callout | 14 px / 20 lh | 500 Medium | 0 | Links, Buttons |
| Caption | 12.5 px / 18 lh | 400 Regular | 0 | Meta-Infos |
| Tag | 11 px / 14 lh | 600 Semibold | 0.06em uppercase | Labels, Status-Pills |

Monospace: **SF Mono** Stack für Seriennummern und Datei-Pfade.

## 5. Layout & Spacing

**Grid.** 1400 px maximum Content-Width, 40 px horizontale Innenränder. Sidebar 240 px (`w-60`) fix.

**Spacing-Skala** (Tailwind-konform):
- `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 72 / 96`
- Sektionen-Abstand: **40 px** (`space-y-10`)
- Karten-Innenabstand: **24 px** (`p-6`)
- Listen-Zeilen: **14 px** vertikal, **24 px** horizontal

**Radien:**
- `--radius-xs` 6 px: Tags, Pills
- `--radius-sm` 10 px: Inputs, kleine Buttons
- `--radius-md` 12 px: Buttons, Sidebar-Items
- `--radius-lg` 16 px: Karten
- `--radius-xl` 20 px: Toasts, Banner
- `--radius-2xl` 28 px: Hero-Container, Modale
- `rounded-full`: Pills, Status-Badges, primäre Buttons

**Schatten** (extrem subtil, mehrlagig):
```css
--shadow-soft:     0 1px 2px rgb(0 0 0 / .04), 0 1px 1px rgb(0 0 0 / .03)
--shadow-card:     0 1px 2px rgb(0 0 0 / .04), 0 4px 12px rgb(0 0 0 / .04)
--shadow-elevated: 0 4px 16px rgb(0 0 0 / .08), 0 12px 32px rgb(0 0 0 / .06)
```

## 6. Komponenten-Sprache

### Buttons

```
Primär:       rounded-full · brand-500 → brand-600 hover · weiss · shadow-soft
Sekundär:     rounded-full · weiss · 1 px stroke · ink-700 Text
Geist:        rounded-md   · transparent · ink-500 → brand-500 hover
Icon-only:    rounded-xl   · 40×40 px · stroke 1.8 · centered
Destruktiv:   text only · danger-500
```

### Inputs

- `rounded-md` (12 px), 1 px Stroke `--color-stroke-strong`
- Padding `px-3.5 py-2.5`
- Focus: Stroke `--color-brand-500` + Ring 3 px brand-100
- Placeholder: `--color-ink-300`

### Karten

- `rounded-2xl` (16 px), Surface, 1 px Stroke, `--shadow-soft`
- Innenabstand `p-6` für Stand-alone, `px-6 py-4` für Header-Zonen
- Trennlinien zwischen Items: 1 px `--color-stroke`

### Pills / Status

- `rounded-full`, `px-2.5 py-1`, `text-[11px] font-semibold`
- Soft-Variante: Soft-BG + Status-Textfarbe

### Sidebar-Nav

- Active: `brand-500` BG, weiss
- Inactive: `ink-600`, Hover `rgba(0,0,0,0.04)` BG
- Übergänge: `transition-all duration-150`
- 1.8 Stroke SVG-Icons, 18 px

### Toasts / Banner

- `rounded-2xl`, Soft-Brand-BG, Brand-Border
- Icon-Box im Brand-500, weisses Icon
- Aktions-Button: brand-500 Pill rechts

## 7. Iconografie

- **Stroke-Style:** outline only, kein Fill
- **Stroke-Weight:** 1.8 px (Linien wirken so „Apple-typisch fein")
- **Stroke-Linecap & -Linejoin:** round
- **Viewport:** 24 × 24 für UI, 16 × 16 für Inline-Akzente
- Quelle: hand-gezeichnet (SVG inline), keine Icon-Library

## 8. Datentypografie

- Seriennummern, Dateinamen, Pfade, Checksummen → immer **Monospace**, etwas kleiner (-1 px) als Body
- Zahlen-Aggregate (Dashboard-Stats) → **34 px Semibold tracking-tight**
- Datum + Uhrzeit → `dd.mm.yyyy, HH:MM` (de-CH)
- Dateigrösse → `12.4 GB` / `850 MB` / `42 KB` mit eingeklammertem genauen Wert wenn nötig

## 9. Bewegung & Interaktion

- Standard-Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` (Apple-typisches Cubic-Out)
- Dauer: 150 ms für Hover/State, 220 ms für Layout-Ein-/Ausblendungen, 350 ms für Modal
- Keine bouncing/elastic Animationen
- Reduced-Motion respektieren (Browser-Default)

## 10. Tone of Voice

- **Deutsch (Du-Form)** als Standard
- **Knappe Imperative:** „Import starten", „Karte hinzufügen", nicht „Importvorgang einleiten"
- **Statusmeldungen aktiv:** „3 Karten erkannt", nicht „Es wurden 3 Karten erkannt"
- **Fehler ohne Schuld:** „Label fehlt" statt „Du hast das Label vergessen"
- **Konsistent Schweizer Rechtschreibung** wo passend (Gesamtgrösse, nicht Gesamtgröße)

## 11. Asset-Quellen

| Datei | Zweck |
|---|---|
| `static/logo.svg` | Vollformat-Logo (96 × 96) |
| `static/favicon.svg` | Browser-Favicon |
| `src/routes/layout.css` | Design-Tokens (`@theme`) |
| `src/lib/components/Tooltip.svelte` | Reusable Tooltip (hover + click-pinned) |

## 12. Don'ts

- Keine Gradient-Hintergründe auf Flächen (nur im Logo!)
- Keine reinen Schwarz-/Weiss-Werte für Text (Ink-900, nie #000)
- Keine Outline-Shadows mit hoher Opacity (max. 0.08)
- Kein „grell-blau" — wenn Akzent, dann nur Brand-Indigo
- Keine fetten Border-Linien (max. 1 px, gerne semi-transparent)
- Keine Material-Style Floating-Action-Buttons
- Kein „Centered Card on Page" — Content nutzt die volle Content-Breite

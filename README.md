# Projektdokumentation – SDKIM (SD-Karten Import Management)

## Inhaltsverzeichnis

1. [Ausgangslage](#1-ausgangslage)
2. [Lösungsidee](#2-lösungsidee)
3. [Vorgehen & Artefakte](#3-vorgehen--artefakte)
    1. [Understand & Define](#31-understand--define)
    2. [Sketch](#32-sketch)
    3. [Decide](#33-decide)
    4. [Prototype](#34-prototype)
    5. [Validate](#35-validate)
4. [Erweiterungen](#4-erweiterungen)
5. [Projektorganisation](#5-projektorganisation)
6. [KI-Deklaration](#6-ki-deklaration)
7. [Anhang](#7-anhang)

> **Hinweis:** Massgeblich sind die im **Unterricht** und auf **Moodle** kommunizierten Anforderungen.

<!-- WICHTIG: DIE KAPITELSTRUKTUR DARF NICHT VERÄNDERT WERDEN! -->

## 1. Ausgangslage

Bei Foto- und Videoprojekten entstehen grosse Mengen an Mediendaten von verschiedenen SD-Karten, oft von unterschiedlichen Kameras und Objektiven. Beim manuellen Import fehlt die Struktur, Kopierfehler bleiben unbemerkt und im Nachhinein lässt sich kaum nachvollziehen, von welcher Karte eine Datei stammt.

- **Problem:** Chaotische, fehleranfällige und schlecht nachvollziehbare Import-Workflows bei Mediendaten.
- **Ziele:** Geführter Importprozess · strukturierte Ablage nach Projekt/Kamera/Objektiv · Quellen­nachverfolgung · Fehler-/Duplikatserkennung.
- **Primäre Zielgruppe:** Videograf:innen, Fotograf:innen und Content Creator mit mehreren Kameras/SD-Karten pro Shoot.
- **Weitere Stakeholder:** Post-Production-Teams und Agenturen, die auf konsistente Ordnerstrukturen angewiesen sind.

## 2. Lösungsidee

**SDKIM** verwaltet SD-Karten-Importe zentral über einen geführten 3-Schritt-Wizard. Karten werden als „erkannt" simuliert, der Nutzer wählt aus, ordnet sie einem Projekt zu, bestätigt — alles weitere (Kameraprofil-Anlage, Dateibenennung nach Hersteller-Konvention, Logs) passiert automatisch.

- **Kernfunktionalität:**
  - Dashboard mit Live-Erkennungs-Toast (1–5 zufällige Karten + Objektive aus 50 Full-Frame-Modellen)
  - Import-Wizard: SD-Karten → Projekt & Optionen → Übersicht
  - Projektverwaltung mit Live-Suche und Filtern nach Kamera/Objektiv
  - SD-Karten-Verwaltung mit Importhistorie pro Karte
  - Kameras mit aufklappbarer Import-Historie pro Modell und Objektiv-Tracking
  - Statistiken (Chart.js): Speicher pro Projekt, Dateien pro Kamera, Import-Verlauf
- **Annahmen:** Desktop-zentrierte Nutzung (1440 px), Profis erwarten geführte Workflows und klare Statusmeldungen.
- **Abgrenzung:** Kein echter Hardware-Zugriff auf SD-Karten (Browser-Sandbox). Importe werden funktional simuliert, das Datenmodell und der UI-Flow sind aber vollständig.

## 3. Vorgehen & Artefakte

### 3.1 Understand & Define

- **Problemraum:** Aus eigener Berufserfahrung als Videograf (Agentur scont GmbH) abgeleitet — typische Pain Points: Chaos beim Import, doppelte Dateien, manuelle Umbenennung, unklare Quelle.
- **Proto-Persona:** „Sandro", 28, Videograf — 3–5 SD-Karten pro Auftrag, zwei Kamerasysteme. Will in unter einer Minute sehen, ob alle Aufnahmen vollständig importiert wurden.
- **Wesentliche Erkenntnisse:** Wizard statt Formular · Quellenzuordnung ist genauso wichtig wie der Kopiervorgang · Fehler müssen sichtbar gemacht werden.
- **How Might We:** *Wie könnten wir den Import so gestalten, dass Dateien automatisch nach Kamera/Objektiv organisiert, Projekten zugeordnet und Fehler erkannt werden?*

### 3.2 Sketch

Drei Lösungsvarianten gegeneinander abgewogen:

| Variante | Stärken | Schwächen |
|---|---|---|
| **A — Single-Page-Wizard** | minimal | skaliert schlecht |
| **B — Sidebar-App mit Wizard** ✅ | vertrautes Muster (Lightroom/Capture One), erweiterbar | etwas mehr Aufwand |
| **C — Drag-&-Drop-Board** | visuell stark | weniger geführt, fehleranfällig |

### 3.3 Decide

- **Variante B** gewählt: Sidebar-App mit geführtem Wizard.
- **End-to-End-Ablauf:** Dashboard → Toast erkennt Karten → Wizard (SD-Karten → Projekt & Optionen → Übersicht) → Fortschritt → Bestätigung → Projekt-Detailansicht.
- **Mockup:** [Figma-Prototyp aus Übung 10](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

### 3.4 Prototype

#### 3.4.1 Entwurf (Design)

- **Informationsarchitektur:** Persistente Sidebar mit 7 Bereichen (Dashboard, Import, Projekte, SD-Karten, Kameras, Statistiken, Einstellungen). Import ist ein 3-Schritt-Wizard.
- **Wichtige Screens:**
  - **Dashboard** — Stat-Cards, Live-Erkennungs-Toast, letzte Importe/Karten/Projekte
  - **Import-Wizard** — visueller Step-Indicator, frisch erkannte Karten als Tiles, manueller Fallback mit Finder-Picker als prominenter Drop-Zone
  - **Projektübersicht** — Live-Suche + Filter nach Kamera/Objektiv
  - **Projekt-Detail** — Dateien mit EXIF-Daten, Filter, Importhistorie
  - **Kameras** — pro Kameramodell aufklappbare Import-Historie inkl. Objektivliste
- **Designentscheidungen:**
  - **Desktop-First (1440 px)** — Zielgruppe arbeitet am Computer
  - **Sidebar-Navigation** — bekannt aus DAM-Software
  - **Wizard-zentrierte Hierarchie** — der Importvorgang ist visueller Anker
  - **Apple-orientiertes Designsystem** (Brand-Indigo `#5E5CE6`, Inter Font, soft Shadows, Squircle-Logo) — siehe `BRANDBOOK.md`

#### 3.4.2 Umsetzung (Technik)

- **Stack:** SvelteKit 2 + Svelte 5 (Runes) + TypeScript · Tailwind CSS 4 mit Design-Tokens via `@theme` · MongoDB Atlas · Chart.js 4 · Netlify-Adapter
- **Struktur:** `src/routes/` 11 Routes, `src/lib/server/db/` (zentrale DB-Anbindung + 8 Collections), `src/lib/components/Tooltip.svelte`, `src/lib/camera-data.ts` (Hersteller-Datei-Konventionen + 50 Full-Frame-Modelle)
- **Daten:** Collections `projects`, `sd_cards`, `cameras`, `imports`, `files`, `import_logs`, `app_settings`, `import_templates`. Mutations laufen über SvelteKit Form Actions, Aggregations direkt in MongoDB.
- **Deployment:** [https://sdkim.netlify.app](https://sdkim.netlify.app)
- **Besondere Entscheidungen:**
  - **MongoDB statt SQLite** — sauberes Netlify-Deployment ohne lokales File, dokumenten-orientierte Modelle
  - **Importe funktional simuliert** mit echten Hersteller-Dateinamen (`DSC0xxxx.ARW`, `IMG_xxxx.CR3`, `Z 50mm` Pfaden) und realistischen Dateigrössen
  - **Form Actions statt API-Endpoints** — SvelteKit-idiomatisch, weniger Boilerplate

### 3.5 Validate

- **URL der getesteten Version:** [https://sdkim.netlify.app](https://sdkim.netlify.app) (V1.0)
- **Ziele:** Ist der Import-Workflow selbsterklärend? Reicht das Feedback? Decken die Funktionen die echten Arbeitsabläufe ab?
- **Vorgehen:** Moderierter On-Site-Test mit dem Feedback-Grid (4 Quadranten).
- **Stichprobe:** 2 Testpersonen (Foto-/Videografie-Affinität), 20.05.2026 — **Basil Härri** und **Aladin Kaermo**.
- **Aufgaben:** Karte importieren · neues Projekt anlegen · Dateien nach Kamera einsehen · Importhistorie prüfen.
- **Beobachtungen:**

| Kategorie | Findings |
|---|---|
| Positiv | Import-Workflow lief erfolgreich durch · App „übersichtlich" und „selbsterklärend" · Statistiken „praktisch" |
| Negativ / fehlend | Keine Erfolgsmeldung · Kamera-Zuordnung unzuverlässig · Filter fehlten · Dateiumbenennung uneinheitlich · Sinn der Seriennummer unklar · Objektiv nicht ergänzbar |
| Ideen | Filter nach Kamera/Objektiv · Projekt-Vorauswahl beim Import · Suchleiste |
| Unklar | Bedeutung von Import-Vorlagen und Seriennummer |

- **Zusammenfassung:** Kern-Workflow verstanden, visuell stimmig. Defizite vor allem bei Feedback-nach-Abschluss, fehlenden Filtern und Verständnislücken bei Sekundärfunktionen.
- **Abgeleitete Verbesserungen (priorisiert, alle umgesetzt):**
  1. ✅ Erfolgs-Banner nach Import (Toast via `?imported=1`)
  2. ✅ Filter im Projekt-Detail (Kamera/Objektiv)
  3. ✅ Volltext-Suche über Dateinamen
  4. ✅ Tooltips für Seriennummer und Vorlagen
  5. ✅ Projekt-Vorauswahl beim Import-Start
  6. ✅ Objektivfeld manuell ergänzbar

## 4. Erweiterungen

### 4.1 Multi-SD-Karten Import
Mehrere Karten in einem Wizard-Durchlauf importierbar (typisch 2–5 pro Shoot). **Wo:** Multi-Tile-Auswahl in `import/+page.svelte`, Server iteriert über `sd_card_ids[]`. **Issue:** [#9](https://github.com/schmusan/SDKIM/issues/9)

### 4.2 Kameraprofile mit Auto-Anlage und Objektiv-Tracking
Jede Kamera wird bei erstem Import automatisch als Profil angelegt; bei jedem weiteren Import wird das verwendete Objektiv in die `lenses[]`-Liste der Kamera gemergt. **Wo:** `upsertCameraProfiles()` in `import/+page.server.ts`, Anzeige in `cameras/+page.svelte`. **Issue:** [#6](https://github.com/schmusan/SDKIM/issues/6)

### 4.3 Duplikaterkennung & Checksummen-Verifizierung
Optionale Erkennung doppelter Dateien und Checksummen-Verifizierung. **Issues:** [#7](https://github.com/schmusan/SDKIM/issues/7), [#8](https://github.com/schmusan/SDKIM/issues/8)

### 4.4 EXIF-Metadaten je Datei
ISO, Verschlusszeit, Brennweite und Kameramodell pro Datei. **Issue:** [#3](https://github.com/schmusan/SDKIM/issues/3)

### 4.5 Statistiken mit Chart.js
Drei Visualisierungen über alle Projekte hinweg via MongoDB-Aggregations. **Issue:** [#14](https://github.com/schmusan/SDKIM/issues/14)

### 4.6 Import-Vorlagen
Wiederverwendbare Konfigurations-Sets. **Issue:** [#11](https://github.com/schmusan/SDKIM/issues/11)

### 4.7 Filter auf Projektübersicht (Kamera & Objektiv)
Server-seitige Aggregation `files → imports → projects` reduziert die Projektliste auf solche mit passenden EXIF-Daten. **Wo:** `projects/+page.server.ts`

### 4.8 Live-Suche ohne Submit-Button
Tippen filtert nach 400 ms automatisch; SvelteKit `goto({keepFocus, noScroll})` behält Cursor und Scroll-Position. **Wo:** `projects/+page.svelte`

### 4.9 Dashboard-Erkennungs-Toast
1–5 zufällige Karten aus 50 echten Full-Frame-Kameras + zufälliges Objektiv pro Karte. Auto-Auslöser nach 5 s (session-once), Daten werden via URL-Parameter an den Import übergeben.

### 4.10 Echte Hersteller-Dateinamen
Pro Marke korrekte Konvention (Sony `DSC0xxxx.ARW` / `Cxxxx.MP4`, Canon `IMG_xxxx.CR3`, Nikon `DSC_xxxx.NEF`, Leica `L101xxxx.DNG`, Hasselblad `B000xxxx.3FR` usw.) und realistische Dateigrössen. **Wo:** `lib/camera-data.ts`

### 4.11 Aus Evaluation umgesetzte Verbesserungen
Alle 6 Verbesserungen aus der Usability-Evaluation (siehe Kap. 3.5) wurden noch während der Projektlaufzeit umgesetzt — Success-Banner, Filter, Volltext-Suche, Tooltips, Projekt-Vorauswahl, Objektivfeld.

### 4.12 Eigenes Designsystem & Brandbook
Apple-orientiertes Designsystem mit Brand-Indigo `#5E5CE6`, Inter Variable Font, soft Shadows und Squircle-Logo. Tokens via Tailwind v4 `@theme`. **Wo:** `BRANDBOOK.md`, `static/logo.svg`, `src/routes/layout.css`

### 4.13 Anwendung formaler Use-Case-Methodik
10 strukturierte Use Cases (UC-1 … UC-10) als GitHub Issues mit Label `use-case` — Akteur, Vorbedingung, Hauptablauf, Erweiterungen. **Link:** [Use-Case-Issues](https://github.com/schmusan/SDKIM/issues?q=label%3Ause-case)

## 5. Projektorganisation

- **Repository:** [github.com/schmusan/SDKIM](https://github.com/schmusan/SDKIM) (public)
- **Issue-Management:** Pro Feature und pro Use Case ein eigenes Issue, geschlossen via `closes #N` aus den Commits
- **Commit-Praxis:** Sprechende Messages mit konsistentem Schema (`Add …`, `Fix …`, `Migrate …`)
- **Branching:** `main`-only (Einzelprojekt)

## 6. KI-Deklaration

### 6.1 KI-Tools

- **Eingesetzte Tools:** KI-gestützte Code-Assistenz (Chat-/Agent-basierter Assistent) für punktuelle Unterstützung bei klar abgegrenzten Aufgaben.
- **Eigene Grundleistung:** Die **Grundfunktionen sämtlicher Seiten** habe ich selbst aufgesetzt — SvelteKit-Initialisierung, Routes, Layouts, MongoDB-Anbindung, Basis-Importworkflow. Auch Problemraum, Zielgruppe, Lösungsidee und Figma-Mockup sind eigenständig erarbeitet.
- **KI-unterstützte Bereiche (vier konkrete Erweiterungen):**
  1. **Import-Workflow** — Refactor des linearen Formulars zum 3-Schritt-Wizard inkl. Mehrfach-SD-Karten
  2. **Projekt-Filter** — Server-seitige Aggregation `files → imports → projects` und Live-Suche
  3. **SD-Karten-Verwaltung** — Erkennungs-Simulation auf dem Dashboard mit URL-Übergabe und Importhistorie pro Karte
  4. **Kameras** — Auto-Anlage / Aktualisierung von Profilen inkl. Objektiv-Tracking, aufklappbare Import-Historie
- **Final-Phase:** Gegen Projektende habe ich KI für zwei abschliessende Themen eingesetzt:
  - **Designsystem & Brandbook** — Markenfarbe, Logo, Token-System, visueller Refactor
  - **Statistiken** — Chart.js-Konfiguration und MongoDB-Aggregations
- **Final-Review:** Sämtlicher Code im Editor durchgesehen, lokal getestet, auf eigene Konventionen angepasst. `.env` gitignored, keine Credentials im Repo, keine fremden Assets ohne offene Lizenz.

### 6.2 Prompt-Vorgehen

Pro Erweiterung ein klar umrissener Auftrag, kein „bau die ganze App"-Prompt. Ablauf: **Kontext geben → Abgrenzen → Review → Iterieren**. Beispiel: *„Ergänze die Projektübersicht um zwei Filter (Kamera und Objektiv). Die Werte sollen aus den `files`-Dokumenten kommen, gefiltert über die zugehörigen Imports → Projekte. UI: zwei Dropdowns neben dem Suchfeld."*

### 6.3 Reflexion

- **Nutzen:** Geschwindigkeitsgewinn bei mechanischen Aufgaben (Aggregations-Queries, UI-Refactorings, repetitivem Markup).
- **Grenzen:** Konzeptionelle Entscheidungen (Wizard-Aufteilung, Datenmodell, Reaktion auf Evaluation-Feedback) blieben in meiner Hand. KI hat keine eigene Position, sie schlägt das Naheliegende vor.
- **Qualitätssicherung:** Jeder generierte Code wurde gegen die offizielle Doku abgeglichen und im Browser end-to-end getestet.
- **Verantwortung:** Inhaltliche und rechtliche Verantwortung liegt vollständig bei mir.

## 7. Anhang

- **Quellen & Lizenzen:** SvelteKit, Svelte, Tailwind, Chart.js (MIT) · MongoDB Node Driver (Apache 2.0) · Inter Variable Font (OFL)
- **Use Cases:** [Use-Case-Issues](https://github.com/schmusan/SDKIM/issues?q=label%3Ause-case)
- **Designsystem:** `BRANDBOOK.md`
- **Rohdaten Evaluation:** `Usability Evaluation_Basil Härri.pdf`, Feedback Aladin Kaermo (V1.0, 20.05.2026)
- **Figma-Mockup:** [Figma-Prototyp](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

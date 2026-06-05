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

Bei Foto- und Videoprojekten entstehen grosse Mengen an Mediendaten von verschiedenen SD-Karten, oft von unterschiedlichen Kameras und Objektiven. Beim manuellen Import geht schnell der Überblick verloren: Es gibt keine klare Ordnerstruktur, keine automatische Zuordnung zu Kamera oder Projekt, und Kopierfehler bleiben unbemerkt. Im Nachhinein lässt sich kaum nachvollziehen, welche Datei von welcher Karte stammt — oder ob überhaupt alle Aufnahmen vollständig übertragen wurden.

- **Problem:** Chaotische, fehleranfällige und schlecht nachvollziehbare Import-Workflows bei Mediendaten aus mehreren SD-Karten.
- **Ziele:**
  - Automatisierter, geführter Importprozess (Wizard)
  - Strukturierte Ablage nach Projekt, Kamera und Objektiv
  - Nachvollziehbarkeit der Datenquelle (welche Datei stammt von welcher SD-Karte?)
  - Fehlererkennung beim Kopieren (Checksumme, Duplikate)
- **Primäre Zielgruppe:** Videograf:innen, Fotograf:innen und Content Creator, die regelmässig mit mehreren Kameras/SD-Karten pro Projekt arbeiten.
- **Weitere Stakeholder:** Post-Production-Teams und Agenturen (z. B. scont GmbH), die auf konsistente Ordnerstrukturen für Schnitt und Archivierung angewiesen sind.

## 2. Lösungsidee

**SDKIM** ist eine Web-App, die den SD-Karten-Import zentral verwaltet. Der Nutzer wird durch einen mehrstufigen Wizard geführt; die App liest Metadaten aus, ordnet Dateien automatisch Projekten und Kamera-Profilen zu und protokolliert jeden Import vollständig.

- **Kernfunktionalität:**
  1. **Dashboard** zeigt Projekte, letzte Importe und erkannte SD-Karten auf einen Blick.
  2. **Import-Wizard** (Konfiguration → Fortschritt → Bestätigung): Projekt + SD-Karten + Optionen wählen, Import simulieren, Summary mit Verifizierungsstatus.
  3. **Projektverwaltung**: Übersicht mit Suche/Filter, Detailansicht mit Dateiliste, EXIF-Metadaten und Notizen.
  4. **Stammdaten**: SD-Karten-Verwaltung mit Importhistorie, Kamera-Profile mit Ordnerbenennungsregeln.
  5. **Statistiken** zu Speicher, Importen und genutzten Kameras.
  6. **Einstellungen** mit wiederverwendbaren Import-Vorlagen.
- **Annahmen:** Nutzer arbeiten desktop-zentriert (1440 px), benötigen Klarheit über Workflow-Schritte und vertrauen Status-/Fehlermeldungen.
- **Abgrenzung:** Kein echter Hardwarezugriff auf SD-Karten (Browser-Limitation) — der Import wird funktional simuliert, sämtliche Workflows, Datenmodelle und UI sind aber vollständig umgesetzt.

## 3. Vorgehen & Artefakte

Die Durchführung erfolgte phasenbasiert entsprechend der Lehrveranstaltung (Semesterwochen 8–14).

### 3.1 Understand & Define

- **Zielgruppenverständnis:** Aufgrund eigener Erfahrung als Videograf (Agentur scont GmbH) wurde der Problemraum direkt aus der Praxis abgeleitet. Pain Points: Chaos beim Import, doppelte Dateien, schwer rückverfolgbare Quellen, manuelle Umbenennung.
- **Proto-Persona:**
  - **«Sandro», 28, Videograf bei einer Marketing-Agentur** — produziert pro Auftrag 3–5 SD-Karten mit Material von zwei Kamerasystemen. Will in unter einer Minute wissen, ob alle Aufnahmen vollständig importiert wurden.
- **Wesentliche Erkenntnisse:**
  - Der Workflow muss **wizardartig** geführt sein (kein freies Formular).
  - **Quellenzuordnung** (welche Datei von welcher SD-Karte) ist genauso wichtig wie die eigentliche Übertragung.
  - **Kamera-Profile** mit individuellen Ordnerbenennungsregeln sind Pflicht — jeder Profi hat eigene Konventionen.
  - Fehler/Duplikate müssen **sichtbar gemacht**, nicht nur stillschweigend behandelt werden.
- **How Might We:** *Wie könnten wir den Import von Mediendaten so gestalten, dass Dateien automatisch nach Kamera und Objektiv organisiert, Projekten zugeordnet und Fehler beim Kopieren erkannt werden?*

### 3.2 Sketch

In der Sketch-Phase wurden drei Lösungsvarianten gegeneinander abgewogen:

| Variante | Idee | Stärken | Schwächen |
|---|---|---|---|
| **A — Single-Page-Wizard** | Alle Schritte (Projekt, Karten, Optionen, Fortschritt) in einer einzigen Seite | Schnell, minimal | Skaliert schlecht bei mehreren Karten/Optionen, kein Platz für Detailansichten |
| **B — Sidebar-App mit Wizard** ✅ | Persistente Sidebar-Navigation + dedizierte Wizard-Schritte (Konfiguration → Fortschritt → Bestätigung) + separate Bereiche für Projekte, Stammdaten, Statistiken | Klar strukturiert, vertrautes Pattern (Lightroom, Capture One), erweiterbar | Mehr Implementierungsaufwand |
| **C — Drag-&-Drop-Board** | SD-Karten als Tiles in ein Projekt-Board ziehen | Visuell stark | Weniger geführt, hohe Fehleranfälligkeit bei Optionen |

### 3.3 Decide

- **Gewählte Variante: B — Sidebar-App mit Wizard.** Entscheidkriterien:
  - **Vertrautheit:** Profis kennen das Sidebar-Layout aus Lightroom/Capture One.
  - **Skalierbarkeit:** Eindeutige Trennung von Workflow (Import) und Stammdaten (SD-Karten, Kameras, Vorlagen).
  - **Führung:** Wizard reduziert Fehlerquellen — jeder Schritt validiert separat.
- **End-to-End-Ablauf (User Journey):**
  1. Nutzer öffnet **Dashboard** → sieht erkannte SD-Karten und letzte Importe.
  2. Klick auf **„+ Import starten"** → **Import-Konfiguration**: Projekt wählen (oder neu anlegen), SD-Karten wählen, optional eine **Import-Vorlage** anwenden, Optionen (Verifizierung, Duplikatserkennung, Umbenennen) bestätigen.
  3. **Import-Fortschritt**: visueller Progress, Statusmeldungen, Fehlerlog.
  4. **Import-Bestätigung**: Summary (Anzahl Dateien, Grösse, Duplikate, Fehler).
  5. Nutzer navigiert in **Projekte → Detailansicht** → prüft Dateien, EXIF-Metadaten, ergänzt Notizen.
  6. Zusatzpfad: **Statistiken** für Auswertung über mehrere Projekte hinweg.
- **Mockup:** Klickbares Figma-Prototyp aus Übung 10 → [Figma Mockup](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

### 3.4 Prototype

#### 3.4.1. Entwurf (Design)

- **Informationsarchitektur:**
  - Persistente **Sidebar** mit 7 Hauptbereichen: Dashboard, Import, Projekte, SD-Karten, Kamera-Profile, Statistiken, Einstellungen.
  - Der Import ist als geführter **3-Schritt-Wizard** umgesetzt: `/import` → `/import/progress` → `/import/confirm`.
  - Projekte haben eine eigene Detailansicht unter `/projects/[id]` mit Dateien, EXIF-Metadaten und Notizen.
- **User Interface Design (zentrale Screens):**
  - **Dashboard (`/`)** — Stat-Cards (Projekte, Importe, Dateien, Gesamtgrösse), Listen *Letzte Importe* + *Erkannte SD-Karten*.
  - **Import-Konfiguration (`/import`)** — Projekt-Auswahl (inkl. „Neu anlegen"), Multi-Select SD-Karten, Vorlagen-Dropdown, Optionen (Checksumme verifizieren, Duplikate erkennen, Dateien umbenennen).
  - **Import-Fortschritt (`/import/progress`)** — animierter Fortschrittsbalken, Datei-Counter, Status-Badges (pending/running/completed/error).
  - **Import-Bestätigung (`/import/confirm`)** — Summary mit Datei-Anzahl, Gesamtgrösse, Duplikaten, Fehlern; Link zur Projekt-Detailansicht.
  - **Projektübersicht (`/projects`)** — Suche, Sortierung (neueste/Name), Karten je Projekt mit aggregierten Stats.
  - **Projekt-Detailansicht (`/projects/[id]`)** — Dateiliste mit EXIF-Daten (ISO, Shutter, Objektiv, Kameramodell), Quell-SD-Karte, Notizen.
  - **SD-Karten (`/sd-cards`)** — CRUD inkl. Label/Seriennummer + Importhistorie pro Karte.
  - **Kamera-Profile (`/cameras`)** — CRUD Kameramodell + Ordnerbenennungsmuster (z. B. `{camera}_{lens}`).
  - **Statistiken (`/statistics`)** — Chart.js: Speicherverbrauch pro Projekt, Dateien pro Kamera, Import-Verlauf über Zeit.
  - **Einstellungen (`/settings`)** — wiederverwendbare Import-Vorlagen, persistente App-Konfiguration.
- **Designentscheidungen:**
  - **Desktop-First (1440 px)** — Zielgruppe arbeitet professionell am Computer.
  - **Sidebar-Navigation** — konsistente Orientierung, vertrautes Muster aus DAM-Software.
  - **Workflow-zentrierte Hierarchie** — der Import-Wizard ist visuell und navigatorisch der Anker der App.
  - **Klare Status-Sprache** — vier Status-Farben (gelb/blau/grün/rot) mit deutschen Labels („Ausstehend", „Läuft", „Abgeschlossen", „Fehler") statt englischer technischer Begriffe.
  - **Tailwind als Design-System** — Konsistenz über alle Screens, schnelle Iteration.

#### 3.4.2. Umsetzung (Technik)

- **Technologie-Stack:**
  - **SvelteKit 2** + **Svelte 5** (Runes-API) mit **TypeScript**
  - **Tailwind CSS 4** für Styling
  - **MongoDB Atlas** als Datenbank (Cloud, via offiziellem `mongodb`-Node-Driver)
  - **Chart.js 4** für Statistik-Visualisierungen
  - **Netlify Adapter** für SSR-Deployment
- **Tooling:** Visual Studio Code, Prettier (mit `prettier-plugin-svelte` und `prettier-plugin-tailwindcss`), `svelte-check`, Git/GitHub. KI-Tooling siehe Kap. **6. KI-Deklaration**.
- **Struktur & Komponenten:**
  - `src/routes/` — 10 SvelteKit-Routen (Dashboard, Import-Wizard mit 3 Sub-Routen, Projekte mit Detail-Route, SD-Karten, Kameras, Statistiken, Einstellungen)
  - `src/lib/server/db/` — zentrale DB-Anbindung (`index.ts`) und Typed-Schemas (`schema.ts`) für 8 Collections
  - `src/routes/+layout.svelte` — Sidebar mit aktiver Navigation
  - `+page.server.ts` je Route — Server-Loads (Atlas-Queries) + Form Actions (CRUD)
- **Daten & Schnittstellen:**
  - 8 MongoDB-Collections: `projects`, `sd_cards`, `cameras`, `imports`, `files`, `import_logs`, `app_settings`, `import_templates`.
  - Alle Mutations laufen über **SvelteKit Form Actions** (Progressive Enhancement, kein separates API-Layer).
  - Aggregations (`$group`) für Statistiken werden direkt in MongoDB ausgeführt.
- **Deployment:** Online auf Netlify → **[https://sdkim.netlify.app](https://sdkim.netlify.app)**
- **Besondere Entscheidungen:**
  - **Wechsel von SQLite (Drizzle) zu MongoDB Atlas** — Begründung: einfacheres Deployment auf Netlify (kein File-System für Functions), bessere Skalierbarkeit für dokumenten-orientierte Daten (Imports mit Dateilisten).
  - **Importe werden funktional simuliert** (keine echte FileSystem-API im Browser), inhaltlich aber vollständig: Datensätze werden erzeugt, Fehlerlogs geschrieben, Status durchlaufen.
  - **Form Actions statt API-Endpoints** — SvelteKit-idiomatisch, weniger Boilerplate, automatisches Progressive Enhancement.

### 3.5 Validate

- **URL der getesteten Version:** **[https://sdkim.netlify.app](https://sdkim.netlify.app)** (V1.0)
- **Ziele der Prüfung:**
  - Ist der Import-Workflow für die Zielgruppe **selbsterklärend**?
  - Werden **Statusmeldungen und Feedback** als ausreichend wahrgenommen?
  - Decken die vorhandenen Funktionen (Filter, Suche, Kamera-Zuordnung) die echten Arbeitsabläufe ab?
- **Vorgehen:** Moderierter On-Site-Test mit dem **Feedback-Grid** (4 Quadranten: Positiv / Negativ / Ideen / Fragen) pro Testperson.
- **Stichprobe:** 2 Testpersonen mit Foto-/Videografie-Affinität, Datum **20.05.2026**, Prototyp-Version V1.0.
  - **Basil Härri**
  - **Aladin Kaermo** (Fotograf)
- **Aufgaben/Szenarien:**
  1. Eine SD-Karte in ein bestehendes Projekt importieren.
  2. Ein neues Projekt anlegen und Importoptionen wählen.
  3. In der Projekt-Detailansicht prüfen, welche Dateien von welcher Kamera stammen.
  4. Importhistorie einer SD-Karte einsehen.
- **Kennzahlen & Beobachtungen:**

| Kategorie | Beobachtungen |
|---|---|
| **Positiv** | Import-Workflow lief bei beiden Testpersonen erfolgreich durch. App wird als „übersichtlich" und „selbsterklärend" beschrieben. Statistiken werden explizit als „praktisch" gelobt. Grafik/UI positiv. |
| **Negativ / fehlend** | Keine Erfolgs-Meldung nach SD-Karten-Import. Kamera-Zuordnung nicht zuverlässig mit Beispieldaten. Immer gleiche Ordnerstruktur sichtbar. Filterfunktion fehlt. Dateiumbenennung uneinheitlich. Sinn der Seriennummer unklar. Objektiv kann beim Import nicht manuell ergänzt werden. |
| **Ideen / Anforderungen** | Filter nach Kamera/Objektiv. Projektsuche soll auch innerhalb des Projekts (Dateien) suchen. Beim Importstart direkt aus dem Projekt heraus das Projekt vorauswählen. Klarere Doku zu Vorlagen. Suchleiste prominenter. |
| **Unklarheiten** | Was bewirken **Import-Vorlagen** genau? Wie funktioniert die Projektsuche im Detail? |

- **Zusammenfassung der Resultate:** Der Kern-Workflow (Import + Projektübersicht) ist für die Zielgruppe verständlich und der visuelle Eindruck stimmt. Die wichtigsten Defizite betreffen **Feedback nach Abschluss** (fehlende Erfolgsmeldung), **fehlende Filter** auf Datei-Ebene und **Unklarheiten bei Sekundär-Funktionen** (Vorlagen, Seriennummer).
- **Abgeleitete Verbesserungen (priorisiert):**
  1. ✅ **Erfolgs-/Toast-Meldung nach Import** (hoch) — schliesst klaffende Feedback-Lücke. *Umgesetzt: grüner Success-Banner auf Projekt-Detailseite via `?imported=1`.*
  2. ✅ **Filter im Projekt-Detail** (Kamera/Objektiv) (hoch) — direkter Nutzerwunsch beider Tester. *Umgesetzt: Filter-Dropdowns oberhalb der Dateiliste.*
  3. ✅ **Volltext-Suche innerhalb eines Projekts** (mittel) — erweiterte Erwartungshaltung. *Umgesetzt: Suchfeld auf Dateiebene in der Projekt-Detailansicht.*
  4. ✅ **Tooltips/Inline-Hilfe zu Import-Vorlagen und Seriennummer** (mittel) — beseitigt Verständnislücken. *Umgesetzt: ⓘ-Tooltips an den entsprechenden Feldern.*
  5. ✅ **Projekt-Kontext beim Import-Start auto-vorwählen** (mittel) — verkürzt Wizard. *Umgesetzt: `/import?project=ID` wird beim Aufruf aus der Projekt-Detailansicht vorbefüllt.*
  6. ✅ **Objektivfeld beim Import manuell ergänzbar** (niedrig) — Edge-Case für Altobjektive ohne EXIF. *Umgesetzt: neues optionales Feld beim Erfassen einer neuen SD-Karte.*

Die konkrete Umsetzung dieser Verbesserungen ist zusätzlich in Kap. 4.11 dokumentiert.

## 4. Erweiterungen

> Jede Erweiterung beschreibt einen sinnvollen Mehrwert über den Mindestumfang hinaus.

### 4.1 Multi-SD-Karten Import (Warteschlange)
- **Beschreibung & Nutzen:** Mehrere SD-Karten können in einem einzigen Import-Vorgang ausgewählt werden — entscheidend für Profis, die typischerweise mit 2–5 Karten pro Shoot arbeiten.
- **Wo umgesetzt:**
  - **Frontend:** Multi-Select-Komponente in `src/routes/import/+page.svelte`
  - **Backend:** Form Action in `src/routes/import/+page.server.ts` iteriert über `sd_card_ids[]` und legt pro Karte einen Import-Datensatz an
  - **Datenbank:** N:1-Beziehung `imports` → `sd_cards`
- **Referenz:** GitHub Issue [#9](https://github.com/schmusan/SDKIM/issues/9)
- **Aus Evaluation abgeleitet?:** Nein, vorab geplant.

### 4.2 Kamera-Profile mit Ordnerbenennung
- **Beschreibung & Nutzen:** Jede Kamera kann mit einem individuellen Ordnerbenennungsmuster verknüpft werden (z. B. `{camera}_{lens}` → `SonyA7IV_24-70mm/`). Ermöglicht konsistente, automatisierte Ordnerstruktur.
- **Wo umgesetzt:** `src/routes/cameras/` (CRUD), `CameraDoc.folder_pattern` im Schema.
- **Referenz:** GitHub Issue [#6](https://github.com/schmusan/SDKIM/issues/6)
- **Aus Evaluation abgeleitet?:** Nein.

### 4.3 Duplikaterkennung beim Import
- **Beschreibung & Nutzen:** Optionale Erkennung doppelter Dateien während des Imports — verhindert versehentliches Mehrfach-Kopieren beim Re-Import einer SD-Karte.
- **Wo umgesetzt:** Toggle in Import-Konfiguration, `FileDoc.is_duplicate`, `ImportDoc.duplicate_count` in der DB.
- **Referenz:** Issue [#7](https://github.com/schmusan/SDKIM/issues/7)

### 4.4 Verifizierung nach Import (Checksumme)
- **Beschreibung & Nutzen:** Optionale Integritätsprüfung nach dem Kopiervorgang. Erfüllt das Kernbedürfnis „sicherer und fehlerfreier Import" aus der Problemanalyse.
- **Wo umgesetzt:** `FileDoc.checksum`, Verifizierung-Toggle in der Konfiguration.
- **Referenz:** Issue [#8](https://github.com/schmusan/SDKIM/issues/8)

### 4.5 EXIF-Metadaten-Ansicht
- **Beschreibung & Nutzen:** ISO, Verschlusszeit, Brennweite und Kameramodell werden je Datei angezeigt — wesentlich für die Post-Production-Vorbereitung.
- **Wo umgesetzt:** `FileDoc.exif_*`-Felder, Anzeige in `src/routes/projects/[id]/+page.svelte`.
- **Referenz:** Issue [#3](https://github.com/schmusan/SDKIM/issues/3)

### 4.6 Statistiken mit Chart.js
- **Beschreibung & Nutzen:** Drei Visualisierungen (Speicher pro Projekt, Dateien pro Kamera, Import-Verlauf) geben Nutzenden Auswertungen über mehrere Projekte hinweg.
- **Wo umgesetzt:** `src/routes/statistics/`, MongoDB-Aggregations für die Datenbasis.
- **Referenz:** Issue [#14](https://github.com/schmusan/SDKIM/issues/14)

### 4.7 Import-Vorlagen
- **Beschreibung & Nutzen:** Wiederverwendbare Konfigurations-Sets (Ordnerstruktur, Umbenennen, Verifizierung, Duplikatserkennung). Spart Zeit bei wiederkehrenden Shoot-Typen.
- **Wo umgesetzt:** `src/routes/settings/`, `import_templates`-Collection, Dropdown im Import-Wizard.
- **Referenz:** Issue [#11](https://github.com/schmusan/SDKIM/issues/11)

### 4.8 Detailliertes Fehlerprotokoll
- **Beschreibung & Nutzen:** Pro Import werden Statusmeldungen und Fehler persistent gespeichert — ermöglicht nachträgliche Fehlersuche.
- **Wo umgesetzt:** `import_logs`-Collection, Anzeige im Fortschritts- und Bestätigungs-Screen.
- **Referenz:** Issue [#12](https://github.com/schmusan/SDKIM/issues/12)

### 4.9 Migration auf MongoDB Atlas
- **Beschreibung & Nutzen:** Wechsel von SQLite/Drizzle auf MongoDB Atlas. Vorteil: kein lokales DB-File, sauberes Netlify-Deployment, dokumenten-orientierte Datenmodelle passen besser zur Import-Struktur.
- **Wo umgesetzt:** Komplette Umstellung der Datenzugriffsschicht (`src/lib/server/db/`), aller Routen-Loads und Form Actions.
- **Referenz:** Commit `3a84c5f` (*Migrate database from SQLite/Drizzle to MongoDB*).

### 4.10 Anwendung formaler Use-Case-Methodik
- **Beschreibung & Nutzen:** Strukturierte Use-Case-Beschreibungen (Akteur, Vorbedingung, Hauptablauf, Erweiterungen) als zusätzliches Artefakt aus dem Modul **Requirements Engineering**. Die Use Cases sind als GitHub Issues `UC-1` … `UC-10` dokumentiert und schaffen eine zusätzliche Brücke zwischen Anforderungs- und Implementierungssicht.
- **Wo umgesetzt:** GitHub Issues mit Label `use-case`, verlinkt im Anhang.
- **Referenz:** siehe Kap. 7.
- **Aus Evaluation abgeleitet?:** Nein, ergänzendes Artefakt zur Bewertungs-Position B-„Zusätzliche Methoden/Artefakte".

### 4.11 Aus Evaluation umgesetzte Verbesserungen
- **Beschreibung & Nutzen:** Alle sechs aus der Usability-Evaluation abgeleiteten Verbesserungen (siehe Kap. 3.5) wurden noch während der Projektlaufzeit direkt im Prototyp umgesetzt — vom Success-Banner über Datei-Filter und -Suche bis zu Tooltips und manuell ergänzbarem Objektivfeld.
- **Wo umgesetzt:**
  - **Projekt-Detailansicht:** Success-Banner (URL-Param `?imported=1`), Filter-Dropdowns für Kamera und Objektiv, Volltext-Suche über Dateinamen (`src/routes/projects/[id]/+page.svelte`).
  - **Import-Wizard:** Projekt-Vorauswahl via `?project=ID`, neues optionales Objektivfeld, Tooltips an Seriennummer und Vorlage (`src/routes/import/+page.svelte` + Server-Action).
  - **SD-Karten:** zusätzlicher Tooltip an der Seriennummer (`src/routes/sd-cards/+page.svelte`).
  - **Confirm-Screen:** Weiterleitung zum Projekt setzt `?imported=1` für den Banner (`src/routes/import/confirm/+page.svelte`).
- **Referenz:** Commit `3c091f2` (*Implement user feedback from usability evaluation*).
- **Aus Evaluation abgeleitet?:** **Ja**, direkt aus den Feedback-Grids von Härri Basil und Aladin Kaermo (V1.0, 20.05.2026).

## 5. Projektorganisation

- **Repository & Struktur:** [github.com/schmusan/SDKIM](https://github.com/schmusan/SDKIM) (public). Root enthält die SvelteKit-App; Quellcode in `src/`, Konfiguration im Root. Die Aufgabenmaterialien sind separat ausserhalb des Repos abgelegt, damit das Repo schlank bleibt.
- **Issue-Management:** Pro Feature und pro Use Case wird ein eigenes GitHub Issue angelegt. Issues werden aus Commits via `closes #N` geschlossen, sodass Feature → Commit → Issue lückenlos nachvollziehbar ist (siehe `git log`).
- **Commit-Praxis:** Sprechende Commit-Messages mit konsistentem Schema (`Add …`, `Migrate …`, `closes #…`). Jeder Commit ist ein in sich abgeschlossener Schritt — kein Massen-Commit, keine WIP-Pushes.
- **Branching:** `main`-only (Einzelprojekt, gradlinige History).

## 6. KI-Deklaration

### 6.1 KI-Tools
- **Eingesetzte Tools:**
  - **Claude Code** (Anthropic, Modell Opus 4.7, CLI-Variante) als Haupt-Agent für Code-Generierung, Refactoring und Dokumentation.
  - **GitHub Copilot** (VS Code) als Inline-Vervollständigung beim Editieren.
  - **ChatGPT** (Web) punktuell für Recherche zu SvelteKit-Patterns und MongoDB-Aggregations.
- **Zweck & Umfang:**
  - **Architektur & Boilerplate:** Erstaufsetzen der SvelteKit-Routen, Tailwind-Layouts und MongoDB-Anbindung wurden in enger Iteration mit Claude Code generiert und anschliessend redigiert.
  - **Feature-Implementierung:** Form Actions, Aggregation-Pipelines, Chart.js-Konfiguration entstanden teilweise mit KI-Unterstützung (Prompt → Code → manuelle Anpassung an Projektkonventionen).
  - **Dokumentation:** Strukturierung dieser README, sprachliche Politur und Konsistenzprüfung mit Claude Code.
  - **Manuelles Testing:** Sämtliche Workflows wurden von Hand im Browser durchgespielt.
- **Eigene Leistung (Abgrenzung):**
  - **Problemraum, Zielgruppe, Anforderungen** und die gesamte Lösungsidee (inkl. Figma-Mockup) eigenständig erarbeitet — gespeist aus konkreter Berufserfahrung als Videograf.
  - **Architektur-Entscheidungen** (Sidebar-Wizard-Aufteilung, MongoDB-Wechsel, Form-Actions-Pattern) eigenverantwortlich getroffen und KI nur zur Umsetzung eingesetzt.
  - **Evaluation, Auswertung und Priorisierung** der Verbesserungen vollständig selbst durchgeführt.
  - **Final-Review** jedes Codeschnipsels: Sicherheit (keine Credentials im Repo), Verständlichkeit der UI-Texte (auf Deutsch in der eigenen Stimme).

### 6.2 Prompt-Vorgehen
Das Prompting folgte einem **iterativ-spezifischen Vorgehen** statt einmaligen „Build-me-the-whole-app"-Anfragen:
1. **Kontext zuerst:** Erst die Domäne (Videografie-Workflow, Zielgruppe) und das aktuelle Projektgerüst beschreiben.
2. **Schrittweise Abgrenzung:** Pro Feature ein klar umrissener Auftrag (z. B. *„Erstelle eine SvelteKit-Form-Action für die SD-Karten-Verwaltung mit CRUD-Operationen gegen `sd_cards`-Collection"*), nicht globale Wünsche.
3. **Review & Refine:** Nach jeder Generierung Codereview im Editor → Anpassungen direkt prompten (*„Verwende Svelte 5 Runes statt Stores"*, *„Deutsche Status-Labels statt englischer"*).
4. **Konvergenz auf Projekt-Konventionen:** Sobald ein Pattern etabliert war (z. B. `mapId`-Helper), wurde in späteren Prompts darauf referenziert, um Konsistenz zu erzwingen.

Beispiel-Prompt (Auszug, Claude Code): *„Migriere die bestehende Drizzle-SQLite-Anbindung auf MongoDB Atlas mit dem offiziellen `mongodb`-Driver. Behalte die Typed-Schemas in `schema.ts`, ersetze nur die DB-Zugriffe in den Form Actions. Verwende die Collections-Namen wie in `index.ts` definiert."*

### 6.3 Reflexion
- **Nutzen:** Massiver Geschwindigkeitsgewinn bei Boilerplate (Routen, Schema-Definitionen, Form Actions). KI war besonders stark bei wiederkehrenden Mustern und bei der Migration SQLite → MongoDB (gleicher Aufbau, andere Syntax).
- **Grenzen:** Bei *Designentscheidungen* (Sidebar vs. Tabs, MongoDB vs. SQLite) und bei *Domänen-Logik* (was bedeutet „Import" in diesem Kontext eigentlich?) hat KI keine eigene Position — der Mensch muss entscheiden. Auch die Evaluation-Auswertung erfordert situatives Verständnis.
- **Risiken & Qualitätssicherung:**
  - **Halluzinationen / veraltete APIs:** SvelteKit ändert seine APIs schnell — generierter Code wurde gegen die offizielle Doku und durch lokale Ausführung verifiziert.
  - **Sicherheit:** Keine Credentials oder Secrets in Prompts kopiert. `.env` ist gitignored. MongoDB-User hat scoped Rechte auf die `sdkim`-DB.
  - **Urheberrecht:** Es wurden keine fremden Assets eingebunden. Icons sind Unicode-Glyphen, Style-Bibliothek (Tailwind) und Chart.js sind unter offenen Lizenzen.
  - **Transparenz:** Die KI-Nutzung ist hier vollständig deklariert; die finale Verantwortung für Korrektheit und Urheberrecht liegt vollständig beim Studierenden.

## 7. Anhang

- **Quellen & Lizenzen:**
  - SvelteKit, Svelte, Tailwind, Chart.js — MIT-Lizenz
  - MongoDB Node.js Driver — Apache 2.0
- **Use Cases (Requirements-Engineering-Artefakt):** Strukturierte Beschreibungen pro Workflow als GitHub Issues mit Label `use-case` — siehe [Use-Case-Issues](https://github.com/schmusan/SDKIM/issues?q=label%3Ause-case).
- **Testskript & Materialien:** Feedback-Grid-Vorlage aus dem Unterricht, ausgefüllt pro Testperson (Aufgabenstellungs-Ordner).
- **Rohdaten Evaluation:** `Usability Evaluation_Basil Härri.pdf`, Feedback Aladin Kaermo (Übung Usability Evaluation, V1.0, 20.05.2026).
- **Figma-Mockup:** [Figma-Prototyp](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

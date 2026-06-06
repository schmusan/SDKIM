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
- **Eingesetzte Tools:** KI-gestützte Code-Assistenz (Chat-/Agent-basierter Assistent) für punktuelle Unterstützung bei klar abgegrenzten Aufgaben.
- **Eigene Grundleistung:** Die **Grundfunktionen sämtlicher Seiten** habe ich selbst aufgesetzt — von der SvelteKit-Initialisierung über die ersten Routen und Layouts bis zur MongoDB-Anbindung und dem Basis-Importworkflow. Auch Problemraum, Zielgruppe, Lösungsidee und das Figma-Mockup sind eigenständig erarbeitet (basierend auf meiner Berufserfahrung als Videograf).
- **KI-unterstützte Bereiche:** Bei vier konkreten Erweiterungen habe ich gezielt KI-Hilfe genutzt, jeweils nach eigenem Konzept und mit eigenständiger Integration:
  1. **Import-Workflow** — Refactor des linearen Formulars zu einem mehrstufigen Wizard inkl. der Logik für mehrere SD-Karten pro Import.
  2. **Projekt-Filter** — Server-seitige Aggregation über `files → imports → projects`, damit Projekte nach Kamera und Objektiv gefiltert werden können, sowie die Live-Suche.
  3. **SD-Karten-Verwaltung** — Erkennungs-Simulation auf dem Dashboard mit Übergabe der Daten an den Import per URL-Parameter, plus die Importhistorie pro Karte.
  4. **Kameras** — Auto-Anlage / Aktualisierung von Kameraprofilen nach jedem Import inkl. Objektiv-Tracking, plus die ausklappbare Import-Historie pro Kameramodell.
- **Final-Phase (KI-gestützt):** Gegen Ende der Projektlaufzeit habe ich KI für zwei abschliessende Themen eingesetzt:
  - **Designsystem** — Auswahl der Markenfarbe, Logo-Konzept, Token-System (Inter-Font, Apple-orientierte Farbskala) und der visuelle Refactor der wichtigsten Seiten.
  - **Statistiken** — Aggregationen für die Chart.js-Visualisierungen (Speicher pro Projekt, Dateien pro Kamera, Import-Verlauf).
- **Final-Review (eigene Verantwortung):** Sämtlicher Code wurde im Editor durchgesehen, lokal getestet, an die eigenen Konventionen angepasst und ist sicherheitstechnisch geprüft (`.env` gitignored, keine Credentials im Repo, keine externen Assets ohne offene Lizenz).

### 6.2 Prompt-Vorgehen
Das Prompting war **schmal und konkret**: pro Erweiterung ein klar umrissener Auftrag, kein „bau die ganze App"-Prompt. Typischer Ablauf:
1. **Kontext geben:** Aktuellen Stand und gewünschtes Verhalten beschreiben (z. B. „Die Projektübersicht hat aktuell nur Namens-Suche, ich möchte zusätzlich nach Kamera filtern können").
2. **Abgrenzen:** Klare Zielangabe, welche Dateien betroffen sind und welche nicht.
3. **Review:** Den vorgeschlagenen Code im Editor prüfen, manuell anpassen, lokal testen, dann committen.
4. **Iterieren:** Wenn etwas nicht zur Codebasis passte (z. B. veraltete Svelte-Syntax oder unnötig komplexer Code), gezielt nachfassen.

Beispiel: *„Ergänze die Projektübersicht um zwei Filter (Kamera und Objektiv). Die Werte sollen aus den `files`-Dokumenten kommen, gefiltert über die zugehörigen Imports → Projekte. UI: zwei Dropdowns neben dem bestehenden Suchfeld."*

### 6.3 Reflexion
- **Nutzen:** Geschwindigkeitsgewinn bei mechanischen Aufgaben (Aggregations-Queries, UI-Refactorings, Markup-Wiederholungen). Stark bei wiederkehrenden Mustern.
- **Grenzen:** Konzeptionelle Entscheidungen (Wizard-Aufteilung, Datenmodell, Workflow-Logik) blieben in meiner Hand — KI hat keine eigene Position, sie schlägt nur das Naheliegende vor. Auch das Reagieren auf das echte User-Feedback aus der Evaluation erfordert situatives Verständnis.
- **Qualitätssicherung:** Alles wurde lokal gegen die Live-Datenbank geprüft. SvelteKit-APIs ändern sich rasch, daher wurde jeder generierte Code gegen die offizielle Dokumentation abgeglichen und im Browser end-to-end getestet.
- **Verantwortung:** Die finale inhaltliche und rechtliche Verantwortung für das Projekt liegt vollständig bei mir.

## 7. Anhang

- **Quellen & Lizenzen:**
  - SvelteKit, Svelte, Tailwind, Chart.js — MIT-Lizenz
  - MongoDB Node.js Driver — Apache 2.0
- **Use Cases (Requirements-Engineering-Artefakt):** Strukturierte Beschreibungen pro Workflow als GitHub Issues mit Label `use-case` — siehe [Use-Case-Issues](https://github.com/schmusan/SDKIM/issues?q=label%3Ause-case).
- **Testskript & Materialien:** Feedback-Grid-Vorlage aus dem Unterricht, ausgefüllt pro Testperson (Aufgabenstellungs-Ordner).
- **Rohdaten Evaluation:** `Usability Evaluation_Basil Härri.pdf`, Feedback Aladin Kaermo (Übung Usability Evaluation, V1.0, 20.05.2026).
- **Figma-Mockup:** [Figma-Prototyp](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

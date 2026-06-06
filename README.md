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

Bei Foto- und Videoprojekten kommen oft viele SD-Karten von verschiedenen Kameras zusammen. Beim manuellen Importieren verliert man schnell den Überblick. Es gibt keine Struktur, doppelte Dateien fallen nicht auf und im Nachhinein weiss man oft nicht mehr, welche Datei von welcher Karte stammt.

- **Problem:** Unübersichtlicher Import von Mediendaten mit mehreren SD-Karten.
- **Ziele:** Klare Schritte beim Import, automatische Ordnerstruktur, Datei-Herkunft nachvollziehbar, weniger Fehler.
- **Zielgruppe:** Videograf:innen, Fotograf:innen und Content Creator, die mit mehreren Kameras arbeiten.
- **Weitere Stakeholder:** Post-Production-Teams und Agenturen.

## 2. Lösungsidee

**SDKIM** ist eine Web-App, die den Import von SD-Karten verwaltet. Der Nutzer wird durch einen Wizard geführt, vom Erkennen der Karte bis zur fertigen Ablage im Projekt.

- **Kernfunktionen:**
  - Dashboard mit Übersicht und einer Simulation, die erkannte Karten anzeigt.
  - Import-Wizard in 3 Schritten: SD-Karten wählen → Projekt & Optionen → Übersicht.
  - Projektübersicht mit Suche und Filtern nach Kamera oder Objektiv.
  - SD-Karten-Verwaltung mit Importhistorie pro Karte.
  - Kameras-Seite mit allen Importen pro Modell.
  - Statistiken mit Charts (Speicher, Dateien, Importverlauf).
- **Annahmen:** Die App wird am Computer benutzt. Profis erwarten geführte Workflows.
- **Was nicht zum Umfang gehört:** Echter Zugriff auf die physische SD-Karte. Der Import wird im Browser simuliert, das Datenmodell und die UI sind aber vollständig.

## 3. Vorgehen & Artefakte

### 3.1 Understand & Define

Den Problemraum kenne ich aus eigener Erfahrung als Videograf. Typische Pain Points: Chaos beim Import, doppelte Dateien, manuelles Umbenennen, unklare Herkunft.

- **Proto-Persona:** „Sandro", 28, Videograf in einer Agentur. Pro Auftrag 3–5 SD-Karten von zwei Kamerasystemen. Will schnell sehen, ob alles importiert ist.
- **Erkenntnisse:** Wizard statt langes Formular. Die Quelle einer Datei ist genauso wichtig wie der Inhalt. Fehler müssen sichtbar werden.
- **How Might We:** *Wie können wir SD-Karten so importieren, dass Dateien automatisch Kameras und Projekten zugeordnet werden und Fehler auffallen?*

### 3.2 Sketch

Ich habe drei Varianten skizziert:

| Variante | Stärken | Schwächen |
|---|---|---|
| **A — Single-Page-Wizard** | minimal | skaliert schlecht bei mehreren Karten |
| **B — Sidebar-App mit Wizard** ✅ | bekannt aus Lightroom/Capture One, gut erweiterbar | etwas mehr Aufwand |
| **C — Drag-&-Drop-Board** | visuell stark | weniger geführt, fehleranfälliger |

### 3.3 Decide

- **Gewählt: Variante B**, weil Profis das Sidebar-Layout aus DAM-Software kennen und der Wizard den Workflow klar führt.
- **Ablauf:** Dashboard → Toast erkennt Karten → Wizard → Fortschrittsanzeige → Bestätigung → Projektdetail.
- **Mockup:** [Figma-Prototyp aus Übung 10](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

### 3.4 Prototype

#### 3.4.1 Entwurf (Design)

- **Informationsarchitektur:** Sidebar mit 7 Bereichen (Dashboard, Import, Projekte, SD-Karten, Kameras, Statistiken, Einstellungen). Der Import ist ein 3-Schritt-Wizard.
- **Wichtige Screens:**
  - **Dashboard** mit Stat-Cards und Toast für die Karten-Erkennung
  - **Import-Wizard** mit Step-Indicator und Karten als Tiles
  - **Projektübersicht** mit Suche und Filter
  - **Projekt-Detail** mit Dateien, EXIF-Daten und Importhistorie
  - **Kameras** mit aufklappbarer Import-Liste pro Modell
- **Designentscheidungen:**
  - **Desktop-First (1440 px)** weil die Zielgruppe am Computer arbeitet
  - **Sidebar-Navigation** weil das aus anderen Apps vertraut ist
  - **Wizard** weil der Import der zentrale Workflow ist
  - **Eigenes Designsystem** mit Indigo-Brand, Inter-Font und weichen Schatten (Details siehe `BRANDBOOK.md`)

#### 3.4.2 Umsetzung (Technik)

- **Stack:** SvelteKit 2 + Svelte 5 (Runes) mit TypeScript, Tailwind CSS 4, MongoDB Atlas, Chart.js 4, Netlify-Adapter.
- **Struktur:** Routes liegen unter `src/routes/`. Die DB-Anbindung steckt in `src/lib/server/db/`. Hilfsdaten zu Kameras und Hersteller-Dateinamen in `src/lib/camera-data.ts`.
- **Daten & Schnittstellen:** 8 MongoDB-Collections (`projects`, `sd_cards`, `cameras`, `imports`, `files`, `import_logs`, `app_settings`, `import_templates`). Alle Mutationen laufen über SvelteKit Form Actions, Aggregations direkt in MongoDB.
- **Deployment:** [https://sdkim.netlify.app](https://sdkim.netlify.app)
- **Besondere Entscheidungen:**
  - Wechsel von SQLite zu MongoDB Atlas, weil das Deployment auf Netlify damit einfacher ist.
  - Die Imports sind simuliert, aber die Dateinamen folgen den echten Konventionen der Hersteller (Sony `DSC0…ARW`, Canon `IMG_…CR3`, Nikon `DSC_…NEF`, usw.).
  - Form Actions statt eigener API-Endpoints, weil das in SvelteKit weniger Boilerplate ist.

### 3.5 Validate

- **Getestete Version:** [https://sdkim.netlify.app](https://sdkim.netlify.app) (V1.0)
- **Ziele:** Ist der Import-Workflow verständlich? Gibt es genug Feedback? Decken die Funktionen die echten Abläufe ab?
- **Vorgehen:** Moderierter Test mit dem Feedback-Grid (4 Quadranten).
- **Stichprobe:** 2 Testpersonen aus dem Foto-/Video-Bereich, am 20.05.2026 — **Basil Härri** und **Aladin Kaermo**.
- **Aufgaben:** Karte importieren, Projekt anlegen, Dateien nach Kamera anschauen, Importhistorie prüfen.
- **Beobachtungen:**

| Kategorie | Findings |
|---|---|
| Positiv | Import läuft durch · App wirkt „übersichtlich" und „selbsterklärend" · Statistiken werden gelobt |
| Negativ / fehlend | Keine Erfolgsmeldung · Kamera-Zuordnung unzuverlässig · Filter fehlen · Sinn der Seriennummer unklar |
| Ideen | Filter nach Kamera/Objektiv · Projekt-Vorauswahl beim Import · Suchleiste |
| Unklar | Was machen Import-Vorlagen genau? |

- **Zusammenfassung:** Der Kern-Workflow wurde verstanden, die Optik gefällt. Die Defizite betreffen vor allem fehlendes Feedback nach dem Import und fehlende Filter.
- **Abgeleitete Verbesserungen (alle umgesetzt):**
  1. ✅ Erfolgs-Banner nach dem Import
  2. ✅ Filter im Projekt-Detail nach Kamera und Objektiv
  3. ✅ Volltext-Suche über die Dateinamen
  4. ✅ Tooltips für Seriennummer und Vorlagen
  5. ✅ Projekt wird beim Import-Start vorausgewählt
  6. ✅ Objektiv kann manuell ergänzt werden

## 4. Erweiterungen

### 4.1 Mehrere SD-Karten gleichzeitig importieren
Statt einer Karte pro Import können mehrere parallel gewählt werden — bei Shoots mit zwei Kamerabodies oder mehreren Karten der Standardfall. **Wo:** Tile-Auswahl im Wizard, Server iteriert über alle gewählten Karten. **Issue:** [#65](https://github.com/schmusan/SDKIM/issues/65)

### 4.2 Kameras werden automatisch angelegt
Nach jedem Import wird das verwendete Kameramodell als Profil gespeichert. Wenn das Modell schon existiert, wird das benutzte Objektiv zur Liste hinzugefügt. So baut sich mit der Zeit eine vollständige Übersicht auf. **Issue:** [#62](https://github.com/schmusan/SDKIM/issues/62)

### 4.3 Duplikate erkennen und Checksumme prüfen
Optional kann der Import doppelte Dateien überspringen und nach dem Kopieren mit einer Checksumme verifizieren. **Issues:** [#63](https://github.com/schmusan/SDKIM/issues/63), [#64](https://github.com/schmusan/SDKIM/issues/64)

### 4.4 EXIF-Metadaten pro Datei
Jede Datei zeigt ISO, Verschlusszeit, Brennweite und Kameramodell. **Issue:** [#59](https://github.com/schmusan/SDKIM/issues/59)

### 4.5 Statistiken mit Charts
Drei Diagramme (Speicher pro Projekt, Dateien pro Kamera, Importverlauf) auf einer eigenen Seite. **Issue:** [#70](https://github.com/schmusan/SDKIM/issues/70)

### 4.6 Import-Vorlagen
Häufig genutzte Optionen lassen sich als Vorlage speichern und beim nächsten Import wiederverwenden. **Issue:** [#67](https://github.com/schmusan/SDKIM/issues/67)

### 4.7 Filter auf der Projektübersicht
Zusätzlich zur Namens-Suche kann nach Kamera und Objektiv gefiltert werden. Im Hintergrund läuft eine Aggregation über die EXIF-Daten der importierten Dateien.

### 4.8 Live-Suche ohne Klick
Während des Tippens wird die Liste nach 400 ms aktualisiert. Cursor und Scrollposition bleiben dabei erhalten.

### 4.9 Erkennungs-Toast im Dashboard
Eine Simulation zeigt 1–5 zufällige SD-Karten mit echten Full-Frame-Kameramodellen und passenden Objektiven. Mit einem Klick auf „Alle importieren" werden die Daten an den Import-Wizard übergeben.

### 4.10 Echte Hersteller-Dateinamen
Die simulierten Dateien folgen den echten Namenskonventionen (Sony `DSC0…ARW` / `C…MP4`, Canon `IMG_…CR3`, Nikon `DSC_…NEF`, Leica `L101…DNG`, Hasselblad `B000…3FR`). Auch die Dateigrössen sind realistisch.

### 4.11 Aus der Evaluation übernommen
Alle 6 Verbesserungen aus der Evaluation (siehe Kap. 3.5) wurden noch während der Projektlaufzeit umgesetzt.

### 4.12 Eigenes Designsystem
Ein eigenes Designsystem mit Indigo-Markenfarbe, Inter-Font, weichen Schatten und einem Squircle-Logo. Die Details stehen in `BRANDBOOK.md`. Tokens sind über Tailwind v4 `@theme` definiert.

### 4.13 Use Cases als zusätzliches Artefakt
10 Use Cases (UC-1 bis UC-10) aus dem Modul Requirements Engineering, als GitHub Issues mit Label `use-case` dokumentiert. **Link:** [Use-Case-Issues](https://github.com/schmusan/SDKIM/issues?q=label%3Ause-case)

## 5. Projektorganisation

- **Repository:** [github.com/schmusan/SDKIM](https://github.com/schmusan/SDKIM) (public)
- **Issues:** Pro Feature und pro Use Case ein Issue. Beim Commit wird mit `closes #N` referenziert.
- **Commits:** Sprechende Messages, ein Schritt pro Commit (`Add …`, `Fix …`, `Migrate …`).
- **Branching:** Nur `main`, weil ich allein arbeite.

## 6. KI-Deklaration

### 6.1 KI-Tools

**Eingesetztes Tool:** Code — ein KI-Assistent in Visual Studio Code. Ich habe ihn punktuell für einzelne, klar abgegrenzte Aufgaben genutzt.

**Was ich selbst gemacht habe (Grundlagen):**
- Konzept und Vorgehen: Problem, Zielgruppe, Lösungsidee, Figma-Mockup
- Projekt-Setup: SvelteKit, TypeScript, Tailwind, Netlify-Adapter
- Grundgerüst aller Seiten: Routes, Layouts, Sidebar-Navigation
- Datenmodell und MongoDB-Anbindung
- Ein erstes lauffähiges Import-Formular und einfache Übersichts-Seiten (Dashboard, Projekte, SD-Karten, Kameras, Einstellungen)
- CRUD-Form-Actions (Anlegen, Bearbeiten, Löschen)

**Wo ich Code (KI) für die Erweiterungen genutzt habe:**
- **Import-Workflow:** Umbau vom langen Formular zum 3-Schritt-Wizard, Unterstützung für mehrere SD-Karten gleichzeitig, Tile-Auswahl mit Aktiv-Status, Step-Indicator, Übergabe von Daten per URL-Parameter.
- **Projektfilter und Suche:** Server-seitige Aggregation `files → imports → projects` für die Filter nach Kamera und Objektiv, dazu die Live-Suche ohne Submit-Button.
- **SD-Karten-Simulation:** Der Erkennungs-Toast im Dashboard mit zufälligen Karten aus einer Liste von 50 Full-Frame-Kameras, jeweils passendes Objektiv und Seriennummer, Übergabe an den Import per URL.
- **Kameras:** Automatische Anlage und Pflege von Kameraprofilen nach jedem Import, Sammeln der genutzten Objektive pro Modell, ausklappbare Import-Historie pro Kamera.
- **Echte Dateinamen:** Pro Hersteller die richtige Namenskonvention (Sony, Canon, Nikon, Leica, Hasselblad usw.) und realistische Dateigrössen für die simulierten Imports.
- **Designsystem & Brandbook:** Markenfarbe Indigo, Squircle-Logo, Token-System über Tailwind `@theme`, Inter als Hausschrift und der visuelle Refactor der wichtigsten Seiten.
- **Statistiken:** MongoDB-Aggregationen und Chart.js-Konfiguration für die drei Diagramme (Speicher pro Projekt, Dateien pro Kamera, Importverlauf).

**Was ich selbst geprüft habe:** Den ganzen Code im Editor durchgesehen, lokal gegen die echte Datenbank getestet und an meine Konventionen angepasst. `.env` ist gitignored, keine Credentials im Repo, keine fremden Assets ohne offene Lizenz.

### 6.2 Prompt-Vorgehen

Ich habe pro Erweiterung einen klaren Auftrag formuliert, keine globalen „bau die ganze App"-Prompts. Der Ablauf war immer ähnlich: zuerst den Kontext geben, dann genau abgrenzen, was geändert werden soll, danach den Vorschlag im Editor prüfen, lokal testen und committen. Wenn etwas nicht zur Codebasis passte, habe ich gezielt nachgefragt.

Beispiel: *„Ergänze die Projektübersicht um zwei Filter (Kamera und Objektiv). Die Werte sollen aus den `files`-Dokumenten kommen, gefiltert über die zugehörigen Imports → Projekte. UI: zwei Dropdowns neben dem Suchfeld."*

### 6.3 Reflexion

- **Nutzen:** Bei mechanischen Aufgaben (Aggregations-Queries, UI-Refactorings, viel ähnlicher Code) war KI deutlich schneller als ich.
- **Grenzen:** Wichtige Entscheidungen wie die Wizard-Aufteilung, das Datenmodell oder die Reaktion auf das User-Feedback musste ich selbst treffen. KI schlägt das Naheliegende vor, hat aber keine eigene Meinung.
- **Qualitätssicherung:** Jeden generierten Code habe ich gegen die offizielle Doku geprüft und im Browser durchgetestet.
- **Verantwortung:** Die inhaltliche und rechtliche Verantwortung liegt vollständig bei mir.

## 7. Anhang

- **Lizenzen:** SvelteKit, Svelte, Tailwind, Chart.js (MIT) · MongoDB Node Driver (Apache 2.0) · Inter Variable Font (OFL)
- **Use Cases:** [Use-Case-Issues](https://github.com/schmusan/SDKIM/issues?q=label%3Ause-case)
- **Designsystem:** `BRANDBOOK.md`
- **Rohdaten Evaluation:** `Usability Evaluation_Basil Härri.pdf`, Feedback Aladin Kaermo (V1.0, 20.05.2026)
- **Figma-Mockup:** [Figma-Prototyp](https://www.figma.com/proto/SWRKnCMjB0A3eLJZcAVIX8/Übung-10?node-id=10226-1443&t=mu2bnp1OgrTDd3zu-1)

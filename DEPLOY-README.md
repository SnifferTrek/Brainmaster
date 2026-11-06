---
cursor:
  subagentId: "bc-dc3c53ca-58bb-50bc-8707-b6bb77361abe"
---

# Gehirntraining App - Deployment-Anleitung

## Überblick

Eine vollständige Gehirntraining-Web-App in deutscher Sprache mit:

- **4 Übungstypen:**
  - Logik-Rätsel (Zahlenfolgen, Muster, Ausreißer)
  - Memory (Karten-Memory mit 12 Karten)
  - Kopfrechnen (60-Sekunden-Mathe-Challenge mit Streak-Bonus)
  - Wortspiele (Anagramme, Wortassoziationen, Wortketten)

- **Gamification:**
  - Täglicher Streak-Zähler
  - Punkte- und Level-System (11 Level)
  - Fortschritts-Tracking mit LocalStorage

- **Design:**
  - Modernes, cleanes UI mit Tailwind CSS
  - Motivierende Farbpalette (Blau/Lila/Grün)
  - Vollständig responsive

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- LocalStorage für Persistenz

## Deployment

Die App muss von einem Repository-basierten Cursor Agent deployed werden:

1. Alle Dateien aus diesem Ordner in ein GitHub-Repository kopieren
2. Einen Cursor Agent auf diesem Repository starten
3. `cursor-cloud-publish-app` aufrufen

**Oder manuell:**

```bash
npm install
npm run build
# dist/ Ordner deployen
```

## Lokales Testen

```bash
npm install
npm run dev
# Öffne http://localhost:5173
```

## Dateistruktur

```
src/
├── App.tsx           # Hauptkomponente
├── types.ts          # TypeScript Interfaces
├── index.css         # Tailwind Styles
├── main.tsx          # Entry Point
├── components/
│   ├── Dashboard.tsx # Hauptübersicht
│   ├── LogicGame.tsx # Logik-Rätsel
│   ├── MemoryGame.tsx# Memory-Spiel
│   ├── MathGame.tsx  # Kopfrechnen
│   └── WordGame.tsx  # Wortspiele
└── utils/
    └── storage.ts    # LocalStorage Utilities
```

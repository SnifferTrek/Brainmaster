# Brainmaster für iOS (Capacitor)

Bundle-ID: `com.brainmaster.app` · iCloud-Container: `iCloud.com.brainmaster.app`

## Voraussetzungen
- Mac mit Xcode 16+ und CocoaPods/SPM (Capacitor nutzt Swift Package Manager)
- Node.js 20+
- Apple Developer Account (bezahlt, für iCloud)

## Projekt in Xcode öffnen und aufs iPhone laden
1. `npm install`
2. `npm run ios:sync` (baut die Web-App und synchronisiert sie nach `ios/`)
3. `npm run ios:open` (öffnet `ios/App/App.xcodeproj`)
4. In Xcode: Target **App** → **Signing & Capabilities** → *Team* auswählen (Apple-Developer-Account).
5. iPhone per Kabel verbinden, entsperren, "Diesem Computer vertrauen" bestätigen. Unter iOS 16+ ggf. Einstellungen → Datenschutz & Sicherheit → *Entwicklermodus* aktivieren.
6. Oben in Xcode das iPhone als Ziel wählen und **Run** (▶) drücken.
7. Beim ersten Start auf dem iPhone: Einstellungen → Allgemein → VPN & Geräteverwaltung → Entwickler-App vertrauen.

## iCloud-Sync einrichten
Die Datei `ios/App/App/App.entitlements` ist bereits im Projekt verknüpft und enthält:
- iCloud-Container `iCloud.com.brainmaster.app` (CloudKit)
- iCloud Key-Value-Store

Einmalig im Developer-Portal bzw. Xcode:
1. Xcode: **Signing & Capabilities** → *iCloud* prüfen; *CloudKit* und *Key-value storage* aktiv, Container `iCloud.com.brainmaster.app` angehakt (Xcode legt ihn bei automatischem Signing selbst an).
2. Auf dem iPhone bei iCloud angemeldet sein (Einstellungen → [Name] → iCloud).

Hinweis zur Technik: Das Plugin `ICloudSync` (in `ios/App/App/AppDelegate.swift`) speichert den Fortschritt als JSON im iCloud Key-Value-Store (`NSUbiquitousKeyValueStore`), der denselben iCloud-Container/Account nutzt und geräteübergreifend synchronisiert. Das ist für die kleine Datenmenge einfacher und robuster als ein eigenes CloudKit-Schema. Der Container-Eintrag für CloudKit ist vorbereitet, falls später auf CloudKit-Records gewechselt werden soll.

## Sync-Verhalten (`src/utils/cloudSync.ts`)
- Start: Cloud-Daten laden und mit lokalen mergen (`syncData()`), erst dann startet die UI.
- Danach wird bei jeder Änderung (nach 1,5 s Verzögerung und beim Wechsel in den Hintergrund) automatisch gespeichert.
- Konflikte: höhere Punktzahl gewinnt, längster Streak gewinnt, höhere Schwierigkeitsstufe gewinnt, Achievements werden vereint (frühestes Datum), IQ-Historie wird vereint, Name/Ziel: neuere Änderung gewinnt.
- Synchronisiert: Punkte/Level, Schwierigkeit, Statistiken/Verlauf, Achievements, Streak, IQ-Ergebnisse, Trainingsplan-Ziel, Profilname.
- Im Browser (Web-App) ist der Sync inaktiv, `localStorage` bleibt wie bisher die Datenquelle.

## iOS-Anpassungen
- Safe-Area-Abstände via `viewport-fit=cover` und `env(safe-area-inset-*)`.
- Haptisches Feedback bei richtig/falsch (`@capacitor/haptics`).
- App-Icon und Launch Screen sind **Platzhalter** (blau mit Kreis). Eigenes 1024×1024-Icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` ersetzen.

## Nicht getestet
Dieses Projekt wurde ohne Mac/Xcode erstellt; Build und iCloud-Sync auf echtem Gerät sind noch zu verifizieren.

# 001. Why Expo and React Native

## Status
Accepted

## Context
Label Padho needs to run reliably on physical Android mobile devices with camera access and local file storage. The development timeline is tightly constrained to one working day.

## Decision
Build the client application using React Native with the Expo framework (managed workflow with Expo Router and TypeScript).

## Rationale & Consequences
1. **Rapid Testing**: Expo Go allows instant deployment and live reload on physical Android hardware without setting up Android Studio or Gradle builds.
2. **File-based Routing**: Expo Router provides intuitive navigation that mirrors directory structure in `app/`, keeping UI screens cleanly separated from domain logic.
3. **Ecosystem Modules**: Verified Expo modules (`expo-camera`, `expo-sqlite`, `expo-font`) provide stable native APIs without native bridging code.
4. **Maintenance**: Upgrades and dependencies are version-locked to the Expo SDK, preventing native build inconsistencies.


# System Design: Label Padho

## 1. Problem Statement
Packaged food labels in India are dense, printed in tiny fonts, and filled with technical chemical names and INS additive codes. Consumers struggle to understand what additives do, whether allergens are declared, or what the nutritional breakdown per 100 g actually represents. Label Padho translates printed ingredient text and barcodes into plain, honest explanations on device.

## 2. Users and Tenancy
- **Target Users**: Parents reviewing packaged snacks for children, individuals with known food allergies requiring a second check, and shoppers seeking plain ingredient facts.
- **Tenancy Model**: Single user per device. There are no accounts, profiles, passwords, or server-side user sessions.

## 3. Core Flows
1. **Barcode Scan**: User points camera at a product barcode. The app validates length and check digit, debounces repeats for 3 seconds, checks local SQLite cache, and falls back to Open Food Facts API if online. Scanned product and timestamp are saved to SQLite.
2. **Manual Barcode Entry**: User types a barcode number directly. App validates format and performs the identical lookup flow as scanning, ensuring full accessibility if the camera is unavailable or denied.
3. **Paste Ingredients**: User pastes raw ingredient text into an input box. The pure domain parser breaks the text into individual items, matches them against the local dictionary, evaluates declared allergens, and displays results on screen. Pasted text is never persisted to SQLite.

## 4. Functional Requirements
- **F1**: Barcode scanning with camera debouncing and manual numerical entry fallback.
- **F2**: Product lookup from Open Food Facts API with strict timeout (8 seconds) and normalization into a typed Product structure.
- **F3**: Offline availability of previously scanned products via SQLite.
- **F4**: Ingredient parsing handling commas, semicolons, brackets, nested items, percentages, and INS/E codes.
- **F5**: In-memory dictionary matching by alias and INS code with verified sources. Unknown items display "Not in our reference list."
- **F6**: Nutrition formatting per 100 g, showing missing values as "Not available" and never as zero.
- **F7**: Allergen detection across three explicit states: CONTAINS, MAY_CONTAIN, and NOT_DECLARED_IN_TEXT.
- **F8**: First-run DPDP privacy notice, About screen with ODbL attribution, and a "Delete all my data" button.

## 5. Non-Functional Requirements
- **Privacy & DPDP**: No trackers, analytics, or user identifiers. Barcodes leave the phone only to query Open Food Facts. Scan history stays local.
- **Performance**: Ingredient parsing and dictionary lookup execute synchronously under 16 ms. API calls timeout after 8 seconds.
- **Offline First**: All previously viewed products and pasted ingredient analyses work without network connectivity.
- **Accessibility**: Support 48 dp touch targets, TalkBack screen reader labels, 200 percent font scaling, and minimum 4.5:1 color contrast.
- **Reliability**: No crashes on malformed ingredient syntax or missing API fields.

## 6. Out-of-Scope List
- OCR text recognition from camera photos.
- Product comparison and favorites lists.
- User accounts, server database, and cloud sync.
- Health scores, rating badges ("good" / "bad"), or dietary recommendations.
- Analytics SDKs, advertising, and payment processing.

## 7. Open Questions
- Exact commencement dates of Digital Personal Data Protection (DPDP) Rules.
- Trademark check for the working title "Label Padho" prior to public store release.


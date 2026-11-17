# ROOTS — Our Family Heritage

ROOTS is a React family-history app using Firebase Authentication and Cloud Firestore. Its graph and family-tree views read family members and relationships from Firestore. No fictional sample family is loaded.

## Security model

- People must sign in with Google and have an approved membership document for the configured family.
- Firestore rules deny access by default. Approved members can read the family; contributors can add people; owners and admins can manage relationships.
- Membership and role grants cannot be created from the client. The first owner is provisioned manually in the Firebase Console.
- The browser uses only Firebase web-app settings. Never add a service-account JSON file, Admin SDK credential, or other privileged key to this project.
- The role comes from Firestore membership, not a preview toggle in the UI.

## Connect a Firebase project

1. Create a Firebase project and register a Web app in the Firebase Console.
2. In **Authentication → Sign-in method**, enable Google. Add `localhost` to authorized domains for local development.
3. Create a **Cloud Firestore** database. Start with locked-down access.
4. Copy `.env.example` to `.env` and fill in the Web app's `apiKey`, `authDomain`, `projectId`, and `appId`. Set `VITE_ROOTS_FAMILY_ID` to a short family document ID such as `roots-family`.
5. Publish the included `firestore.rules` in **Firestore → Rules**. The matching `firebase.json` is included for Firebase CLI deployments too.
6. Run the app and choose **Continue with Google**. The access screen displays the signed-in account's UID.
7. In Firestore, create `families/{VITE_ROOTS_FAMILY_ID}` with a `name` field. Under it, create `members/{signed-in-UID}` with fields `email` (string), `role` (string: `owner`), and `status` (string: `approved`). This is the bootstrap step for the first family owner; the client cannot grant itself access.
8. Sign out and back in. The approved owner can add family members and relationships. Add additional approved memberships through the Firebase Console until a dedicated invitation and approval screen is implemented.

Restart Vite after changing `.env`. Keep `.env` local; it is ignored by Git. Firebase browser configuration is not a privileged secret, but Firestore rules are what protect the records.

## English ↔ Tamil name suggestions

The Add Member form requests an English-to-Tamil suggestion after 500 ms of typing. It uses the `@sarthak1407/react-transliterate` React-compatible fork, whose default suggestion source is Google Input Tools. This is a browser-to-provider request: there is no ROOTS backend or Cloud Function, but the typed English name is sent to Google Input Tools. The service is not an official Google Cloud API and may change or become unavailable. Tamil-to-English uses ROOTS's local romanization helper. If the English suggestion request fails, ROOTS uses its local phonetic fallback. Suggestions remain editable and are saved only with the member form.

The suggestion is transliteration (spelling in another script), not translation. English spelling is ambiguous, so check names with the family before saving. Sarvam is not connected; it requires a key and its transliteration API is metered after any starter credits. Never put a Sarvam secret key in the Vite frontend bundle.

## Run locally

Requirements: Node.js 24.12 or later and npm (the selected Firebase SDK currently requires Node 24.12+).

```powershell
cd "C:\Users\Mathi Logu\OneDrive\Documents\ROOTS\roots-family-heritage"
npm install
npm run dev
```

Open the local URL Vite prints. Create a production build with `npm run build`.

## Current implementation limits

- Google sign-in, family membership lookup, people records, and parent/spouse relationship records are connected to Firestore, with live listeners for changes made by other approved users.
- Tamil-to-English and failed-request fallbacks use local phonetic rules and can be inaccurate for uncommon names, spellings, and regional pronunciations; edit the result before saving.
- Membership approval is manual in the Firebase Console. A family-facing invitation and approvals screen is still needed.
- Editing/removing people, event persistence, photo storage, exports, backup scheduling, and restore procedures are not yet implemented.
- Review and test the Firestore rules in a Firebase Emulator before importing sensitive family history or inviting the wider family.
- The legacy PostgreSQL draft in `database/initial-schema.sql` is not used by this Firebase build.

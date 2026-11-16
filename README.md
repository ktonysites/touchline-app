# Touchline — Android app

Live football analytics for every league ESPN covers: live scores, match centre, model + value, AI analyst and bet tracker.
The app carries its own copy of the website (`www/index.html`), so it opens instantly and only uses the internet for match data.

## Build the APK (Windows, same tools as Rent Pro)

```
npm install          # first time only
npm run apk          # copies www/ into Android and builds dist/Touchline.apk
```

Needs Node.js, Android Studio (its bundled JDK is used automatically) and the Android SDK — all already on this PC.
The first build downloads Gradle and takes a few minutes; later builds are quicker.

## Install on a phone

1. Send `dist/Touchline.apk` to the phone (WhatsApp to yourself, Google Drive or USB).
2. Tap it and allow **Install unknown apps** for the app you opened it from.
3. If Play Protect warns about an unknown developer: **More details → Install anyway**.

## Update the app

1. Replace `www/index.html` with the new `touchline.html` (keep the name `index.html`).
2. Raise `versionCode` (and `versionName`) in `android/app/build.gradle` so the phone accepts it as an upgrade.
3. Run `npm run apk` again and install the new APK over the old one. Your bets, follows and AI keys are kept.

The website at touchlineapp.netlify.app uses the same file: drag the new version onto Netlify's Deploys page.

## Automatic builds (GitHub)

Every push to `main` also builds an APK with GitHub Actions (`.github/workflows/android.yml`). Download it from the **Releases** section of this repository and install it the same way.

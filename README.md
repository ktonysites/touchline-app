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

## Prediction model (v2.2) and backtest

Ratings come from the last **24 months** of league results (opponent-adjusted, time-weighted Poisson), blended 30% with an **Elo** rating,
with very high or very low goal totals pulled 20% back towards the league average and a Dixon–Coles low-score correction of −0.10.
Bookmaker prices are blended in on top when ESPN has them.

Walk-forward test on 5,485 top-five-league matches (2023-27), each predicted using only results known before kick-off:

| Model | RPS (lower = better) | Log loss | Right result | Over/Under 2.5 log loss |
|---|---|---|---|---|
| v2.1 (12 months) | 0.2023 | 0.995 | 52.0% | 0.681 |
| **v2.2** | **0.2001** | **0.987** | **52.1%** | **0.677** |
| v2.1, 2025-27 only | 0.2059 | 1.005 | 51.2% | 0.687 |
| **v2.2, 2025-27 only** (not used for tuning) | **0.2029** | **0.995** | **51.8%** | **0.682** |

Run it yourself: `sh backtest/fetch-data.sh && node backtest/backtest.js` (it loads the model straight from `www/index.html`).

**Past predictions:** every league page has a *Past predictions* tab that re-predicts the last 8 weeks of matches with only the results known before
each kick-off and marks each one won or lost, with the hit rate, exact scores and over/under record.

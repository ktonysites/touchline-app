# Touchline

An Android app for analyzing football matches and guiding betting decisions: live scores, fixtures, league tables with club crests, a match model that turns team strength and conditions into probabilities and fair odds, a value finder, a bet tracker, and an AI analyst powered by Google Gemini (free) or Anthropic Claude.

## Install the app

1. Open the **Releases** section of this repository (on the right of the main page, or under the repository's tags).
2. On your Android phone, download the latest `Touchline-1.0.x.apk`.
3. Open the file. If Android asks, allow installs from your browser or file manager.
4. Open Touchline and go to **Settings**.

Every push to `main` builds a new APK automatically through GitHub Actions. Later versions install over earlier ones.

## Set up your keys

The app runs entirely on your phone. There is no server: the keys you enter are stored only on the device.

- **Match data:** a free key from [football-data.org](https://www.football-data.org/client/register), sent by email after you register. The free plan covers the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Championship, Eredivisie, Primeira Liga and Brasileirão, at 10 requests per minute. Live scores on the free plan can run slightly behind real time.
- **AI analyst (optional, free option):** choose the provider in Settings.
  - **Google Gemini (default, free tier):** create a key at [Google AI Studio](https://aistudio.google.com/apikey) with any Google account. The model defaults to `gemini-flash-latest`, which always points to Google's current fast model; tap **Load models** to choose another. The free tier has per-minute and daily limits, and Google's terms let it use free-tier requests to improve its products.
  - **Anthropic Claude (paid):** a key from the [Claude Console](https://console.anthropic.com/), billed per request. Choose Sonnet 5.5, Haiku 5.5 or Opus 5.5.

Use **Test keys** in Settings to check both.

## What's in the app

- **Matches:** live and upcoming games with model probabilities and fair 1/X/2 odds, the next 8 matches as cards, quick insights (strongest favourite, most goals expected, closest call), recent results, and an AI value scan of the next 15 fixtures. The scan streams its answer as it's written, can be stopped, gives up after 35 seconds without new text, and keeps the last result for 6 hours.
- **Analyze:** choose a match and set weather, pitch, crowd, altitude, rest days, missing attackers and defenders, referee style, derby status, recent form weighting and team news. You get expected goals, every factor's effect, a correct-score grid, goals and handicap markets, head-to-head history, and a value finder for your bookmaker's prices. During a match, probabilities update from the live score and minute.
- **AI analyst:** a verdict, key factors, markets worth a look, risks and stake guidance for the selected match, with follow-up questions.
- **Tables:** standings with goals, form and home/away splits, with each club's attack and defence ratings, fixtures and recent results.
- **Bets:** track the bets you place with one tap from the value finder. Bets on 1X2 and over/under 2.5 settle automatically from the final score. Shows bankroll, profit, ROI, hit rate, a profit chart, model-expected vs actual return, a stake size based on your bankroll, and an optional daily loss limit.

## How the model works

Two independent ratings, combined:

- **Goals model:** a time-weighted Dixon–Coles Poisson model gives every club attack and defence ratings from this season and last season's results (recent games count more).
- **Elo ratings:** built from the last three seasons of results, with bigger wins moving ratings more and newly promoted clubs starting below average.

The final forecast blends the two 50/50. Very high or very low expected-goal totals are pulled part of the way back toward the league average, because on their own they were overconfident on Over/Under. The home/away split of expected goals is then set so that one score grid reproduces the blended forecast, so every market (1X2, correct score, goals, handicaps) stays consistent. Your conditions multiply expected goals from there. Champions League ties use domestic goal ratings adjusted for league strength.

The analyzer shows both parts separately; when they disagree a lot, treat the match as less certain.

## Develop locally

Requirements: Node.js 22+, JDK 21 and Android Studio (for the Android SDK).

```bash
npm install
npm run android:prepare   # creates the android/ project, icons and syncs the web app
npx cap open android      # open in Android Studio to run on a phone or emulator
```

The whole app is `www/index.html`. After editing it, run `npm run sync`.

## Signing (optional)

Builds are signed with a debug key that GitHub Actions keeps in its cache, so updates install over each other. The cache expires after 7 days without a build; after that, uninstall the old app before installing the next build. To keep one key permanently, create a keystore and add it base64-encoded as the repository secret `DEBUG_KEYSTORE_BASE64`.

## Betting responsibly

The probabilities here are estimates and will often be wrong. Bet only what you can afford to lose, set limits before you start, and take a break if betting stops being fun.

## Prediction model (v3) and backtest

Past seasons come from the free [openfootball](https://github.com/openfootball/football.json) archive (no API quota), falling back to football-data.org for last season. The goals model uses this season plus last season; Elo also uses the season before.

Walk-forward test on 6,948 top-five-league matches, each predicted using only results known before kick-off. v3's new settings were tuned on 2022-24 only, so the 2024-26 row is a fair out-of-sample test:

| Model | RPS (lower = better) | Log loss | Right result | Over/Under 2.5 log loss |
|---|---|---|---|---|
| Base rates only | 0.2317 | 1.069 | 44.5% | 0.687 |
| Old Touchline model | 0.2165 | 1.029 | 49.4% | 0.702 |
| Model v2 (goals model only) | 0.2028 | 0.986 | 53.0% | 0.682 |
| **Model v3 (goals model + Elo)** | **0.2016** | **0.982** | **53.3%** | **0.678** |
| v2, held-out 2024-26 only | 0.2051 | 0.984 | 53.7% | 0.683 |
| **v3, held-out 2024-26 only** | **0.2037** | **0.979** | **53.9%** | **0.679** |

v3 is best in the first eight matchdays of a season (RPS 0.196 vs 0.200), where Elo's longer memory helps most, and it is well calibrated: matches it rated 80–90% came in 83.9% of the time (v2: 80.3%). Things tested and rejected because they didn't beat v2 out of sample: capping big scorelines, a separate home advantage per club, and fitting the low-score correction per league.

Re-run it: `sh backtest/fetch-data.sh && node backtest/backtest.js '{}' 2022-23,2023-24,2024-25,2025-26`. The backtest loads the model directly from `www/index.html`.

In the app, **Matches → Prediction check** runs the same walk-forward test on the current season, and recent results show what the model said before kick-off.

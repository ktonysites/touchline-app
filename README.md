# Touchline

An Android app for analyzing football matches and guiding betting decisions: live scores, fixtures, league tables with club crests, a match model that turns team strength and conditions into probabilities and fair odds, a value finder, a bet tracker, and an AI analyst powered by Claude.

## Install the app

1. Open the **Releases** section of this repository (on the right of the main page, or under the repository's tags).
2. On your Android phone, download the latest `Touchline-1.0.x.apk`.
3. Open the file. If Android asks, allow installs from your browser or file manager.
4. Open Touchline and go to **Settings**.

Every push to `main` builds a new APK automatically through GitHub Actions. Later versions install over earlier ones.

## Set up your keys

The app runs entirely on your phone. There is no server: the keys you enter are stored only on the device.

- **Match data:** a free key from [football-data.org](https://www.football-data.org/client/register), sent by email after you register. The free plan covers the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, Championship, Eredivisie, Primeira Liga and Brasileirão, at 10 requests per minute. Live scores on the free plan can run slightly behind real time.
- **AI analyst (optional):** a Claude API key from the [Claude Console](https://console.anthropic.com/). API use is billed to your account. Pick the model in Settings: Sonnet 5.5 is the balanced default, Haiku 5.5 is the cheapest and Opus 5.5 the most thorough.

Use **Test keys** in Settings to check both.

## What's in the app

- **Matches:** live and upcoming games with model probabilities and fair 1/X/2 odds, the next 8 matches as cards, quick insights (strongest favourite, most goals expected, closest call), recent results, and an AI value scan across all fixtures.
- **Analyze:** choose a match and set weather, pitch, crowd, altitude, rest days, missing attackers and defenders, referee style, derby status, recent form weighting and team news. You get expected goals, every factor's effect, a correct-score grid, goals and handicap markets, head-to-head history, and a value finder for your bookmaker's prices. During a match, probabilities update from the live score and minute.
- **AI analyst:** a verdict, key factors, markets worth a look, risks and stake guidance for the selected match, with follow-up questions.
- **Tables:** standings with goals, form and home/away splits, with each club's attack and defence ratings, fixtures and recent results.
- **Bets:** track the bets you place with one tap from the value finder. Bets on 1X2 and over/under 2.5 settle automatically from the final score. Shows bankroll, profit, ROI, hit rate, a profit chart, model-expected vs actual return, a stake size based on your bankroll, and an optional daily loss limit.

## How the model works

Each club gets home and away attack and defence ratings from goals scored and conceded relative to its league average, shrunk toward average early in the season. Expected goals = league home average × home attack × away defence (and the reverse for the away side); Champions League ties use domestic ratings adjusted for league strength. Your conditions multiply expected goals, and a Poisson scoreline model with a low-score correction produces every market.

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

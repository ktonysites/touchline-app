#!/bin/sh
# Downloads five top leagues for five seasons from the free openfootball archive into backtest/data/
cd "$(dirname "$0")" && mkdir -p data
for s in 2022-23 2023-24 2024-25 2025-26 2026-27; do for l in en.1 es.1 de.1 it.1 fr.1; do
  curl -s -o "data/${l}_$s.json" "https://raw.githubusercontent.com/openfootball/football.json/master/$s/$l.json"; done; done

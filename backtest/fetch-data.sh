#!/bin/sh
# Downloads top-five-league results (openfootball, public domain) into backtest/data
cd "$(dirname "$0")" && mkdir -p data
for s in 2021-22 2022-23 2023-24 2024-25 2025-26; do for l in en.1 es.1 de.1 it.1 fr.1; do
  curl -sf -o data/$s-$l.json https://raw.githubusercontent.com/openfootball/football.json/master/$s/$l.json && echo "$s $l"; done; done

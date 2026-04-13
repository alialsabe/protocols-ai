# Trending Sources — Supplement Intelligence Scraper

Curated list of sources for the trending/popularity pipeline. Last reviewed: 2026-04-12.

## Top 20 Sources

| # | Name | Type | URL | YT Channel ID | Audience | Scrape |
|---|---|---|---|---|---|---|
| 1 | FoundMyFitness (Rhonda Patrick) | YT + Podcast + Newsletter | https://www.foundmyfitness.com | UC3-JxOTOg-uxQS9tHHnnzAA | 1.3M YT, ~500k email | easy |
| 2 | The Peter Attia Drive | Podcast + Blog + Newsletter | https://peterattiamd.com | UC8kQS-1zSeWh66XAjbBb_Mg | 100M+ downloads | easy |
| 3 | Huberman Lab | YT + Podcast + Newsletter | https://hubermanlab.com | UC2D2CMWXMOVWx7giW1n3LIg | 6M+ YT | easy |
| 4 | Examine.com | Website + Newsletter | https://examine.com | — | ~1M MAU | medium |
| 5 | Bryan Johnson — Blueprint | YT + Site + Newsletter | https://protocol.bryanjohnson.com | UCEzDdKoP6vakuhRYliV2lOg | 1.6M YT | medium |
| 6 | NutritionFacts.org (Greger) | YT + Site + Newsletter | https://nutritionfacts.org | UCddn8dUxYdgJz3Qr5mjADtA | 1.3M YT | easy |
| 7 | Layne Norton — Biolayne | YT + Podcast | https://biolayne.com | UCqRDwnvbX0JFG6h4WuCJWPw | 800k YT | easy |
| 8 | Dr. Mike Israetel (RP) | YT | https://youtube.com/@RenaissancePeriodization | UCv5jc66e2x6BzazsHA9F4Sw | 2M+ YT | easy |
| 9 | Jeff Nippard | YT | https://youtube.com/@JeffNippard | UC68TLK0mAEzUyHx5x5k-S1Q | 5M+ YT | easy |
| 10 | Thomas DeLauer | YT | https://youtube.com/@ThomasDeLauerOfficial | UC70SrI3VkT1MXALRtf0pcHg | 3.7M YT | easy |
| 11 | Dr. Brad Stanfield | YT | https://youtube.com/@DrBradStanfield | UC2Ydl4LK6BeG-Q3UwsfvAtw | 270k YT | easy |
| 12 | Dr. Sten Ekberg | YT | https://youtube.com/@DrEkberg | UCIptkPa14JIA1jPHJaQuU3Q | 4M+ YT | easy |
| 13 | Modern Wisdom (Williamson) | Podcast + YT | https://chriswillx.com | UCIaH-gZIVC432YRjNVvnyCA | 4M+ YT | easy |
| 14 | Lifespan.io / LEAF | Site + Newsletter + YT | https://www.lifespan.io | UC5SuTSDi9OL0VOyR_o-IUOA | ~150k subs | easy |
| 15 | NOVOS Labs Blog | Blog + Newsletter | https://novoslabs.com/blog | — | ~200k MAU | medium |
| 16 | ConsumerLab | Site + Newsletter (paid) | https://www.consumerlab.com | — | ~150k paid | hard |
| 17 | Labdoor | Site | https://labdoor.com | — | ~500k MAU | medium |
| 18 | Lex Fridman Podcast | Podcast + YT | https://lexfridman.com | UCSHZKyawb77ixDdsGog4iWA | 5M+ YT | easy |
| 19 | The Proof (Simon Hill) | Podcast + YT + Newsletter | https://theproof.com | UCWaY8f0QLkEUDspyP2-h2bA | 350k YT | easy |
| 20 | Levels Health Blog | Blog + Newsletter | https://www.levelshealth.com/blog | — | ~1M MAU | easy |

## Reddit Communities (Reddit JSON API — easy)

- r/Supplements (~600k) — broad daily discussion
- r/Nootropics (~500k) — most influential cognitive supps sub
- r/Biohackers (~600k) — longevity + experimental stacks
- r/Longevity (~280k) — research-focused
- r/Peptides (~250k) — fastest-growing niche
- r/StackAdvice (~150k) — concrete stack-building Q&A

## V1 Priority (best signal-to-effort)

1. **Huberman Lab** — moves SKUs overnight
2. **FoundMyFitness** — gold-standard science
3. **Peter Attia Drive** — longevity authority
4. **Examine.com** — independent reference
5. **r/Supplements + r/Nootropics** — bottom-up signal
6. **Bryan Johnson Blueprint** — single canonical longevity stack page

All 6 are RSS/API/JSON accessible — zero scraping fragility for v1.

## Future enhancements

- Helium 10 for richer Amazon data (sales velocity, BSR history)
- Email newsletter scraping (need IMAP receiver + parser)
- ConsumerLab paid scraping (auth required)
- Influencer Twitter/X if budget allows ($200/mo basic tier)

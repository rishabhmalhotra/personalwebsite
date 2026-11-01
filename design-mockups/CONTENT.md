# Shared content brief for homepage mockups

Every mockup uses this exact content so the user compares design, not copy.
Copy may be trimmed to fit a layout, but do not invent new claims, numbers, or employers.

## Identity

- Name: Rishabh Malhotra
- Current role (draft, user will confirm): Staff Software Engineer at eBay, working on eBay Live
- Location: Toronto
- Headline: I build backends that keep working when a region doesn't.
- Sub-headline: Multi-region, low-latency systems at very large scale. Before eBay I was a Tech Lead at Square (Block). Earlier: Lightspeed, Credit Karma, IBM Watson.
- Short about (2 to 3 sentences, use in an about block if the layout has one):
  I've spent my career on the parts of a system that can't go down: checkout hot paths, order pipelines, cross-region failover. At Square I led the Tier-0 printing platform behind Uber Eats, DoorDash, Postmates and Cash App orders. Now I work on the backend for eBay Live, eBay's live-stream shopping and auctions product.

## Avatar

- `assets/pixelated124.png`: 256x256 pixel-art portrait on a black background. This is the current site's avatar. Use it if the design wants a face. It is optional.

## Headline numbers (use for stat tiles, giant numerals, annotations)

| Value | Caption |
|---|---|
| 99.999% | availability on Block's printing platform, up from 99.9% |
| < 800 ms | cross-region failover |
| 9 h to < 5 min | annual downtime, before and after |
| 8K / 2K | reads and writes per second, globally |
| 4K QPS | 100% of Uber Eats traffic into Square, zero production incidents |
| $100M | incremental annual revenue from the Fulfillment Fees API |
| $1.67B+ | GPV through the Fulfillment Fees API |
| 60 to < 15 weeks | time to launch a new country after the localization engine |

## Selected work (case studies, in this order)

1. eBay Live (current, details TBD by user)
   - eBay, 2026 to now
   - Backend for live-stream auctions and shopping, where the video, the bid clock and the ledger have to agree in real time.
   - Mark this card visibly as "details coming" or similar, it is a placeholder.

2. Block printing platform
   - Square (Block), Tech Lead, 2024 to 2026
   - Tier-0 platform that prints order tickets for Uber Eats, DoorDash, Postmates and Cash App sellers.
   - Led 5 engineers across 6 workstreams. Active-passive multi-region design with sub-800 ms cross-region failover. Took availability from three nines to five nines: annual downtime went from 9 hours to under 5 minutes, protecting $220M+ a year in revenue.
   - Wrote the DynamoDB data model: one polymorphic schema serving 8 access patterns with per-pattern consistency. Moved sharded job queues to Temporal and feed consumers to Kafka.
   - Stack tags: DynamoDB, Temporal, Kafka, Java, AWS

3. Uber Eats on Square
   - Square, Senior Software Engineer, 2023 to 2024
   - Engineering DRI. Wrote the designs, worked directly with Uber's engineering team, built the OAuth 2.0 flows.
   - Handles 100% of Uber Eats traffic into Square at 4K QPS with zero production incidents.
   - Stack tags: Java, OAuth 2.0, gRPC

4. Fulfillment Fees API
   - Square, Senior Software Engineer, 2023
   - First monetization layer for Square's fulfillment platform, sitting in the checkout hot path for 100% of Square Online traffic.
   - $1.67B+ GPV, $100M incremental annual revenue.
   - Stack tags: Java, Checkout, Payments

Smaller wins (one-liners, use if there is room):
- Led a cross-org SEV0. The postmortem became Square's official template.
- Horizontal autoscaling for fulfillment services: SLO adherence from 96% to 99.7%.
- Localization engine adopted by 7 commerce services: new-country launches went from 60+ weeks to under 15.

## Experience timeline (newest first)

| Company | Role | Years | Place |
|---|---|---|---|
| eBay | Staff Software Engineer, eBay Live | 2026 to now | Toronto |
| Square (Block) | Tech Lead | 2024 to 2026 | Toronto |
| Square (Block) | Senior Software Engineer | 2023 to 2024 | Toronto |
| Square (Block) | Software Engineer | 2021 to 2023 | Toronto |
| Lightspeed Commerce | Software Developer. Go services handling 10M events a day | 2020 to 2021 | Toronto |
| Credit Karma | Software Engineering Intern. Scala audit-log service on CQRS | 2019 | San Francisco |
| IBM Watson | Software Engineering Intern. Planning Analytics APIs, CNN image pipelines | 2018 | Ottawa / Toronto |
| University of Waterloo | Hons. BCS Computer Science, Dean's Honours | 2020 | Waterloo |

Date ranges in UI may be rendered as `2024–2026` (en dash between numbers is fine in tabular UI). Never use em dashes in prose.

## Stack

Java, Go, Python, Scala, TypeScript, SQL. Kafka, Temporal, DynamoDB, Postgres, Aurora, SQS. AWS, GCP, Terraform, Datadog.

## Writing

Section label: Writing, or Notes. Intro line: "When I'm not on backends I write about astrodynamics, mostly to understand how we get things into orbit."

Posts (link to existing URLs, they must keep working):
- The Tyranny of the Rocket Equation, `/Astrodynamics/posts/tyranny-rocket-equation.html`
- From Fireworks to Orbit: How Rockets Generate Thrust (coming soon)
- The Chemistry of Going Fast: Propellant Combinations (coming soon)
- All posts, `/Astrodynamics/index.html`

## Links

- Email: `mailto:smartguy.rm@gmail.com` (placeholder, user will confirm)
- LinkedIn: https://www.linkedin.com/in/rishmalho/
- GitHub: https://github.com/rishabhmalhotra
- X: https://twitter.com/rishmalho
- nostr: http://primal.net/p/npub1gxuneh3mkxlm28fg0uxv2qtp8q4nr2h47kn26rqfp2vnw0gp30ustn3l2q
- Photography: https://unsplash.com/@rishmalho
- Resume: `/resume.pdf`

## Music widget (required in every mockup)

The real site plays a Spotify playlist through a hidden Spotify embed and shows a custom UI. In the mockup, build only the UI, styled to match the design. No audio.

- Playlist: "Music" by rishabhmalhotra, 38 tracks, https://open.spotify.com/playlist/6YGvluoYkCURQePkFMoYqW
- Cover art: `assets/cover.jpg` (300x300)
- Tracks to show (title, artist, duration):
  1. ecstacy, SUICIDAL-IDOL, 1:36
  2. you haunt me, Marzi and Yana, 3:16
  3. You, Zen/it, 2:44
  4. Tonight, Arman Cekin and C-Mart, 2:22
  5. Una Noche, HUGEL and WILCE, 3:57
  6. Burning, NAOMI JEREMIAH, 2:49
- Must have: play/pause toggle (toggling animates a visualizer and advances a fake progress bar), previous and next (cycle the 6 tracks above), current title and artist, an "Open in Spotify" link.
- Should have: collapsed state that stays out of the way, expanded state with the track list. Clicking a track selects it.
- It should look like it belongs to the design, not like a generic player.

## Quality bar

- Audience: hiring managers, recruiters, and senior engineers deciding whether this person operates at staff level. It should feel calm, confident and expensive, not flashy.
- Avoid generic AI-portfolio tells: purple-to-blue gradients, glassmorphism blobs, glowing neon everywhere, emoji, "Hi, I'm X" with a wave, skill bars with percentages, tilted 3D cards, typewriter effects on the headline.
- Real typographic hierarchy, consistent spacing scale, aligned grid.
- Responsive: must look intentional at 1440x900 and at 390px wide.
- Respect `prefers-reduced-motion`: no motion beyond simple fades when it is set.
- Accessible contrast (WCAG AA for body text), visible focus states, semantic HTML.

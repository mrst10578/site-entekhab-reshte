# Protocol 25

Selecting `quota-25` starts a fictional cinematic UI sequence. This is frontend
presentation, with no server policy, identity collection, cookies, or account bans.

## Integration

`DatabaseExplorer` routes the selection directly to `protocol25-init`, bypassing
`loading`. Its existing shard-loading effect runs only in `loading`. The normal
database and Matrix component are not rendered while the protocol is active.
All other quota selections retain the original data loading and ready behavior.

The screen is portalled into `body`, outside the normal page. Scoped takeover
rules hide the normal main and skip link; `inert` removes underlying interaction.
The existing phase effect and takeover CSS lock body scrolling. Cleanup restores
the previous inert and overflow values when components unmount.

## State and timing

`Protocol25Stage` and an absolute timer schedule drive the presentation. CSS
animation events never change state. Every outstanding timer is cancelled on
unmount, including React Strict Mode cleanup.

| Time | Stage / event |
| --- | --- |
| 0 ms | `init`: green selection confirmation |
| 350 ms | `anomaly`: red takeover and a single 90 ms displacement |
| 950 ms | `scan`: verification begins |
| 1,400 / 1,800 ms | Session check / clearance mismatch |
| 1,950 / 2,650 / 3,350 ms | Scan progress: 12 / 47 / 86 percent |
| 3,850 ms | `pause`: scan reaches 100 percent; streams pause |
| 4,250 ms | `flagged`: ACCESS FLAGGED and Persian explanation |
| 5,400 / 5,900 / 6,400 ms | `lockdown`: denied / revoked / closed logs |
| 6,900 / 7,500 / 8,100 ms | `countdown`: SESSION TERMINATED, 03 / 02 / 01 |
| 8,700 ms | `eject`: short fade |
| 9,300 ms | `terminated`: CONNECTION CLOSED; store the tab lock |

The dedicated background has 12 CSS data streams, a faint grid and a scan line.
It does not use the normal Matrix engine or canvas. The final screen removes all
background motion. Reduced motion removes transforms, stream movement and scan
travel while the timer sequence and terminal lock remain functional.

## Tab lock and boot

The only persistence is `sessionStorage["protocol25-session-locked"] = "1"`,
written when the sequence finishes. On refresh, the app checks the key before
removing the existing dark SSR boot curtain. It commits the final screen before
removing that curtain, and skips even the data index request for locked tabs.

A fresh tab session without copied session storage starts normal onboarding.
Browser tab duplication/session restoration may retain session storage according
to the browser's own behavior. No persistent storage or server reset is involved.
Developers can close the tab or remove the key manually; no reset control is
exposed in the product. If the browser blocks session storage, the sequence still
finishes but refresh persistence is unavailable.

## Verification

Unit tests cover the deterministic scan/pause/countdown timeline, timer cleanup,
terminal persistence and unavailable storage. E2E tests cover the complete flow,
no shard requests, final refresh, a fresh tab, delayed locked hydration, mobile
390×844, reduced motion, and all five normal quota choices. Existing E2E coverage
also verifies dark SSR, Matrix behavior, search and independent year scrolling.

Required commands: `npm run lint`, `npm run typecheck`, `npm run test`,
`npm run build`, and `npm run test:e2e`.

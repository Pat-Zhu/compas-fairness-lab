# COMPAS Fairness Lab - Classroom v4

Live site: https://pat-zhu.github.io/compas-fairness-lab/

## Facilitator
1. Open the base site and click **Create classroom**.
2. Project the QR. Students scan and enter a waiting room automatically.
3. Close the QR dialog and choose **Start case introduction**. All screens show the case background and glossary, with no vote.
4. Choose **Open opening vote** to begin Activity 1. Students follow automatically.
5. For each voting activity, wait for submitted responses, choose **Close voting & show results**, discuss, then **Next activity**.
6. Optional **Reveal reading evidence** panels appear only in Activities 2, 4, 5, and 7. They summarize cited readings; they do not select a correct opinion. **Hide reading evidence** closes the panel. This control is independent of closing voting or showing class results.
7. Use **Show QR** for late arrivals without creating a new session.
8. At Activity 5, run the detention and support scenarios separately; their answers are stored separately.
9. Export the aggregate summary on Activity 9, then **End session**.

The private facilitator guidance has been removed from the presentation interface and active content file. Keep the separate PDF guide on a non-projecting device. Student-facing group tasks and discussion prompts remain on screen.

A private co-facilitator link is available in the lobby. Share it only with your partner. Only one facilitator should operate the controls at a time. Browser refresh preserves facilitator credentials; **Resume my classroom** restores the most recently created room in that browser.

## Students
Scan the QR, keep the page open, and wait. There are no Start, Next, session-creation, timer, or reading-reveal controls in participant mode. Read along during the briefing. When a voting activity opens, choose an answer and click **Submit response**. Changes replace your response while voting is open; they do not add another vote. Class results remain hidden until voting closes. Reading evidence appears when the facilitator reveals it. Late arrivals join the current activity.

## Architecture and privacy
- GitHub Pages serves the static client; no CDN scripts are required.
- `qr.js` renders one black-and-white SVG with a four-module quiet zone. Its URL contains no host credential.
- Supabase RPCs maintain the authoritative stage, voting state, reading visibility, timer, and membership. Active pages refresh every two seconds.
- Host actions require a random capability checked on the server. Student credentials cannot control the classroom.
- Raw classroom tables are inaccessible through the public key. RPCs return a student's own answers and permitted aggregates.
- No names or emails are requested. Browser credentials are pseudonymous; counts are not verified unique people.
- Participation access expires after 24 hours; this is not automatic data deletion. Project administrators can inspect or remove records.
- Hosts are excluded from student vote totals. Only submitted answers count. Token allocations require exactly 10; principles require two or three distinct choices.

## Deployment and compatibility
`config.js` contains only the public Supabase URL and publishable key. Never commit a service-role key or facilitator credential.

The v3 RPCs and response stage IDs are retained. Background uses stage ID 10, ordered between 0 and 1 by `LAB_CONTENT.order`. The applied `add_case_briefing_and_reading_evidence_v4` migration adds the stage and the host-only `reading` command. Stage/context changes reset reading visibility. The original nine activity IDs and saved responses do not change.

Old v2 scripts are retained but are not loaded. Links containing `?session=` cannot join the host-controlled classrooms. Create a new classroom and use its QR for a clean class session.

## Evidence versus opinion
Panels appear for the reported ProPublica/Northpointe disagreement (2), the limited claim about excluding race (4), threshold mechanics (5), and the descriptive part of who used which standard (7). They include reading links and explicit limits. No model answers are attached to human-versus-algorithm preferences, stakeholder priorities, liberty judgments, governance allocations, or team principles.

The background and evidence text summarize assigned sources. Activity scripts, synthetic data, and timing are classroom design, not facts attributed to a reading.

## Testing
Local Chromium UI tests use mocked transport because browser navigation is restricted in the build environment. They cover one QR SVG, waiting, briefing-to-opening order, synchronized reveals, hidden opinion answers, no private notes, response controls, refresh recovery, and mobile overflow. Separate SQL tests exercised the real RPC changes with rollback. GitHub Actions checks client syntax and runs a real REST smoke test in a separate test classroom, closing it afterward. These are distinct checks, not a claim of a full public-site physical-phone test.

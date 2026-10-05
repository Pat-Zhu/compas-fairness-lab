# COMPAS Fairness Lab - Classroom v3

Live site: https://pat-zhu.github.io/compas-fairness-lab/

## Facilitator
1. Open the base site and click **Create classroom**.
2. Project the QR. Students scan and enter a waiting room automatically.
3. Close the QR dialog, then click **Start discussion**. Student screens follow automatically.
4. For each activity, wait for submitted responses, click **Close voting & show results**, discuss, then **Next activity**.
5. Use **Show QR** for late arrivals without creating a new session.
6. At Activity 5, run the detention and support scenarios separately; their answers are stored separately.
7. Export the aggregate summary on Activity 9. **End session** closes participation for everyone.

A private co-facilitator link is available in the lobby. Share it only with your partner. Only one facilitator should operate the controls at a time. Browser refresh preserves facilitator credentials; **Resume my classroom** restores the most recently created room in that browser.

## Students
Scan the QR, keep the page open, and wait. There are no Start, Next, session-creation, or timer controls in participant mode. Choose an answer and click **Submit response**. Changes replace your response while voting is open; they do not add another vote. Results remain hidden until the facilitator closes voting. Late arrivals enter the current activity.

## Architecture
- GitHub Pages serves the static client; no CDN scripts are required.
- `qr.js` renders a single black-and-white SVG, with a four-module quiet zone. The QR contains only a student join URL, never the facilitator credential.
- Supabase RPCs maintain the authoritative stage, voting state, timer, and membership. Active pages refresh state every two seconds.
- Host actions require a random 256-bit capability, checked on the server. Student credentials cannot change the stage, close voting, or end the session.
- Raw classroom tables are not readable or writable using the publishable API key. RPCs return a student's own answers plus permitted aggregate results.
- Participation expires after 24 hours. Expiration limits access; it is not automatic data deletion. Project administrators can inspect or remove stored data.
- No names or email addresses are collected. Browser credentials are pseudonymous. A person can create another identity using another browser: counts are not verified unique humans.
- The host and co-host are not included in student vote totals. Only submitted answers count. Token allocations must total exactly 10; principle selections must contain two or three distinct choices.

## Deployment
Existing `config.js` holds only the public Supabase URL and publishable key. Never add a service-role key or a facilitator credential to Git. The `classroom_v3_host_controlled_sessions` migration installs five public RPCs and two RLS-protected tables.

The v2 scripts are retained for history but are no longer loaded. Old `?session=` links do not join v3 rooms; start a new classroom and use the new QR.

## Testing
Browser interaction tests use local documents and mocked API responses because external browser navigation is restricted in the build environment. They cover decoded QR URLs, waiting rooms, synchronized stages, submitted votes, hidden/revealed results, refresh, separate threshold rounds, and session closure. Separate SQL tests run against the real Supabase functions under the `anon` role, including rejected student control requests and closed votes. These are separate checks, not a claim of a full deployed-site browser test.

## Activity content
The original nine-activity sequence and the eight assigned discussion questions are retained. Activity 6 uses the assigned equal-error thought experiment; it does not assert that every fairness constraint can simultaneously be satisfied under unequal base rates. The threshold dataset is synthetic, not COMPAS data. See `content.js` for assigned reading links.

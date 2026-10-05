# COMPAS Fairness Lab

Interactive classroom discussion site for a Data Ethics case study on COMPAS and technical fairness.

## Live site

https://pat-zhu.github.io/compas-fairness-lab/

## Classroom flow

1. Warm-up: COMPAS vs. human judge
2. ProPublica vs. Northpointe fairness definitions
3. Stakeholder breakout
4. “We don't use race” discussion
5. Threshold trade-off lab
6. 99.9% accurate COMPAS thought experiment
7. Who should define fairness?
8. Data-science design principles
9. Final re-vote and debrief

## Live classroom mode

The site supports realtime anonymous classroom aggregation through Supabase.

The facilitator clicks **Create classroom QR** and projects the generated QR code. Students scan it with their phone cameras and automatically join the same live session. No room code needs to be typed or shared.

A **Copy student link** button remains available as a backup for anyone who cannot scan the QR code.

Until Supabase is configured, the site automatically falls back to local-only mode.

See [LIVE_SETUP.md](LIVE_SETUP.md) for the backend details.

## Privacy / data

The activity never asks students for names or emails.

- Local mode: responses stay in that browser.
- Live mode: a random browser UUID and response state are stored for the room so class aggregates can be computed.
- The QR code contains a short-lived classroom session URL. It is not strong authentication, so live mode should only be used for low-risk, non-sensitive discussion responses.

## Local preview

```bash
python -m http.server 8000
```

Then open http://localhost:8000

## Sources

The activity links to the assigned COMPAS case-study readings from ProPublica, The Washington Post archive, and MIT Technology Review. The threshold lab is explicitly a toy dataset for classroom discussion, not actual COMPAS data.

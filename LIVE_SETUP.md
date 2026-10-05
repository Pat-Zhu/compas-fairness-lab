# Classroom v3 operations

Backend: the existing Supabase project, using capability-checked RPCs. No additional project or subscription was created.

## Start a real class
Open the base website, hard-refresh if an old interface appears, and look for **Classroom v3**. Click **Create classroom** once. Project the generated QR. A student who scans should see **Waiting for the facilitator**, without a Start button. Close the QR and click **Start discussion** on the facilitator screen. Students receive the current activity automatically, normally after the next two-second state refresh.

## Co-facilitator
In the lobby choose **Copy private co-facilitator link** and send it privately to your partner. It grants control of this room. Do not distribute it to the class or encode it in a QR. Agree on one control operator to avoid simultaneous navigation.

## Voting
Only **Submit response** sends an answer. Dragging a slider or selecting a choice is a draft. The facilitator does not vote. **Close voting & show results** closes voting on the server and reveals aggregate results. **Reopen voting** lets students revise their existing answer. Changing the activity opens that activity's vote automatically; the breakout activity has no vote.

## Refresh and reconnect
Keep the same browser and device. Host credentials and participant credentials persist in browser storage; submitted answers persist on the server. Draft edits are not guaranteed to survive a refresh. A fresh/incognito browser represents a new participant. A lost connection is not a successful submission: wait for **Response saved**.

## Timers and endings
The timer is shared, but reaching zero does not close voting or advance the activity. The facilitator does that manually. **End session** closes the room for everyone and cannot be undone. Create a new room for another class.

## Retention and limitations
Join links expire after 24 hours. Data are not automatically deleted at expiration. No names or emails are requested; capability tokens and browser-linked answers are still stored. Do not use this for sensitive personal disclosures, formal elections, or high-stakes assessments.

## Fast pre-class check
Use your laptop as host and one phone as student: scan, wait, start, submit, close/reveal, next, refresh. Always create a fresh room after rehearsal. Use raised hands and the projected prompts if the network fails.

# Enable live classroom aggregation

The GitHub Pages site already contains the realtime UI. It falls back to local mode until a Supabase project is configured.

## 1. Create a Supabase project

Create a project in Supabase.

## 2. Create the classroom table

Open **SQL Editor** in Supabase and run the contents of `supabase-setup.sql`.

This creates one table, `class_responses`, and enables Realtime.

## 3. Add the public browser configuration

In Supabase, copy the **Project URL** and **anon / publishable key**.

Edit `config.js`:

```js
window.SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_PUBLIC_ANON_KEY"
};
```

The anon/publishable key is intended for browser use. Never put a Supabase service-role key in this repository.

## 4. Use it in class

Open the GitHub Pages site and choose **Create classroom QR**.

A QR code will appear on the facilitator screen. Project that screen and ask students to:

1. Open the phone camera.
2. Scan the QR code.
3. Open the link.
4. Keep the page open during discussion.

Students automatically join the same realtime session. They do not need to type a room code, create an account, or enter a name.

The **Copy student link** button is a backup for students who cannot scan the QR code.

## Data design

- No names or email addresses are requested.
- Each browser gets a random participant UUID.
- Each browser stores one JSON response state per room.
- Room codes are short-lived classroom identifiers, not authentication.
- This setup is appropriate for low-risk classroom interaction, not sensitive or confidential data.

## What syncs live

- Opening vote
- ProPublica vs. Northpointe fairness preference
- Race-blindness question
- Threshold choice
- 99.9% COMPAS thought experiment
- Governance token allocation
- Top three data-science principles
- Final vote and opening-vs-final comparison

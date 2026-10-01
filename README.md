# Danapur Premier League 2026 — Registration

Cricket player registration for Danapur Premier League.

Players fill the form, pay the ₹100 entry fee on the PhonePe QR of Ratan Kailas Gawai, and their name shows on a public list so everyone can see who has registered. Each new registration emails the full list to `gawairatan960@gmail.com`. The organiser page can download the same list as Excel.

Last date: **19 October 2026, 11:59 PM IST**.

## Run

```bash
npm install
cp .env.example .env.local
# put a real ADMIN_PASSWORD and ADMIN_SECRET in .env.local
npm run dev -- -p 43123 -H 0.0.0.0
```

Open `/` to register, `/players` for the public list, and `/admin` for the organiser.

The public site is <https://saurabhthakre-aws-devops.github.io/danapur-premier-league/>.

On that page, the shared list of names is stored at KVdb for the organiser email `gawairatan960@gmail.com`. The full mobile number and UPI transaction ID are not in that list. They are sent by email to the same address. The first save needs the organiser to open the confirmation mail from KVdb, and the first email needs the confirmation mail from FormSubmit. A name stays on the public list for 7 days after the last registration, then that free store drops it. The organiser inbox is the copy that remains.

## Mail

- The organiser downloads the full Excel from `/admin` at any time.
- To also email that Excel automatically on every registration, log in at `/admin` and save a Gmail App Password (Google Account → Security → 2-Step Verification → App passwords). That is not the normal Gmail password. Quote `ADMIN_PASSWORD` in `.env.local` if it contains `#`.

## What is stored

Registrations stay in `data/registrations.json` on the machine running the site. That folder is not committed. The Gmail inbox is the copy that remains if this server is rebuilt.

Phone numbers and transaction IDs are visible to the organiser only. The public list shows the player name, age, area, role, and the last four digits of the mobile number.

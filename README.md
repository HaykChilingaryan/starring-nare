# Starring Nare

A one-page "film that hasn't started yet" for Nare. Red curtains open, the song
"SMS" by Mi Qani Hogi feat. Sebu starts playing, and opening credits roll until
**0:48**, when the line "Հլը չի սկսե կինոն մեր" ("our movie hasn't started yet")
lands. A title card plays, then the rest unlocks: a movie poster, a short
screenplay of the Best Buy story, Aram's note, and the ending: "How about we
continue the movie?" with a clapperboard for the next scene (getting a coffee
together). Saying yes opens an Instagram DM to Aram.

Domain: **for-nare.com** (bought on GoDaddy, DNS managed there).

## Before it goes live

Edit `config.js`:

- `senderName`: Aram (set)
- `instagram`: aram_chilingaryan (set). The yes button opens a DM via ig.me.
- `phone`: optional, left empty so his number isn't on a public page
- `lineArmenian`: double-check the spelling of the line
- `credits`, `note`, `nextScene`: wording, if anything should change

## Run locally

```bash
python3 -m http.server 4180
```

Open http://localhost:4180. The YouTube player needs http(s), so opening the
file directly won't play the song.

## Publish

Hosted on GitHub Pages from the `main` branch (repo root) at https://for-nare.com.
Every push to `main` redeploys. The page is set to `noindex` so it stays out of
search results.

### How for-nare.com is wired up

1. The `CNAME` file in the repo tells GitHub Pages to serve for-nare.com.
2. GoDaddy DNS for for-nare.com has four `A` records for `@`:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`,
   and a `CNAME` record for `www` pointing to `haykchilingaryan.github.io`
   (GoDaddy's default parking `A` records removed).
3. Once GitHub has issued the certificate (can take up to an hour), HTTPS is enforced:

   ```bash
   gh api -X PUT repos/HaykChilingaryan/starring-nare/pages -F https_enforced=true
   ```

`netlify.toml` is kept in case you'd rather host on Netlify.

## "She said yes" notification

When she taps "Let's continue it", the page sends a push notification through
[ntfy](https://ntfy.sh) (free, no account). To receive it on a phone:

1. Install the **ntfy** app (App Store or Google Play).
2. Tap **+**, enter the topic from `notifyTopic` in `config.js`, and subscribe.

Anyone subscribed to that topic gets it, so both of you can. The topic name is the
only key, so don't share it. Set `notifyTopic` to `""` to turn this off.

## Printable ticket

`ticket.html` is a printable "Admit one" ticket with a QR code to the site (three
per page). If the domain changes, regenerate the QR code:

```bash
python3 scripts/make_qr.py "https://new-domain.com"
```

…and update `siteUrl` in `config.js`.

## Notes

- Browsers block music until the visitor taps something, so the opening "Dim the
  lights" ticket is what starts the song. If a phone still blocks it, a hint asks
  her to tap play on the screen, and "Skip ahead to the line" always works.
- The YouTube player stays visible (YouTube requires at least 200×200 px).

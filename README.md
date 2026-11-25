# Starring Nare

A one-page "film that hasn't started yet" for Nare. Red curtains open, the song
"SMS" by Mi Qani Hogi feat. Sebu starts playing, and opening credits roll until
**0:48**, when the line "Հլը չի սկսե կինոն մեր" ("our movie hasn't started yet")
lands. A title card plays, then the rest unlocks: a movie poster, a short
screenplay of the Best Buy story, Aram's note, and the ending: "How about we
continue the movie?" with a clapperboard for the next scene (getting a coffee
together). Saying yes opens an Instagram DM to Aram.

Domain: **starring-nare.com** (unregistered as of 2026-11-24, needs to be bought).

## Before it goes live

Edit `config.js`:

- `senderName`: Aram (set)
- `instagram`: aram_chilingaryan (set). The yes button opens a DM via ig.me.
- `phone`: optional, left empty so his number isn't on a public page
- `lineArmenian` / `lineLatin`: double-check the spelling of the line
- `credits`, `note`, `nextScene`: wording, if anything should change

## Run locally

```bash
python3 -m http.server 4180
```

Open http://localhost:4180. The YouTube player needs http(s), so opening the
file directly won't play the song.

## Publish

Hosted on GitHub Pages from the `main` branch (repo root). Every push to `main`
redeploys. Until the domain is set up it lives at
https://haykchilingaryan.github.io/starring-nare/. The page is set to `noindex`
so it stays out of search results.

### Hooking up starring-nare.com

1. Buy starring-nare.com (GoDaddy, like the Anzhela domains).
2. In GoDaddy DNS, add four `A` records for `@`:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`,
   and a `CNAME` record for `www` pointing to `haykchilingaryan.github.io`.
3. Point Pages at the domain (this also adds a `CNAME` file to the repo):

   ```bash
   gh api -X PUT repos/HaykChilingaryan/starring-nare/pages -f cname=starring-nare.com
   ```

4. Once the certificate is ready (can take up to an hour), turn on HTTPS:

   ```bash
   gh api -X PUT repos/HaykChilingaryan/starring-nare/pages -F https_enforced=true
   ```

`netlify.toml` is kept in case you'd rather host on Netlify.

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

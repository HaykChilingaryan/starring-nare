(() => {
  "use strict";

  const cfg = window.FILM_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const LINE_AT = Number(cfg.lineAt) || 48;
  // The title card runs on the song's timeline: each word appears as it's sung
  const WORDS_AT = (Array.isArray(cfg.lineWordsAt) && cfg.lineWordsAt.length ? cfg.lineWordsAt : [LINE_AT])
    .map(Number)
    .filter(Number.isFinite);
  if (!WORDS_AT.length) WORDS_AT.push(LINE_AT);
  const SUNG_AT = WORDS_AT[0];
  const SUNG_END = WORDS_AT[WORDS_AT.length - 1];
  const CARD_AT = SUNG_AT - 0.8; // fade in just before the line
  const TRANSLATE_AT = SUNG_END + 0.6; // English once the last word lands
  const CARD_UNTIL = SUNG_END + 4; // then step aside
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const YT_PLAYING = 1;
  const YT_BUFFERING = 3;

  const name = (cfg.recipientName || "Nare").trim();
  const sender = (cfg.senderName || "").trim();
  const songUrl = `https://www.youtube.com/watch?v=${cfg.youtubeId || ""}`;

  const el = {
    body: document.body,
    startBtn: $("#startBtn"),
    backstage: $("#backstage"),
    readyBtn: $("#readyBtn"),
    screenHint: $("#screenHint"),
    screenFallback: $("#screenFallback"),
    fallbackLink: $("#fallbackLink"),
    cueNow: $("#cueNow"),
    cueLabel: $("#cueLabel"),
    cueFill: $("#cueFill"),
    credits: $("#credits"),
    typing: $("#typing"),
    creditsWindow: $("#creditsWindow"),
    creditsTrack: $("#creditsTrack"),
    after: $("#after"),
    skipBtn: $("#skipBtn"),
    poster: $("#poster"),
    note: $("#note"),
    slate: $("#slate"),
    nextHeading: $("#nextHeading"),
    nextAction: $("#nextAction"),
    postcard: $("#postcard"),
    postcardText: $("#postcardText"),
    dmBtn: $("#dmBtn"),
    dmHint: $("#dmHint"),
    profileLine: $("#profileLine"),
    profileLink: $("#profileLink"),
    replayBtn: $("#replayBtn"),
    songLink: $("#songLink"),
    titlecard: $("#titlecard"),
    tcArm: $("#tcArm"),
    tcEng: $("#tcEng"),
    tcCredit: $("#tcCredit"),
    tcContinue: $("#tcContinue"),
    nowPlaying: $("#nowPlaying"),
    npToggle: $("#npToggle"),
    npTime: $("#npTime"),
    npReplay: $("#npReplay"),
  };

  const fmt = (seconds) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const fillTokens = (text) =>
    String(text).replaceAll("{name}", name).replaceAll("{sender}", sender || "me");

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  // ---------- Content from config ----------

  function applyConfig() {
    document.title = `For ${name}`;
    $$("[data-recipient]").forEach((n) => (n.textContent = name));
    $$("[data-sender]").forEach((n) => (n.textContent = sender || "him"));

    el.songLink.href = songUrl;
    el.fallbackLink.href = songUrl;

    el.credits.replaceChildren(
      ...(cfg.credits || []).map((c) => {
        const li = make("li", "", c.text);
        li.dataset.at = c.at;
        return li;
      })
    );

    el.note.replaceChildren(...(cfg.note || []).map((p) => make("p", "", fillTokens(p))));

    const next = cfg.nextScene || {};
    if (next.heading) el.nextHeading.textContent = next.heading;
    if (next.action) el.nextAction.textContent = fillTokens(next.action);

    // Title card: Armenian line word by word, each one timed to the song
    const words = String(cfg.lineArmenian || "").split(/\s+/).filter(Boolean);
    tcWords = words.map((w, i) => {
      const span = make("span", "w", w);
      span.dataset.at = WORDS_AT[i] ?? SUNG_END + (i - WORDS_AT.length + 1) * 0.35;
      return span;
    });
    el.tcArm.replaceChildren(...tcWords.flatMap((s, i) => (i < tcWords.length - 1 ? [s, " "] : [s])));

    const eng = cfg.lineEnglish || "";
    const idx = eng.toLowerCase().lastIndexOf("yet");
    if (idx >= 0) {
      el.tcEng.replaceChildren(`“${eng.slice(0, idx)}`, make("em", "", eng.slice(idx, idx + 3)), `${eng.slice(idx + 3)}”`);
    } else {
      el.tcEng.textContent = `“${eng}”`;
    }
    el.tcCredit.textContent = `“${cfg.songTitle || "SMS"}” · ${cfg.songArtist || ""}`;
  }

  // ---------- The ending: clapperboard + postcard ----------

  function clap() {
    el.slate.classList.remove("is-clapped");
    void el.slate.offsetWidth; // restart the clap
    el.slate.classList.add("is-clapped");
  }

  // Ping Aram's phone (ntfy.sh) when she scans the ticket, taps the Message
  // button, or taps his handle.
  // Each kind is sent once per visit. A plain-text POST with query-string options,
  // so no CORS preflight is needed, and keepalive lets it finish even though
  // she's leaving for Instagram.
  const notifySent = new Set();
  function notify(kind) {
    const topic = String(cfg.notifyTopic || "").trim();
    if (!topic || notifySent.has(kind)) return;
    notifySent.add(kind);
    const handle = String(cfg.instagram || "").replace(/^@/, "").trim();
    const kinds = {
      message: {
        title: `${name} is messaging you!`,
        tags: "clapper,speech_balloon",
        body: `${name} tapped "Message ${sender || "you"} on Instagram" on ${location.host}. Check your DMs.`,
      },
      profile: {
        title: `${name} opened your Instagram!`,
        tags: "clapper,eyes",
        body: `${name} tapped @${handle} on ${location.host}. She's looking at your profile.`,
      },
      scan: {
        title: "The ticket was scanned!",
        tags: "tickets,clapper",
        body: `Someone just opened ${location.host} from the ticket's QR code. Probably ${name}.`,
      },
    };
    const k = kinds[kind];
    const params = new URLSearchParams({ title: k.title, tags: k.tags, priority: "high" });
    const message = k.body;
    try {
      fetch(`https://ntfy.sh/${encodeURIComponent(topic)}?${params}`, {
        method: "POST",
        body: message,
        mode: "no-cors",
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* never block the page on this */
    }
  }

  // The ticket's QR code points to /?qr. On arrival: notify once per browser
  // session, then strip the marker so a reload or a shared link doesn't re-send.
  function noteQrScan() {
    const params = new URLSearchParams(location.search);
    if (!params.has("qr")) return;
    params.delete("qr");
    const rest = params.toString();
    try {
      history.replaceState(null, "", location.pathname + (rest ? `?${rest}` : "") + location.hash);
    } catch {
      /* ignore */
    }
    let alreadySent = false;
    try {
      alreadySent = sessionStorage.getItem("qr-notified") === "1";
      sessionStorage.setItem("qr-notified", "1");
    } catch {
      /* private mode etc. still sends once per page load */
    }
    if (!alreadySent) notify("scan");
  }

  function setupPostcard() {
    const handle = String(cfg.instagram || "").replace(/^@/, "").trim();

    if (handle) {
      el.dmBtn.textContent = `Message ${sender || "me"} on Instagram`;
      el.dmBtn.href = `https://ig.me/m/${encodeURIComponent(handle)}`;
      el.profileLink.textContent = `@${handle}`;
      el.profileLink.href = `https://www.instagram.com/${encodeURIComponent(handle)}/`;
    } else if (cfg.phone) {
      const text = `Hi${sender ? " " + sender : ""}! It's ${name} 🎬 Let's continue the movie ☕`;
      el.dmBtn.textContent = `Text ${sender || "me"}`;
      el.dmBtn.href = `sms:${cfg.phone}?&body=${encodeURIComponent(text)}`;
      el.dmBtn.removeAttribute("target");
      el.profileLine.hidden = true;
    } else {
      el.dmBtn.hidden = true;
      el.dmHint.hidden = true;
      el.profileLine.hidden = true;
      el.postcardText.textContent = "Next time you see me at Best Buy, just say “next scene.” I'll know.";
    }

    el.dmBtn.addEventListener("click", () => {
      notify("message");
      clap();
    });
    el.profileLink.addEventListener("click", () => notify("profile"));
  }

  // Clap the slate and land the stamp when they scroll into view
  function watchEnding() {
    const once = (node, threshold, fn) => {
      if (!("IntersectionObserver" in window)) return fn();
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            fn();
          }
        },
        { threshold }
      );
      io.observe(node);
    };
    once(el.slate, 0.6, clap);
    once(el.postcard, 0.5, () => el.postcard.classList.add("is-live"));
  }

  // ---------- Soundtrack (YouTube IFrame API) ----------

  let player = null;
  let playerReady = false;
  let playerFailed = false;
  let wantsPlay = false;
  let started = false;
  let unlocked = false;
  let cardArmed = true;
  let cardOpen = false;
  let cardFirst = false;
  let cardRaf = 0;
  let tcWords = [];
  let hintTimer = null;

  const state = () => {
    try {
      return player.getPlayerState();
    } catch {
      return -1;
    }
  };

  const time = () => {
    try {
      return player.getCurrentTime() || 0;
    } catch {
      return 0;
    }
  };

  function loadYouTube() {
    if (!cfg.youtubeId) return failPlayer();

    window.onYouTubeIframeAPIReady = () => {
      const vars = { rel: 0, playsinline: 1, modestbranding: 1 };
      if (location.protocol.startsWith("http")) vars.origin = location.origin;
      player = new window.YT.Player("player", {
        videoId: cfg.youtubeId,
        width: "100%",
        height: "100%",
        playerVars: vars,
        events: {
          onReady: () => {
            playerReady = true;
            if (wantsPlay) play();
          },
          onStateChange: (e) => onState(e.data),
          onError: () => failPlayer(),
        },
      });
    };

    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = failPlayer;
    document.head.appendChild(s);
  }

  function play() {
    if (playerFailed) return;
    if (!playerReady) {
      wantsPlay = true;
      return;
    }
    wantsPlay = false;
    try {
      player.playVideo();
    } catch {
      /* ignore */
    }
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      const st = state();
      if (st !== YT_PLAYING && st !== YT_BUFFERING && !playerFailed) el.screenHint.hidden = false;
    }, 2600);
  }

  function onState(s) {
    const playing = s === YT_PLAYING;
    el.body.classList.toggle("is-playing", playing);
    el.npToggle.setAttribute("aria-label", playing ? "Pause the soundtrack" : "Play the soundtrack");
    if (playing || s === YT_BUFFERING) el.screenHint.hidden = true;
  }

  function failPlayer() {
    if (playerFailed) return;
    playerFailed = true;
    el.screenHint.hidden = true;
    el.screenFallback.hidden = false;
    el.nowPlaying.hidden = true;
    el.skipBtn.textContent = "Continue to the film →";
  }

  // ---------- Opening ----------

  // Ticket tap: tear the stub, then go "backstage" (black screen with the
  // headphones prompt). The song waits for the "I'm ready" tap, because phones
  // only allow sound to start right after a tap.
  // The backstage page never advances on its own: only a deliberate tap on
  // "I'm ready", and that button stays disabled until it has faded in, so a
  // double-tap on the ticket can't land on it while it's still invisible.
  let readyArmed = false;
  function openBackstage() {
    if (started || !el.backstage.hidden) return;
    el.startBtn.classList.add("is-torn");
    setTimeout(() => {
      el.backstage.hidden = false;
      void el.backstage.offsetWidth;
      el.backstage.classList.add("is-on");
      setTimeout(() => {
        readyArmed = true;
        el.readyBtn.disabled = false;
        el.readyBtn.focus({ preventScroll: true });
      }, REDUCED ? 300 : 3600);
    }, REDUCED ? 0 : 450);
  }

  function start() {
    if (started || !readyArmed) return;
    started = true;
    window.scrollTo(0, 0);
    el.body.classList.add("is-started");
    play();
    // Fade the backstage out as the curtains part behind it
    el.backstage.classList.remove("is-on");
    setTimeout(() => (el.backstage.hidden = true), REDUCED ? 0 : 900);
    setTimeout(() => el.body.classList.remove("is-gated"), REDUCED ? 0 : 900);
    setTimeout(() => {
      if (!playerFailed) el.nowPlaying.hidden = false;
    }, REDUCED ? 0 : 2200);
  }

  el.startBtn.addEventListener("click", openBackstage);
  el.readyBtn.addEventListener("click", start);

  // ---------- Sync loop: credits, cue bar, the 0:48 moment ----------

  function tick() {
    if (!started) return;
    const live = playerReady && !playerFailed;
    const t = live ? time() : 0;

    el.cueNow.textContent = fmt(t);
    el.npTime.textContent = fmt(t);
    el.cueFill.style.width = `${(unlocked ? 1 : Math.min(t / LINE_AT, 1)) * 100}%`;

    let current = null;
    let shownCount = 0;
    for (const li of el.credits.children) {
      const shown = unlocked || t >= Number(li.dataset.at);
      li.classList.toggle("is-shown", shown);
      if (shown) {
        current = li;
        shownCount += 1;
      }
    }
    for (const li of el.credits.children) li.classList.toggle("is-current", li === current);

    // Typing dots while the next line (or the 0:48 line) is on its way
    el.typing.hidden = unlocked;
    if (shownCount !== lastShownCount) {
      const grew = shownCount > lastShownCount;
      lastShownCount = shownCount;
      positionCredits();
      if (grew && shownCount > 0 && !unlocked && !cardOpen) followCredits();
    }

    if (!live || cardOpen) return;
    const reached = t >= CARD_AT;
    if (!unlocked && reached && state() === YT_PLAYING) showCard(true);
    else if (unlocked && cardArmed && reached && t < CARD_UNTIL) showCard(false);
  }

  // Lyrics-style scrolling: slide the track so the current line (or the dots,
  // before the first line) sits at a fixed focus point inside the window.
  let lastShownCount = -1;
  let followTimer = null;
  function positionCredits() {
    requestAnimationFrame(() => {
      if (unlocked) {
        el.creditsTrack.style.transform = "";
        return;
      }
      const current = el.credits.querySelector("li.is-current");
      const target = current || (el.typing.hidden ? null : el.typing);
      if (!target) return;
      const focus = el.creditsWindow.clientHeight * 0.42;
      const center = target.offsetTop + target.offsetHeight / 2;
      el.creditsTrack.style.transform = `translateY(${Math.round(focus - center)}px)`;
    });
  }

  // Also keep the window itself on screen (no-op when it's already visible)
  function followCredits() {
    clearTimeout(followTimer);
    followTimer = setTimeout(() => {
      if (unlocked || cardOpen) return;
      el.creditsWindow.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
    }, 300);
  }

  window.addEventListener("resize", positionCredits);

  setInterval(tick, 200);

  function showCard(first) {
    cardOpen = true;
    cardFirst = first;
    cardArmed = false;
    el.titlecard.classList.remove("is-on");
    el.titlecard.hidden = false;
    el.body.classList.add("has-titlecard");
    el.titlecard.classList.remove("is-translated");
    tcWords.forEach((w) => w.classList.remove("is-in"));
    void el.titlecard.offsetWidth; // restart the transitions
    requestAnimationFrame(() => el.titlecard.classList.add("is-on"));
    cardShownAt = Date.now();

    // Follow the song when it's playing around the line; otherwise (no soundtrack)
    // play the same timeline off the wall clock.
    const t = playerReady && !playerFailed && state() === YT_PLAYING ? time() : -1;
    cardClock = t >= CARD_AT - 2 && t < CARD_UNTIL ? songNow : wallClock(CARD_AT);
    lastCardT = -1;
    cancelAnimationFrame(cardRaf);
    cardRaf = requestAnimationFrame(runCard);
  }

  // The YouTube API only reports the time a few times a second, so smooth between
  // reports to land each word on the beat.
  let clockVal = -1;
  let clockAt = 0;
  function songNow() {
    const t = time();
    const now = performance.now();
    if (t !== clockVal) {
      clockVal = t;
      clockAt = now;
    }
    return state() === YT_PLAYING ? t + Math.min((now - clockAt) / 1000, 0.5) : t;
  }

  function wallClock(from) {
    const t0 = performance.now();
    return () => from + (performance.now() - t0) / 1000;
  }

  let cardClock = songNow;
  let lastCardT = -1;
  let lastCardMove = 0;
  function runCard() {
    if (!cardOpen) return;
    let t = cardClock();
    // If the song stalls (paused, buffering), finish the card on its own
    const now = performance.now();
    if (t !== lastCardT) {
      lastCardT = t;
      lastCardMove = now;
    } else if (now - lastCardMove > 1500) {
      cardClock = wallClock(t);
      t = cardClock();
    }
    for (const w of tcWords) if (t >= Number(w.dataset.at) - 0.1) w.classList.add("is-in");
    if (t >= TRANSLATE_AT) el.titlecard.classList.add("is-translated");
    if (t >= CARD_UNTIL) {
      hideCard();
      return;
    }
    cardRaf = requestAnimationFrame(runCard);
  }

  // A tap anywhere on the card moves on, once the line has had a moment
  let cardShownAt = 0;
  el.titlecard.addEventListener("click", () => {
    if (cardOpen && Date.now() - cardShownAt > 1500) hideCard();
  });

  function hideCard() {
    if (!cardOpen) return;
    cancelAnimationFrame(cardRaf);
    el.titlecard.classList.remove("is-on");
    el.body.classList.remove("has-titlecard");
    setTimeout(() => {
      el.titlecard.hidden = true;
      cardOpen = false;
      if (cardFirst) unlock(true);
    }, REDUCED ? 50 : 800);
  }

  function unlock(scroll) {
    if (unlocked) return;
    unlocked = true;
    el.after.classList.remove("is-locked");
    el.body.classList.add("is-heard");
    el.cueLabel.replaceChildren("you heard it ", make("b", "", "✓"));
    if (scroll) {
      requestAnimationFrame(() =>
        el.poster.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" })
      );
    }
  }

  el.tcContinue.addEventListener("click", hideCard);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cardOpen) hideCard();
  });

  // Skip ahead: jump the song to just before the line so she still hears it
  el.skipBtn.addEventListener("click", () => {
    if (!playerReady || playerFailed) {
      showCard(true);
      return;
    }
    try {
      player.seekTo(Math.max(0, SUNG_AT - 5), true);
    } catch {
      /* ignore */
    }
    play();
    // If the soundtrack still won't start, don't leave her stuck
    setTimeout(() => {
      const st = state();
      if (!unlocked && !cardOpen && st !== YT_PLAYING && st !== YT_BUFFERING) showCard(true);
    }, 4000);
  });

  function replayLine() {
    if (!playerReady || playerFailed) {
      if (!cardOpen) showCard(false);
      return;
    }
    cardArmed = true;
    try {
      player.seekTo(Math.max(0, SUNG_AT - 5), true);
    } catch {
      /* ignore */
    }
    play();
  }

  el.replayBtn.addEventListener("click", replayLine);
  el.npReplay.addEventListener("click", replayLine);

  el.npToggle.addEventListener("click", () => {
    if (!playerReady || playerFailed) return;
    if (state() === YT_PLAYING) player.pauseVideo();
    else play();
  });

  applyConfig();
  noteQrScan();
  setupPostcard();
  watchEnding();
  loadYouTube();
})();

(() => {
  "use strict";

  const cfg = window.FILM_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const LINE_AT = Number(cfg.lineAt) || 48;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const YT_PLAYING = 1;
  const YT_BUFFERING = 3;

  const name = (cfg.recipientName || "Nare").trim();
  const sender = (cfg.senderName || "").trim();
  const songUrl = `https://www.youtube.com/watch?v=${cfg.youtubeId || ""}`;

  const el = {
    body: document.body,
    startBtn: $("#startBtn"),
    screenHint: $("#screenHint"),
    screenFallback: $("#screenFallback"),
    fallbackLink: $("#fallbackLink"),
    cueNow: $("#cueNow"),
    cueLabel: $("#cueLabel"),
    cueFill: $("#cueFill"),
    credits: $("#credits"),
    after: $("#after"),
    skipBtn: $("#skipBtn"),
    poster: $("#poster"),
    note: $("#note"),
    slate: $("#slate"),
    nextHeading: $("#nextHeading"),
    nextAction: $("#nextAction"),
    response: $("#response"),
    replayBtn: $("#replayBtn"),
    songLink: $("#songLink"),
    titlecard: $("#titlecard"),
    tcArm: $("#tcArm"),
    tcLatin: $("#tcLatin"),
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

    // Title card: Armenian line word by word
    const words = String(cfg.lineArmenian || "").split(/\s+/).filter(Boolean);
    el.tcArm.replaceChildren(
      ...words.flatMap((w, i) => {
        const span = make("span", "w", w);
        span.style.transitionDelay = `${0.5 + i * 0.38}s`;
        return i < words.length - 1 ? [span, " "] : [span];
      })
    );
    el.tcLatin.textContent = cfg.lineLatin || "";

    const eng = cfg.lineEnglish || "";
    const idx = eng.toLowerCase().lastIndexOf("yet");
    if (idx >= 0) {
      el.tcEng.replaceChildren(`“${eng.slice(0, idx)}`, make("em", "", eng.slice(idx, idx + 3)), `${eng.slice(idx + 3)}”`);
    } else {
      el.tcEng.textContent = `“${eng}”`;
    }
    el.tcCredit.textContent = `“${cfg.songTitle || "SMS"}” · ${cfg.songArtist || ""}`;
  }

  // ---------- The ask ----------

  function clap(on) {
    el.slate.classList.remove("is-clapped");
    if (!on) return;
    void el.slate.offsetWidth; // restart the clap
    el.slate.classList.add("is-clapped");
  }

  function renderYes() {
    el.response.dataset.answer = "yes";
    clap(true);

    const box = make("div", "reply reply-yes");
    const stamp = make("span", "stamp", "Admit two");
    stamp.setAttribute("aria-hidden", "true");
    box.append(stamp, make("p", "reply-title", "And… action."));

    const handle = String(cfg.instagram || "").replace(/^@/, "").trim();
    const hasContact = Boolean(handle || cfg.phone);
    box.append(
      make(
        "p",
        "",
        hasContact
          ? `Thank you, ${name}. Really. Send me a message (an SMS, like the song… or a DM, close enough) and we'll pick a day for that coffee.`
          : `Thank you, ${name}. Really. Next time you see me at Best Buy, just say “next scene.” I'll know.`
      )
    );

    if (handle) {
      const dm = make("a", "sms-btn", `Message ${sender || "me"} on Instagram`);
      dm.href = `https://ig.me/m/${encodeURIComponent(handle)}`;
      dm.target = "_blank";
      dm.rel = "noopener";
      box.append(dm, make("p", "reply-small", "Not sure what to say? “Next scene ☕” works."));

      const p = make("p", "reply-small", "or find him at ");
      const profile = make("a", "", `@${handle}`);
      profile.href = `https://www.instagram.com/${encodeURIComponent(handle)}/`;
      profile.target = "_blank";
      profile.rel = "noopener";
      p.append(profile);
      box.append(p);
    }

    if (cfg.phone) {
      const text = `Hi${sender ? " " + sender : ""}! It's ${name} 🎬 Let's continue the movie ☕`;
      const link = make("a", handle ? "" : "sms-btn", handle ? `text ${cfg.phone}` : `Text ${sender || "me"}`);
      link.href = `sms:${cfg.phone}?&body=${encodeURIComponent(text)}`;
      if (handle) {
        const p = make("p", "reply-small", "or ");
        p.append(link);
        box.append(p);
      } else {
        box.append(link);
      }
    }

    el.response.replaceChildren(box);
    el.response.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
  }

  function renderNo() {
    el.response.dataset.answer = "no";
    clap(false);
    const box = make("div", "reply");
    box.append(
      make("p", "reply-title", "That's completely fair."),
      make("p", "", "Thank you for watching this far. No awkwardness, I promise. If I see you at Best Buy, I'll just say hi like a normal person. 🙂")
    );
    const reset = make("button", "reply-reset", "Wait, I misclicked");
    reset.type = "button";
    reset.addEventListener("click", () => {
      delete el.response.dataset.answer;
      el.response.replaceChildren();
    });
    box.append(reset);
    el.response.replaceChildren(box);
    el.response.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "nearest" });
  }

  $$(".answer").forEach((btn) =>
    btn.addEventListener("click", () => (btn.dataset.answer === "yes" ? renderYes() : renderNo()))
  );

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
  let cardTimer = null;
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

  function start() {
    if (started) return;
    started = true;
    window.scrollTo(0, 0);
    el.body.classList.add("is-started");
    play();
    setTimeout(() => el.body.classList.remove("is-gated"), REDUCED ? 0 : 900);
    setTimeout(() => {
      if (!playerFailed) el.nowPlaying.hidden = false;
    }, REDUCED ? 0 : 2200);
  }

  el.startBtn.addEventListener("click", start);

  // ---------- Sync loop: credits, cue bar, the 0:48 moment ----------

  function tick() {
    if (!started) return;
    const live = playerReady && !playerFailed;
    const t = live ? time() : 0;

    el.cueNow.textContent = fmt(t);
    el.npTime.textContent = fmt(t);
    el.cueFill.style.width = `${(unlocked ? 1 : Math.min(t / LINE_AT, 1)) * 100}%`;

    let current = null;
    for (const li of el.credits.children) {
      const shown = unlocked || t >= Number(li.dataset.at);
      li.classList.toggle("is-shown", shown);
      if (shown) current = li;
    }
    for (const li of el.credits.children) li.classList.toggle("is-current", li === current);

    if (!live || cardOpen) return;
    const reached = t >= LINE_AT - 0.4;
    if (!unlocked && reached && state() === YT_PLAYING) showCard(true);
    else if (unlocked && cardArmed && reached && t < LINE_AT + 6) showCard(false);
  }

  setInterval(tick, 200);

  function showCard(first) {
    cardOpen = true;
    cardFirst = first;
    cardArmed = false;
    el.titlecard.classList.remove("is-on");
    el.titlecard.hidden = false;
    el.body.classList.add("has-titlecard");
    void el.titlecard.offsetWidth; // restart the transitions
    requestAnimationFrame(() => el.titlecard.classList.add("is-on"));
    clearTimeout(cardTimer);
    cardTimer = setTimeout(hideCard, 11500);
  }

  function hideCard() {
    if (!cardOpen) return;
    clearTimeout(cardTimer);
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
      player.seekTo(Math.max(0, LINE_AT - 4), true);
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
      player.seekTo(Math.max(0, LINE_AT - 5), true);
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
  loadYouTube();
})();

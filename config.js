// Everything personal lives here. Edit this file, not the HTML.
window.FILM_CONFIG = {
  siteUrl: "https://for-nare.com",

  recipientName: "Nare",

  // His first name (shows on the poster, script and SMS button)
  senderName: "Aram",

  // Instagram handle without the @. The "yes" reply opens a DM to him.
  instagram: "aram_chilingaryan",

  // Optional: a phone number for a "Text" button, international format ("+1818...").
  // Left empty on purpose so his number isn't on a public page.
  phone: "",

  // Push notifications through ntfy.sh: when the ticket QR is scanned, and when she
  // taps "Message Aram on Instagram" or his @handle.
  // To get it: install the free "ntfy" app, tap +, and subscribe to this topic.
  // Leave empty to turn notifications off.
  notifyTopic: "next-scene-cbebaf9ff30a5b0f",

  // The song: "SMS" by Mi Qani Hogi feat. Sebu
  youtubeId: "Y63JIH6Zu5w",
  songTitle: "SMS",
  songArtist: "Mi Qani Hogi feat. Sebu",

  // Where the part starts, in seconds (0:48): the cue bar and labels count to this
  lineAt: 48,
  lineArmenian: "Հլը չի սկսե կինոն մեր",
  lineEnglish: "Our movie hasn't started yet.",

  // When each word of that line is actually sung, in seconds into the video. The
  // title card follows the song's own clock and reveals each word as it's sung,
  // then shows the English and steps aside about 4 seconds after the last word.
  lineWordsAt: [49.1, 49.5, 49.7, 50.1, 50.5],

  // Opening credits that fade in while the song plays, before 0:48 (seconds)
  credits: [
    { at: 3, text: "Filmed on location at Best Buy." },
    { at: 12, text: "Previously: the same store, a few different days, a few glances." },
    { at: 21, text: "Every time, he told himself: next time I'll say something." },
    { at: 31, text: "This is the NEXT time." },
    { at: 40, text: "Keep listening. The line is coming…" },
  ],

  // His note to her. {name} and {sender} get filled in automatically.
  note: [
    "Okay, stepping out of the script for a second. Hi {name}, I'm {sender}.",
    "We've crossed paths at Best Buy a couple of times, and every time I walked out telling myself I'd say something next time. This is me finally doing it, just a little more dramatically than a normal person would.",
    "I'm not asking for the whole movie. Just the next scene: a coffee together, somewhere easy where we actually get to talk.",
  ],

  // The ending: "How about we continue the movie?" and the next scene she's invited to
  nextScene: {
    heading: "INT. COFFEE SHOP — SOON",
    action: "{name} and {sender}, getting a coffee together. No script. Just talking.",
  },
};

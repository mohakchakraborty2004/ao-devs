const WEEK = [
  { day: "Sunday", topic: "Random topic / bug bash", image: "assets/backgrounds/sunday.png", fallback: "linear-gradient(130deg, #24180f 0%, #a04d23 48%, #eaac4c 100%)", playlistId: "PLDIoUOhQQPlXzhp-83rECoLaV6BwFtNC4" },
  { day: "Monday", topic: "Backend", image: "assets/backgrounds/monday.png", fallback: "linear-gradient(130deg, #071c23 0%, #14677a 48%, #d4ad5e 100%)", playlistId: "PL8U7gDbfLksNOQ-IbN_jfC9DVQYt4xXTo" },
  { day: "Tuesday", topic: "Orchestrator kanban board", image: "assets/backgrounds/tuesday.png", fallback: "linear-gradient(130deg, #191431 0%, #664583 46%, #e4c084 100%)", playlistId: "PL8UyqylmnisFUwJIB68ULRC6qA3SD-EHr" },
  { day: "Wednesday", topic: "Mobile version AO", image: "assets/backgrounds/wednesday.png", fallback: "linear-gradient(130deg, #203449 0%, #4d88a2 48%, #e4b873 100%)", playlistId: "PL70T8j-ymdANGqYxN4XglRuVHsxwttVTI" },
  { day: "Thursday", topic: "AO Cloud", image: "assets/backgrounds/thursday.png", fallback: "linear-gradient(130deg, #151e3b 0%, #5f72ba 45%, #e7c8a1 100%)", playlistId: "PL7DA3D097D6FDBC02" },
  { day: "Friday", topic: "Weekly updates · Desi hip hop", image: "assets/backgrounds/friday.png", fallback: "linear-gradient(130deg, #35131a 0%, #aa3f35 47%, #e3a35a 100%)", playlistId: "PLtlu7gv0lIvEO-MozJ4UNW0YgA8rhWifg" },
  { day: "Saturday", topic: "No meet", image: "assets/backgrounds/saturday.png", fallback: "linear-gradient(130deg, #172222 0%, #617963 48%, #e4cc88 100%)", playlistId: "PLMRKdK25AuPVjHl9Kdb-gkBy0Cm7Zi2xo" }
];

const playButton = document.querySelector("#play");
const seek = document.querySelector("#seek");
const backdrops = document.querySelector(".backdrops");
const outgoing = document.querySelector(".backdrop--outgoing");
const incoming = document.querySelector(".backdrop--incoming");
let activeDay = null;
let player;
let playerReady = false;
let progressTimer;
let transitionTimer;

function getSchedule() { return WEEK[new Date().getDay()]; }
function isPlaying() { return playerReady && player.getPlayerState() === YT.PlayerState.PLAYING; }

function setBackdrop(element, schedule) {
  element.style.setProperty("--fallback", schedule.fallback);
  element.querySelector(".backdrop__image").src = schedule.image;
}

function updateClock() {
  document.querySelector("#time").textContent = new Intl.DateTimeFormat(undefined, {
    hour: "numeric", minute: "2-digit", hour12: true
  }).format(new Date());
}

function updateVoiceTime() {
  const indianParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const datePart = (type) => indianParts.find((part) => part.type === type).value;
  const voiceTime = new Date(`${datePart("year")}-${datePart("month")}-${datePart("day")}T22:00:00+05:30`);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric", minute: "2-digit", hour12: true
  }).format(voiceTime);
  const zone = ["Asia/Kolkata", "Asia/Calcutta"].includes(localZone)
    ? "IST"
    : new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
      .formatToParts(voiceTime).find((part) => part.type === "timeZoneName")?.value;
  document.querySelector("#voice-time").textContent = `Join voice at ${localTime}${zone ? ` ${zone}` : ""}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

function updateLabels() {
  const schedule = WEEK[activeDay];
  const data = playerReady ? (player.getVideoData() || {}) : {};
  document.querySelector("#playlist-name").textContent = schedule.topic;
  document.querySelector("#track-title").textContent = data.title || "YouTube playlist";
}

function cueCurrentPlaylist() {
  if (!playerReady) return;
  player.cuePlaylist({ listType: "playlist", list: WEEK[activeDay].playlistId, index: 0 });
  updateLabels();
}

function startCurrentPlaylist() {
  if (!playerReady) return;
  player.loadPlaylist({ listType: "playlist", list: WEEK[activeDay].playlistId, index: 0 });
  fadeIn();
}

function fadeIn() {
  if (!playerReady) return;
  player.setVolume(0);
  const start = performance.now();
  const ramp = (now) => {
    const volume = Math.min(Math.round(((now - start) / 1000) * 100), 100);
    player.setVolume(volume);
    if (volume < 100) requestAnimationFrame(ramp);
  };
  requestAnimationFrame(ramp);
}

function fadeOut(callback) {
  if (!isPlaying()) return callback();
  const startingVolume = player.getVolume();
  const start = performance.now();
  const ramp = (now) => {
    const volume = Math.max(Math.round(startingVolume * (1 - (now - start) / 850)), 0);
    player.setVolume(volume);
    if (volume > 0) requestAnimationFrame(ramp);
    else { player.pauseVideo(); callback(); }
  };
  requestAnimationFrame(ramp);
}

function swapDay({ initial = false } = {}) {
  const schedule = getSchedule();
  const newIndex = WEEK.indexOf(schedule);
  updateClock();
  updateVoiceTime();
  document.querySelector("#day").textContent = `${schedule.day} · ${schedule.topic}`;
  if (newIndex === activeDay) return;

  const wasPlaying = isPlaying();
  activeDay = newIndex;

  if (initial) setBackdrop(outgoing, schedule);
  else {
    setBackdrop(incoming, schedule);
    backdrops.classList.add("is-transitioning");
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      setBackdrop(outgoing, schedule);
      backdrops.classList.remove("is-transitioning");
    }, 1650);
  }

  if (!playerReady) return;
  if (wasPlaying) fadeOut(startCurrentPlaylist);
  else cueCurrentPlaylist();
}

function updateProgress() {
  if (!playerReady) return;
  const current = player.getCurrentTime();
  const duration = player.getDuration();
  document.querySelector("#elapsed").textContent = formatTime(current);
  document.querySelector("#duration").textContent = formatTime(duration);
  seek.value = duration ? (current / duration) * 100 : 0;
}

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("youtube-player", {
    height: "1", width: "1",
    playerVars: { controls: 0, disablekb: 1, playsinline: 1 },
    events: {
      onReady: () => { playerReady = true; cueCurrentPlaylist(); progressTimer = setInterval(updateProgress, 500); },
      onStateChange: ({ data }) => {
        const playing = data === YT.PlayerState.PLAYING;
        playButton.classList.toggle("is-playing", playing);
        if (data === YT.PlayerState.PLAYING || data === YT.PlayerState.CUED) updateLabels();
      }
    }
  });
};

playButton.addEventListener("click", () => {
  if (!playerReady) return;
  if (isPlaying()) player.pauseVideo();
  else player.playVideo();
});

seek.addEventListener("input", () => {
  if (playerReady && player.getDuration()) player.seekTo((seek.value / 100) * player.getDuration(), true);
});

document.querySelector("#previous").addEventListener("click", () => { if (playerReady) player.previousVideo(); });
document.querySelector("#next").addEventListener("click", () => { if (playerReady) player.nextVideo(); });

swapDay({ initial: true });
updateVoiceTime();
setInterval(swapDay, 1000);

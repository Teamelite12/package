const localVideo = document.getElementById("localVideo");
const cameraFallback = document.getElementById("cameraFallback");
const permissionMessage = document.getElementById("permissionMessage");
const contactName = document.getElementById("contactName");
const remoteAvatar = document.getElementById("remoteAvatar");
const remoteLabel = document.getElementById("remoteLabel");
const callStatus = document.getElementById("callStatus");
const callTimer = document.getElementById("callTimer");
const statusDot = document.getElementById("statusDot");
const muteButton = document.getElementById("muteButton");
const cameraButton = document.getElementById("cameraButton");
const endButton = document.getElementById("endButton");
const reactionBurst = document.getElementById("reactionBurst");
const contacts = document.querySelectorAll(".contact");
const reactionButtons = document.querySelectorAll(".reaction-button");

let localStream;
let muted = false;
let cameraOff = false;
let callActive = true;
let callStartedAt = Date.now();
let timerInterval;

function formatTime(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function updateTimer() {
  if (!callActive) return;

  const elapsedSeconds = Math.floor((Date.now() - callStartedAt) / 1000);
  callTimer.textContent = formatTime(elapsedSeconds);
}

function startTimer() {
  clearInterval(timerInterval);
  callStartedAt = Date.now();
  callTimer.textContent = "00:00";
  timerInterval = setInterval(updateTimer, 1000);
}

function syncMediaControls() {
  localStream?.getAudioTracks().forEach((track) => {
    track.enabled = !muted;
  });
  localStream?.getVideoTracks().forEach((track) => {
    track.enabled = !cameraOff;
  });

  muteButton.classList.toggle("active", muted);
  muteButton.setAttribute("aria-pressed", String(muted));
  muteButton.innerHTML = muted ? "<span>🔇</span> Unmute" : "<span>🎙️</span> Mute";

  cameraButton.classList.toggle("active", cameraOff);
  cameraButton.setAttribute("aria-pressed", String(cameraOff));
  cameraButton.innerHTML = cameraOff ? "<span>🚫</span> Camera off" : "<span>📹</span> Camera";
  cameraFallback.hidden = !cameraOff && Boolean(localStream);
}

function setCallState(active) {
  callActive = active;
  statusDot.classList.toggle("offline", !active);
  callStatus.textContent = active ? "Connected" : "Call ended";
  endButton.innerHTML = active ? "<span>☎️</span> End" : "<span>📞</span> Start";

  if (active) {
    muted = false;
    cameraOff = false;
    syncMediaControls();
    startTimer();
  } else {
    clearInterval(timerInterval);
  }
}

function updateContact(contact) {
  contacts.forEach((item) => item.classList.toggle("active", item === contact));
  contactName.textContent = contact.dataset.name;
  remoteAvatar.textContent = contact.dataset.initials;
  remoteLabel.textContent = `${contact.dataset.name.split(" ")[0]} is on the call`;
  setCallState(true);
}

async function startCameraPreview() {
  if (!navigator.mediaDevices?.getUserMedia) {
    permissionMessage.hidden = false;
    return;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    cameraFallback.hidden = true;
  } catch (error) {
    permissionMessage.hidden = false;
  }
}

function toggleAudio() {
  muted = !muted;
  syncMediaControls();
}

function toggleCamera() {
  cameraOff = !cameraOff;
  syncMediaControls();
}

function sendReaction(reaction) {
  reactionBurst.textContent = reaction;
  reactionBurst.classList.remove("show");
  void reactionBurst.offsetWidth;

  reactionBurst.classList.add("show");
}

contacts.forEach((contact) => {
  contact.addEventListener("click", () => updateContact(contact));
});

reactionButtons.forEach((button) => {
  button.addEventListener("click", () => sendReaction(button.dataset.reaction));
});

reactionBurst.addEventListener("animationend", () => {
  reactionBurst.classList.remove("show");
});

muteButton.addEventListener("click", toggleAudio);
cameraButton.addEventListener("click", toggleCamera);
endButton.addEventListener("click", () => setCallState(!callActive));

startCameraPreview();
setCallState(true);

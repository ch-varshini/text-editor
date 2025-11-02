const manualEditor = document.getElementById('manual-text');
const voiceEditor = document.getElementById('voice-text');
const micBtn = document.getElementById('mic-btn');
const completedBtn = document.getElementById('completed-btn');
const startEditContainer = document.getElementById('start-edit-container');
const startEditBtn = document.getElementById('start-edit-btn');
const voiceEditPanel = document.getElementById('voice-edit-panel');
const voiceTextDisplay = document.getElementById('voice-text-display');
const commandMicBtn = document.getElementById('command-mic-btn');
const commandFeedback = document.getElementById('command-feedback');
const toast = document.getElementById('toast');

let recognition, commandRecognition;
let isMicOn = false, isCommandMicOn = false, editingMode = false;
let micPermissionGranted = false;
let finalTranscript = "";

/* Toast */
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/* Ask mic permission once */
async function requestMicPermissionOnce() {
  if (micPermissionGranted) return true;
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    micPermissionGranted = true;
    showToast("🎧 Microphone access granted!");
    return true;
  } catch (err) {
    alert("⚠️ Please allow microphone access to use voice features.");
    return false;
  }
}

/* Color Change */
function changeColor() {
  const c = prompt("Enter color name or hex code:");
  if (c) document.execCommand('foreColor', false, c);
}

/* Highlight Word */
function highlightWord(targetEl, target, fn) {
  if (!target || !target.trim()) return;
  const html = targetEl.innerHTML;
  const re = new RegExp(`(${target})`, "gi");
  const newHtml = html.replace(re, (_, m) => fn(m).outerHTML);
  targetEl.innerHTML = newHtml;
}

/* Speech Recognition setup */
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  commandRecognition = new SR();
  commandRecognition.continuous = false;
  commandRecognition.interimResults = false;
  commandRecognition.lang = 'en-US';

  recognition.onresult = e => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalTranscript += t + " ";
      else interim += t;
    }
    voiceEditor.innerText = finalTranscript + interim;
  };

  commandRecognition.onresult = e => {
    const text = e.results[e.resultIndex][0].transcript.trim();
    applyCommand(text);
  };

  commandRecognition.onend = () => {
    if (isCommandMicOn) setTimeout(() => commandRecognition.start(), 300);
  };
}

/* Mic control */
micBtn.onclick = async () => {
  if (!recognition) return alert("Speech Recognition not supported.");
  const allowed = await requestMicPermissionOnce();
  if (!allowed) return;

  if (!isMicOn) {
    recognition.start();
    micBtn.classList.add('active');
    micBtn.textContent = '⏹️ Stop';
    isMicOn = true;
  } else {
    recognition.stop();
    micBtn.classList.remove('active');
    micBtn.textContent = '🎤 Start';
    isMicOn = false;
  }
};

/* Clear */
function clearVoiceEditor() {
  voiceEditor.innerText = "";
  voiceTextDisplay.innerHTML = "";
  finalTranscript = "";
  commandFeedback.textContent = "🎧 Waiting for command...";
}

/* Transition to editing mode */
completedBtn.onclick = () => {
  startEditContainer.style.display = 'block';
  startEditContainer.scrollIntoView({ behavior: 'smooth' });
};

startEditBtn.onclick = () => {
  editingMode = true;
  voiceTextDisplay.innerHTML = voiceEditor.innerText.trim();
  voiceEditPanel.classList.add('active');
  commandMicBtn.disabled = false;
  commandFeedback.textContent = "🎧 Ready for command.";
  voiceEditPanel.scrollIntoView({ behavior: 'smooth' });
};

/* Apply Voice Commands */
function applyCommand(cmdRaw) {
  if (!editingMode || !cmdRaw) return;
  const cmd = cmdRaw.toLowerCase().trim();
  commandFeedback.textContent = "Heard: " + cmdRaw;

  let m;
  if ((m = cmd.match(/color\s+(\w+)\s+(.+)/))) {
    const color = m[1], target = m[2].trim();
    highlightWord(voiceTextDisplay, target, txt => {
      const el = document.createElement('span');
      el.style.color = color;
      el.textContent = txt;
      return el;
    });
    commandFeedback.textContent = `✅ Colored "${target}" ${color}`;
    return;
  }

  if ((m = cmd.match(/bold\s+(.+)/))) {
    const target = m[1].trim();
    highlightWord(voiceTextDisplay, target, txt => {
      const el = document.createElement('span');
      el.className = 'bold';
      el.textContent = txt;
      return el;
    });
    commandFeedback.textContent = `✅ Bolded "${target}"`;
    return;
  }

  if ((m = cmd.match(/underline\s+(.+)/))) {
    const target = m[1].trim();
    highlightWord(voiceTextDisplay, target, txt => {
      const el = document.createElement('span');
      el.className = 'underline';
      el.textContent = txt;
      return el;
    });
    commandFeedback.textContent = `✅ Underlined "${target}"`;
    return;
  }

  commandFeedback.textContent = "❌ Command not recognized.";
}

/* Command Mic control */
commandMicBtn.onclick = async () => {
  if (!commandRecognition) return alert("Speech Recognition not supported.");
  if (!editingMode) return alert("Click 'Start Editing' first!");
  const allowed = await requestMicPermissionOnce();
  if (!allowed) return;

  if (!isCommandMicOn) {
    commandRecognition.start();
    commandMicBtn.classList.add('active');
    commandMicBtn.textContent = '⏹️ Stop';
    isCommandMicOn = true;
    commandFeedback.textContent = '🎧 Listening... (say command)';
  } else {
    isCommandMicOn = false;
    commandRecognition.stop();
    commandMicBtn.classList.remove('active');
    commandMicBtn.textContent = '🎤';
    commandFeedback.textContent = '⏹️ Stopped.';
  }
};

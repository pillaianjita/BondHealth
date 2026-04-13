/**
 * ChatRoom.js
 * Generates the HTML for the shared doctor↔patient chat+video room.
 * Route: GET /chat-room?doctorId=<uuid>&patientId=<uuid>
 */

function generateChatRoomHTML({ doctorId, patientId, doctorName, patientName, currentUserId, currentUserRole, currentUserName }) {
  const rid = [doctorId, patientId].sort().join('_');
  const peerName = currentUserRole === 'doctor' ? patientName : doctorName;
  const peerRole = currentUserRole === 'doctor' ? 'patient' : 'doctor';
  const peerId   = currentUserRole === 'doctor' ? patientId : doctorId;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BondHealth — Consultation Room</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
:root {
  --teal:   #0d9488;
  --teal-l: #14b8a6;
  --teal-d: #0f766e;
  --cyan:   #06b6d4;
  --bg:     #f0fdfa;
  --surface:#ffffff;
  --border: #ccfbf1;
  --text:   #134e4a;
  --muted:  #5eead4;
  --danger: #ef4444;
  --warn:   #f59e0b;
  --green:  #10b981;
  --radius: 16px;
  --shadow: 0 4px 24px rgba(13,148,136,.10);
  --font: 'DM Sans', sans-serif;
  --mono: 'DM Mono', monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;font-family:var(--font);background:var(--bg);color:var(--text);overflow:hidden}

/* ── Layout ──────────────────────────────────────────── */
#app{display:grid;grid-template-columns:1fr 340px;grid-template-rows:64px 1fr;height:100vh;gap:0}
@media(max-width:768px){#app{grid-template-columns:1fr;grid-template-rows:64px 1fr auto}}

/* ── Top bar ─────────────────────────────────────────── */
#topbar{
  grid-column:1/-1;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;
  background:var(--surface);
  border-bottom:1px solid var(--border);
  box-shadow:var(--shadow);
  z-index:10;
}
.topbar-left{display:flex;align-items:center;gap:12px}
.logo{display:flex;align-items:center;gap:8px;font-weight:600;font-size:.95rem;color:var(--teal-d)}
.logo svg{width:28px;height:28px}
.divider-v{width:1px;height:28px;background:var(--border)}
.peer-info{display:flex;align-items:center;gap:10px}
.peer-avatar{
  width:36px;height:36px;border-radius:50%;
  background:linear-gradient(135deg,var(--teal),var(--cyan));
  display:flex;align-items:center;justify-content:center;
  color:#fff;font-weight:600;font-size:.85rem;flex-shrink:0
}
.peer-name{font-weight:600;font-size:.9rem;color:var(--text)}
.peer-status{font-size:.75rem;color:var(--muted);display:flex;align-items:center;gap:4px}
.status-dot{width:7px;height:7px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

.topbar-right{display:flex;align-items:center;gap:8px}
.icon-btn{
  width:38px;height:38px;border-radius:10px;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:.9rem;
  transition:.2s;
}
.icon-btn.teal{background:var(--teal);color:#fff}
.icon-btn.teal:hover{background:var(--teal-d)}
.icon-btn.ghost{background:var(--border);color:var(--teal)}
.icon-btn.ghost:hover{background:var(--muted);color:#fff}
.icon-btn.danger{background:#fee2e2;color:var(--danger)}
.icon-btn.danger:hover{background:var(--danger);color:#fff}
.back-btn{
  display:flex;align-items:center;gap:6px;padding:0 12px;height:36px;
  border-radius:10px;border:1.5px solid var(--border);background:var(--surface);
  color:var(--teal);font-size:.82rem;font-weight:500;cursor:pointer;transition:.2s
}
.back-btn:hover{background:var(--border)}

/* ── Video panel (left) ─────────────────────────────── */
#video-panel{
  background:#0d1f1e;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
#video-panel.hidden-panel{display:none}

#remote-video{
  width:100%;height:100%;object-fit:cover;
  display:block;background:#0d1f1e;
}
#local-video{
  position:absolute;bottom:16px;right:16px;
  width:140px;height:100px;border-radius:12px;
  object-fit:cover;background:#1a2e2d;
  border:2px solid rgba(20,184,166,.5);
  cursor:move;z-index:5;
}
#video-placeholder{
  display:flex;flex-direction:column;align-items:center;gap:16px;color:#5eead4;
}
#video-placeholder .big-avatar{
  width:96px;height:96px;border-radius:50%;
  background:linear-gradient(135deg,#0f766e,#0e7490);
  display:flex;align-items:center;justify-content:center;
  font-size:2.2rem;font-weight:700;color:#fff;
}
#video-placeholder p{font-size:.9rem;opacity:.7}

/* Video controls bar */
#video-controls{
  position:absolute;bottom:0;left:0;right:0;
  display:flex;justify-content:center;align-items:center;gap:12px;
  padding:14px 20px;
  background:linear-gradient(transparent,rgba(5,30,28,.8));
  z-index:6;
  opacity:0;transition:opacity .3s;
}
#video-panel:hover #video-controls{opacity:1}
.ctrl-btn{
  width:44px;height:44px;border-radius:50%;border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font-size:1rem;
  transition:.2s;color:#fff;
}
.ctrl-btn.on{background:rgba(255,255,255,.15)}
.ctrl-btn.on:hover{background:rgba(255,255,255,.25)}
.ctrl-btn.off{background:rgba(255,255,255,.08);opacity:.5}
.ctrl-btn.end-call{background:var(--danger);width:52px;height:52px;font-size:1.1rem}
.ctrl-btn.end-call:hover{background:#dc2626}

/* Waiting screen */
#call-waiting{
  position:absolute;inset:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:12px;
  background:#0d1f1e;color:#5eead4;z-index:4;
}
#call-waiting.hidden{display:none}
.ring-animation{
  width:80px;height:80px;border-radius:50%;border:3px solid var(--teal-l);
  display:flex;align-items:center;justify-content:center;
  animation:ring 1.5s ease-in-out infinite;
}
@keyframes ring{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}
.ring-animation i{font-size:1.8rem}

/* No-video chat toggle banner */
#chat-only-banner{
  position:absolute;top:12px;left:50%;transform:translateX(-50%);
  background:rgba(13,148,136,.8);color:#fff;
  padding:6px 16px;border-radius:999px;font-size:.78rem;
  backdrop-filter:blur(6px);z-index:5;white-space:nowrap;
}

/* ── Chat panel (right) ─────────────────────────────── */
#chat-panel{
  background:var(--surface);
  display:flex;flex-direction:column;
  border-left:1px solid var(--border);
}
#chat-header{
  padding:14px 16px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0
}
#chat-header h3{font-size:.9rem;font-weight:600;color:var(--text)}
.msg-count{
  background:var(--teal);color:#fff;
  font-size:.72rem;font-family:var(--mono);
  padding:2px 8px;border-radius:999px;min-width:22px;text-align:center
}

#messages{
  flex:1;overflow-y:auto;padding:14px 14px 0;
  display:flex;flex-direction:column;gap:10px;
  scrollbar-width:thin;scrollbar-color:var(--muted) transparent
}
#messages::-webkit-scrollbar{width:4px}
#messages::-webkit-scrollbar-thumb{background:var(--muted);border-radius:2px}

/* Message bubbles */
.msg-row{display:flex;flex-direction:column;max-width:88%}
.msg-row.mine{align-self:flex-end;align-items:flex-end}
.msg-row.theirs{align-self:flex-start;align-items:flex-start}
.msg-meta{font-size:.68rem;color:var(--muted);margin-bottom:3px;display:flex;gap:6px;align-items:center}
.msg-bubble{
  padding:9px 13px;border-radius:14px;font-size:.83rem;line-height:1.5;word-break:break-word;
}
.msg-row.mine .msg-bubble{
  background:linear-gradient(135deg,var(--teal),var(--teal-l));
  color:#fff;border-bottom-right-radius:4px;
}
.msg-row.theirs .msg-bubble{
  background:#f0fdfa;border:1px solid var(--border);
  color:var(--text);border-bottom-left-radius:4px;
}
.msg-time{font-size:.65rem;opacity:.7}

/* System messages */
.sys-msg{
  text-align:center;font-size:.72rem;color:var(--muted);font-family:var(--mono);
  padding:4px 10px;background:#f0fdfa;border-radius:999px;
  align-self:center;border:1px solid var(--border);
}

/* Typing */
#typing-indicator{
  padding:6px 14px;font-size:.75rem;color:var(--muted);font-style:italic;
  min-height:24px;flex-shrink:0
}
.typing-dots span{
  display:inline-block;width:5px;height:5px;border-radius:50%;
  background:var(--muted);margin:0 1px;
  animation:bounce .8s ease-in-out infinite;
}
.typing-dots span:nth-child(2){animation-delay:.15s}
.typing-dots span:nth-child(3){animation-delay:.3s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

/* Input area */
#chat-input-area{
  padding:12px 14px;border-top:1px solid var(--border);flex-shrink:0
}
#chat-input-row{display:flex;gap:8px;align-items:flex-end}
#chat-input{
  flex:1;resize:none;min-height:38px;max-height:120px;
  padding:9px 12px;border:1.5px solid var(--border);border-radius:12px;
  font-family:var(--font);font-size:.84rem;color:var(--text);
  background:var(--bg);outline:none;transition:.2s;line-height:1.4;
}
#chat-input:focus{border-color:var(--teal);background:#fff}
#send-btn{
  width:38px;height:38px;flex-shrink:0;
  border-radius:10px;border:none;cursor:pointer;
  background:linear-gradient(135deg,var(--teal),var(--cyan));
  color:#fff;font-size:.9rem;display:flex;align-items:center;justify-content:center;
  transition:.2s
}
#send-btn:hover{transform:scale(1.05)}
#send-btn:active{transform:scale(.97)}

/* ── Incoming call overlay ───────────────────────────── */
#incoming-call-overlay{
  position:fixed;inset:0;z-index:100;
  background:rgba(5,30,28,.75);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;pointer-events:none;transition:opacity .3s
}
#incoming-call-overlay.active{opacity:1;pointer-events:all}
.call-card{
  background:var(--surface);border-radius:24px;padding:36px;
  text-align:center;max-width:320px;width:90%;
  box-shadow:0 24px 64px rgba(0,0,0,.25);
}
.call-card .big-avatar{
  width:80px;height:80px;border-radius:50%;
  background:linear-gradient(135deg,var(--teal),var(--cyan));
  display:flex;align-items:center;justify-content:center;
  font-size:1.8rem;font-weight:700;color:#fff;margin:0 auto 16px;
  animation:ring 1.5s ease-in-out infinite
}
.call-card h3{font-size:1.1rem;font-weight:600;margin-bottom:4px}
.call-card p{font-size:.85rem;color:var(--muted);margin-bottom:24px}
.call-actions{display:flex;justify-content:center;gap:20px}
.call-accept{
  width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;
  background:var(--green);color:#fff;font-size:1.3rem;transition:.2s
}
.call-accept:hover{transform:scale(1.1)}
.call-decline{
  width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;
  background:var(--danger);color:#fff;font-size:1.3rem;transition:.2s
}
.call-decline:hover{transform:scale(1.1)}

/* ── Toast ───────────────────────────────────────────── */
#toast{
  position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(20px);
  background:var(--text);color:#fff;padding:10px 20px;border-radius:12px;
  font-size:.82rem;z-index:200;opacity:0;transition:.3s;pointer-events:none
}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}

/* ── No-video mode (chat only) ───────────────────────── */
#app.chat-only-mode{grid-template-columns:1fr}
#app.chat-only-mode #video-panel{display:none}
#app.chat-only-mode #chat-panel{border-left:none}
</style>
</head>
<body>
<div id="app">

  <!-- Top bar -->
  <header id="topbar">
    <div class="topbar-left">
      <div class="logo">
        <svg viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="23" fill="#0d9488" opacity=".15"/>
          <path d="M25 15v20M15 25h20" stroke="#0d9488" stroke-width="3" stroke-linecap="round"/>
        </svg>
        BondHealth
      </div>
      <div class="divider-v"></div>
      <div class="peer-info">
        <div class="peer-avatar" id="peerAvatar">?</div>
        <div>
          <div class="peer-name" id="peerNameDisplay">Connecting…</div>
          <div class="peer-status"><span class="status-dot" id="statusDot"></span><span id="statusText">Waiting</span></div>
        </div>
      </div>
    </div>
    <div class="topbar-right">
      <button class="icon-btn ghost" id="toggleVideoBtn" title="Toggle video panel">
        <i class="fas fa-video"></i>
      </button>
      <button class="icon-btn teal" id="startCallBtn" title="Start video call">
        <i class="fas fa-phone"></i>
      </button>
      <button class="back-btn" onclick="window.history.back()">
        <i class="fas fa-arrow-left"></i> Back
      </button>
    </div>
  </header>

  <!-- Video panel -->
  <div id="video-panel">
    <video id="remote-video" autoplay playsinline></video>
    <video id="local-video"  autoplay playsinline muted></video>

    <div id="video-placeholder">
      <div class="big-avatar" id="placeholderAvatar">?</div>
      <p id="placeholderText">Start a call to connect</p>
    </div>

    <div id="chat-only-banner">💬 Chat-only mode — click 📞 to start video</div>

    <div id="call-waiting" class="hidden">
      <div class="ring-animation"><i class="fas fa-phone"></i></div>
      <p id="waitingText">Calling…</p>
    </div>

    <div id="video-controls">
      <button class="ctrl-btn on" id="ctrlMic" title="Toggle mic"><i class="fas fa-microphone"></i></button>
      <button class="ctrl-btn on" id="ctrlCam" title="Toggle camera"><i class="fas fa-video"></i></button>
      <button class="ctrl-btn end-call" id="ctrlEnd" title="End call"><i class="fas fa-phone-slash"></i></button>
      <button class="ctrl-btn on" id="ctrlFullscreen" title="Fullscreen"><i class="fas fa-expand"></i></button>
    </div>
  </div>

  <!-- Chat panel -->
  <div id="chat-panel">
    <div id="chat-header">
      <h3><i class="fas fa-comment-medical" style="color:var(--teal);margin-right:6px"></i>Consultation Chat</h3>
      <span class="msg-count" id="msgCount">0</span>
    </div>

    <div id="messages">
      <div class="sys-msg">🔒 End-to-end encrypted consultation</div>
    </div>

    <div id="typing-indicator"></div>

    <div id="chat-input-area">
      <div id="chat-input-row">
        <textarea id="chat-input" placeholder="Type a message…" rows="1"></textarea>
        <button id="send-btn"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>
</div>

<!-- Incoming call overlay -->
<div id="incoming-call-overlay">
  <div class="call-card">
    <div class="big-avatar" id="callerAvatar">?</div>
    <h3 id="callerName">Someone</h3>
    <p id="callerSubtitle">is calling you…</p>
    <div class="call-actions">
      <button class="call-accept" id="acceptCallBtn"><i class="fas fa-phone"></i></button>
      <button class="call-decline" id="declineCallBtn"><i class="fas fa-phone-slash"></i></button>
    </div>
  </div>
</div>

<!-- Toast -->
<div id="toast"></div>

<script src="/socket.io/socket.io.js"></script>
<script>
// ── Config (server-injected) ─────────────────────────────────────────────────
const ME = {
  id:   ${JSON.stringify(currentUserId)},
  role: ${JSON.stringify(currentUserRole)},
  name: ${JSON.stringify(currentUserName)}
};
const PEER = {
  id:   ${JSON.stringify(peerId)},
  name: ${JSON.stringify(peerName)},
  role: ${JSON.stringify(peerRole)}
};
const ROOM_ID   = ${JSON.stringify(rid)};
const DOCTOR_ID = ${JSON.stringify(doctorId)};
const PATIENT_ID= ${JSON.stringify(patientId)};

// ── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const remoteVideo    = $('remote-video');
const localVideo     = $('local-video');
const messagesEl     = $('messages');
const chatInput      = $('chat-input');
const sendBtn        = $('send-btn');
const msgCountEl     = $('msgCount');
const typingEl       = $('typing-indicator');
const videoPanel     = $('video-panel');
const videoPH        = $('video-placeholder');
const callWaiting    = $('call-waiting');
const incCallOverlay = $('incoming-call-overlay');
const chatOnlyBanner = $('chat-only-banner');

// ── State ────────────────────────────────────────────────────────────────────
let socket, pc, localStream;
let micOn = true, camOn = true;
let msgCount = 0;
let typingTimer;
let isInCall = false;
let pendingCallFrom = null;
let videoMode = false;   // false = chat-only panel, true = video+chat

// ── Init peer display ────────────────────────────────────────────────────────
const initials = PEER.name.split(' ').filter(Boolean).map(n=>n[0]).join('').toUpperCase().slice(0,2) || '?';
$('peerAvatar').textContent      = initials;
$('placeholderAvatar').textContent = initials;
$('callerAvatar').textContent    = initials;
$('peerNameDisplay').textContent = PEER.name;
$('callerName').textContent      = PEER.name;
$('callerSubtitle').textContent  = PEER.role === 'doctor' ? 'Doctor is calling…' : 'Patient is calling…';

// Default: chat-only
document.getElementById('app').classList.add('chat-only-mode');
chatOnlyBanner.style.display = 'none';

// ── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, dur = 3000) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), dur);
}

// ── Socket setup ─────────────────────────────────────────────────────────────
function initSocket() {
  // Read token from cookie
  const token = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] || '';

  socket = io({ auth: { token }, path: '/socket.io' });

  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
    $('statusText').textContent = 'Connected';
    $('statusDot').style.background = 'var(--green)';
    socket.emit('join-room', { doctorId: DOCTOR_ID, patientId: PATIENT_ID });
  });

  socket.on('disconnect', () => {
    $('statusText').textContent = 'Disconnected';
    $('statusDot').style.background = 'var(--danger)';
  });

  socket.on('connect_error', err => {
    console.warn('[socket] error', err.message);
    toast('⚠️ Connection error — retrying…');
  });

  socket.on('chat-history', msgs => {
    if (!msgs.length) return;
    msgs.forEach(m => appendMessage(m.sender_id, m.sender_name, m.message, new Date(m.created_at)));
  });

  socket.on('chat-message', msg => {
    if (msg.sender_id === ME.id) return; // Already shown optimistically
    appendMessage(msg.sender_id, msg.sender_name, msg.message, new Date(msg.created_at));
  });

  socket.on('user-joined', ({ userId, username }) => {
    if (userId !== ME.id) {
      appendSys(username + ' joined the room');
      $('statusText').textContent = 'Online';
    }
  });

  socket.on('user-left', ({ userId, username }) => {
    if (userId !== ME.id) {
      appendSys(username + ' left the room');
      $('statusText').textContent = 'Offline';
      $('statusDot').style.background = 'var(--warn)';
    }
  });

  socket.on('typing', ({ userId }) => {
    if (userId === ME.id) return;
    typingEl.innerHTML = '<span>' + PEER.name + ' is typing </span><span class="typing-dots"><span></span><span></span><span></span></span>';
  });
  socket.on('stop-typing', () => { typingEl.innerHTML = ''; });

  // ── WebRTC signalling ───────────────────────────────────────────────────────
  socket.on('webrtc-offer', async ({ offer, fromUserId }) => {
    if (!pc) createPeerConnection();
    
    // Ensure local stream is added before setting remote description
    const stream = await getLocalStream();
    if (stream) {
        stream.getTracks().forEach(track => {
        if (!pc.getSenders().find(s => s.track?.kind === track.kind)) {
            pc.addTrack(track, stream);
        }
        });
    }
    
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc-answer', { roomId: ROOM_ID, answer, targetUserId: fromUserId });
});

    socket.on('webrtc-answer', async ({ answer }) => {
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
        if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(e) {}
        }
    });

  // ── Call signalling ─────────────────────────────────────────────────────────
  socket.on('incoming-call', ({ fromUserId, fromName, callType }) => {
    pendingCallFrom = fromUserId;
    $('callerName').textContent    = fromName;
    $('callerSubtitle').textContent = callType === 'video' ? '📹 Video call…' : '📞 Voice call…';
    incCallOverlay.classList.add('active');
    toast('📞 Incoming call from ' + fromName);
  });

  socket.on('call-accepted', ({ roomId: rid }) => {
    // Just notify the room that call was accepted
    socket.to(rid).emit('call-accepted', { fromUserId: ME.id });
    appendSys('Call accepted - connecting...');
});

  socket.on('call-rejected', () => {
    callWaiting.classList.add('hidden');
    appendSys(PEER.name + ' declined the call');
    toast(PEER.name + ' declined');
    endCallCleanup();
  });

  socket.on('call-ended', () => {
    appendSys('Call ended');
    toast('Call ended');
    endCallCleanup();
  });

  socket.on('peer-media-toggle', ({ video, audio }) => {
    if (video === false) appendSys(PEER.name + ' turned off camera');
    if (audio === false) appendSys(PEER.name + ' muted mic');
  });
}

// ── Chat ─────────────────────────────────────────────────────────────────────
function appendMessage(senderId, senderName, text, date = new Date()) {
  const mine = senderId === ME.id;
  const row  = document.createElement('div');
  row.className = 'msg-row ' + (mine ? 'mine' : 'theirs');

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  row.innerHTML =
    '<div class="msg-meta">' +
      (mine ? '' : '<span>' + escHTML(senderName) + '</span>') +
      '<span class="msg-time">' + timeStr + '</span>' +
    '</div>' +
    '<div class="msg-bubble">' + escHTML(text) + '</div>';

  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  msgCount++;
  msgCountEl.textContent = msgCount;
}

function appendSys(text) {
  const div = document.createElement('div');
  div.className = 'sys-msg';
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !socket) return;

  // Optimistic
  appendMessage(ME.id, ME.name, text);
  socket.emit('chat-message', { roomId: ROOM_ID, message: text, doctorId: DOCTOR_ID, patientId: PATIENT_ID });
  chatInput.value = '';
  chatInput.style.height = 'auto';
  socket.emit('stop-typing', { roomId: ROOM_ID });
  clearTimeout(typingTimer);
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
chatInput.addEventListener('input', () => {
  // Auto-grow
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  // Typing signal
  if (socket) {
    socket.emit('typing', { roomId: ROOM_ID });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => socket.emit('stop-typing', { roomId: ROOM_ID }), 1500);
  }
});

// ── WebRTC ───────────────────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

function createPeerConnection() {
  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('webrtc-ice-candidate', {
        roomId: ROOM_ID, candidate: e.candidate, targetUserId: PEER.id
      });
    }
  };

  pc.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
    videoPH.style.display = 'none';
    isInCall = true;
    $('placeholderText').textContent = '';
  };

  pc.onconnectionstatechange = () => {
    if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
      appendSys('Connection lost');
      endCallCleanup();
    }
  };

  return pc;
}

async function getLocalStream() {
  if (localStream) return localStream;
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    return localStream;
  } catch {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localVideo.srcObject = null;
      toast('📷 Camera not available — audio only');
      return localStream;
    } catch {
      toast('🎙️ Could not access camera/mic');
      return null;
    }
  }
}

async function startWebRTC(targetUserId, isCaller = true) {
  if (!pc) createPeerConnection();

  const stream = await getLocalStream();
  if (!stream) return false;

  // Add all tracks to peer connection
  stream.getTracks().forEach(track => {
    const existing = pc.getSenders().find(s => s.track?.kind === track.kind);
    if (!existing) pc.addTrack(track, stream);
  });

  if (isCaller && targetUserId) {
    // Caller creates and sends offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('webrtc-offer', { roomId: ROOM_ID, offer, targetUserId });
  }
  return true;
}

async function initiateCall(callType = 'video') {
  if (isInCall) { toast('Already in a call'); return; }

  showVideoMode();
  callWaiting.classList.remove('hidden');
  $('waitingText').textContent = 'Calling ' + PEER.name + '…';
  appendSys('Calling ' + PEER.name + '…');

  // Start WebRTC as caller BEFORE sending call request
  const started = await startWebRTC(PEER.id, true);
  if (!started) {
    callWaiting.classList.add('hidden');
    toast('Could not access camera/mic');
    return;
  }

  socket.emit('call-request', {
    roomId: ROOM_ID, targetUserId: PEER.id, callType
  });
}

async function acceptCall() {
  incCallOverlay.classList.remove('active');
  showVideoMode();
  appendSys('Call connected');

  // Create peer connection and add local stream BEFORE answering
  if (!pc) createPeerConnection();
  const stream = await getLocalStream();
  if (stream) {
    stream.getTracks().forEach(track => {
      if (!pc.getSenders().find(s => s.track?.kind === track.kind)) {
        pc.addTrack(track, stream);
      }
    });
  }

  socket.emit('call-accepted', { roomId: ROOM_ID, targetUserId: pendingCallFrom });
  pendingCallFrom = null;
}

function declineCall() {
  incCallOverlay.classList.remove('active');
  if (pendingCallFrom) {
    socket.emit('call-rejected', { roomId: ROOM_ID, targetUserId: pendingCallFrom });
    pendingCallFrom = null;
  }
}

function endCallCleanup() {
  if (localStream) {
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (pc) { pc.close(); pc = null; }
  remoteVideo.srcObject = null;
  localVideo.srcObject  = null;
  videoPH.style.display = 'flex';
  isInCall  = false;
  micOn = camOn = true;
  callWaiting.classList.add('hidden');
  updateMediaButtons();
}

function updateMediaButtons() {
  $('ctrlMic').className = 'ctrl-btn ' + (micOn ? 'on' : 'off');
  $('ctrlMic').innerHTML = '<i class="fas fa-' + (micOn ? 'microphone' : 'microphone-slash') + '"></i>';
  $('ctrlCam').className = 'ctrl-btn ' + (camOn ? 'on' : 'off');
  $('ctrlCam').innerHTML = '<i class="fas fa-' + (camOn ? 'video' : 'video-slash') + '"></i>';
}

// ── Video mode toggle ─────────────────────────────────────────────────────────
function showVideoMode() {
  videoMode = true;
  document.getElementById('app').classList.remove('chat-only-mode');
  chatOnlyBanner.style.display = 'none';
  videoPH.style.display = 'flex';
}

$('toggleVideoBtn').addEventListener('click', () => {
  if (videoMode) {
    document.getElementById('app').classList.add('chat-only-mode');
    videoMode = false;
    $('toggleVideoBtn').innerHTML = '<i class="fas fa-video"></i>';
    $('toggleVideoBtn').title = 'Show video panel';
  } else {
    showVideoMode();
    $('toggleVideoBtn').innerHTML = '<i class="fas fa-comment"></i>';
    $('toggleVideoBtn').title = 'Hide video panel';
  }
});

// ── Control buttons ───────────────────────────────────────────────────────────
$('startCallBtn').addEventListener('click', () => initiateCall('video'));
$('acceptCallBtn').addEventListener('click', acceptCall);
$('declineCallBtn').addEventListener('click', declineCall);

$('ctrlMic').addEventListener('click', () => {
  if (!localStream) return;
  micOn = !micOn;
  localStream.getAudioTracks().forEach(t => { t.enabled = micOn; });
  socket.emit('toggle-media', { roomId: ROOM_ID, audio: micOn, video: camOn });
  updateMediaButtons();
  toast(micOn ? '🎙️ Mic on' : '🔇 Mic muted');
});

$('ctrlCam').addEventListener('click', () => {
  if (!localStream) return;
  camOn = !camOn;
  localStream.getVideoTracks().forEach(t => { t.enabled = camOn; });
  socket.emit('toggle-media', { roomId: ROOM_ID, audio: micOn, video: camOn });
  updateMediaButtons();
  toast(camOn ? '📷 Camera on' : '📷 Camera off');
});

$('ctrlEnd').addEventListener('click', () => {
  socket.emit('call-ended', { roomId: ROOM_ID });
  appendSys('You ended the call');
  endCallCleanup();
  toast('Call ended');
});

$('ctrlFullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    videoPanel.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

// Drag local video
(function() {
  let dragging = false, ox, oy;
  localVideo.addEventListener('mousedown', e => {
    dragging = true;
    ox = e.clientX - localVideo.offsetLeft;
    oy = e.clientY - localVideo.offsetTop;
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    localVideo.style.right = 'auto';
    localVideo.style.bottom = 'auto';
    localVideo.style.left = (e.clientX - ox) + 'px';
    localVideo.style.top  = (e.clientY - oy) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHTML(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(s ?? '')));
  return d.innerHTML;
}

// ── Boot ──────────────────────────────────────────────────────────────────────
initSocket();
</script>
</body>
</html>`;
}

module.exports = { generateChatRoomHTML };
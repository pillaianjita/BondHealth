/**
 * chat.js — Real-time chat + WebRTC signalling server
 * Attach to an existing Express http.Server via: require('./chat').attach(server, sessionMiddleware)
 *
 * Rooms are keyed by  `<doctorId>_<patientId>`  so both sides join the same room.
 * WebRTC signalling (offer / answer / ice-candidate) is relayed transparently.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('./db/config');

// ── In-memory stores (replace with Redis for multi-instance) ──────────────────
const activeRooms = new Map();   // roomId → { doctor, patient, createdAt }
const onlineUsers = new Map();   // userId → socketId

// ── Helper ────────────────────────────────────────────────────────────────────
function verifyJwt(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
  } catch {
    return null;
  }
}

function roomId(doctorId, patientId) {
  // Sort so the key is the same regardless of who constructs it
  return [doctorId, patientId].sort().join('_');
}

// ── Attach to HTTP server ─────────────────────────────────────────────────────
function attach(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io'
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.cookie
        ?.split(';')
        .find(c => c.trim().startsWith('token='))
        ?.split('=')[1];

    if (!token) return next(new Error('Authentication required'));

    const decoded = verifyJwt(token);
    if (!decoded) return next(new Error('Invalid token'));

    socket.user = decoded;   // { id, username, role }
    next();
  });

  // ── Connection ───────────────────────────────────────────────────────────────
  io.on('connection', socket => {
    const { id: userId, role, username } = socket.user;
    onlineUsers.set(userId, socket.id);
    console.log(`[chat] ${role} "${username}" connected — socket ${socket.id}`);

    // ── Join a chat room ───────────────────────────────────────────────────────
    // Payload: { doctorId, patientId }
    socket.on('join-room', async ({ doctorId, patientId }) => {
      if (!doctorId || !patientId) return;

      const rid = roomId(doctorId, patientId);
      socket.join(rid);
      socket.currentRoom = rid;

      // Load last 50 messages from DB
      try {
        const res = await query(
          `SELECT m.*, u.username as sender_name
           FROM chat_messages m
           JOIN users u ON m.sender_id = u.user_id
           WHERE m.room_id = $1
           ORDER BY m.created_at DESC
           LIMIT 50`,
          [rid]
        );
        const history = res.rows.reverse();
        socket.emit('chat-history', history);
      } catch (e) {
        // Table may not exist yet — that's fine
        socket.emit('chat-history', []);
      }

      // Track room
      if (!activeRooms.has(rid)) {
        activeRooms.set(rid, { doctorId, patientId, createdAt: Date.now() });
      }

      io.to(rid).emit('user-joined', { userId, role, username });
      console.log(`[chat] ${username} joined room ${rid}`);
    });

    // ── Chat message ───────────────────────────────────────────────────────────
    // Payload: { roomId, message, doctorId, patientId }
    socket.on('chat-message', async ({ roomId: rid, message, doctorId, patientId }) => {
      if (!rid || !message?.trim()) return;

      const msg = {
        id:          `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sender_id:   userId,
        sender_name: username,
        sender_role: role,
        message:     message.trim(),
        room_id:     rid,
        created_at:  new Date().toISOString()
      };

      // Persist to DB (best-effort)
      try {
        await query(
          `INSERT INTO chat_messages (room_id, sender_id, message, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [rid, userId, message.trim()]
        );
      } catch (e) {
        // Table may not exist — gracefully skip
      }

      io.to(rid).emit('chat-message', msg);
    });

    // ── WebRTC signalling ──────────────────────────────────────────────────────
    // Relay offer/answer/ice-candidate to the other peer in the room

    socket.on('webrtc-offer', ({ roomId: rid, offer, targetUserId }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      const payload = { offer, fromUserId: userId, fromRole: role, fromName: username };
      if (targetSocket) {
        io.to(targetSocket).emit('webrtc-offer', payload);
      } else {
        socket.to(rid).emit('webrtc-offer', payload);
      }
    });

    socket.on('webrtc-answer', ({ roomId: rid, answer, targetUserId }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      const payload = { answer, fromUserId: userId };
      if (targetSocket) {
        io.to(targetSocket).emit('webrtc-answer', payload);
      } else {
        socket.to(rid).emit('webrtc-answer', payload);
      }
    });

    socket.on('webrtc-ice-candidate', ({ roomId: rid, candidate, targetUserId }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      const payload = { candidate, fromUserId: userId };
      if (targetSocket) {
        io.to(targetSocket).emit('webrtc-ice-candidate', payload);
      } else {
        socket.to(rid).emit('webrtc-ice-candidate', payload);
      }
    });

    // ── Call signalling ────────────────────────────────────────────────────────
    socket.on('call-request', ({ roomId: rid, targetUserId, callType }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      const payload = { fromUserId: userId, fromName: username, fromRole: role, callType, roomId: rid };
      if (targetSocket) {
        io.to(targetSocket).emit('incoming-call', payload);
      }
    });

    socket.on('call-accepted', ({ roomId: rid, targetUserId }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call-accepted', { fromUserId: userId });
    });

    socket.on('call-rejected', ({ roomId: rid, targetUserId }) => {
      const targetSocket = onlineUsers.get(targetUserId);
      if (targetSocket) io.to(targetSocket).emit('call-rejected', { fromUserId: userId });
    });

    socket.on('call-ended', ({ roomId: rid }) => {
      socket.to(rid).emit('call-ended', { fromUserId: userId });
    });

    socket.on('toggle-media', ({ roomId: rid, video, audio }) => {
      socket.to(rid).emit('peer-media-toggle', { fromUserId: userId, video, audio });
    });

    // ── Typing indicator ───────────────────────────────────────────────────────
    socket.on('typing', ({ roomId: rid }) => {
      socket.to(rid).emit('typing', { userId, username, role });
    });
    socket.on('stop-typing', ({ roomId: rid }) => {
      socket.to(rid).emit('stop-typing', { userId });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      if (socket.currentRoom) {
        io.to(socket.currentRoom).emit('user-left', { userId, role, username });
      }
      console.log(`[chat] ${username} disconnected`);
    });
  });

  return io;
}

module.exports = { attach, activeRooms, onlineUsers };
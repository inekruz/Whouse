const socketIo = require('socket.io');

const createSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
    },
  });

  const activeUsers = new Map();
  let onlineCount = 0;

  io.on('connection', (socket) => {
    const userId = socket.handshake.query?.userId;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    if (activeUsers.has(userId)) {
      socket.emit('duplicate_connection');
      socket.disconnect(true);
      return;
    }

    activeUsers.set(userId, socket.id);
    onlineCount++;
    io.emit('online-count', onlineCount);

    socket.on('disconnect', () => {
      if (activeUsers.get(userId) === socket.id) {
        activeUsers.delete(userId);
        onlineCount--;
        io.emit('online-count', onlineCount);
      }
    });

    socket.on('update-timer', async (newDuration) => {
      io.emit('timer-updated', newDuration);
    });
  });

  return io;
};

module.exports = createSocketServer;

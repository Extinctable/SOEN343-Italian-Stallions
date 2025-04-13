const StreamingActivity = require("./StreamingActivity");

class LivePolling extends StreamingActivity {
  setup(io, socket) {
    // 1. Start a poll
    socket.on("start-poll", (pollData) => {
      console.log("🗳️ Poll started:", pollData);
      socket.broadcast.emit("start-poll", pollData); 
    });

    // 2. A viewer votes
    socket.on("vote", ({ username, option }) => {
      console.log(`🗳️ ${username} voted for: ${option}`);
      io.emit("new-vote", { option });
    });
  }
}

module.exports = LivePolling;

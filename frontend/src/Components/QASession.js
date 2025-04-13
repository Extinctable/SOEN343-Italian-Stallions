const StreamingActivity = require("./StreamingActivity");

class QASession extends StreamingActivity {
  // Optional constructor if you want fields like ID, title, etc.
  // constructor(id, title) {
  //   super();
  //   this.id = id;
  //   this.title = title;
  // }

  setup(io, socket) {
    // 1. Start Q&A: Notifies all viewers
    socket.on("start-qa", () => {
      console.log("💬 Q&A started...");
      socket.broadcast.emit("start-qa"); 
    });

    // 2. Viewer sends question
    socket.on("question", ({ username, message }) => {
      console.log("Received question from viewer:", username, message);
      io.emit("new-question", { username, message });
    });
  }
}

module.exports = QASession;

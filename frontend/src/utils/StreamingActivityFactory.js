// StreamingActivityFactory.js
// ------------------------------------
// This file implements a small Factory that creates “activity” helpers for the
// live–streaming feature set (Polling & Q/A).  Each activity encapsulates the
// socket‑io wiring plus the local React‑state callbacks it needs, so the
// Streamer / Viewer components no longer have to know about the low‑level
// event names.  Nothing about the visual behaviour changes – we are just
//organising the existing logic behind a Factory.
//
// Usage inside a React component (Streamer or Viewer):
//
//   import StreamingActivityFactory from "./StreamingActivityFactory";
//   const pollActivity = StreamingActivityFactory.create("polling", {
//       socket,          // required – the connected socket.io instance
//       onStart: () => { … },           // optional – called when activity starts
//       onUpdate: (data) => { … }       // optional – called on every update
//   });
//   pollActivity.start();               // begin listening / emitting
//   …
//   pollActivity.stop();                // clean‑up when component unmounts
//
// ------------------------------------

/*********************
 * Abstract base‑class
 *********************/
class StreamingActivity {
    constructor(socket) {
      if (!socket) throw new Error("A socket instance is required");
      this.socket = socket;
      this._handlers = []; // keep references so we can detach later
    }
  
    /** Register a socket listener and remember it so we can remove it on stop() */
    _on(event, fn) {
      this.socket.on(event, fn);
      this._handlers.push({ event, fn });
    }
  
    /** Emit a socket event */
    _emit(event, payload) {
      this.socket.emit(event, payload);
    }
  
    /** Remove all listeners that were attached via _on() */
    _detachAll() {
      this._handlers.forEach(({ event, fn }) => this.socket.off(event, fn));
      this._handlers = [];
    }
  
    /* eslint-disable class-methods-use-this */
    // Sub‑classes must implement start() and stop()
    start() { throw new Error("start() not implemented"); }
    stop()  { throw new Error("stop() not implemented"); }
    /* eslint-enable class-methods-use-this */
  }
  
  /*********************
   * Live‑Polling helper
   *********************/
  class LivePolling extends StreamingActivity {
    constructor(socket, { onStart, onUpdate }) {
      super(socket);
      this.onStart = onStart;
      this.onUpdate = onUpdate;
    }
  
    start() {
      // Streamer will emit `start-poll`, viewers emit `vote`, and everyone hears
      // `new-vote`.  We just forward them to the supplied callbacks.
      this._on("start-poll", (pollData) => {
        this.onStart && this.onStart(pollData);
      });
  
      this._on("new-vote", (vote) => {
        this.onUpdate && this.onUpdate(vote);
      });
    }
  
    /** Utility for the Streamer side to start a poll */
    sendPoll(pollData) {
      this._emit("start-poll", pollData);
    }
  
    /** Utility for the Viewer side to vote */
    sendVote(vote) {
      this._emit("vote", vote);
    }
  
    stop() {
      this._detachAll();
    }
  }
  
  /*********************
   * Q/A Session helper
   *********************/
  class QASession extends StreamingActivity {
    constructor(socket, { onStart, onQuestion }) {
      super(socket);
      this.onStart = onStart;
      this.onQuestion = onQuestion;
    }
  
    start() {
      // Streamer triggers QA with `start-qa`; viewers send `question` events.
      this._on("start-qa", () => {
        this.onStart && this.onStart();
      });
  
      this._on("new-question", (payload) => {
        this.onQuestion && this.onQuestion(payload);
      });
    }
  
    /** Streamer announces start */
    announceStart() {
      this._emit("start-qa");
    }
  
    /** Viewer submits a question */
    submitQuestion(q) {
      this._emit("question", q);
    }
  
    stop() {
      this._detachAll();
    }
  }
  
  /*********************
   * Factory Singleton
   *********************/
  const StreamingActivityFactory = {
    /**
     * Create a concrete StreamingActivity instance.
     *
     * @param {"polling"|"qa"} type
     * @param {object}          options – must include `socket` and any callbacks
     */
    create(type, options = {}) {
      const { socket, ...rest } = options;
      if (!socket) throw new Error("StreamingActivityFactory: socket is required");
  
      switch (type) {
        case "polling":
          return new LivePolling(socket, rest);
        case "qa":
          return new QASession(socket, rest);
        default:
          throw new Error(`Unknown StreamingActivity type: ${type}`);
      }
    },
  };
  
  export default StreamingActivityFactory;
  
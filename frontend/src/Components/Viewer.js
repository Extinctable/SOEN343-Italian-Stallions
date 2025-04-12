import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./Viewer.css";
import StreamingActivityFactory from "../utils/StreamingActivityFactory";   

const socket = io("http://localhost:5002", { transports: ["websocket"] });

const Viewer = () => {
  const videoRef          = useRef(null);
  const peerConnectionRef = useRef(null);

  // ────────── UI state ──────────
  const [subtitle,       setSubtitle]       = useState("");
  const [qaActive,       setQaActive]       = useState(false);
  const [question,       setQuestion]       = useState("");
  const [username]                         = useState("viewer 1"); // stub
  const [pollData,       setPollData]       = useState(null);
  const [selectedOption, setSelectedOption] = useState("");

  // activity refs
  const qaActivityRef   = useRef(null);
  const pollActivityRef = useRef(null);

  /* ---------- main effect ---------- */
  useEffect(() => {
    /* 1️⃣ Activities */
    qaActivityRef.current = StreamingActivityFactory.create("qa", socket, {
      onStartQA: () => setQaActive(true),
    });

    pollActivityRef.current = StreamingActivityFactory.create("poll", socket, {
      onPollStart: data => {
        setPollData(data);
        setSelectedOption("");
      },
    });

    qaActivityRef.current.init();
    pollActivityRef.current.init();

    /* 2️⃣ WebRTC viewer setup */
    (async () => {
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      pc.ontrack = e => (videoRef.current.srcObject = e.streams[0]);
      pc.onicecandidate = e => e.candidate && socket.emit("stream-ice-candidate", e.candidate);

      socket.on("connect", () => socket.emit("viewer-ready"));
      socket.on("stream-offer", async offer => {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("stream-answer", answer);
      });
      socket.on("stream-ice-candidate", c => pc.addIceCandidate(new RTCIceCandidate(c)));
      socket.on("subtitle", txt => setSubtitle(txt));
    })();

    /* cleanup */
    return () => {
      qaActivityRef.current.dispose();
      pollActivityRef.current.dispose();
      peerConnectionRef.current?.close();
    };
  }, []);

  /* ----------  interactions ---------- */
  const handleVoteSubmit = e => {
    e.preventDefault();
    if (!selectedOption) return;
    socket.emit("vote", { username, option: selectedOption });
    setPollData(null); // hide poll after voting
  };

  const handleQuestionSubmit = e => {
    e.preventDefault();
    if (!question.trim()) return;
    socket.emit("question", { username, message: question.trim() });
    setQuestion("");
  };

  /* ----------  render ---------- */
  return (
    <div>
      <h2>Watching Live Stream</h2>
      <video ref={videoRef} autoPlay controls style={{ width: "600px" }} />

      {subtitle && (
        <div className="subtitle-box">
          {subtitle}
        </div>
      )}

      {qaActive && (
        <div className="qa-container">
          <h3 className="qa-title">💬 Q&A is Live – Ask your question</h3>
          <form onSubmit={handleQuestionSubmit} className="qa-form">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Type your question..."
              className="qa-input"
            />
            <button type="submit" className="qa-send-button">Send</button>
          </form>
        </div>
      )}

      {pollData && (
        <div className="poll-container">
          <h3 className="poll-title">📊 {pollData.question}</h3>
          <form onSubmit={handleVoteSubmit} className="poll-form">
            {pollData.options.map(opt => (
              <label key={opt} className="poll-option">
                <input
                  type="radio"
                  name="poll"
                  value={opt}
                  checked={selectedOption === opt}
                  onChange={e => setSelectedOption(e.target.value)}
                />
                {opt}
              </label>
            ))}
            <button type="submit" className="poll-vote-button">Vote</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Viewer;

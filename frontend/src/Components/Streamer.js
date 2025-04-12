import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./Streamer.css";
import StreamingActivityFactory from "../utils/StreamingActivityFactory"; 

// Connect to your Node server (port 5002)
const signalingSocket = io("http://localhost:5002", {
  transports: ["websocket"],
});

let hasSetRemoteAnswer = false;

const Streamer = () => {
  const videoRef          = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef  = useRef(null);
  const audioChunksRef    = useRef([]);

  // ───────────────────────── UI state ─────────────────────────
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCameraOff,  setIsCameraOff]  = useState(false);
  const [isStreaming,  setIsStreaming]  = useState(true);

  // Q & A and Poll state
  const [qaQuestions,  setQaQuestions]  = useState([]);
  const [pollResults,  setPollResults]  = useState(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions,  setPollOptions]  = useState(["", ""]);

  // ───────────────── Activity objects (factory) ────────────────
  const qaActivityRef   = useRef(null);
  const pollActivityRef = useRef(null);

  /* ----------  media helpers  ---------- */
  const toggleMute = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getAudioTracks().forEach(t => (t.enabled = !t.enabled));
      setIsMuted(p => !p);
    }
  };

  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getVideoTracks().forEach(t => (t.enabled = !t.enabled));
      setIsCameraOff(p => !p);
    }
  };

  const endStream = () => {
    peerConnectionRef.current?.close();
    videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
    videoRef.current && (videoRef.current.srcObject = null);
    setIsStreaming(false);
  };

  /* ----------  main effect  ---------- */
  useEffect(() => {
    /* 1️⃣  Build activity objects  */
    qaActivityRef.current = StreamingActivityFactory.create("qa", signalingSocket, {
      onNewQuestion: ({ username, message }) =>
        setQaQuestions(prev => [...prev, `${username} asked: ${message}`]),
    });

    pollActivityRef.current = StreamingActivityFactory.create("poll", signalingSocket, {
      onPollStart: pollData => {
        const counts = {};
        pollData.options.forEach(opt => (counts[opt] = 0));
        setPollResults({ question: pollData.question, counts });
      },
      onVote: ({ option }) =>
        setPollResults(prev =>
          !prev || !prev.counts[option]
            ? prev
            : { ...prev, counts: { ...prev.counts, [option]: prev.counts[option] + 1 } }
        ),
    });

    /* 2️⃣  Attach listeners  */
    qaActivityRef.current.init();
    pollActivityRef.current.init();

    /* 3️⃣  WebRTC boot‑strap  */
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current && (videoRef.current.srcObject = stream);

      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = e => e.candidate && signalingSocket.emit("stream-ice-candidate", e.candidate);

      signalingSocket.on("viewer-ready", async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signalingSocket.emit("stream-offer", offer);
      });

      signalingSocket.on("stream-answer", async answer => {
        if (!hasSetRemoteAnswer) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          hasSetRemoteAnswer = true;
        }
      });

      signalingSocket.on("stream-ice-candidate", c => pc.addIceCandidate(new RTCIceCandidate(c)));

      /* ---- audio chunking for subtitles ---- */
      const audioStream     = new MediaStream(stream.getAudioTracks());
      const mediaRecorder   = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = e => e.data.size && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" });
        audioChunksRef.current = [];
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(",")[1];
          signalingSocket.emit("audio_chunk", base64);
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start();
      const interval = setInterval(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 3000);

      /* cleanup on unmount */
      return () => {
        clearInterval(interval);
        pc.close();
        mediaRecorder.state !== "inactive" && mediaRecorder.stop();
      };
    })();

    return () => {
      qaActivityRef.current.dispose();
      pollActivityRef.current.dispose();
    };
  }, []);

  /* ----------  Poll creation helpers  ---------- */
  const handleStartPoll = () => {
    const options = pollOptions.map(o => o.trim()).filter(Boolean);
    if (!pollQuestion.trim() || options.length < 2) {
      alert("Please provide a poll question and at least two options.");
      return;
    }
    signalingSocket.emit("start-poll", { question: pollQuestion.trim(), options });
    setPollQuestion("");
    setPollOptions(["", ""]);
  };

  /* ----------  render  ---------- */
  return (
    <div className="stream-layout">
      <div className="all_stream_controls">
        <div className="stream-controls">
          <h3>🎛️ Stream Controls</h3>
          <button onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
          <button onClick={toggleVideo}>{isCameraOff ? "Turn Camera On" : "Turn Camera Off"}</button>
          <button onClick={endStream}>End Stream</button>
        </div>

        <div className="stream-controls questions">
          <h3>Ask viewers</h3>
          <button onClick={() => signalingSocket.emit("start-qa")}>Start Q/A</button>

          <div className="poll-creator">
            <input
              type="text"
              placeholder="Poll Question"
              value={pollQuestion}
              onChange={e => setPollQuestion(e.target.value)}
              className="poll-input"
            />

            {pollOptions.map((opt, i) => (
              <input
                key={i}
                type="text"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => {
                  const next = [...pollOptions];
                  next[i] = e.target.value;
                  setPollOptions(next);
                }}
                className="poll-input"
              />
            ))}

            <button onClick={() => setPollOptions([...pollOptions, ""])} className="add-option-button">
              ➕ Add Option
            </button>
          </div>

          <button onClick={handleStartPoll}>Start a poll</button>
        </div>
      </div>

      <div className="stream-card">
        <div className={isStreaming ? "stream-status" : "stream-status not"}>
          <span className={isStreaming ? "status-dot" : "status-dot not_dot"} />
          <span>{isStreaming ? "You are now streaming" : "Currently not streaming"}</span>
        </div>
        <video ref={videoRef} autoPlay muted className="stream-video" />
        <p className="viewer_count">Current viewer count: 0</p>
      </div>

      {/* QA + Poll results */}
      <div className="qa-section">
        <h3>📩 Viewer Questions</h3>
        {qaQuestions.length ? (
          <ul>{qaQuestions.map((q, i) => <li key={i}>{q}</li>)}</ul>
        ) : (
          <p>No questions yet.</p>
        )}

        {pollResults && (
          <div className="poll-results">
            <h3>{pollResults.question}</h3>
            <ul>
              {Object.entries(pollResults.counts).map(([opt, cnt]) => (
                <li key={opt}>
                  {opt}: {cnt} vote{cnt !== 1 ? "s" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Streamer;

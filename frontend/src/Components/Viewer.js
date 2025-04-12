import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./Viewer.css";
// Connect to signaling server (Node.js)
const socket = io("http://localhost:5002", {
  transports: ["websocket"],
});

const Viewer = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [subtitle, setSubtitle] = useState("");
  const [qaActive, setQaActive] = useState(false);
const [question, setQuestion] = useState("");
const [username, setUsername] = useState("viewer 1"); // Replace this with real user info if you have auth
const [pollData, setPollData] = useState(null); // poll question + options
const [selectedOption, setSelectedOption] = useState("");



  useEffect(() => {
    const setupViewer = async () => {
      console.log("👀 Setting up viewer...");

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      // When streamer tracks arrive, put them in the video
      peerConnection.ontrack = (event) => {
        console.log("🎬 Received media stream:", event.streams);
        videoRef.current.srcObject = event.streams[0];
      };

      // Send ICE candidates to streamer
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("📨 Sending ICE candidate to streamer");
          socket.emit("stream-ice-candidate", event.candidate);
        }
      };

      socket.on("start-poll", (data) => {
        setPollData(data); // { question: '...', options: ['...', '...'] }
        setSelectedOption("");
      });
      

      // On connect => let streamer know viewer is ready
      socket.on("connect", () => {
        console.log("✅ Viewer connected to signaling server:", socket.id);
        socket.emit("viewer-ready");
      });

      // On disconnect
      socket.on("disconnect", () => {
        console.warn("⚠️ Viewer disconnected from signaling server");
      });

      socket.on("start-qa", () => {
        setQaActive(true);
      });
      

      // On stream-offer => create and send answer
      socket.on("stream-offer", async (offer) => {
        console.log("📥 Received stream offer from streamer:", offer?.sdp);
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          console.log("📤 Sending answer back to streamer");
          socket.emit("stream-answer", answer);
        } catch (err) {
          console.error("❌ Error during offer/answer exchange:", err);
        }
      });

      // On ICE from streamer => add candidate
      socket.on("stream-ice-candidate", async (candidate) => {
        try {
          console.log("📥 Received ICE candidate from streamer");
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("❌ Error adding ICE candidate:", err);
        }
      });

      // 📝 Listen for subtitles from Node server
      socket.on("subtitle", (data) => {
        console.log("📝 Subtitle received:", data);
        setSubtitle(data);
      });
    };

    setupViewer();


    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log("⚠️ Viewer connection closed.");
      }
    };
  }, []);

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    if (!selectedOption) return;
  
    socket.emit("vote", {
      username,
      option: selectedOption
    });
  
    // optionally clear or disable poll
    setPollData(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
  
    socket.emit("question", {
      username,
      message: question
    });
  
    setQuestion(""); // clear input
  };
  return (
    <div>
      <h2>Watching Live Stream</h2>
      <video ref={videoRef} autoPlay controls style={{ width: "600px" }} />

      {subtitle && (
        <div
          style={{
            backgroundColor: "black",
            color: "white",
            padding: "10px",
            marginTop: "10px",
            width: "600px",
            textAlign: "center",
            borderRadius: "8px"
          }}
        >
          {subtitle}
        </div>
      )}

{qaActive && (
  <div className="qa-container">
    <h3 className="qa-title">💬 Q&A is Live – Ask your question</h3>
    <form onSubmit={handleSubmit} className="qa-form">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Type your question..."
        className="qa-input"
      />
      <button type="submit" className="qa-send-button">
        Send
      </button>
    </form>
  </div>
)}

{pollData && (
  <div className="poll-container">
    <h3 className="poll-title">📊 {pollData.question}</h3>
    <form onSubmit={handleVoteSubmit} className="poll-form">
      {pollData.options.map((opt, idx) => (
        <label key={idx} className="poll-option">
          <input
            type="radio"
            name="poll"
            value={opt}
            checked={selectedOption === opt}
            onChange={(e) => setSelectedOption(e.target.value)}
          />
          {opt}
        </label>
      ))}
      <button type="submit" className="poll-vote-button">
        Vote
      </button>
    </form>
  </div>
)}

    </div>
  );
};

export default Viewer;

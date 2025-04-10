import React, { useEffect, useRef, useState  } from "react";
import io from "socket.io-client";
import "./Streamer.css";



// Connect to your Node server (port 5002)
const signalingSocket = io("http://localhost:5002", {
  transports: ["websocket"],
});

let hasSetRemoteAnswer = false;

const Streamer = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const streamRef = useRef(null); // to hold original stream
  const [isStreaming, setIsStreaming] = useState(true);
  const [qaQuestions, setQaQuestions] = useState([]);
  const [pollResults, setPollResults] = useState(null);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]); // start with 2 empty options
  


  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  };

  const endStream = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log("🛑 Stream ended.");
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false)
  };
  
  useEffect(() => {
    const startStreaming = async () => {
      console.log("📡 Starting stream...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          signalingSocket.emit("stream-ice-candidate", event.candidate);
        }
      };

      signalingSocket.on("viewer-ready", async () => {
        console.log("👀 Viewer ready, sending offer...");
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        signalingSocket.emit("stream-offer", offer);
      });

      signalingSocket.on("new-question", ({ username, message }) => {
        console.log("📣 Emitting 'start-qa' event to viewers");
        setQaQuestions((prev) => [...prev, `${username} asked: ${message}`]);
      });
      signalingSocket.on("start-poll", (pollData) => {
        // Reset poll results
        const initialCounts = {};
        pollData.options.forEach(opt => {
          initialCounts[opt] = 0;
        });
        setPollResults({
          question: pollData.question,
          counts: initialCounts
        });
      });
      
      signalingSocket.on("new-vote", ({ option }) => {
        setPollResults(prev => {
          if (!prev || !prev.counts[option]) return prev;
          return {
            ...prev,
            counts: {
              ...prev.counts,
              [option]: prev.counts[option] + 1
            }
          };
        });
      });
      
      signalingSocket.on("stream-answer", async (answer) => {
        if (!hasSetRemoteAnswer) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          hasSetRemoteAnswer = true;
          console.log("✅ Remote description set");
        }
      });

      signalingSocket.on("stream-ice-candidate", async (candidate) => {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      });

      // Setup audio recording
      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        audioChunksRef.current = [];

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(",")[1];
          signalingSocket.emit("audio_chunk", base64Audio);
          console.log("📤 Sent finalized audio chunk to server");
        };
        reader.readAsDataURL(finalBlob);
      };

      // Start a loop to stop/start every 5 seconds
      mediaRecorder.start();
      console.log("🎙️ MediaRecorder started");

      const interval = setInterval(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 3000);

      // Cleanup
      return () => clearInterval(interval);
    };

    startStreaming();

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        console.log("⚠️ PeerConnection closed.");
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        console.log("🛑 MediaRecorder stopped.");
      }
    };
  }, []);

  const handleStartPoll = () => {
    const trimmedOptions = pollOptions.map(opt => opt.trim()).filter(opt => opt !== "");
  
    if (!pollQuestion.trim() || trimmedOptions.length < 2) {
      alert("Please provide a poll question and at least two valid options.");
      return;
    }
  
    const pollData = {
      question: pollQuestion.trim(),
      options: trimmedOptions
    };
  
    signalingSocket.emit("start-poll", pollData);
    console.log("📢 Poll sent to viewers:", pollData);
  
    // Clear the form
    setPollQuestion("");
    setPollOptions(["", ""]);
  };
  
  

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
        
       
        <button onClick={() => signalingSocket.emit("start-qa")}>
  Start Q/A
</button>

<div className="poll-creator">
  <input
    type="text"
    placeholder="Poll Question"
    value={pollQuestion}
    onChange={(e) => setPollQuestion(e.target.value)}
    className="poll-input"
  />

  {pollOptions.map((option, idx) => (
    <input
      key={idx}
      type="text"
      placeholder={`Option ${idx + 1}`}
      value={option}
      onChange={(e) => {
        const newOptions = [...pollOptions];
        newOptions[idx] = e.target.value;
        setPollOptions(newOptions);
      }}
      className="poll-input"
    />
  ))}

  <button
    onClick={() => setPollOptions([...pollOptions, ""])}
    className="add-option-button"
  >
    ➕ Add Option
  </button>
</div>


<button onClick={handleStartPoll}>Start a poll</button>

      </div>
      </div>
  
      <div className="stream-card">
        <div className={isStreaming ? "stream-status" : "stream-status not"}>
          <span className={isStreaming ? "status-dot" : "status-dot not_dot"} />
          <span>{isStreaming ? "You are now streaming" :  "Currently not streaming"}</span>
        </div>
        <video ref={videoRef} autoPlay muted className="stream-video" />
        <p className="viewer_count">Current viewer count: 0</p>
      </div>

      <div className="qa-section">
  <h3>📩 Viewer Questions</h3>
  {qaQuestions.length === 0 ? (
    <p>No questions yet.</p>
  ) : (
    <ul>
      {qaQuestions.map((q, idx) => (
        <li key={idx}>{q}</li>
      ))}
    </ul>
  )}

{pollResults && (
  <div className="poll-results">
    <h3>{pollResults.question}</h3>
    <ul>
      {Object.entries(pollResults.counts).map(([option, count]) => (
        <li key={option}>
          {option}: {count} vote{count !== 1 ? "s" : ""}
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

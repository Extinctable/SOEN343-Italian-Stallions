import React, { useEffect, useRef } from "react";
import io from "socket.io-client";

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
        audioBitsPerSecond: 64000,
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
      }, 1000);

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

  return (
    <div>
      <h2>You are now streaming</h2>
      <video ref={videoRef} autoPlay muted style={{ width: "600px" }} />
    </div>
  );
};

export default Streamer;

import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

// Connect to signaling server (Node.js)
const socket = io("http://localhost:5002", {
  transports: ["websocket"],
});

const Viewer = () => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [subtitle, setSubtitle] = useState("");

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

      // On connect => let streamer know viewer is ready
      socket.on("connect", () => {
        console.log("✅ Viewer connected to signaling server:", socket.id);
        socket.emit("viewer-ready");
      });

      // On disconnect
      socket.on("disconnect", () => {
        console.warn("⚠️ Viewer disconnected from signaling server");
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
    </div>
  );
};

export default Viewer;

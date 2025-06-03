
import { useEffect, useRef, useState } from "react";

const SIGNALING_SERVER_URL = "ws://localhost:3001";
const ROOM_NAME = "demo";

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const wsRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(SIGNALING_SERVER_URL);
    wsRef.current = ws;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    });

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", room: ROOM_NAME }));
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: "answer", answer }));
      } else if (data.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === "candidate") {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    const startConnection = async () => {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "offer", offer }));
    };

    setTimeout(startConnection, 1000); // Delay for joining room

    return () => {
      ws.close();
      pc.close();
    };
  }, []);

  return (
    <div>
      <h1>ConfApp WebRTC Demo</h1>
      <video ref={localVideoRef} autoPlay muted playsInline width="300" />
      <video ref={remoteVideoRef} autoPlay playsInline width="300" />
    </div>
  );
}

export default App;

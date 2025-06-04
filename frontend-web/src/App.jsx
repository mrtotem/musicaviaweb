// src/App.jsx
import React, { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';

function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    const pc = new RTCPeerConnection();

    // Manejar candidatos ICE
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
      }
    };

    // Manejar tracks remotos
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => [...prev, remoteStream]);
    };

    // Obtener acceso a cámara y micrófono
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      })
      .catch((err) => {
        console.error('Error al acceder a dispositivos multimedia:', err);
      });

    // Manejar mensajes del servidor de señalización
    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
      }

      if (data.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }

      if (data.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error al agregar ICE candidate:', e);
        }
      }
    };

    // Enviar mensaje JOIN al conectar
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', room: 'test-room' }));
    };

    return () => {
      ws.close();
      pc.close();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Tu video local</h2>
      {localStream && <VideoPlayer stream={localStream} />}

      <h2>Video remoto</h2>
      {remoteStreams.length > 0 ? (
        remoteStreams.map((stream, index) => (
          <VideoPlayer key={index} stream={stream} />
        ))
      ) : (
        <p>No hay video remoto conectado aún.</p>
      )}
    </div>
  );
}

export default App;
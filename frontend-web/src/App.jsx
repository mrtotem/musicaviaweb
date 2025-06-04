import React, { useEffect, useRef, useState } from 'react';
import VideoPlayer from './components/VideoPlayer';

function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [room, setRoom] = useState('');
  const socketRef = useRef(null);
  const pcRefs = useRef({});

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    socketRef.current = ws;

    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);

      if (data.type === 'offer' || data.type === 'answer' || data.type === 'candidate') {
        const peerId = data.from;

        if (!pcRefs.current[peerId]) {
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });

          pc.onicecandidate = (e) => {
            if (e.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: 'candidate',
                candidate: e.candidate,
                to: peerId
              }));
            }
          };

          pc.ontrack = (e) => {
            setRemoteStreams((prev) => [...prev, e.streams[0]]);
          };

          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          if (data.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current.send(JSON.stringify({
              type: 'answer',
              sdp: answer,
              to: peerId
            }));
          }

          pcRefs.current[peerId] = pc;
        } else {
          await pcRefs.current[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const joinRoom = async () => {
    if (!room.trim()) {
      alert('Por favor ingresa un nombre de sala válido.');
      return;
    }

    const ws = socketRef.current;
    ws.send(JSON.stringify({ type: 'join', room }));

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setLocalStream(stream);

    stream.getTracks().forEach(track => {
      for (const pc of Object.values(pcRefs.current)) {
        pc.addTrack(track, stream);
      }
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>ConfApp - Clases Multipersona</h1>

      {!localStream ? (
        <div>
          <input
            type="text"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Nombre de la sala"
            style={{ padding: '8px', width: '250px' }}
          />
          <button onClick={joinRoom} style={{ marginLeft: '10px', padding: '8px 12px' }}>Unirse a Sala</button>
        </div>
      ) : (
        <>
          <h2>Tu video local</h2>
          <VideoPlayer stream={localStream} />

          <h2>Videos remotos</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {remoteStreams.map((stream, index) => (
              <VideoPlayer key={index} stream={stream} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
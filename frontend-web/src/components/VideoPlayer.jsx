import React, { useEffect, useRef } from 'react';

const VideoPlayer = ({ stream }) => {
  const ref = useRef();

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={false}
      style={{ width: '400px', height: '300px', border: '1px solid #ccc' }}
    />
  );
};

export default VideoPlayer;
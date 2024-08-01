import React, { useRef, useEffect } from 'react';

function Room() {
  const videoRef = useRef(null);

  useEffect(() => {
    const getWebcamStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    getWebcamStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div
      className='w-[100vw] h-[100vh] flex justify-center'
      style={{
        background: 'linear-gradient(to right, #FFB6C1, #00008B)',
      }}
    >
      <div className='flex items-center justify-center flex-col gap-10'>
        <div className='flex items-center justify-center'>
          <video
            ref={videoRef}
            className='w-[35vw] h-[45vh] bg-black object-cover transform scale-x-[-1] rounded-xl'
            autoPlay
          ></video>
        </div>

        <textarea
          className='h-[4vh] w-[12vw] text-center text-lg rounded-md overflow-hidden'
          name=""
          placeholder='Enter room number'
          id=""
        ></textarea>

    

      </div>
    </div>
  );
}

export default Room;

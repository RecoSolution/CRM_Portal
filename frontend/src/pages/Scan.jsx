import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDraft, clearDraft } from '../utils/scanDraftStore';
import { useEffect } from 'react';

export default function Scan() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
  return () => {
    // Stop any active camera stream when this page unmounts,
    // so it doesn't conflict with the microphone on Voice Note
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }
}, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied or unavailable', err);
    }
  }

  function flipCamera() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    startCamera();
  }

  function capturePhoto() {
    setScanning(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    video.srcObject?.getTracks().forEach((track) => track.stop());

    setTimeout(() => {
      clearDraft(); // fresh draft for a brand new scan
      setDraft({ imageData });
      navigate('/scanned-card');
    }, 1500);
  }

  function handleGalleryImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      clearDraft();
      setDraft({ imageData: reader.result });
      navigate('/scanned-card');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg flex flex-col'>
      {/* Top bar */}
      <div className='bg-sage flex items-center justify-between px-5 h-12 shrink-0'>
        <button onClick={() => setFlashOn(!flashOn)}>
          <img
            src={
              flashOn
                ? '/assets/icons/flash-on.svg'
                : '/assets/icons/flash-off.svg'
            }
            alt='flash'
            className='w-5 h-5'
          />
        </button>
        <button onClick={() => navigate('/scan-history')}>
          <img
            src='/assets/icons/scan-history.svg'
            alt='history'
            className='w-5 h-5'
          />
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className='flex-1 flex flex-col items-center justify-center px-6'>
        <div className='relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gray-500'>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => {}}
            className='w-full h-full object-cover'
          />
          {!videoRef.current?.srcObject && (
            <button
              onClick={startCamera}
              className='absolute inset-0 flex items-center justify-center bg-gray-500/80 text-white text-sm font-medium'
            >
              Tap to enable camera
            </button>
          )}

          {scanning && (
            <div className='absolute inset-0 bg-gray-500/70 flex items-center justify-center'>
              <div className='bg-bg rounded-2xl px-8 py-6 flex flex-col items-center gap-3'>
                <div className='w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin' />
                <span className='text-[14px] font-semibold text-gray-900'>
                  Scanning Card in Progress...
                </span>
              </div>
            </div>
          )}
        </div>

        <p className='text-center text-[13px] text-gray-600 mt-4'>
          Fix entire card to capture the Image properly
        </p>
      </div>

      {/* Bottom controls */}
      <div className='bg-forest flex items-center justify-between px-8 py-6 shrink-0'>
        <button onClick={() => fileInputRef.current?.click()}>
          <img
            src='/assets/icons/gallery-import.svg'
            alt='import'
            className='w-6 h-6'
          />
        </button>

        <button
          onClick={capturePhoto}
          disabled={scanning}
          className='w-16 h-16 rounded-full bg-sage border-4 border-white/30 disabled:opacity-60'
        />

        <button onClick={flipCamera}>
          <img
            src='/assets/icons/flip-camera.svg'
            alt='flip'
            className='w-6 h-6'
          />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleGalleryImport}
      />
    </div>
  );
}

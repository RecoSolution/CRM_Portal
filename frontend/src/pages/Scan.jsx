import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setDraft, clearDraft } from '../utils/scanDraftStore';

export default function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const isBackSide = location.state?.backSide || false;

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraReady(true);
      }
    } catch (err) {
      console.error('Camera access denied or unavailable', err);
    }
  }

  async function toggleFlash() {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;

    const capabilities = track.getCapabilities?.();
    if (!capabilities?.torch) {
      console.warn('Flash/torch not supported on this device.');
      return;
    }

    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error('Could not toggle flash', err);
    }
  }

  function stopCameraStream() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }

  function handleBack() {
    stopCameraStream();
    navigate('/home');
  }

  function capturePhoto() {
    setScanning(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    stopCameraStream();

    setTimeout(() => {
      if (isBackSide) {
        setDraft({ backImageData: imageData, isBackSideScan: true });
      } else {
        clearDraft();
        setDraft({ imageData });
      }
      navigate('/scanned-card');
    }, 800);
  }

  function handleGalleryImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (isBackSide) {
        setDraft({ backImageData: reader.result, isBackSideScan: true });
      } else {
        clearDraft();
        setDraft({ imageData: reader.result });
      }
      navigate('/scanned-card');
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className='max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-bg'>
      {/* Top bar - back button left, scan-history button right */}
      <div className='bg-sage flex items-center justify-between px-5 h-12 shrink-0'>
        <button onClick={handleBack}>
          <img
            src='/assets/icons/arrow-left.svg'
            alt='back'
            className='w-5 h-5 brightness-0 invert'
          />
        </button>
        {isBackSide && (
          <span className='text-white text-[13px] font-semibold'>
            Scanning Back Side
          </span>
        )}
        <button onClick={() => navigate('/scan-history')}>
          <img
            src='/assets/icons/scan-history.svg'
            alt='history'
            className='w-5 h-5'
          />
        </button>
      </div>

      {/* Camera viewfinder - takes remaining space, never overflows */}
      <div className='flex-1 flex flex-col items-center justify-center px-6 min-h-0'>
        <div className='relative w-full max-h-full aspect-[4/3] rounded-3xl overflow-hidden bg-black'>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className='w-full h-full object-cover'
          />

          {!cameraReady && (
            <div className='absolute inset-0 flex items-center justify-center bg-black text-white text-sm font-medium'>
              Starting camera...
            </div>
          )}

          {scanning && (
            <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
              <div className='bg-bg rounded-2xl px-8 py-6 flex flex-col items-center gap-3'>
                <div className='w-7 h-7 border-2 border-forest border-t-transparent rounded-full animate-spin' />
                <span className='text-[14px] font-semibold text-gray-900'>
                  Scanning Card in Progress...
                </span>
              </div>
            </div>
          )}
        </div>

        <p className='text-center text-[12px] text-gray-600 mt-3 px-2'>
          {isBackSide
            ? 'Now capture the back side of the card'
            : 'Fix entire card to capture the Image properly'}
        </p>
      </div>

      {/* Bottom bar - gallery left, capture center, flash right */}
      {/* Bottom bar - gallery left, capture center, flash right (closer together) */}
      <div className='bg-forest flex items-center justify-center gap-16 py-5 shrink-0'>
        <button onClick={() => fileInputRef.current?.click()}>
          <img
            src='/assets/icons/gallery-import.svg'
            alt='import'
            className='w-6 h-6'
          />
        </button>

        <button
          onClick={capturePhoto}
          disabled={scanning || !cameraReady}
          className='w-16 h-16 rounded-full bg-sage border-4 border-white/30 disabled:opacity-60'
        />

        <button onClick={toggleFlash}>
          <img
            src={
              flashOn
                ? '/assets/icons/flash-on.svg'
                : '/assets/icons/flash-off.svg'
            }
            alt='flash'
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

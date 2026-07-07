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
    <div className="max-w-[480px] mx-auto h-screen flex flex-col overflow-hidden bg-bg">

      {/* Top bar */}
      <div className="bg-sage flex items-center justify-between px-5 h-14 shrink-0">
        <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center -ml-1">
          <img src="/assets/icons/arrow-left.svg" alt="back" className="w-5 h-5 brightness-0 invert" />
        </button>

        {isBackSide ? (
          <span className="text-white text-[12.5px] font-semibold px-3 py-1.5 rounded-full bg-white/15">
            Scanning Back Side
          </span>
        ) : (
          <span className="text-white text-[16px] font-semibold">Scan Card</span>
        )}

        <button onClick={() => navigate('/scan-history')} className="w-9 h-9 flex items-center justify-center -mr-1">
          <img src="/assets/icons/scan-history.svg" alt="history" className="w-5 h-5 brightness-0 invert" />
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
        <div className="relative w-full max-h-full aspect-[4/3] rounded-3xl overflow-hidden bg-black shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Corner guides */}
          {cameraReady && !scanning && (
            <div className="absolute inset-4 pointer-events-none">
              {[
                'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl',
              ].map((pos) => (
                <div key={pos} className={`absolute w-7 h-7 border-white/70 ${pos}`} />
              ))}
            </div>
          )}

          {!cameraReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-white/80 text-[13px] font-medium">Starting camera...</span>
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-bg rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-lg">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-forest animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-sage animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[14px] font-semibold text-gray-900">
                  Scanning Card in Progress...
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[12.5px] text-gray-500 mt-4 px-4 leading-relaxed">
          {isBackSide
            ? 'Now capture the back side of the card'
            : 'Fit the entire card inside the frame to capture properly'}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="bg-forest flex items-center justify-center gap-16 py-6 shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
        >
          <img src="/assets/icons/gallery-import.svg" alt="import" className="w-5 h-5 brightness-0 invert" />
        </button>

        <button
          onClick={capturePhoto}
          disabled={scanning || !cameraReady}
          className="w-[70px] h-[70px] rounded-full bg-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
        >
          <span className="w-[58px] h-[58px] rounded-full bg-sage border-2 border-forest/20" />
        </button>

        <button
          onClick={toggleFlash}
          className={`w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform ${
            flashOn ? 'bg-white/25' : 'bg-white/10'
          }`}
        >
          <img
            src={flashOn ? '/assets/icons/flash-on.svg' : '/assets/icons/flash-off.svg'}
            alt="flash"
            className="w-5 h-5 brightness-0 invert"
          />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryImport}
      />
    </div>
  );
}
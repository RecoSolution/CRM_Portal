import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDraft } from '../utils/scanDraftStore';

export default function VoiceNote() {
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const transcriptRef = useRef(''); // ref instead of state - avoids stale-closure issues

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startRecording();

    return () => {
      stopTimer();
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(Math.floor(totalSeconds % 60)).padStart(2, '0');
    return `${m}:${s}`;
  }

  function startTimer() {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }
  function stopTimer() {
    clearInterval(timerRef.current);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        // Store every result directly in a ref (not state) - refs update
        // synchronously and don't suffer from React's batching delays,
        // which matters on mobile where onresult can fire right before onend.
        recognition.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          transcriptRef.current = text;
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      }

      setRecording(true);
      startTimer();
    } catch (err) {
      console.error('Microphone access denied or unavailable', err);
      setRecording(false);
      alert(
        'Could not access microphone. Please check permissions and try again.',
      );
    }
  }

  function releaseMicrophone() {
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }

  // ✓ Confirm button - stops recording AND waits for speech recognition
  // to fully finish (onend) before navigating, so the transcript is
  // guaranteed complete. This is the actual fix for the mobile bug -
  // previously we navigated based on the audio recorder stopping,
  // without waiting for the separate speech recognition engine to
  // also finish processing, which is slower and less predictable on mobile.
  function handleConfirm() {
    setFinishing(true);
    stopTimer();
    setRecording(false);

    const recognition = recognitionRef.current;
    const recorder = mediaRecorderRef.current;

    let recognitionDone = !recognition; // if no speech API support, treat as already done
    let recorderDone = false;

    function tryFinish() {
      if (recognitionDone && recorderDone) {
        releaseMicrophone();
        setDraft({
          voiceBlob: finalBlob,
          voiceTranscript: transcriptRef.current,
        });
        navigate('/scanned-card');
      }
    }

    let finalBlob = null;

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        finalBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recorderDone = true;
        tryFinish();
      };
      recorder.stop();
    } else {
      recorderDone = true;
    }

    if (recognition) {
      recognition.onend = () => {
        recognitionDone = true;
        tryFinish();
      };
      recognition.stop();
    }

    // Safety fallback: if recognition.onend never fires (can happen on
    // some mobile browsers), force-finish after 2 seconds so the user
    // is never stuck on a frozen "finishing" screen.
    setTimeout(() => {
      if (!recognitionDone) {
        recognitionDone = true;
        tryFinish();
      }
    }, 2000);
  }

  // ✕ Cancel button - discards everything, goes back without saving
  function handleCancel() {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.onstop = () => releaseMicrophone();
      mediaRecorderRef.current.stop();
    } else {
      releaseMicrophone();
    }
    recognitionRef.current?.stop();
    stopTimer();
    setRecording(false);
    navigate(-1);
  }

  return (
    <div className='max-w-[480px] mx-auto min-h-screen bg-bg px-6 pt-5 pb-10 flex flex-col'>
      <button
        onClick={handleCancel}
        className='w-10 h-10 flex items-center justify-center -ml-2 mb-10'
      >
        <img
          src='/assets/icons/arrow-left.svg'
          alt='back'
          className='w-5 h-5'
        />
      </button>

      <div className='flex-1 flex flex-col items-center justify-center'>
        <div className='relative w-[200px] h-[200px] flex items-center justify-center mb-6'>
          {recording && (
            <span className='absolute inset-0 rounded-full bg-sage/40 animate-ping' />
          )}
          <span className='absolute inset-3 rounded-full bg-sage/60' />
          <span className='absolute inset-7 rounded-full bg-forest flex items-center justify-center'>
            {finishing ? (
              <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin' />
            ) : (
              <img
                src='/assets/icons/mic-white.svg'
                alt=''
                className='w-9 h-9'
              />
            )}
          </span>
        </div>

        <p className='text-[16px] font-bold text-gray-900'>
          {finishing ? 'Processing...' : formatTime(seconds)}
        </p>
      </div>

      <div className='flex items-center justify-center gap-10 pb-6'>
        <button
          onClick={handleConfirm}
          disabled={finishing}
          className='w-14 h-14 rounded-full bg-forest flex items-center justify-center disabled:opacity-60'
        >
          <img
            src='/assets/icons/check.svg'
            alt='confirm'
            className='w-6 h-6'
          />
        </button>
        <button
          onClick={handleCancel}
          disabled={finishing}
          className='w-14 h-14 rounded-full bg-sage flex items-center justify-center disabled:opacity-60'
        >
          <img src='/assets/icons/close.svg' alt='cancel' className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}

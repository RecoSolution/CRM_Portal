import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDraft } from '../utils/scanDraftStore';

export default function VoiceNote() {
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const hasStartedRef = useRef(false);

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
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
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
        recognition.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setTranscript(text);
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

  // Stops everything EXCEPT the media tracks - those get stopped
  // inside the recorder's own onstop handler instead, so we don't
  // race against / kill the recorder before it finishes stopping
  function stopEverything() {
    recognitionRef.current?.stop();
    stopTimer();
    setRecording(false);
  }

  // Helper: stop the actual mic tracks (call this only after recorder has fully stopped)
  function releaseMicrophone() {
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }

  // Square "stop" button - just stops recording, stays on this screen
  // function handleStopButton() {
  //   if (mediaRecorderRef.current?.state === 'inactive') return;
  //   mediaRecorderRef.current.onstop = () => releaseMicrophone();
  //   mediaRecorderRef.current?.stop();
  //   stopEverything();
  // }

  // ✓ Confirm button - stops recording, waits for the actual audio blob, then navigates
  function handleConfirm() {
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === 'inactive'
    ) {
      navigate('/scanned-card');
      return;
    }

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setDraft({ voiceBlob: blob, voiceTranscript: transcript });
      releaseMicrophone();
      navigate('/scanned-card');
    };
    mediaRecorderRef.current.stop();
    stopEverything();
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
    stopEverything();
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
            <img src='/assets/icons/mic-white.svg' alt='' className='w-9 h-9' />
          </span>
        </div>

        <p className='text-[16px] font-bold text-gray-900'>
          {formatTime(seconds)}
        </p>
      </div>

      <div className='flex items-center justify-center gap-10 pb-6'>
        <button
          onClick={handleConfirm}
          className='w-14 h-14 rounded-full bg-sage/50 flex items-center justify-center'
        >
          <img
            src='/assets/icons/check.svg'
            alt='confirm'
            className='w-6 h-6'
          />
        </button>
        {/* <button
          onClick={handleStopButton}
          className='w-16 h-16 rounded-full bg-forest flex items-center justify-center'
        >
          <span className='w-5 h-5 bg-white rounded-sm' />
        </button> */}
        <button
          onClick={handleCancel}
          className='w-14 h-14 rounded-full bg-sage/50 flex items-center justify-center'
        >
          <img src='/assets/icons/close.svg' alt='cancel' className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}

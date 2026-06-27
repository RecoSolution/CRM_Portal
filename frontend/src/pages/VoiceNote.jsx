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
  const transcriptRef = useRef('');

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    startRecording();

    return () => {
      stopTimer();
      try {
        recognitionRef.current?.stop();
      } catch {}
      releaseMicrophone();
    };
  }, []);

  function formatTime(totalSeconds) {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  function startTimer() {
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerRef.current);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

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
          transcriptRef.current = text.trim();
        };

        recognition.onerror = () => {};
        recognition.onend = () => {};

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (err) {
          console.error(err);
        }
      }

      setRecording(true);
      startTimer();
    } catch (err) {
      console.error('Microphone access denied', err);
      alert(
        'Could not access microphone. Please check permissions and try again.',
      );
    }
  }

  function releaseMicrophone() {
    mediaRecorderRef.current?.stream
      ?.getTracks()
      .forEach((track) => track.stop());
  }

  function handleConfirm() {
    if (finishing) return;

    setFinishing(true);
    setRecording(false);
    stopTimer();

    const recorder = mediaRecorderRef.current;
    const recognition = recognitionRef.current;

    let recorderDone = false;
    let recognitionDone = !recognition;
    let finalBlob = null;

    function finishIfReady() {
      if (!recorderDone || !recognitionDone) return;

      releaseMicrophone();

      setDraft({
        voiceBlob: finalBlob,
        voiceTranscript: transcriptRef.current.trim(),
      });

      navigate('/scanned-card');
    }

    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        finalBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        recorderDone = true;
        finishIfReady();
      };
      recorder.stop();
    } else {
      recorderDone = true;
    }

    if (recognition) {
      recognition.onend = () => {
        recognitionDone = true;
        finishIfReady();
      };

      try {
        recognition.stop();
      } catch {
        recognitionDone = true;
        finishIfReady();
      }
    }

    setTimeout(() => {
      if (!recognitionDone) {
        recognitionDone = true;
        finishIfReady();
      }
    }, 2000);
  }

  function handleCancel() {
    if (finishing) return;

    stopTimer();
    setRecording(false);

    try {
      recognitionRef.current?.stop();
    } catch {}

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.onstop = releaseMicrophone;
      mediaRecorderRef.current.stop();
    } else {
      releaseMicrophone();
    }

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
              <div className='w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin' />
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
          className='w-14 h-14 rounded-full bg-sage/50 flex items-center justify-center disabled:opacity-60'
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
          className='w-14 h-14 rounded-full bg-sage/50 flex items-center justify-center disabled:opacity-60'
        >
          <img src='/assets/icons/close.svg' alt='cancel' className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}

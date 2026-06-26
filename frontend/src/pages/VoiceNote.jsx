import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDraft } from '../utils/scanDraftStore';

export default function VoiceNote() {
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');

  // Playback state - shown after recording stops, before confirming
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    startRecording();

    return () => {
      stopTimer();
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
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

        recognition.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setTranscript(text);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended.');
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

  function stopEverything() {
    recognitionRef.current?.stop();
    stopTimer();
    setRecording(false);
  }

  function releaseMicrophone() {
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }

  // Square "stop" button - stops recording, shows playback preview
  // (no longer used in the current button layout, kept available if needed)
  function handleStopButton() {
    if (mediaRecorderRef.current?.state === 'inactive') return;

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      setRecordedBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      releaseMicrophone();
    };
    mediaRecorderRef.current.stop();
    stopEverything();
  }

  // ✓ Confirm button - stops recording, saves to draft, navigates back
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

  // ── Playback controls (used only if recordedBlob exists - preview before confirming) ──
  function togglePlayback() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setPlaybackProgress(audioRef.current.currentTime);
  }

  function handleLoadedMetadata() {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  }

  function handleSeek(e) {
    const newTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setPlaybackProgress(newTime);
    }
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

        {transcript && (
          <p className='text-[12px] text-gray-500 mt-2 px-4 text-center max-w-[280px]'>
            "{transcript}"
          </p>
        )}

        {/* Playback preview - only shows if recording was stopped via handleStopButton,
            giving a chance to listen back before confirming. Not shown during active recording. */}
        {audioUrl && (
          <div className='w-full max-w-[280px] mt-6 flex flex-col items-center gap-2'>
            <div className='flex items-center gap-3 w-full'>
              <button
                onClick={togglePlayback}
                className='w-9 h-9 rounded-full bg-forest flex items-center justify-center shrink-0'
              >
                <img
                  src={
                    isPlaying
                      ? '/assets/icons/pause.svg'
                      : '/assets/icons/play.svg'
                  }
                  alt={isPlaying ? 'pause' : 'play'}
                  className='w-4 h-4'
                />
              </button>

              <input
                type='range'
                min='0'
                max={duration || 0}
                value={playbackProgress}
                onChange={handleSeek}
                className='flex-1 h-1.5 rounded-full accent-forest'
              />
            </div>
            <div className='flex justify-between w-full text-[11px] text-gray-500'>
              <span>{formatTime(playbackProgress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className='hidden'
            />
          </div>
        )}
      </div>

      <div className='flex items-center justify-center gap-10 pb-6'>
        <button
          onClick={handleConfirm}
          className='w-14 h-14 rounded-full bg-forest flex items-center justify-center'
        >
          <img
            src='/assets/icons/check.svg'
            alt='confirm'
            className='w-6 h-6'
          />
        </button>
        <button
          onClick={handleCancel}
          className='w-14 h-14 rounded-full bg-sage flex items-center justify-center'
        >
          <img src='/assets/icons/close.svg' alt='cancel' className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
}

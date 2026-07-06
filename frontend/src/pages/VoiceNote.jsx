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

  function log() {}

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    log(`UserAgent: ${navigator.userAgent}`);
    log(`Secure Context: ${window.isSecureContext}`);
    log(`Origin: ${window.location.origin}`);

    startRecording();

    return () => {
      stopTimer();
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
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
      log('Requesting microphone permission...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      log('Microphone permission granted.');

      const recorder = new MediaRecorder(stream);

      log(`MediaRecorder mimeType: ${recorder.mimeType}`);
      log(`MediaRecorder state: ${recorder.state}`);

      chunksRef.current = [];

      recorder.onstart = () => {
        log('Recorder onstart fired.');
      };

      recorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
        log(
          `ondataavailable fired. Size=${e.data.size} bytes, chunks=${chunksRef.current.length}`,
        );
      };

      recorder.onerror = (e) => {
        log(`Recorder error: ${e.error?.message || 'Unknown'}`);
      };

      recorder.onpause = () => {
        log('Recorder paused.');
      };

      recorder.onresume = () => {
        log('Recorder resumed.');
      };

      recorder.start();

      mediaRecorderRef.current = recorder;

      log('Recorder started successfully.');

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      log(`SpeechRecognition available: ${!!SpeechRecognition}`);

      if (!SpeechRecognition) {
        log('Browser does not support SpeechRecognition.');
      } else {
        log(`SpeechRecognition: ${!!window.SpeechRecognition}`);
        log(`webkitSpeechRecognition: ${!!window.webkitSpeechRecognition}`);
        const recognition = new SpeechRecognition();
        log(`Recognition constructor: ${recognition.constructor.name}`);
        log(`navigator.onLine: ${navigator.onLine}`);
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onaudiostart = () => log('onaudiostart');
        recognition.onsoundstart = () => log('onsoundstart');
        recognition.onspeechstart = () => log('onspeechstart');
        recognition.onspeechend = () => log('onspeechend');
        recognition.onsoundend = () => log('onsoundend');
        recognition.onaudioend = () => log('onaudioend');
        recognition.onnomatch = () => log('onnomatch');

        recognition.onstart = () => {
          log('SpeechRecognition started.');
        };

        recognition.onaudiostart = () => {
          log('Audio capture started.');
        };

        recognition.onsoundstart = () => {
          log('Sound detected.');
        };

        recognition.onspeechstart = () => {
          log('Speech started.');
        };

        recognition.onresult = (event) => {
          let text = '';

          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }

          transcriptRef.current = text;

          log(`Transcript updated (${text.length} chars): "${text}"`);
        };
        recognition.onerror = (event) => {
          log(
            `SpeechRecognition ERROR -> ${event.error} ${event.message || ''}`,
          );
        };

        recognition.onnomatch = () => {
          log('SpeechRecognition onnomatch fired.');
        };

        recognition.onspeechend = () => {
          log('Speech ended.');
        };

        recognition.onsoundend = () => {
          log('Sound ended.');
        };

        recognition.onaudioend = () => {
          log('Audio capture ended.');
        };

        recognition.onend = () => {
          log(
            `SpeechRecognition ended. Final transcript="${transcriptRef.current}"`,
          );
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
          log('recognition.start() called successfully.');
        } catch (err) {
          log(`recognition.start() threw error: ${err.message}`);
        }
      }

      setRecording(true);
      startTimer();
    } catch (err) {
      log(`getUserMedia ERROR: ${err.message}`);
      setRecording(false);
    }
  }

  function releaseMicrophone() {
    log('Releasing microphone tracks...');
    mediaRecorderRef.current?.stream?.getTracks().forEach((track) => {
      log(`Stopping track: ${track.kind}`);
      track.stop();
    });
  }

  function handleConfirm() {
    log('Confirm button pressed.');

    setFinishing(true);
    stopTimer();
    setRecording(false);

    const recognition = recognitionRef.current;
    const recorder = mediaRecorderRef.current;

    let recognitionDone = !recognition;
    let recorderDone = false;
    let finalBlob = null;

    function tryFinish() {
      log(
        `tryFinish -> recognitionDone=${recognitionDone}, recorderDone=${recorderDone}`,
      );

      if (!recognitionDone || !recorderDone) return;

      log(`Saving draft. Transcript length=${transcriptRef.current.length}`);

      if (finalBlob) {
        log(`Blob size=${finalBlob.size} bytes`);
      }

      setDraft({
        voiceBlob: finalBlob,
        voiceTranscript: transcriptRef.current,
      });

      log('Draft saved successfully.');

      releaseMicrophone();

      log('Navigating to /scanned-card in 3 seconds...');

      setTimeout(() => {
        navigate('/scanned-card');
      }, 3000);
    }

    if (recorder && recorder.state !== 'inactive') {
      log(`Stopping recorder. Current state=${recorder.state}`);

      recorder.onstop = () => {
        finalBlob = new Blob(chunksRef.current, {
          type: 'audio/webm',
        });

        recorderDone = true;

        log(`Recorder stopped. Blob created (${finalBlob.size} bytes).`);

        tryFinish();
      };

      recorder.stop();
    } else {
      log('Recorder already inactive.');
      recorderDone = true;
    }

    if (recognition) {
      recognition.onend = () => {
        recognitionDone = true;

        log(
          `Recognition finished during confirm. Transcript="${transcriptRef.current}"`,
        );

        tryFinish();
      };

      try {
        recognition.stop();
        log('recognition.stop() called.');
      } catch (err) {
        log(`recognition.stop() ERROR: ${err.message}`);
      }
    }

    setTimeout(() => {
      if (!recognitionDone) {
        log('Safety timeout reached (2s). Forcing recognitionDone=true');
        recognitionDone = true;
        tryFinish();
      }
    }, 2000);
  }

  function handleCancel() {
    log('Cancel pressed.');

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      mediaRecorderRef.current.onstop = () => {
        releaseMicrophone();
      };

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
        className='w-10 h-10 flex items-center justify-center -ml-2 mb-4'
      >
        <img
          src='/assets/icons/arrow-left.svg'
          alt='back'
          className='w-5 h-5'
        />
      </button>

      <div className='flex flex-col items-center justify-center py-4'>
        <div className='relative w-[140px] h-[140px] flex items-center justify-center mb-4'>
          {recording && (
            <span className='absolute inset-0 rounded-full bg-sage/40 animate-ping' />
          )}

          <span className='absolute inset-3 rounded-full bg-sage/60' />

          <span className='absolute inset-7 rounded-full bg-forest flex items-center justify-center'>
            {finishing ? (
              <div className='flex items-center gap-1.5'>
                <span
                  className='w-2.5 h-2.5 rounded-full bg-forest animate-bounce'
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className='w-2.5 h-2.5 rounded-full bg-sage animate-bounce'
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className='w-2.5 h-2.5 rounded-full bg-forest/60 animate-bounce'
                  style={{ animationDelay: '300ms' }}
                />
              </div>
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

      <div className='flex items-center justify-center gap-10 py-4'>
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

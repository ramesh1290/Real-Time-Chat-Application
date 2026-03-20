"use client";

import {
  Mic,
  Square,
  Trash2,
  SendHorizontal,
  AudioLines,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type VoiceRecorderProps = {
  username: string;
  onUploaded: (data: {
    id: number;
    username: string;
    voice_url: string;
    created_at: string;
  }) => void;
};

export default function VoiceRecorder({
  username,
  onUploaded,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedMimeType, setRecordedMimeType] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [previewUrl]);

  const recordingTimeLabel = useMemo(() => {
    const minutes = Math.floor(recordingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (recordingSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [recordingSeconds]);

  const getSupportedMimeType = () => {
    const mimeTypes = [
      "audio/mp4",
      "audio/mp4;codecs=mp4a.40.2",
      "audio/webm;codecs=opus",
      "audio/webm",
    ];

    for (const mimeType of mimeTypes) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(mimeType)
      ) {
        return mimeType;
      }
    }

    return "";
  };

  const getFileExtension = (mimeType: string) => {
    if (mimeType.includes("mp4")) return "m4a";
    if (mimeType.includes("webm")) return "webm";
    return "webm";
  };

  const resetTimer = () => {
    setRecordingSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    resetTimer();
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
  };

  const stopStreamTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const clearRecording = () => {
    clearPreview();
    setAudioBlob(null);
    setRecordedMimeType("");
    setError("");
    resetTimer();
  };

  const startRecording = async () => {
    try {
      setError("");
      clearPreview();
      setAudioBlob(null);
      setRecordedMimeType("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser does not support microphone recording.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stopTimer();

        const finalType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalType });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setPreviewUrl(url);
          setRecordedMimeType(finalType);
        } else {
          setError("Recording was empty. Try again.");
        }

        stopStreamTracks();
        mediaRecorderRef.current = null;
      };

      recorder.onerror = () => {
        stopTimer();
        stopStreamTracks();
        mediaRecorderRef.current = null;
        setIsRecording(false);
        setError("Recording failed. Please try again.");
      };

      recorder.start();
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.error("Mic permission / recording error:", error);
      stopTimer();
      stopStreamTracks();
      setIsRecording(false);
      setError("Could not access microphone. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    try {
      mediaRecorderRef.current.stop();
    } catch (error) {
      console.error("Stop recording error:", error);
      stopTimer();
      stopStreamTracks();
      setError("Could not stop recording properly.");
    } finally {
      setIsRecording(false);
    }
  };

  const uploadVoice = async () => {
    if (!audioBlob || !username.trim()) return;

    try {
      setIsUploading(true);
      setError("");

      const mimeType = recordedMimeType || audioBlob.type || "audio/webm";
      const extension = getFileExtension(mimeType);

      const file = new File([audioBlob], `voice-message.${extension}`, {
        type: mimeType,
      });

      const formData = new FormData();
      formData.append("voice", file);
      formData.append("username", username);

      const res = await fetch(
        "https://real-time-chat-application2-yxtc.onrender.com/api/upload-voice/",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Voice upload failed");
      }

      const data = await res.json();

      onUploaded({
        id: data.id,
        username: data.username,
        voice_url: data.voice_url,
        created_at: data.created_at,
      });

      clearRecording();
    } catch (error) {
      console.error("Upload voice error:", error);
      setError("Failed to upload voice message.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex max-w-full items-center gap-2">
      {!isRecording && !audioBlob && (
        <button
          type="button"
          onClick={startRecording}
          className="group flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] backdrop-blur-xl transition duration-200 hover:scale-[1.04] hover:bg-white/15 active:scale-95 sm:h-11 sm:w-11"
          title="Record voice"
        >
          <Mic size={18} className="transition group-hover:scale-110" />
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 rounded-full border border-pink-400/20 bg-linear-to-rrom-pink-500/15 via-rose-500/15 to-orange-500/15 px-3 py-2 text-white shadow-[0_8px_30px_rgba(236,72,153,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
            <span className="text-xs font-medium text-red-200">Recording</span>
            <span className="text-xs font-semibold text-white/90">
              {recordingTimeLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-red-500 text-white shadow-[0_8px_24px_rgba(239,68,68,0.35)] transition hover:scale-[1.03] active:scale-95"
            title="Stop recording"
          >
            <Square size={16} />
          </button>
        </div>
      )}

      {!isRecording && audioBlob && (
        <div className="flex max-w-full items-center gap-2 rounded-[22px] border border-white/10 bg-linear-to-r from-white/12 to-white/8 px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-brrom-fuchsia-500 to-orange-500 text-white sm:flex">
            <AudioLines size={18} />
          </div>

          <audio controls src={previewUrl} className="max-w-35 sm:max-w-47.5" />

          <button
            type="button"
            onClick={uploadVoice}
            disabled={isUploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-fuchsia-500 via-pink-500 to-orange-500 text-white shadow-[0_10px_24px_rgba(236,72,153,0.28)] transition hover:scale-[1.03] hover:opacity-95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            title="Send voice"
          >
            <SendHorizontal size={16} />
          </button>

          <button
            type="button"
            onClick={clearRecording}
            disabled={isUploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/15 active:scale-95 disabled:opacity-60"
            title="Discard"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {error && <p className="max-w-55 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
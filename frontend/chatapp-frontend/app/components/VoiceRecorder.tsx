"use client";

import { useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

type VoiceRecorderProps = {
  username: string;
  onUploaded: (data: {
    id: number;
    username: string;
    voice_url: string;
    created_at: string;
  }) => void;
};

function getSupportedMimeType() {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

function getFileExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("webm")) return "webm";
  return "webm";
}

export default function VoiceRecorder({
  username,
  onUploaded,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>("");

  const startRecording = async () => {
    if (!username.trim()) return;
    if (recording || uploading) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const supportedMimeType = getSupportedMimeType();
      mimeTypeRef.current = supportedMimeType;

      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          setUploading(true);

          const finalMimeType =
            mimeTypeRef.current || recorder.mimeType || "audio/webm";

          const blob = new Blob(chunksRef.current, { type: finalMimeType });

          if (blob.size === 0) {
            throw new Error("Recorded audio is empty");
          }

          const extension = getFileExtension(finalMimeType);
          const file = new File([blob], `voice-message.${extension}`, {
            type: finalMimeType,
          });

          const formData = new FormData();
          formData.append("username", username);
          formData.append("voice", file);

          const res = await fetch("https://real-time-chat-application2-yxtc.onrender.com/api/voice-message/", {
            method: "POST",
            body: formData,
          });

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
        } catch (err) {
          console.error("Voice upload error:", err);
        } finally {
          setUploading(false);
          chunksRef.current = [];
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access denied or failed:", err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (mediaRecorderRef.current.state === "inactive") return;

    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      onClick={recording ? stopRecording : startRecording}
      disabled={uploading}
      className={`flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-white transition ${
        recording
          ? "border-red-400/30 bg-red-500/20 hover:bg-red-500/30"
          : "border-white/10 bg-white/10 hover:bg-white/15"
      } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
      title={recording ? "Stop recording" : "Record voice message"}
    >
      {recording ? <Square size={18} /> : <Mic size={18} />}
    </button>
  );
}
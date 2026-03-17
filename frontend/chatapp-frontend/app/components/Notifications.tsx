"use client";

import { useEffect, useRef } from "react";

type NotificationsProps = {
  playSend: boolean;
  playReceive: boolean;
};

export default function Notifications({
  playSend,
  playReceive,
}: NotificationsProps) {
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    sendAudioRef.current = new Audio("/send.mp3");
    receiveAudioRef.current = new Audio("/receive.mp3");

    sendAudioRef.current.preload = "auto";
    receiveAudioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!playSend || !sendAudioRef.current) return;

    sendAudioRef.current.currentTime = 0;
    sendAudioRef.current.play().catch((err) => {
      console.log("Send sound blocked:", err);
    });
  }, [playSend]);

  useEffect(() => {
    if (!playReceive || !receiveAudioRef.current) return;

    receiveAudioRef.current.currentTime = 0;
    receiveAudioRef.current.play().catch((err) => {
      console.log("Receive sound blocked:", err);
    });
  }, [playReceive]);

  return null;
}
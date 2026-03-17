"use client";

import { useEffect, useRef } from "react";

type NotificationsProps = {
  sendTrigger: number;
  receiveTrigger: number;
};

export default function Notifications({
  sendTrigger,
  receiveTrigger,
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
    if (sendTrigger === 0 || !sendAudioRef.current) return;

    sendAudioRef.current.currentTime = 0;
    sendAudioRef.current.play().catch((err) => {
      console.log("Send sound blocked:", err);
    });
  }, [sendTrigger]);

  useEffect(() => {
    if (receiveTrigger === 0 || !receiveAudioRef.current) return;

    receiveAudioRef.current.currentTime = 0;
    receiveAudioRef.current.play().catch((err) => {
      console.log("Receive sound blocked:", err);
    });
  }, [receiveTrigger]);

  return null;
}
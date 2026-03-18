"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";

export type EmojiReaction = "❤️" | "😂" | "🔥" | "😮" | "😢" | "👍";

type EmojiProps = {
  onReact: (emoji: EmojiReaction) => void;
  isOwnMessage?: boolean;
};

const reactions: EmojiReaction[] = ["❤️", "😂", "🔥", "😮", "😢", "👍"];

// NEW: separate sound file for each reaction
const reactionSoundMap: Record<EmojiReaction, string> = {
  "❤️": "sounds/heart.mp3",
  "😂": "sounds/haha.mp3",
  "🔥": "sounds/fire.mp3",
  "😮": "sounds/wow.mp3",
  "😢": "sounds/sad.mp3",
  "👍": "sounds/like.mp3",
};

export default function Emoji({
  onReact,
  isOwnMessage = false,
}: EmojiProps) {
  const [open, setOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // NEW: store one audio object for each emoji
  const reactionAudioRefs = useRef<Partial<Record<EmojiReaction, HTMLAudioElement>>>({});
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice(
        window.matchMedia("(hover: none), (pointer: coarse)").matches
      );
    }

    // NEW: preload separate audio files
    reactions.forEach((emoji) => {
      const audio = new Audio(reactionSoundMap[emoji]);
      audio.preload = "auto";
      reactionAudioRefs.current[emoji] = audio;
    });
  }, []);

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    if (!isTouchDevice) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    if (isTouchDevice) return;
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  const handleToggleMobile = () => {
    if (!isTouchDevice) return;
    setOpen((prev) => !prev);
  };

  const handleReactionClick = (emoji: EmojiReaction) => {
    onReact(emoji);

    // NEW: play emoji-specific sound
    const audio = reactionAudioRefs.current[emoji];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((err) => {
        console.log(`${emoji} reaction sound blocked:`, err);
      });
    }

    setOpen(false);
  };

  return (
    <div
      className={`relative ${isOwnMessage ? "ml-2" : "mr-2"}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button
        type="button"
        onClick={handleToggleMobile}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 backdrop-blur-xl transition hover:bg-white/15"
      >
        <SmilePlus size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className={`absolute z-50 ${isOwnMessage ? "right-0" : "left-0"
              } bottom-10`}
          >
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/70 px-2 py-2 shadow-xl backdrop-blur-2xl">
              {reactions.map((emoji, index) => (
                <motion.button
                  key={emoji}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.25, y: -3 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleReactionClick(emoji)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition"
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

type GIFProps = {
  onSelect: (url: string) => void;
};

const demoGIFs = [
  "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif",
  "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/13CoXDiaCcCoyk/giphy.gif",
  "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
  "https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.gif",
  "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",



];

export default function GIF({ onSelect }: GIFProps) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleSelect = (gif: string) => {
    onSelect(gif);
    setOpen(false);
  };

  const desktopPicker = (
    <AnimatePresence>
      {open && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="absolute bottom-14 left-0 z-50 w-[320px] rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-2xl"
        >
          <p className="mb-3 text-sm font-semibold text-white">Choose a GIF</p>

          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto">
            {demoGIFs.map((gif) => (
              <img
                key={gif}
                src={gif}
                alt="gif option"
                className="h-24 w-full cursor-pointer rounded-lg object-cover"
                onClick={() => handleSelect(gif)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const mobilePicker =
    mounted && open && isMobile
      ? createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9998 bg-black/60"
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-0 left-0 right-0 z-9999 rounded-t-3xl border-t border-white/10 bg-[#0b1220] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Choose a GIF</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto pb-4">
              {demoGIFs.map((gif) => (
                <img
                  key={gif}
                  src={gif}
                  alt="gif option"
                  className="h-24 w-full cursor-pointer rounded-lg object-cover"
                  onClick={() => handleSelect(gif)}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 px-3 text-white transition hover:bg-white/15"
      >
        <ImageIcon size={18} />
      </button>

      {desktopPicker}
      {mobilePicker}
    </>
  );
}
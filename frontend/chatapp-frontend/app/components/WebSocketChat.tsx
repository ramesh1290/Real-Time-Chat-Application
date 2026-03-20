"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  UserCircle2,
  Wifi,
  WifiOff,
  PencilLine,
} from "lucide-react";
import Notifications from "./Notifications";
import Emoji, { type EmojiReaction } from "./Emoji";
import GIF from "./GIF";
import VoiceRecorder from "./VoiceRecorder";

type Receipt = {
  username: string;
  status: "delivered" | "seen";
  updated_at?: string;
};

type MessageReaction = {
  username: string;
  emoji: EmojiReaction;
  created_at?: string;
};

type ChatMessage = {
  id: number;
  username: string;
  text: string;
  gif_url?: string | null;
  voice_url?: string | null;
  created_at: string;
  receipts?: Receipt[];
  reactions?: MessageReaction[];
};

type IncomingSocketMessage =
  | {
    type?: "chat" | "voice";
    id: number;
    username: string;
    text?: string;
    gif_url?: string | null;
    voice_url?: string | null;
    created_at: string;
  }
  | {
    type: "typing";
    username: string;
    isTyping: boolean;
  }
  | {
    type: "receipt_update";
    message_id: number;
    username: string;
    status: "delivered" | "seen";
  }
  | {
    type: "reaction_update";
    message_id: number;
    reactions: MessageReaction[];
  };

function getAvatarLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function getAvatarGradient(name: string) {
  const gradients = [
    "from-cyan-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-pink-500 to-rose-600",
    "from-orange-500 to-red-600",
    "from-indigo-500 to-sky-600",
  ];

  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }

  return gradients[sum % gradients.length];
}

export default function WebSocketChat() {
  const [username, setUsername] = useState("");
  const [tempUsername, setTempUsername] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [sendTrigger, setSendTrigger] = useState(0);
  const [receiveTrigger, setReceiveTrigger] = useState(0);
  const [messageReactions, setMessageReactions] = useState<
    Record<number, MessageReaction[]>
  >({});

  const socketRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem("chat_username");
    if (savedUsername) {
      setUsername(savedUsername);
      setTempUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    const ws = new WebSocket("wss://real-time-chat-application2-yxtc.onrender.com/ws/chat/");
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data: IncomingSocketMessage = JSON.parse(event.data);

      if (data.type === "typing") {
        if (!data.username || data.username === username) return;

        setTypingUsers((prev) => {
          if (data.isTyping) {
            if (prev.includes(data.username)) return prev;
            return [...prev, data.username];
          }
          return prev.filter((user) => user !== data.username);
        });
        return;
      }

      if (data.type === "receipt_update") {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== data.message_id) return msg;

            const currentReceipts = msg.receipts || [];
            const existingReceipt = currentReceipts.find(
              (receipt) =>
                receipt.username.toLowerCase() === data.username.toLowerCase()
            );

            let updatedReceipts: Receipt[];

            if (existingReceipt) {
              updatedReceipts = currentReceipts.map((receipt) => {
                if (
                  receipt.username.toLowerCase() !==
                  data.username.toLowerCase()
                ) {
                  return receipt;
                }

                if (receipt.status === "seen") {
                  return receipt;
                }

                return {
                  ...receipt,
                  status: data.status,
                };
              });
            } else {
              updatedReceipts = [
                ...currentReceipts,
                {
                  username: data.username,
                  status: data.status,
                },
              ];
            }

            return {
              ...msg,
              receipts: updatedReceipts,
            };
          })
        );
        return;
      }

      if (data.type === "reaction_update") {
        setMessageReactions((prev) => ({
          ...prev,
          [data.message_id]: data.reactions,
        }));
        return;
      }

      const chatData: ChatMessage = {
        id: data.id,
        username: data.username,
        text: data.text || "",
        gif_url: data.gif_url || null,
        voice_url: data.voice_url || null,
        created_at: data.created_at,
        receipts: [],
        reactions: [],
      };

      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === chatData.id);
        if (exists) return prev;
        return [...prev, chatData];
      });

      setTypingUsers((prev) =>
        prev.filter((user) => user !== chatData.username)
      );

      const isOtherUserMessage =
        chatData.username.trim().toLowerCase() !== username.trim().toLowerCase();

      if (isOtherUserMessage) {
        setReceiveTrigger((prev) => prev + 1);
      }

      if (
        isOtherUserMessage &&
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN &&
        username.trim()
      ) {
        socketRef.current.send(
          JSON.stringify({
            type: "delivered",
            message_id: chatData.id,
            username,
          })
        );

        if (document.visibilityState === "visible") {
          socketRef.current.send(
            JSON.stringify({
              type: "seen",
              message_id: chatData.id,
              username,
            })
          );
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      console.log("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [username]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch("https://real-time-chat-application2-yxtc.onrender.com/api/messages/", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Fetching failed");
        }

        const data: ChatMessage[] = await res.json();
        setMessages(data);

        const reactionsMap: Record<number, MessageReaction[]> = {};
        data.forEach((msg) => {
          reactionsMap[msg.id] = msg.reactions || [];
        });
        setMessageReactions(reactionsMap);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers, messageReactions]);

  useEffect(() => {
    const handleVisibilitySeen = () => {
      if (document.visibilityState !== "visible") return;
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
        return;
      if (!username.trim()) return;

      messages.forEach((msg) => {
        const isOtherUserMessage =
          msg.username.trim().toLowerCase() !== username.trim().toLowerCase();

        if (!isOtherUserMessage) return;

        socketRef.current?.send(
          JSON.stringify({
            type: "seen",
            message_id: msg.id,
            username,
          })
        );
      });
    };

    document.addEventListener("visibilitychange", handleVisibilitySeen);
    window.addEventListener("focus", handleVisibilitySeen);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilitySeen);
      window.removeEventListener("focus", handleVisibilitySeen);
    };
  }, [messages, username]);

  const currentUserGradient = useMemo(
    () => getAvatarGradient(username || "User"),
    [username]
  );

  const handleSaveUsername = () => {
    const trimmed = tempUsername.trim();
    if (!trimmed) return;

    localStorage.setItem("chat_username", trimmed);
    setUsername(trimmed);
    inputRef.current?.focus();
  };

  const handleChangeUser = () => {
    localStorage.removeItem("chat_username");
    setUsername("");
    setTempUsername("");
    setText("");
    setTypingUsers([]);
  };

  const handleEditCurrentName = () => {
    setTempUsername(username);
    setUsername("");
  };

  const sendTypingEvent = (isTyping: boolean) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;
    if (!username.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "typing",
        username,
        isTyping,
      })
    );
  };

  const handleTypingChange = (value: string) => {
    setText(value);

    sendTypingEvent(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingEvent(false);
    }, 1200);
  };

  const sendMessage = () => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;
    if (!username.trim() || !text.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "chat",
        username,
        text,
      })
    );

    setSendTrigger((prev) => prev + 1);

    sendTypingEvent(false);
    setText("");
    inputRef.current?.focus();
  };

  const sendGifMessage = (gifUrl: string) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;
    if (!username.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "chat",
        username,
        gif_url: gifUrl,
      })
    );

    setSendTrigger((prev) => prev + 1);
    inputRef.current?.focus();
  };

  const handleVoiceUploaded = (data: {
    id: number;
    username: string;
    voice_url: string;
    created_at: string;
  }) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;

    socketRef.current.send(
      JSON.stringify({
        type: "voice",
        id: data.id,
        username: data.username,
        voice_url: data.voice_url,
        created_at: data.created_at,
      })
    );

    setSendTrigger((prev) => prev + 1);
  };

  const handleReactionSend = (messageId: number, emoji: EmojiReaction) => {
    if (!socketRef.current) return;
    if (socketRef.current.readyState !== WebSocket.OPEN) return;
    if (!username.trim()) return;

    socketRef.current.send(
      JSON.stringify({
        type: "reaction",
        message_id: messageId,
        username,
        emoji,
      })
    );
  };

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length > 1
        ? `${typingUsers.join(", ")} are typing...`
        : "";

  const getOwnMessageStatus = (msg: ChatMessage) => {
    if (msg.username.trim().toLowerCase() !== username.trim().toLowerCase()) {
      return "";
    }

    const receipts = msg.receipts || [];

    if (receipts.some((receipt) => receipt.status === "seen")) {
      return "Seen";
    }

    if (receipts.some((receipt) => receipt.status === "delivered")) {
      return "Delivered";
    }

    return "Sent";
  };

  return (
    <>
      <Notifications
        sendTrigger={sendTrigger}
        receiveTrigger={receiveTrigger}
      />

      <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_45%,#000000_100%)] flex items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-5xl h-[95vh] sm:h-[92vh] mx-auto rounded-[30px] overflow-hidden border border-cyan-400/10 bg-white/10 backdrop-blur-2xl shadow-[0_0_80px_rgba(34,211,238,0.10),0_25px_100px_rgba(0,0,0,0.45)] flex flex-col"
        >
          <div className="border-b border-cyan-300/10 bg-white/10 backdrop-blur-2xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-full bg-linear-to-br ${currentUserGradient} flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(34,211,238,0.25)] border border-white/20 shrink-0`}
                >
                  {getAvatarLetter(username || "U")}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold text-white sm:text-2xl">
                    Chat Application
                  </h1>

                  {username ? (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300 sm:text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        <UserCircle2 size={15} />
                        Current user:
                      </span>
                      <span className="font-semibold text-cyan-300">
                        {username}
                      </span>
                      <button
                        onClick={handleEditCurrentName}
                        className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-slate-200 transition hover:bg-white/15"
                      >
                        <PencilLine size={12} />
                        Edit
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                      Choose your username to start chatting
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <motion.div
                  animate={{ scale: connected ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.35 }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm ${connected
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-400"
                      : "border-rose-400/30 bg-rose-500/15 text-rose-400"
                    }`}
                >
                  {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
                  {connected ? "Connected" : "Disconnected"}
                </motion.div>

                {username && (
                  <button
                    onClick={handleChangeUser}
                    className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/15 sm:inline-flex"
                  >
                    Change User
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(8,15,33,0.50),rgba(1,4,10,0.82))] px-3 py-4 sm:px-5">
            {!username ? (
              <div className="flex h-full items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 22, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="w-full max-w-md rounded-[28px] border border-cyan-400/10 bg-white/10 p-6 shadow-[0_0_50px_rgba(34,211,238,0.08)] backdrop-blur-2xl sm:p-7"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-brrom-cyan-500 to-blue-600 text-white shadow-lg">
                      <UserCircle2 size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Welcome</h2>
                      <p className="text-sm text-slate-300">
                        Set your name once for this browser
                      </p>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveUsername();
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500"
                  />

                  <button
                    onClick={handleSaveUsername}
                    className="mt-4 w-full rounded-2xl bg-linear-to-rrom-cyan-500 to-blue-600 px-4 py-3 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-500"
                  >
                    Continue
                  </button>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((msg, index) => {
                    const isOwnMessage =
                      msg.username.toLowerCase() === username.toLowerCase();
                    const avatarGradient = getAvatarGradient(msg.username);
                    const hasOnlyVoice =
                      !!msg.voice_url && !msg.text && !msg.gif_url;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.22,
                          delay: Math.min(index * 0.015, 0.12),
                        }}
                        className={`flex items-end gap-2 ${isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                      >
                        {!isOwnMessage && (
                          <div
                            className={`h-9 w-9 shrink-0 rounded-full bg-linear-to-br ${avatarGradient} flex items-center justify-center border border-white/20 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.08)]`}
                          >
                            {getAvatarLetter(msg.username)}
                          </div>
                        )}

                        {!isOwnMessage && (
                          <Emoji
                            isOwnMessage={false}
                            onReact={(emoji) => handleReactionSend(msg.id, emoji)}
                          />
                        )}

                        <div
                          className={`relative rounded-[22px] border px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-[1.01] ${!isOwnMessage && hasOnlyVoice
                              ? "max-w-[320px] sm:max-w-85"
                              : "max-w-[84%] sm:max-w-[68%]"
                            } ${isOwnMessage
                              ? "rounded-br-md border-cyan-200/20 bg-linear-to-bran-500 to-blue-600 text-white"
                              : "rounded-bl-md border-white/10 bg-white/10 text-slate-100 backdrop-blur-xl"
                            }`}
                        >
                          {!isOwnMessage && (
                            <span className="absolute -left-1 bottom-0 h-4 w-4 rotate-45 rounded-sm border-l border-b border-white/10 bg-white/10 backdrop-blur-xl" />
                          )}
                          {isOwnMessage && (
                            <span className="absolute -right-1 bottom-0 h-4 w-4 rotate-45 rounded-sm bg-cyan-500" />
                          )}

                          <div className="relative z-10">
                            <div className="mb-1 flex items-center justify-between gap-3">
                              <span
                                className={`text-sm font-bold ${isOwnMessage ? "text-cyan-50" : "text-cyan-300"
                                  }`}
                              >
                                {isOwnMessage ? "You" : msg.username}
                              </span>
                            </div>

                            {msg.text && (
                              <p className="wrap-break-wordwordword text-sm leading-relaxed sm:text-[15px]">
                                {msg.text}
                              </p>
                            )}

                            {msg.gif_url && (
                              <img
                                src={msg.gif_url}
                                alt="gif message"
                                className="mt-2 rounded-xl max-w-full sm:max-w-55"
                              />
                            )}

                            {msg.voice_url &&
                              (isOwnMessage ? (
                                <audio
                                  controls
                                  preload="metadata"
                                  src={msg.voice_url}
                                  className="mt-2 w-full max-w-65"
                                >
                                  Your browser does not support audio playback.
                                </audio>
                              ) : (
                                <div className="mt-2 flex max-w-72.5 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                                    <span className="text-base">🎙️</span>
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="mb-2 text-xs font-medium text-slate-300">
                                      {msg.username} sent a voice message
                                    </p>

                                    <audio
                                      controls
                                      preload="metadata"
                                      src={msg.voice_url}
                                      className="w-full max-w-52.5"
                                    >
                                      Your browser does not support audio playback.
                                    </audio>
                                  </div>
                                </div>
                              ))}

                            {messageReactions[msg.id] &&
                              messageReactions[msg.id].length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {messageReactions[msg.id].map((reaction, i) => (
                                    <span
                                      key={`${msg.id}-${reaction.username}-${i}`}
                                      className="rounded-full bg-white/10 px-2 py-0.5 text-sm"
                                      title={reaction.username}
                                    >
                                      {reaction.emoji}
                                    </span>
                                  ))}
                                </div>
                              )}

                            <div className="mt-2 flex justify-end">
                              <p
                                className={`text-[10px] sm:text-[11px] ${isOwnMessage
                                    ? "text-cyan-50/80"
                                    : "text-slate-400"
                                  }`}
                              >
                                {new Date(msg.created_at).toLocaleString()}
                                {isOwnMessage && ` • ${getOwnMessageStatus(msg)}`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {isOwnMessage && (
                          <Emoji
                            isOwnMessage={true}
                            onReact={(emoji) => handleReactionSend(msg.id, emoji)}
                          />
                        )}

                        {isOwnMessage && (
                          <div
                            className={`h-9 w-9 shrink-0 rounded-full bg-linear-to-br ${currentUserGradient} flex items-center justify-center border border-white/20 text-sm font-bold text-white shadow-[0_0_15px_rgba(34,211,238,0.18)]`}
                          >
                            {getAvatarLetter(username)}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <AnimatePresence>
                  {typingText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="flex items-end gap-2 justify-start"
                    >
                      <div className="h-9 w-9 shrink-0 rounded-full bg-linear-to-brrom-violet-500 to-purple-600 flex items-center justify-center border border-white/20 text-sm font-bold text-white">
                        …
                      </div>

                      <div className="max-w-[84%] sm:max-w-[68%] rounded-[22px] rounded-bl-md border border-white/10 bg-white/10 backdrop-blur-xl px-4 py-3 relative">
                        <span className="absolute -left-1 bottom-0 h-4 w-4 rotate-45 rounded-sm border-l border-b border-white/10 bg-white/10 backdrop-blur-xl" />
                        <div className="relative z-10">
                          <p className="text-sm text-slate-300 mb-2">
                            {typingText}
                          </p>
                          <div className="flex items-center gap-1">
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: 0,
                              }}
                              className="h-2 w-2 rounded-full bg-cyan-300"
                            />
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: 0.15,
                              }}
                              className="h-2 w-2 rounded-full bg-cyan-300"
                            />
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.7,
                                delay: 0.3,
                              }}
                              className="h-2 w-2 rounded-full bg-cyan-300"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {messages.length === 0 && !typingText && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center pt-20"
                  >
                    <p className="text-lg font-medium text-slate-300">
                      No messages yet
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Start the conversation
                    </p>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {username && (
            <div className="border-t border-cyan-300/10 bg-white/10 p-3 backdrop-blur-2xl sm:p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${currentUserGradient} border border-white/20 text-white font-bold shadow-md sm:flex`}
                >
                  {getAvatarLetter(username)}
                </div>

                <div className="relative">
                  <GIF onSelect={sendGifMessage} />
                </div>

                <VoiceRecorder
                  username={username}
                  onUploaded={handleVoiceUploaded}
                />

                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Message as ${username}...`}
                    value={text}
                    onChange={(e) => handleTypingChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                    className="w-full rounded-full border border-white/10 bg-white/10 py-3 pl-4 pr-14 text-white outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500"
                  />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={sendMessage}
                    className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(34,211,238,0.25)] transition hover:from-cyan-400 hover:to-blue-500"
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
              </div>

              <div className="mt-3 flex justify-end sm:hidden">
                <button
                  onClick={handleChangeUser}
                  className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/15"
                >
                  Change User
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
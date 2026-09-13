"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import type { Dictionary } from "@/lib/dictionaries";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const Chatbot = ({ dict }: { dict: Dictionary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && window.innerWidth < 640) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message || dict.chatbot.fallback },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: dict.chatbot.errorMessage },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-0 sm:bottom-4 right-0 sm:right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed bottom-4 right-4 sm:static bg-yellow-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:bg-yellow-700 transition-colors duration-200 flex items-center justify-center"
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X size={20} className="sm:w-6 sm:h-6" />
          ) : (
            <MessageCircle size={20} className="sm:w-6 sm:h-6" />
          )}
        </button>

        {isOpen && (
          <div
            className="fixed sm:absolute inset-0 sm:inset-auto sm:bottom-16 sm:right-0 w-full sm:w-[400px] min-h-screen sm:min-h-0 sm:h-[600px] bg-white sm:rounded-lg shadow-xl flex flex-col"
            style={{ height: "calc(100dvh)", maxHeight: "calc(100vh - 100px)" }}
          >
            <div className="bg-yellow-600 text-white px-4 py-3 sm:p-4 sm:rounded-t-lg flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <MessageCircle size={20} className="hidden sm:block" />
                <h3 className="font-semibold text-base">{dict.chatbot.title}</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="sm:hover:bg-yellow-700 p-1.5 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-6 text-center space-y-4">
                  <div className="text-gray-500 text-sm sm:text-base">
                    {dict.chatbot.welcome}
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    <button
                      onClick={() => setInput(dict.chatbot.suggestion1)}
                      className="px-4 py-2 rounded-full border border-gray-200 hover:border-yellow-600 hover:bg-yellow-50 transition-colors text-gray-600 hover:text-yellow-700"
                    >
                      {dict.chatbot.suggestion1}
                    </button>
                    <button
                      onClick={() => setInput(dict.chatbot.suggestion2)}
                      className="px-4 py-2 rounded-full border border-gray-200 hover:border-yellow-600 hover:bg-yellow-50 transition-colors text-gray-600 hover:text-yellow-700"
                    >
                      {dict.chatbot.suggestion2}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-4 sm:p-4 space-y-3 sm:space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} items-start`}
                    >
                      <div
                        className={`max-w-[85%] px-3.5 py-2 sm:p-3 rounded-2xl whitespace-pre-wrap text-sm sm:text-base leading-relaxed ${
                          message.role === "user"
                            ? "bg-yellow-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-800 rounded-bl-sm"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start items-start">
                      <div className="bg-gray-100 text-gray-800 px-3.5 py-2 sm:p-3 rounded-2xl rounded-bl-sm text-sm sm:text-base animate-pulse">
                        {dict.chatbot.thinking}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              )}
            </div>

            <div className="border-t bg-white sm:rounded-b-lg sticky bottom-0">
              <form onSubmit={handleSubmit} className="p-3 sm:p-4">
                <div className="flex space-x-2 items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={dict.chatbot.placeholder}
                    className="flex-1 px-3.5 py-2 text-sm sm:text-base border rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-yellow-600 text-white p-2.5 rounded-full hover:bg-yellow-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                    aria-label="Send"
                  >
                    <Send size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

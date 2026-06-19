"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, X, Sparkles } from "lucide-react";

/* ============================================
   TYPES
   ============================================ */
type AssistantState = "idle" | "listening" | "thinking" | "speaking";

interface ConversationTurn {
  id: string;
  user: string;
  bot: string;
}

/* ============================================
   KNOWLEDGE BASE — Fallback Responses
   ============================================ */

// Detect if text contains Hindi (Devanagari) characters
function isHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function findFallbackResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  const hindi = isHindi(input);

  const entries: { keywords: string[]; response: string; hindiResponse: string }[] = [
    {
      keywords: ["convert", "text", "excel", "paste", "data", "csv", "बदल", "टेक्स्ट", "कन्वर्ट"],
      response:
        "To convert text to Excel, go to the Convert page, select Paste Text, paste your data, and click Generate Excel. Then download your file.",
      hindiResponse:
        "टेक्स्ट को Excel में बदलने के लिए, Convert पेज पर जाएं, Paste Text चुनें, अपना डेटा पेस्ट करें, और Generate Excel पर क्लिक करें। फिर अपनी फाइल डाउनलोड करें।",
    },
    {
      keywords: ["upload", "document", "doc", "docx", "pdf", "अपलोड", "डॉक्यूमेंट", "फाइल"],
      response:
        "To upload a document, go to the Convert page, select Upload Document, drag and drop your file, then click Generate Excel.",
      hindiResponse:
        "डॉक्यूमेंट अपलोड करने के लिए, Convert पेज पर जाएं, Upload Document चुनें, अपनी फाइल ड्रैग करें, और Generate Excel पर क्लिक करें।",
    },
    {
      keywords: ["edit", "modify", "change", "column", "row", "sheet", "एडिट", "बदलो", "कॉलम"],
      response:
        "To edit an Excel file, go to the Edit page, upload your xlsx file, type your instructions like add a column or rename a sheet, then click Apply Changes.",
      hindiResponse:
        "Excel फाइल एडिट करने के लिए, Edit पेज पर जाएं, अपनी xlsx फाइल अपलोड करें, इंस्ट्रक्शन लिखें जैसे कॉलम जोड़ें या शीट का नाम बदलें, फिर Apply Changes पर क्लिक करें।",
    },
    {
      keywords: ["hello", "hi", "hey", "good morning", "good evening", "नमस्ते", "हेलो", "हाय"],
      response:
        "Hey there! I'm your ExcelWeb assistant. You can ask me about converting text to Excel, uploading documents, or editing spreadsheets. What would you like to do?",
      hindiResponse:
        "नमस्ते! मैं आपका ExcelWeb असिस्टेंट हूं। आप मुझसे टेक्स्ट को Excel में बदलने, डॉक्यूमेंट अपलोड करने, या स्प्रेडशीट एडिट करने के बारे में पूछ सकते हैं। बताइए क्या करना है?",
    },
    {
      keywords: ["thank", "thanks", "thank you", "धन्यवाद", "शुक्रिया"],
      response: "You're welcome! Let me know if you need anything else.",
      hindiResponse: "आपका स्वागत है! और कुछ चाहिए तो बताइए।",
    },
    {
      keywords: ["what", "features", "can", "do", "help", "about", "क्या", "कैसे", "मदद", "बताओ"],
      response:
        "ExcelWeb can convert text and documents to Excel spreadsheets, and edit existing Excel files with simple instructions. Just tell me what you want to do!",
      hindiResponse:
        "ExcelWeb से आप टेक्स्ट और डॉक्यूमेंट को Excel स्प्रेडशीट में बदल सकते हैं, और पहले से बनी Excel फाइल को आसान इंस्ट्रक्शन से एडिट कर सकते हैं। बताइए क्या करना है!",
    },
  ];

  let bestScore = 0;
  let bestResponse = "";

  for (const entry of entries) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (lower.includes(keyword)) score += keyword.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestResponse = hindi ? entry.hindiResponse : entry.response;
    }
  }

  return bestResponse || (hindi
    ? "मैं आपकी Excel से जुड़ी मदद कर सकता हूं — टेक्स्ट कन्वर्ट करना, डॉक्यूमेंट अपलोड करना, या स्प्रेडशीट एडिट करना। बताइए क्या करना है?"
    : "I can help you with converting text to Excel, uploading documents, or editing spreadsheets. What would you like to do?");
}

/* ============================================
   SPEECH RECOGNITION HOOK
   ============================================ */

function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = typeof window !== "undefined" ? (window as any) : null;
    const SpeechRecognitionAPI =
      win?.SpeechRecognition ?? win?.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Accept both Hindi and English — Chrome auto-detects
      recognition.lang = "hi-IN";
      // Add English as alternative
      if (recognition.grammars !== undefined) {
        try { recognition.lang = "hi-IN"; } catch { /* use default */ }
      }
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    setTranscript("");
    setInterimTranscript("");
    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setTranscript(final);
        setInterimTranscript("");
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  };
}

/* ============================================
   TEXT-TO-SPEECH
   ============================================ */

function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      // Clean text for speech
      const cleanText = text
        .replace(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
          ""
        )
        .replace(/[→•📋📄✏️✨📊🎤💡✅🔧💾🤔👋😊📁]/g, "")
        .replace(/\*\*/g, "")
        .trim();

      if (!cleanText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      
      // Detect if response is in Hindi
      const hindiText = /[\u0900-\u097F]/.test(text);
      utterance.lang = hindiText ? "hi-IN" : "en-US";
      
      // Standard pitch 1.0 for Hindi (higher pitch sounds squeaky/robotic)
      utterance.pitch = hindiText ? 1.0 : 1.1;
      utterance.volume = 0.95;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;

      if (hindiText) {
        // Hindi voices - Prioritize Google Hindi and Niloy (more natural) over Lekha (robotic)
        const hindiNames = ["Google हिन्दी", "Niloy", "Microsoft Swara", "Lekha"];
        for (const name of hindiNames) {
          const found = voices.find(
            (v) => v.name.includes(name) && v.lang.startsWith("hi")
          );
          if (found) { selectedVoice = found; break; }
        }
        // Fallback: any Hindi voice
        if (!selectedVoice) {
          selectedVoice = voices.find((v) => v.lang.startsWith("hi"));
        }
      } else {
        // English female voices — priority order
        const femaleNames = [
          "Samantha",        // macOS — best female voice
          "Karen",           // macOS — Australian female
          "Moira",           // macOS — Irish female
          "Tessa",           // macOS — South African female
          "Google UK English Female",
          "Google US English",
          "Microsoft Zira",  // Windows female
          "Microsoft Jenny", // Windows 11 female
        ];
        for (const name of femaleNames) {
          const found = voices.find(
            (v) => v.name.includes(name) && v.lang.startsWith("en")
          );
          if (found) { selectedVoice = found; break; }
        }
        if (!selectedVoice) {
          selectedVoice =
            voices.find(
              (v) => v.lang.startsWith("en") && /female|woman|fiona|victoria|kate/i.test(v.name)
            ) || voices.find((v) => v.lang.startsWith("en"));
        }
      }
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
}

/* ============================================
   SIRI-LIKE VOICE ASSISTANT COMPONENT
   ============================================ */

export function VoiceChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [state, setState] = useState<AssistantState>("idle");
  const [displayText, setDisplayText] = useState("");
  const [userText, setUserText] = useState("");
  const [history, setHistory] = useState<ConversationTurn[]>([]);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();

  // Sync listening state
  useEffect(() => {
    if (isListening) setState("listening");
  }, [isListening]);

  useEffect(() => {
    if (isSpeaking) setState("speaking");
  }, [isSpeaking]);

  // Show interim transcript while listening
  useEffect(() => {
    if (interimTranscript) {
      setUserText(interimTranscript);
    }
  }, [interimTranscript]);

  // When final transcript is received, process it
  useEffect(() => {
    if (transcript) {
      setUserText(transcript);
      processUserInput(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  async function processUserInput(text: string) {
    setState("thinking");
    setDisplayText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history.slice(-6).flatMap((t) => [
            { role: "user", text: t.user },
            { role: "bot", text: t.bot },
          ]),
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const reply = data.reply;
      setDisplayText(reply);
      setHistory((prev) => [...prev, { id: Date.now().toString(), user: text, bot: reply }]);

      // Speak the response
      await speak(reply);
      setState("idle");
    } catch {
      const fallback = findFallbackResponse(text);
      setDisplayText(fallback);
      setHistory((prev) => [...prev, { id: Date.now().toString(), user: text, bot: fallback }]);
      await speak(fallback);
      setState("idle");
    }
  }

  function handleMicClick() {
    if (state === "speaking") {
      stopSpeaking();
      setState("idle");
      return;
    }
    if (isListening) {
      stopListening();
      setState("idle");
      return;
    }
    // Reset and start listening
    setUserText("");
    setDisplayText("");
    startListening();
  }

  function handleOpen() {
    if (isOpen) {
      // Close
      stopSpeaking();
      stopListening();
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
        setState("idle");
        setDisplayText("");
        setUserText("");
      }, 350);
    } else {
      setIsOpen(true);
    }
  }

  function getStateLabel(): string {
    switch (state) {
      case "listening":
        return "Listening...";
      case "thinking":
        return "Thinking...";
      case "speaking":
        return "Speaking...";
      default:
        return "Tap the mic to talk";
    }
  }

  return (
    <>
      {/* Voice Assistant Overlay */}
      {isOpen && (
        <div
          className={`voice-overlay${isClosing ? " voice-overlay-closing" : ""}`}
          id="voice-assistant-overlay"
        >
          {/* Close button */}
          <button
            className="voice-close-btn"
            onClick={handleOpen}
            aria-label="Close assistant"
            id="voice-close-btn"
          >
            <X size={24} />
          </button>

          {/* Main content */}
          <div className="voice-content">
            {/* Animated Orb */}
            <button
              className={`voice-orb voice-orb-${state}`}
              onClick={handleMicClick}
              aria-label={
                state === "listening"
                  ? "Stop listening"
                  : state === "speaking"
                  ? "Stop speaking"
                  : "Start listening"
              }
              id="voice-orb-btn"
              type="button"
              disabled={state === "thinking"}
            >
              <div className="voice-orb-inner">
                {state === "listening" ? (
                  <div className="voice-orb-waves">
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                  </div>
                ) : state === "thinking" ? (
                  <div className="voice-orb-spinner" />
                ) : state === "speaking" ? (
                  <div className="voice-orb-waves speaking">
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                    <span className="voice-wave" />
                  </div>
                ) : (
                  <Mic size={36} />
                )}
              </div>

              {/* Pulse rings */}
              {(state === "listening" || state === "speaking") && (
                <>
                  <span className="voice-ring voice-ring-1" />
                  <span className="voice-ring voice-ring-2" />
                  <span className="voice-ring voice-ring-3" />
                </>
              )}
            </button>

            {/* State Label */}
            <div className="voice-state-label">{getStateLabel()}</div>

            {/* User transcript */}
            {userText && (
              <div className="voice-transcript voice-transcript-user">
                <span className="voice-transcript-label">You</span>
                {userText}
              </div>
            )}

            {/* Bot response */}
            {displayText && (
              <div className="voice-transcript voice-transcript-bot">
                <span className="voice-transcript-label">
                  <Sparkles size={12} /> Assistant
                </span>
                {displayText}
              </div>
            )}
          </div>

          {/* Bottom hint */}
          <div className="voice-hint">
            {!isSupported
              ? "Voice not supported — try Chrome or Edge"
              : state === "idle"
              ? "Say something like \"How do I convert text to Excel?\""
              : state === "speaking"
              ? "Tap the orb to stop"
              : ""}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className={`chat-fab${isOpen ? " open" : ""}`}
        onClick={handleOpen}
        aria-label={isOpen ? "Close assistant" : "Open voice assistant"}
        id="chat-fab-btn"
        type="button"
      >
        {isOpen ? <X size={24} /> : <Mic size={24} />}
        {!isOpen && (
          <span className="chat-fab-badge">
            <span className="chat-fab-badge-dot" />
          </span>
        )}
      </button>
    </>
  );
}

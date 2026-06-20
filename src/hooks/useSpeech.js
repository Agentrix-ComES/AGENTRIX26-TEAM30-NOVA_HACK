import { useState, useEffect, useRef } from "react";

export function useSpeech(onResult, currentLang = "en") {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    // Set recognition language based on active application language
    if (currentLang === "si") {
      recognition.lang = "si-LK";
    } else if (currentLang === "ta") {
      recognition.lang = "ta-LK";
    } else {
      recognition.lang = "en-US";
    }

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event) => {
      setError(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onResult) {
        onResult(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [currentLang, onResult]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech recognition start error:", e);
      }
    } else {
      // Simulation for unsupported environments
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const simulatedVoicePhrases = {
          en: "lost NIC",
          si: "හැඳුනුම්පත නැතිවෙලා",
          ta: "அடையாள அட்டை"
        };
        if (onResult) {
          onResult(simulatedVoicePhrases[currentLang] || "lost NIC");
        }
      }, 2500);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else {
      setIsListening(false);
    }
  };

  return {
    isListening,
    startListening,
    stopListening,
    error
  };
}

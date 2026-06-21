import { useState } from 'react';
import { api } from '../services/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function send(query) {
    const trimmed = query.trim();
    if (!trimmed || pending) return;

    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: trimmed, id: crypto.randomUUID() }]);
    setPending(true);

    try {
      const res = await api.chat(trimmed);
      const { data, debug } = res;
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          id: crypto.randomUUID(),
          language: data.language,
          text: data.responseText,
          formAvailable: data.formAvailable,
          pdfFilename: data.pdfFilename,
          debug,
        },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }

  return { messages, pending, error, send };
}

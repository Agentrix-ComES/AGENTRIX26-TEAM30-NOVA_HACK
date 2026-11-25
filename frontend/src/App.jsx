import { useState } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';
import { supportedLanguages } from './i18n';

const styles = {
  page: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif',
    minHeight: '100vh',
    background: '#f5f6f8',
    color: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: '#0d2c54',
    color: 'white',
    padding: '16px 24px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { margin: 0, fontSize: 18, fontWeight: 600 },
  subtitle: { margin: 0, fontSize: 12, opacity: 0.8 },
  controls: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  controlLabel: { fontSize: 12, marginRight: 4, opacity: 0.85 },
  select: { padding: '6px 8px', borderRadius: 6, border: 'none', fontSize: 14 },
  main: {
    flex: 1,
    maxWidth: 760,
    width: '100%',
    margin: '0 auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  hint: {
    background: '#fff',
    border: '1px solid #e1e4ea',
    borderRadius: 8,
    padding: 12,
    color: '#555',
    fontSize: 13,
  },
  message: (role) => ({
    background: role === 'user' ? '#0d2c54' : '#fff',
    color: role === 'user' ? '#fff' : '#1a1a1a',
    border: role === 'user' ? 'none' : '1px solid #e1e4ea',
    borderRadius: 12,
    padding: '10px 14px',
    maxWidth: '85%',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  }),
  formBadge: {
    display: 'inline-block',
    marginTop: 8,
    padding: '4px 8px',
    background: '#e8f4ff',
    color: '#0d2c54',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
  },
  debug: { marginTop: 6, fontSize: 11, color: '#888' },
  inputRow: { display: 'flex', gap: 8, padding: 12, background: 'white', borderTop: '1px solid #e1e4ea' },
  input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #c8ccd4', fontSize: 14 },
  sendBtn: { padding: '0 18px', borderRadius: 8, border: 'none', background: '#0d2c54', color: 'white', fontWeight: 600, cursor: 'pointer' },
  errorBar: { background: '#fdecea', color: '#8a1c13', padding: 10, borderRadius: 8, fontSize: 13 },
};

export default function App() {
  const { lang, setLang, t } = useLanguage();
  const { district, districts, ready, setDistrict, error: sessionError } = useSession();
  const { messages, pending, error: chatError, send } = useChat();
  const [draft, setDraft] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    send(draft);
    setDraft('');
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('appTitle')}</h1>
          <p style={styles.subtitle}>{t('appSubtitle')}</p>
        </div>
        <div style={styles.controls}>
          <label>
            <span style={styles.controlLabel}>{t('languageLabel')}:</span>
            <select style={styles.select} value={lang} onChange={(e) => setLang(e.target.value)}>
              {supportedLanguages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span style={styles.controlLabel}>{t('districtLabel')}:</span>
            <select
              style={styles.select}
              value={district || ''}
              disabled={!ready}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">{t('districtNone')}</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>
      </header>

      <main style={styles.main}>
        {messages.length === 0 && (
          <div style={styles.hint}>{t('noResultsHint')}</div>
        )}
        {messages.map(m => (
          <div key={m.id} style={styles.message(m.role)}>
            <div>{m.text}</div>
            {m.role === 'assistant' && m.formAvailable && (
              <div style={styles.formBadge}>
                📄 {t('formAvailable')}: {m.pdfFilename}
              </div>
            )}
            {m.role === 'assistant' && m.debug && (
              <div style={styles.debug}>
                {t('retrievedFrom')}: {m.debug.retrievedIds.slice(0, 3).map(r => `${r.id}(${r.score})`).join(', ')}
              </div>
            )}
          </div>
        ))}
        {(sessionError || chatError) && (
          <div style={styles.errorBar}>
            <strong>{t('errorTitle')}:</strong> {chatError || sessionError}
          </div>
        )}
      </main>

      <form style={styles.inputRow} onSubmit={onSubmit}>
        <input
          style={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('askPlaceholder')}
          disabled={pending}
        />
        <button style={styles.sendBtn} disabled={pending || !draft.trim()}>
          {pending ? t('sending') : t('send')}
        </button>
      </form>
    </div>
  );
}

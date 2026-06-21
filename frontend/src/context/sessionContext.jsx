import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [district, setDistrictState] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, current] = await Promise.all([
          api.listDistricts(),
          api.getDistrict(),
        ]);
        if (cancelled) return;
        setDistricts(list.districts || []);
        setDistrictState(current.district || null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function setDistrict(next) {
    const value = next === '' ? null : next;
    const res = await api.setDistrict(value);
    setDistrictState(res.district);
  }

  return (
    <SessionContext.Provider value={{ district, districts, ready, error, setDistrict }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSessionContext must be used within SessionProvider');
  return ctx;
}

import { useSessionContext } from '../context/sessionContext';

export function useSession() {
  return useSessionContext();
}

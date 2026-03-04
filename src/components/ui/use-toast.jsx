import { useState } from 'react';
export function useToast() { const [toasts, setToasts] = useState([]); const toast = (opts) => setToasts(t => [...t, { id: Date.now(), ...opts }]); const dismiss = (id) => setToasts(t => t.filter(x => x.id !== id)); return { toasts, toast, dismiss }; }

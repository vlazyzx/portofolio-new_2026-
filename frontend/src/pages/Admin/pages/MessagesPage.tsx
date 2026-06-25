import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { EmptyState, LoadingState } from '../components/ui';
import { errorMessage, getContactMessages, markContactMessageRead, deleteContactMessage } from '../services/api';
import { useToast } from '../store/toast';
import type { ContactMessage } from '../types';

export function MessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);

  useEffect(() => {
    getContactMessages()
      .then(setMessages)
      .catch(err => toast(errorMessage(err, 'Gagal memuat pesan.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function markRead(id: string) {
    try {
      await markContactMessageRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
      if (selected?.id === id) setSelected(s => s ? { ...s, read: true } : s);
      toast('Ditandai sebagai dibaca', 'info');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menandai pesan.'), 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContactMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selected?.id === id) setSelected(null);
      toast('Pesan dihapus');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menghapus pesan.'), 'error');
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-180px)]">
      <div className="lg:w-80 flex flex-col gap-2 overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[11px] text-sub">{messages.length} pesan</span>
          <span className="font-mono text-[11px] text-accent">
            {messages.filter(m => !m.read).length} belum dibaca
          </span>
        </div>
        {messages.length === 0 ? (
          <EmptyState title="Belum ada pesan" description="Pesan dari halaman contact akan muncul di sini" />
        ) : messages.map(m => (
          <button key={m.id}
            type="button"
            onClick={() => { setSelected(m); if (!m.read) markRead(m.id); }}
            className={`text-left p-4 rounded-xl border transition-colors duration-150
                        ${selected?.id === m.id ? 'border-accent bg-accent/5' : 'border-white/10 bg-surface/80 hover:border-accent/40'}
                        ${!m.read ? 'border-l-2 border-l-accent' : ''}`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-semibold text-[13px] text-tx truncate">{m.name}</div>
              {!m.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />}
            </div>
            <div className="text-[12px] text-sub truncate mb-1">{m.subject || '(tanpa subjek)'}</div>
            <div className="font-mono text-[10px] text-muted">
              {new Date(m.createdAt).toLocaleDateString('id-ID')}
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        {selected ? (
          <div className="card h-full flex flex-col">
            <div className="flex items-start justify-between mb-4 gap-3">
              <div>
                <h3 className="font-syne font-bold text-[16px]">{selected.name}</h3>
                <p className="text-[12px] text-sub">{selected.email}</p>
                <p className="font-mono text-[10px] text-muted mt-1">
                  {new Date(selected.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!selected.read && (
                  <button type="button" onClick={() => markRead(selected.id)}
                    className="btn-link">
                    Tandai Dibaca
                  </button>
                )}
                <button type="button" onClick={() => handleDelete(selected.id)} className="btn-danger py-1">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {selected.subject && (
              <div className="mb-3 pb-3 border-b border-white/10">
                <span className="font-mono text-[11px] text-sub uppercase tracking-wider">Subjek</span>
                <p className="text-[13px] text-tx mt-1">{selected.subject}</p>
              </div>
            )}
            <p className="text-[14px] text-sub leading-relaxed flex-1 whitespace-pre-wrap">
              {selected.message}
            </p>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState title="Pilih pesan" description="Klik pesan di kiri untuk membacanya" />
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import {
  InputField, TextAreaField, SelectField, ImageUploader,
  LoadingState, Spinner
} from '../components/ui';
import { errorMessage, getHome, updateHome, uploadLanyardImage } from '../services/api';
import { useToast } from '../store/toast';
import type { HomeContent } from '../types';

export function HomePage() {
  const { toast } = useToast();
  const [home, setHome] = useState<HomeContent | null>(null);
  const homeRef = useRef<HomeContent | null>(null);
  const [lanyardFile, setLanyardFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getHome()
      .then(data => {
        homeRef.current = data;
        setHome(data);
      })
      .catch(err => toast(errorMessage(err, 'Gagal memuat data home.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    homeRef.current = home;
  }, [home]);

  async function handleSave() {
    const currentHome = homeRef.current;
    if (!currentHome) return;
    setSaving(true);
    try {
      let nextHome = currentHome;
      if (lanyardFile) {
        nextHome = await uploadLanyardImage(lanyardFile);
      }
      const updated = await updateHome(nextHome);
      homeRef.current = updated;
      setHome(updated);
      setLanyardFile(null);
      window.dispatchEvent(new Event('home-content-updated'));
      toast('Data home berhasil disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan data home.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!home) return null;

  function set<K extends keyof HomeContent>(key: K, value: HomeContent[K]) {
    setHome(current => {
      if (!current) return current;
      const next = { ...current, [key]: value };
      homeRef.current = next;
      return next;
    });
  }

  const statKeys: (keyof HomeContent['stats'])[] = ['mainStack', 'learningYears', 'gpa'];
  const statScale: Record<keyof HomeContent['stats'], number> = {
    completedProjects: 100,
    mainStack: 18,
    learningYears: 30,
    gpa: 98,
  };

  function setStat<K extends keyof HomeContent['stats'][keyof HomeContent['stats']]>(
    key: keyof HomeContent['stats'],
    field: K,
    value: HomeContent['stats'][keyof HomeContent['stats']][K]
  ) {
    setHome(current => {
      if (!current) return current;
      const next = {
        ...current,
        stats: {
          ...current.stats,
          [key]: {
            ...current.stats[key],
            [field]: value,
          },
        },
      };
      homeRef.current = next;
      return next;
    });
  }

  function formatStatValue(key: keyof HomeContent['stats'], numericValue: number): string {
    const roundedValue = key === 'gpa' ? numericValue.toFixed(0) : Math.round(numericValue).toString();
    return key === 'learningYears' ? `${roundedValue}+` : roundedValue;
  }

  function setStatValue(key: keyof HomeContent['stats'], value: string) {
    const numericValue = Number(value.replace(/[^0-9.]/g, ''));
    const progress = Number.isFinite(numericValue) ? Math.min(Math.max(numericValue, 0), statScale[key]) : 0;

    setHome(current => {
      if (!current) return current;
      const next = {
        ...current,
        stats: {
          ...current.stats,
          [key]: {
            ...current.stats[key],
            value,
            progress,
          },
        },
      };
      homeRef.current = next;
      return next;
    });
  }

  function setStatProgress(key: keyof HomeContent['stats'], progress: number) {
    const clampedProgress = Math.min(Math.max(progress, 0), statScale[key]);

    setHome(current => {
      if (!current) return current;
      const next = {
        ...current,
        stats: {
          ...current.stats,
          [key]: {
            ...current.stats[key],
            value: formatStatValue(key, clampedProgress),
            progress: clampedProgress,
          },
        },
      };
      homeRef.current = next;
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <div className="card p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h2 className="font-syne font-bold text-[18px]">Manajer Home</h2>
          </div>
          <p className="text-[12px] text-sub max-w-2xl">
            Atur media, statistik, dan kartu navigasi yang tampil di halaman home. Statistik proyek selesai otomatis mengikuti data terbaru dari Manajer Project.
          </p>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Media Home</h3>
          </div>
          <p className="text-[12px] text-sub">
            Konten ini tampil di hero utama halaman home.
          </p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
          <div className="flex flex-col gap-4">
            <InputField
              label="Eyebrow"
              value={home.eyebrow}
              onChange={e => set('eyebrow', e.target.value)}
              placeholder="Pengembang Kreatif"
            />
            <InputField
              label="Nama di Home"
              value={home.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Muhammad Ikhsan"
            />
            <TextAreaField
              label="Deskripsi Hero"
              value={home.heroDescription}
              onChange={e => set('heroDescription', e.target.value)}
              rows={4}
              placeholder="Deskripsi singkat yang tampil di bawah nama pada hero home..."
            />
            <InputField
              label="Subtitle Badge"
              value={home.badgeSubtitle}
              onChange={e => set('badgeSubtitle', e.target.value)}
              placeholder="Backend Developer"
            />
          </div>
          <ImageUploader
            label="Gambar Lanyard"
            value={home.lanyardImage}
            onChange={value => set('lanyardImage', Array.isArray(value) ? value[0] || '' : value)}
            onFilesChange={files => setLanyardFile(files instanceof File ? files : null)}
            fileOnly
          />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Statistik Home</h3>
          </div>
          <p className="text-[12px] text-sub">
            Value dan tombol volume saling terhubung. Ubah angka atau geser slider, lalu simpan untuk mengirim data ke halaman home.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statKeys.map(statKey => {
            const stat = home.stats[statKey];

            return (
              <div key={stat.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-syne font-bold text-[14px] text-tx">{stat.label || 'Statistik Home'}</div>
                    <div className="mono text-[11px] text-sub">Range 0 - {statScale[statKey]}{statKey === 'learningYears' ? '+' : ''}</div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full border border-white/10 bg-elevated mono text-[11px] text-sub">
                    {Math.round(stat.progress)} / {statScale[statKey]}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <InputField label="Value" value={stat.value} onChange={e => setStatValue(statKey, e.target.value)} placeholder="18" />
                  <InputField label="Label" value={stat.label} onChange={e => setStat(statKey, 'label', e.target.value)} placeholder="Stack Utama" />
                </div>
                <div className="rounded-xl border border-white/10 bg-elevated/60 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3 mono text-[11px] text-sub">
                    <span>Volume</span>
                    <span>{Math.round((stat.progress / statScale[statKey]) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max={statScale[statKey]} step="1" value={stat.progress} onChange={e => setStatProgress(statKey, Number(e.target.value))} className="w-full accent-accent" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-2 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-px bg-accent" />
            <h3 className="font-syne font-bold text-[15px]">Kartu Navigasi Home</h3>
          </div>
          <p className="text-[12px] text-sub">
            Kartu ini tampil di halaman home sebagai pintasan menuju halaman lain.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {home.cards.map((card, index) => (
            <div key={card.id || index} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="font-syne font-bold text-[14px] text-tx">Kartu {index + 1}</div>
                  <div className="mono text-[11px] text-sub">Navigasi: {card.page}</div>
                </div>
                <button type="button" onClick={() => set('cards', home.cards.filter((_, i) => i !== index))} className="btn-icon-danger self-start sm:self-auto"><Trash2 size={13} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label="Tag" value={card.tag} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, tag: e.target.value } : item))} placeholder="Project" />
                <SelectField label="Halaman" value={card.page} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, page: e.target.value as HomeContent['cards'][number]['page'] } : item))} options={[{ value: 'projects', label: 'Project' }, { value: 'about', label: 'Tentang' }, { value: 'student', label: 'Pelajar' }, { value: 'contact', label: 'Kontak' }]} />
                <div className="sm:col-span-2">
                  <InputField label="Judul" value={card.title} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} placeholder="Judul" />
                </div>
                <div className="sm:col-span-2">
                  <InputField label="Deskripsi" value={card.desc} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, desc: e.target.value } : item))} placeholder="Deskripsi" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <InputField label="Meta" value={card.meta} onChange={e => set('cards', home.cards.map((item, i) => i === index ? { ...item, meta: e.target.value } : item))} placeholder="Meta" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => set('cards', [...home.cards, { id: Date.now().toString(), page: 'projects', tag: '', title: '', desc: '', meta: '' }])} className="btn-link self-start w-full sm:w-auto justify-center sm:justify-start"><Plus size={13} /> Tambah Kartu</button>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto">
          {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Home</>}
        </button>
      </div>
    </div>
  );
}

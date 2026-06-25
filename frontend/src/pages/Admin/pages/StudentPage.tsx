import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { InputField, TextAreaField, LoadingState, Spinner } from '../components/ui';
import { errorMessage, getStudent, updateStudent } from '../services/api';
import { useToast } from '../store/toast';
import type { StudentContent } from '../types';

export function StudentPage() {
  const { toast } = useToast();
  const [student, setStudent] = useState<StudentContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStudent()
      .then(setStudent)
      .catch(err => toast(errorMessage(err, 'Gagal memuat data student.'), 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  async function handleSave() {
    if (!student) return;
    setSaving(true);
    try {
      await updateStudent(student);
      toast('Data student berhasil disimpan');
    } catch (err: unknown) {
      toast(errorMessage(err, 'Gagal menyimpan data student.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;
  if (!student) return null;

  return (
    <div className="admin-manager-page">
      <div className="admin-manager-intro card">
        <div>
          <div className="admin-section-label"><span className="admin-section-title">Student Manager</span></div>
          <div className="admin-manager-title">Kelola identitas akademik dan pencapaian.</div>
          <p className="admin-manager-desc mt-3">Atur informasi student, deskripsi akademik, daftar pencapaian, dan mata kuliah unggulan agar tampil lebih rapi di halaman student.</p>
        </div>
        <div className="admin-manager-badges">
          <span className="tag">Profil</span>
          <span className="tag">Achievement</span>
          <span className="tag">Course</span>
        </div>
      </div>

      <div className="admin-manager-grid">
        <div className="admin-manager-main">
          <div className="card">
            <div className="admin-section-header">
              <div className="admin-section-heading"><div className="admin-section-line" /><h3>Profil Student</h3></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField label="Periode" value={student.period} onChange={e => setStudent(s => s ? { ...s, period: e.target.value } : s)} placeholder="2022 - Sekarang" />
              <InputField label="Gelar / Jurusan" value={student.degree} onChange={e => setStudent(s => s ? { ...s, degree: e.target.value } : s)} placeholder="S1 Informatika" />
              <InputField label="Sekolah / Kampus" value={student.school} onChange={e => setStudent(s => s ? { ...s, school: e.target.value } : s)} placeholder="Nama kampus" />
              <InputField label="IPK" value={student.gpa} onChange={e => setStudent(s => s ? { ...s, gpa: e.target.value } : s)} placeholder="3.8" />
              <div className="sm:col-span-2"><InputField label="Label IPK" value={student.gpaLabel} onChange={e => setStudent(s => s ? { ...s, gpaLabel: e.target.value } : s)} placeholder="IPK Saat Ini" /></div>
              <div className="sm:col-span-2"><TextAreaField label="Deskripsi" value={student.description} onChange={e => setStudent(s => s ? { ...s, description: e.target.value } : s)} rows={4} placeholder="Deskripsi student..." /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="card">
              <div className="admin-section-header">
                <div className="admin-section-heading"><div className="admin-section-line" /><h3>Pencapaian</h3></div>
                <button type="button" onClick={() => setStudent(s => s ? { ...s, achievements: [...s.achievements, { id: Date.now().toString(), code: '', title: '', note: '' }] } : s)} className="btn-link"><Plus size={13} /> Tambah</button>
              </div>
              <div className="admin-collection-list">
                {student.achievements.map(item => (
                  <div key={item.id} className="admin-collection-card grid grid-cols-1 sm:grid-cols-[80px_1fr_auto] gap-2 items-start">
                    <input value={item.code} onChange={e => setStudent(s => s ? { ...s, achievements: s.achievements.map(entry => entry.id === item.id ? { ...entry, code: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="TOP" />
                    <div className="flex flex-col gap-1.5">
                      <input value={item.title} onChange={e => setStudent(s => s ? { ...s, achievements: s.achievements.map(entry => entry.id === item.id ? { ...entry, title: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Judul" />
                      <input value={item.note} onChange={e => setStudent(s => s ? { ...s, achievements: s.achievements.map(entry => entry.id === item.id ? { ...entry, note: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Catatan" />
                    </div>
                    <button type="button" onClick={() => setStudent(s => s ? { ...s, achievements: s.achievements.filter(entry => entry.id !== item.id) } : s)} className="btn-icon-danger mt-0.5"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="admin-section-header">
                <div className="admin-section-heading"><div className="admin-section-line" /><h3>Mata Kuliah</h3></div>
                <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: [...s.courses, { id: Date.now().toString(), name: '', grade: '', highlight: false }] } : s)} className="btn-link"><Plus size={13} /> Tambah</button>
              </div>
              <div className="admin-collection-list">
                {student.courses.map(item => (
                  <div key={item.id} className="admin-collection-card grid grid-cols-1 sm:grid-cols-[1fr_110px_auto] gap-2 items-center">
                    <input value={item.name} onChange={e => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, name: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="Nama mata kuliah" />
                    <input value={item.grade} onChange={e => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, grade: e.target.value } : entry) } : s)} className="input-field text-[12px]" placeholder="A" />
                    <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: s.courses.map(entry => entry.id === item.id ? { ...entry, highlight: !entry.highlight } : entry) } : s)} className="btn-ghost">{item.highlight ? 'Highlight' : 'Normal'}</button>
                    <div className="sm:col-span-3 flex justify-end">
                      <button type="button" onClick={() => setStudent(s => s ? { ...s, courses: s.courses.filter(entry => entry.id !== item.id) } : s)} className="btn-icon-danger"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="admin-sticky-actions">
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <><Spinner size={14} />Menyimpan...</> : <><Save size={14} />Simpan Student</>}
            </button>
          </div>
        </div>

        <div className="admin-manager-side">
          <div className="card admin-side-card admin-preview-card">
            <div className="admin-section-heading"><div className="admin-section-line" /><h3>Ringkasan Akademik</h3></div>
            <div className="admin-stat-grid">
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.achievements.length}</div><div className="admin-stat-label">Achievement</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.courses.length}</div><div className="admin-stat-label">Course</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.courses.filter(item => item.highlight).length}</div><div className="admin-stat-label">Highlighted</div></div>
              <div className="admin-stat-tile"><div className="admin-stat-value">{student.gpa || '—'}</div><div className="admin-stat-label">IPK</div></div>
            </div>
            <div className="admin-info-list">
              <div className="admin-info-row"><div className="admin-info-label">Kampus</div><div className="admin-info-value">{student.school || '-'}</div></div>
              <div className="admin-info-row"><div className="admin-info-label">Jurusan</div><div className="admin-info-value">{student.degree || '-'}</div></div>
              <div className="admin-info-row"><div className="admin-info-label">Periode</div><div className="admin-info-value">{student.period || '-'}</div></div>
              <div className="admin-info-row"><div className="admin-info-label">Preview</div><div className="admin-info-value">{student.description || 'Deskripsi belum diisi'}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, type CSSProperties } from 'react';
import SectionHeader from '../../components/SectionHeader';
import Footer from '../../components/Footer';
import { api } from '../../services/api';
import type { PageId, StudentContent } from '../../types/portfolio';
import './Student.css';

interface StudentProps {
  onNavigate: (page: PageId) => void;
}

export default function Student({ onNavigate: _onNavigate }: StudentProps) {
  const [student, setStudent] = useState<StudentContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStudent()
      .then(setStudent)
      .catch(() => setStudent(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page student-page"><section className="wrap sec"><div className="mono">Memuat data...</div></section></div>;

  const studentData = student ?? {
    period: '',
    degree: '',
    school: '',
    description: '',
    gpa: '',
    gpaLabel: '',
    achievements: [],
    courses: [],
  };

  return (
    <div className="page student-page">
      <section className="wrap sec">
        <SectionHeader eyebrow="Dunia Akademik" title="Profil" accent="Pelajar." />

        {!student && (
          <div className="mono" style={{ marginBottom: '12px' }}>
            Data student belum tersedia.
          </div>
        )}

        <article className="student-profile card edge-panel">
          <div className="student-main">
            <div>
              <div className="mono student-year">{studentData.period || '—'}</div>
              <h2>{studentData.degree || '—'}</h2>
              <p className="campus">{studentData.school || '—'}</p>
              <p className="student-copy">{studentData.description || 'Data student belum diisi.'}</p>
            </div>
            <div className="gpa-card">
              <div>{studentData.gpa || '—'}</div>
              <span className="mono">{studentData.gpaLabel || 'IPK'}</span>
            </div>
          </div>
        </article>

        <div className="stu-2">
          <section className="student-column edge-panel">
            <div className="ey student-ey">Pencapaian</div>
            {studentData.achievements.length > 0 ? studentData.achievements.map((achievement, index) => (
              <div className="ach" key={achievement.id || achievement.title} style={{ '--delay': `${index * 85}ms` } as CSSProperties}>
                <div className="ai">{achievement.code}</div>
                <div>
                  <div className="at">{achievement.title}</div>
                  <div className="as">{achievement.note}</div>
                </div>
              </div>
            )) : <div className="mono">Pencapaian belum tersedia.</div>}
          </section>

          <section className="student-column edge-panel">
            <div className="ey student-ey">Mata Kuliah Relevan</div>
            {studentData.courses.length > 0 ? studentData.courses.map((course, index) => (
              <div className="cr" key={course.id || course.name} style={{ '--delay': `${index * 85}ms` } as CSSProperties}>
                <span>{course.name}</span>
                <span className={course.highlight ? 'mono course-highlight' : 'mono'}>{course.grade}</span>
              </div>
            )) : <div className="mono">Mata kuliah belum tersedia.</div>}
          </section>
        </div>
      </section>
      <Footer compact />
    </div>
  );
}

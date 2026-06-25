import { useEffect, useState, type FormEvent } from 'react';
import SectionHeader from '../../components/SectionHeader';
import Footer from '../../components/Footer';
import SocialIcon from '../../components/SocialIcon';
import { api } from '../../services/api';
import type { PageId, ProfileContent, SocialLinkItem, SocialLinksContent } from '../../types/portfolio';
import './Contact.css';

interface ContactProps {
  onNavigate: (page: PageId) => void;
}

const quickBrands = ['tiktok', 'instagram', 'github', 'roblox', 'discord'];

export default function Contact({ onNavigate: _onNavigate }: ContactProps) {
  const [profile, setProfile] = useState<ProfileContent | null>(null);
  const [links, setLinks] = useState<SocialLinksContent | null>(null);
  const [socialItems, setSocialItems] = useState<SocialLinkItem[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(current => ({ ...current, [field]: value }));
    if (status !== 'loading') {
      setStatus('idle');
      setFeedback('');
    }
  };

  useEffect(() => {
    Promise.allSettled([api.getProfile(), api.getSocialLinks(), api.getSocialLinkItems()])
      .then(([profileResult, linksResult, itemsResult]) => {
        setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null);
        setLinks(linksResult.status === 'fulfilled' ? linksResult.value : null);
        setSocialItems(itemsResult.status === 'fulfilled' ? itemsResult.value : []);
      })
      .finally(() => setLoadingInfo(false));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus('loading');
    setFeedback('Mengirim pesan ke backend...');

    try {
      await api.sendContactMessage(form);
      setStatus('success');
      setFeedback('Pesan berhasil dikirim ke backend.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      setFeedback(error instanceof Error ? error.message : 'Pesan gagal dikirim.');
    }
  };

  const contactChannels = [
    { icon: 'NM', label: 'Nama', value: profile?.name || '' },
    { icon: 'RL', label: 'Role', value: profile?.role || '' },
    { icon: 'LC', label: 'Lokasi', value: profile?.location || '' },
    { icon: 'CV', label: 'CV', value: links?.resume || '', href: links?.resume || '' }
  ].filter(channel => channel.value);

  if (loadingInfo) return <div className="page contact-page"><section className="wrap sec"><div className="mono">Memuat data...</div></section></div>;

  return (
    <div className="page contact-page">
      <section className="wrap sec">
        <SectionHeader eyebrow="Mari Bicara" title="Terbuka untuk" accent="peluang." />
        <div className="ct-grid">
          <div className="contact-info">
            <p className="contact-copy">
              {profile?.bio || 'Data kontak publik belum tersedia.'}
            </p>

            <div className="channel-grid edge-panel">
              {contactChannels.length > 0 ? contactChannels.map(channel => (
                <a className="ch" href={channel.href || '#'} key={channel.label} target={channel.href ? '_blank' : undefined} rel={channel.href ? 'noopener' : undefined}>
                  <span className="ci">{channel.icon.toUpperCase().slice(0, 2)}</span>
                  <span>
                    <span className="mono channel-label">{channel.label}</span>
                    <strong>{channel.value}</strong>
                  </span>
                </a>
              )) : <div className="mono">Channel kontak belum tersedia.</div>}
            </div>

            <div className="social-panel edge-panel">
              <div className="mono social-title">Tautan Sosial</div>
              <div className="social-quick" aria-label="Tautan sosial cepat">
                {quickBrands.map(brand => {
                  const item = socialItems.find(link => link.brand === brand);
                  return item ? (
                    <a className={`social-icon brand-${brand}`} href={item.href} key={brand} target="_blank" rel="noopener" aria-label={brand}>
                      <SocialIcon brand={brand} />
                    </a>
                  ) : null;
                })}
              </div>
              <div className="social-list">
                {socialItems.length > 0 ? socialItems.map(link => (
                  <a className={`social-card brand-${link.brand}`} href={link.href} key={link.id} target="_blank" rel="noopener">
                    <span className="social-badge"><SocialIcon brand={link.brand} /></span>
                    <span>
                      <strong>{link.title}</strong>
                      <small>{link.subtitle}</small>
                    </span>
                    <span className="social-arrow">-&gt;</span>
                  </a>
                )) : <div className="mono">Link sosial belum tersedia.</div>}
              </div>
            </div>
          </div>

          <form className="fb edge-panel" onSubmit={handleSubmit}>
            <div className="mono form-title">Kirim Pesan</div>
            <label className="fl" htmlFor="name">Nama Kamu</label>
            <input className="fi" id="name" type="text" placeholder="Siapa namamu?" value={form.name} onChange={event => updateField('name', event.target.value)} required />
            <label className="fl" htmlFor="email">Email</label>
            <input className="fi" id="email" type="email" placeholder="email@example.com" value={form.email} onChange={event => updateField('email', event.target.value)} required />
            <label className="fl" htmlFor="subject">Subjek</label>
            <input className="fi" id="subject" type="text" placeholder="Magang / Pekerjaan Lepas / Kolaborasi..." value={form.subject} onChange={event => updateField('subject', event.target.value)} />
            <label className="fl" htmlFor="message">Pesan</label>
            <textarea className="fi" id="message" rows={4} placeholder="Ceritain projectmu di sini..." value={form.message} onChange={event => updateField('message', event.target.value)} required />
            {feedback && <div className={`form-status ${status}`} role="status">{feedback}</div>}
            <button className="bp send-button" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Mengirim...' : 'Kirim Pesan ->'}
            </button>
          </form>
        </div>
      </section>
      <Footer compact />
    </div>
  );
}

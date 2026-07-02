'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Plus, ChevronLeft, ChevronRight, X, Trash2,
  ArrowLeft, ArrowRight, Share, MoreHorizontal, Bookmark, Heart,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthProvider';

interface Note {
  id: string;
  img: string;
  text: string;
  date: string;
  author: string;
}

interface GalleryRow {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  author: string;
  created_at: string;
}

function rowToNote(row: GalleryRow): Note {
  return {
    id: row.id,
    img: row.image_url,
    text: row.caption || 'Untitled note.',
    date: formatDate(row.created_at),
    author: row.author || 'Unknown',
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── glass token ── */
const G = (alpha = 0.55, blur = 22, sat = 140) => ({
  background: `rgba(255,255,255,${alpha})`,
  backdropFilter: `blur(${blur}px) saturate(${sat}%)`,
  WebkitBackdropFilter: `blur(${blur}px) saturate(${sat}%)`,
  border: '1px solid rgba(28,28,30,0.08)',
} as React.CSSProperties);

/* ── Aurora OS design tokens (see CLAUDE.md §5) ── */
const YELLOW    = '#FFD60A';
const INK       = '#1c1c1e';
const INK_DIM   = '#8e8e93';
const INK_LOW   = '#aeaeb2';
const RED       = '#FF3B30';
const CARD_BG   = '#fffef9';
const TRACK_BG  = '#e5e4df';

/* ── tiny glass circle button ── */
function GlassBtn({
  children, onClick, size = 32, accent = false, style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  size?: number;
  accent?: boolean;
  style?: React.CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        color: accent ? '#a3790a' : (hov ? INK : INK_DIM),
        transition: 'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
        boxShadow: accent && hov ? `0 0 0 6px rgba(255,214,10,0.15)` : 'none',
        ...G(hov ? 0.78 : 0.55),
        border: accent ? '1px solid rgba(255,214,10,0.5)' : '1px solid rgba(28,28,30,0.08)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function GalleryApp() {
  const { session } = useAuth();

  const [notes, setNotes]             = useState<Note[]>([]);
  const [loading, setLoading]         = useState(true);
  const [focus, setFocus]             = useState(0);
  const [target, setTarget]           = useState(0);
  const [query, setQuery]             = useState('');
  const [detail, setDetail]           = useState<Note | null>(null);
  const [detailRow, setDetailRow]     = useState<GalleryRow | null>(null);
  const [composeImg, setComposeImg]   = useState<string | null>(null);
  const [composeFile, setComposeFile] = useState<File | null>(null);
  const [composeText, setComposeText] = useState('');
  const [composeName, setComposeName] = useState('');
  const [saving, setSaving]           = useState(false);

  const focRef  = useRef(0);
  const tgtRef  = useRef(0);
  const rafRef  = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const hvTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowsRef = useRef<GalleryRow[]>([]);

  /* ── fetch + realtime sync ── */
  const fetchEntries = useCallback(async () => {
    const { data, error } = await supabase
      .from('gallery_entries')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) { console.error(error); return; }
    rowsRef.current = data as GalleryRow[];
    setNotes((data as GalleryRow[]).map(rowToNote));
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    const channel = supabase
      .channel('gallery_entries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_entries' }, () => {
        fetchEntries();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEntries]);

  /* ── coverflow physics (unchanged from prototype) ── */
  useEffect(() => { tgtRef.current = target; }, [target]);
  useEffect(() => {
    const tick = () => {
      focRef.current += (tgtRef.current - focRef.current) * 0.08;
      if (Math.abs(tgtRef.current - focRef.current) < 0.001) focRef.current = tgtRef.current;
      setFocus(focRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const matches = useCallback((n: Note) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return n.text.toLowerCase().includes(q) || n.date.toLowerCase().includes(q) || n.author.toLowerCase().includes(q);
  }, [query]);

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q) {
      const i = notes.findIndex(n => {
        const lq = q.toLowerCase();
        return n.text.toLowerCase().includes(lq) || n.author.toLowerCase().includes(lq);
      });
      if (i !== -1) setTarget(i);
    }
  };

  const prev = () => setTarget(() => Math.max(0, Math.round(focRef.current) - 1));
  const next = () => setTarget(() => Math.min(notes.length - 1, Math.round(focRef.current) + 1));

  const hoverCard = (i: number) => {
    if (hvTimer.current) clearTimeout(hvTimer.current);
    hvTimer.current = setTimeout(() => setTarget(i), 130);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      setComposeImg(ev.target?.result as string);
      setComposeFile(f);
      setComposeText('');
      setComposeName('');
    };
    r.readAsDataURL(f);
    e.target.value = '';
  };

  /* ── save: upload to Storage, then insert row ── */
  const save = async () => {
    if (!composeFile || !session?.user?.id || saving) return;
    setSaving(true);
    try {
      const ext = composeFile.name.split('.').pop() || 'jpg';
      const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(path, composeFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('gallery-photos').getPublicUrl(path);

      const { error: insertError } = await supabase.from('gallery_entries').insert({
        user_id: session.user.id,
        image_url: pub.publicUrl,
        caption: composeText.trim() || 'Untitled note.',
        author: composeName.trim() || 'Unknown',
      });
      if (insertError) throw insertError;

      setComposeImg(null);
      setComposeFile(null);
      setTarget(notes.length);
      await fetchEntries();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ── delete: remove row (+ best-effort remove storage object) ── */
  const del = async (id: string) => {
    const row = rowsRef.current.find(r => r.id === id);
    const { error } = await supabase.from('gallery_entries').delete().eq('id', id);
    if (error) { console.error(error); return; }
    if (row) {
      const path = row.image_url.split('/gallery-photos/')[1];
      if (path) await supabase.storage.from('gallery-photos').remove([path]);
    }
    setDetail(null);
    setDetailRow(null);
    await fetchEntries();
  };

  const matchCount = query ? notes.filter(matches).length : 0;
  const centerNote = notes[Math.round(focus)] ?? notes[0];

  /* card geometry — squarer, larger */
  const CW = 224, CH = 218;
  const SPREAD = 148;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f1ec', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400;1,9..144,500;1,9..144,600&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: rgba(28,28,30,0.28); }
        ::-webkit-scrollbar { display: none; }
        textarea { transition: border-color 0.2s ease; }
        textarea:focus { border-color: rgba(255,214,10,0.55) !important; outline: none; }
        input:focus { outline: none; }
        @keyframes vpIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .vp-in { animation: vpIn 0.22s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      {/* ── 3:2 CANVAS ── */}
      <div style={{
        position: 'relative',
        width: 'min(960px, 100vw)',
        aspectRatio: '3 / 2',
        borderRadius: 18,
        overflow: 'hidden',
        background: `
          radial-gradient(ellipse 110% 65% at 50% 10%, rgba(255,214,10,0.10) 0%, transparent 65%),
          radial-gradient(ellipse 70%  50% at 15% 70%, rgba(0,122,255,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 60%  40% at 85% 75%, rgba(255,214,10,0.06) 0%, transparent 60%),
          linear-gradient(165deg, #f7f6f1 0%, #f2f1ec 45%, #efeee8 75%, #ece9e0 100%)
        `,
        color: INK,
        WebkitFontSmoothing: 'antialiased',
      }}>

        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '45%', background: 'radial-gradient(ellipse at center, rgba(255,214,10,0.08), transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ── TOP GLASS PILL ── */}
        <div style={{
          position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 10px', height: 34, borderRadius: 999,
          ...G(0.6, 20, 140),
          minWidth: 'min(520px, 88%)',
        }}>
          <GlassBtn size={26} onClick={prev}><ArrowLeft size={12} /></GlassBtn>
          <GlassBtn size={26} onClick={next}><ArrowRight size={12} /></GlassBtn>

          <div style={{
            flex: 1, height: 24, borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
            background: TRACK_BG, border: '1px solid rgba(28,28,30,0.06)',
            position: 'relative',
          }}>
            <Search size={10} style={{ color: INK_LOW, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search notes…"
              value={query}
              onChange={e => handleSearch(e.target.value)}
              style={{
                flex: 1, background: 'transparent', border: 'none', color: INK,
                fontSize: 11, fontFamily: "'Inter', sans-serif", letterSpacing: '0.01em',
              }}
            />
            {query && matchCount > 0 && (
              <span style={{ fontSize: 10, color: '#a3790a', whiteSpace: 'nowrap' }}>{matchCount}</span>
            )}
          </div>

          <GlassBtn size={26}><Share size={11} /></GlassBtn>
          <GlassBtn size={26}><MoreHorizontal size={11} /></GlassBtn>
        </div>

        {/* ── LEFT SIDE BUTTON STACK ── */}
        <div style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <GlassBtn size={34} onClick={() => fileRef.current?.click()} accent>
            <Plus size={14} />
          </GlassBtn>
          <GlassBtn size={34}><Bookmark size={13} /></GlassBtn>
          <GlassBtn size={34}><Heart size={13} /></GlassBtn>
        </div>

        {/* ── COVERFLOW ── */}
        <div style={{
          position: 'absolute', top: '12%', left: 0, right: 0, bottom: '22%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ color: INK_LOW, fontSize: 13 }}>Loading…</div>
          ) : notes.length === 0 ? (
            <div style={{ color: INK_LOW, fontSize: 13 }}>No photos yet.</div>
          ) : notes.map((note, i) => {
            const off  = i - focus;
            const aoff = Math.abs(off);
            if (aoff > 3.5) return null;

            const dx    = off * SPREAD;
            const dy    = Math.min(aoff, 2) * 10;
            const scale = 1 - Math.min(aoff, 2) * 0.13;
            const ry    = Math.max(-55, Math.min(55, off * -28));
            const op    = Math.max(0, 1 - Math.min(aoff, 2.5) * 0.32);
            const blur  = aoff * 2.2;
            const z     = Math.round(100 - aoff * 10);
            const dim   = !!query && !matches(note);

            return (
              <div
                key={note.id}
                onClick={() => { setDetail(note); setDetailRow(rowsRef.current.find(r => r.id === note.id) ?? null); }}
                onMouseEnter={() => hoverCard(i)}
                onMouseLeave={() => hvTimer.current && clearTimeout(hvTimer.current)}
                style={{
                  position: 'absolute',
                  width: CW, height: CH,
                  borderRadius: 16, overflow: 'hidden',
                  border: '1px solid rgba(28,28,30,0.08)',
                  background: CARD_BG,
                  boxShadow: `0 22px 56px -10px rgba(28,28,30,0.22), 0 0 0 1px rgba(255,255,255,0.5) inset`,
                  cursor: 'pointer',
                  transform: `translateX(${dx}px) translateY(${dy}px) scale(${scale}) perspective(900px) rotateY(${ry}deg)`,
                  filter: `blur(${blur}px)${dim ? ' grayscale(0.8) brightness(0.9)' : ''}`,
                  opacity: op * (dim ? 0.4 : 1),
                  zIndex: z,
                  willChange: 'transform, opacity, filter',
                  transition: 'filter 0.22s ease',
                }}
              >
                <img src={note.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)', pointerEvents: 'none' }} />

                <div style={{
                  position: 'absolute', bottom: 10, left: 10, right: 10,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'rgba(28,28,30,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: YELLOW, fontWeight: 500 }}>{note.date}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.03em' }}>{note.author}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM GLASS PILL ── */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 30, display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px 8px 8px', borderRadius: 999, height: 52,
          ...G(0.65, 26, 145),
          minWidth: 'min(360px, 78%)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: `linear-gradient(135deg, hsl(${(Math.round(focus) * 60 + 40) % 360},70%,88%), hsl(${(Math.round(focus) * 60 + 20) % 360},60%,80%))`,
            border: '1px solid rgba(28,28,30,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, color: INK_DIM, fontFamily: "'Fraunces', serif", fontStyle: 'italic',
          }}>
            {centerNote?.author?.[0] ?? '?'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: INK, letterSpacing: '0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {centerNote?.author ?? '—'}
            </div>
            <div style={{ fontSize: 10, color: INK_LOW, marginTop: 1, letterSpacing: '0.03em' }}>
              {centerNote?.date ?? '—'}
            </div>
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(28,28,30,0.1)', flexShrink: 0 }} />

          <GlassBtn size={34} onClick={prev}><ChevronLeft size={14} /></GlassBtn>
          <GlassBtn size={34} onClick={next}><ChevronRight size={14} /></GlassBtn>
        </div>

        {/* ── REFLECTION of bottom pill ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%) scaleY(-1)',
          transformOrigin: 'top center',
          zIndex: 19, display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px 8px 8px', borderRadius: 999, height: 52,
          minWidth: 'min(360px, 78%)',
          opacity: 0.18,
          marginBottom: -50,
          maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 75%)',
          WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 75%)',
          background: 'rgba(255,214,10,0.06)',
          border: '1px solid rgba(28,28,30,0.06)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          pointerEvents: 'none',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'rgba(28,28,30,0.05)', border: '1px solid rgba(28,28,30,0.08)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, width: '60%', borderRadius: 4, background: 'rgba(28,28,30,0.08)', marginBottom: 5 }} />
            <div style={{ height: 8,  width: '35%', borderRadius: 4, background: 'rgba(28,28,30,0.05)' }} />
          </div>
          <div style={{ width: 1, height: 20, background: 'rgba(28,28,30,0.06)', flexShrink: 0 }} />
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(28,28,30,0.05)', border: '1px solid rgba(28,28,30,0.07)' }} />
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(28,28,30,0.05)', border: '1px solid rgba(28,28,30,0.07)' }} />
        </div>

        <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleFile} />

        {/* ── COMPOSE OVERLAY ── */}
        {composeImg && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(28,28,30,0.45)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget && !saving) setComposeImg(null); }}
          >
            <div className="vp-in" style={{ position: 'relative', width: 'min(320px,100%)', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#fffef9,#f7f6f1)', border: '1px solid rgba(28,28,30,0.1)', boxShadow: '0 48px 96px -24px rgba(28,28,30,0.35)' }}>
              <button onClick={() => !saving && setComposeImg(null)} style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)', border: '1px solid rgba(28,28,30,0.1)', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={10} /></button>
              <img src={composeImg} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />
              <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="text" placeholder="Author name…" value={composeName} onChange={e => setComposeName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', background: TRACK_BG, border: '1px solid rgba(28,28,30,0.08)', borderRadius: 10, color: INK, fontSize: 12, fontFamily: "'Inter', sans-serif" }}
                />
                <textarea
                  value={composeText} onChange={e => setComposeText(e.target.value)} placeholder="Write a note…" rows={3} autoFocus
                  style={{ width: '100%', resize: 'vertical', background: TRACK_BG, border: '1px solid rgba(28,28,30,0.08)', borderRadius: 10, padding: '9px 12px', color: INK, fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 13, lineHeight: 1.5 }}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => !saving && setComposeImg(null)} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(28,28,30,0.1)', background: 'transparent', color: INK_DIM, fontSize: 11, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Cancel</button>
                  <button onClick={save} disabled={saving} style={{ padding: '7px 16px', borderRadius: 999, background: YELLOW, border: `1px solid ${YELLOW}`, color: '#1a1206', fontSize: 11, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}>
                    {saving ? 'Saving…' : 'Add to stack'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── DETAIL OVERLAY ── */}
        {detail && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(28,28,30,0.45)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={e => { if (e.target === e.currentTarget) { setDetail(null); setDetailRow(null); } }}
          >
            <div className="vp-in" style={{ position: 'relative', width: 'min(320px,100%)', aspectRatio: '1/1', borderRadius: 22, overflow: 'hidden', border: '1px solid rgba(28,28,30,0.1)', boxShadow: '0 48px 100px -20px rgba(28,28,30,0.4), 0 0 0 1px rgba(255,255,255,0.4) inset' }}>
              <img src={detail.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 50%)', pointerEvents: 'none' }} />

              <button onClick={() => { setDetail(null); setDetailRow(null); }} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(28,28,30,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={11} /></button>

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '40px 18px 18px',
                background: 'linear-gradient(to top, rgba(20,16,8,0.88) 0%, rgba(20,16,8,0.55) 55%, transparent 100%)',
              }}>
                <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: YELLOW, fontWeight: 500, marginBottom: 8 }}>{detail.date} · {detail.author}</div>
                <p style={{ margin: 0, fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontWeight: 500, fontSize: 15, lineHeight: 1.55, color: '#fff' }}>{detail.text}</p>
                {detailRow?.user_id === session?.user?.id && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button
                      onClick={() => del(detail.id)}
                      style={{ padding: '7px 14px', borderRadius: 999, border: `1px solid rgba(255,59,48,0.4)`, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: RED, fontSize: 11, cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,59,48,0.16)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.25)')}
                    >
                      <Trash2 size={10} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
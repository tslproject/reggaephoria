function EventIcon({ type }: { type: 'date' | 'location' | 'lineup' }) {
  if (type === 'date') return <svg viewBox="0 0 48 48" aria-hidden="true" className="event-icon event-icon-date"><rect x="6" y="10" width="36" height="32" rx="5" fill="#fff0c2"/><path d="M6 17a7 7 0 0 1 7-7h22a7 7 0 0 1 7 7v4H6Z" fill="#ee3b32"/><path d="M16 6v9m16-9v9" stroke="#173d32" strokeWidth="4" strokeLinecap="round"/><path d="M14 28h5m5 0h5m5 0h2M14 35h5m5 0h5" stroke="#238e68" strokeWidth="3" strokeLinecap="round"/></svg>;
  if (type === 'location') return <svg viewBox="0 0 48 48" aria-hidden="true" className="event-icon event-icon-location"><path d="M24 44S8 28 8 19a16 16 0 1 1 32 0c0 9-16 25-16 25Z" fill="#ee3b32"/><circle cx="24" cy="19" r="9" fill="#ffd447"/><circle cx="24" cy="19" r="4" fill="#245e3f"/><path d="M7 43c8-4 25-4 34 0" fill="none" stroke="#39b765" strokeWidth="3" strokeLinecap="round"/></svg>;
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="event-icon event-icon-lineup"><path d="M26 7v22a8 8 0 1 1-4-7V12l20-5v22a8 8 0 1 1-4-7V11Z" fill="#ffd447"/><path d="M7 13h7m-10 7h9m-6 7h5" stroke="#39b765" strokeWidth="3" strokeLinecap="round"/></svg>;
}

function splitLineup(description: string) {
  const marker = /line\s*[- ]?\s*up\s*:?/i.exec(description);
  if (!marker || marker.index === undefined) return { intro: description.trim(), artists: [] as string[] };
  const intro = description.slice(0, marker.index).replace(/[\s:;,–—-]+$/, '').trim();
  const lineupText = description.slice(marker.index + marker[0].length).replace(/^\s*[:;,–—-]+\s*/, '').trim();
  const artists = lineupText.split(/\s*(?:\||•|·|\n|\s[-–—]\s)\s*/).map((artist) => artist.trim()).filter(Boolean);
  return artists.length ? { intro, artists } : { intro: description.trim(), artists: [] as string[] };
}

export default function EventOverview({ eventName, description, eventDate, location }: { eventName: string; description: string; eventDate: Date; location: string }) {
  const { intro, artists } = splitLineup(description);
  const formattedDate = eventDate.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

  return <article className="event-overview" aria-label={`Informasi ${eventName}`}>
    <header className="event-title-block">
      <p className="event-eyebrow"><span className="event-sparkle" aria-hidden="true">✦</span> REGGAEPHORIA TANGSEL</p>
      <h1>{eventName}</h1>
      <div className="reggae-rule" aria-hidden="true"><span/><span/><span/></div>
    </header>

    <div className="event-meta-row">
      <div className="event-info-item">
        <div className="event-icon-holder"><EventIcon type="date"/></div>
        <div className="min-w-0"><p className="event-info-label">Tanggal & waktu</p><p className="event-info-value">{formattedDate}</p><span className="event-info-hint">Waktu Indonesia Barat · WIB</span></div>
      </div>
      <div className="event-info-item">
        <div className="event-icon-holder"><EventIcon type="location"/></div>
        <div className="min-w-0"><p className="event-info-label">Lokasi acara</p><p className="event-info-value">{location}</p></div>
      </div>
    </div>

    {intro && <section className="event-description-section">
      <div className="event-section-heading"><span className="event-heading-dot" aria-hidden="true">♫</span><h2>Tentang acara</h2></div>
      <p>{intro}</p>
    </section>}

    {artists.length > 0 && <section className="event-lineup-section">
      <div className="event-section-heading"><span className="event-icon-holder event-lineup-icon"><EventIcon type="lineup"/></span><h2>Line-up</h2></div>
      <ul className="event-artist-list">{artists.map((artist, index) => <li key={`${artist}-${index}`} style={{ animationDelay: `${index * 70}ms` }}><span aria-hidden="true">✦</span>{artist}</li>)}</ul>
    </section>}
  </article>;
}

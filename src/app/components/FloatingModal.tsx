'use client';

import { useId, useState, type ReactNode } from 'react';

export default function FloatingModal({ triggerLabel, title, children }: { triggerLabel: string; title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return <>
    <button type="button" onClick={() => setOpen(true)}>{triggerLabel}</button>
    <div className="floating-modal-backdrop" hidden={!open}>
      <section className="floating-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="floating-modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="floating-modal-close" aria-label="Tutup modal" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className="floating-modal-content">{children}</div>
      </section>
    </div>
  </>;
}

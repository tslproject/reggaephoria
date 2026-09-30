'use client';

import { useEffect, useState } from 'react';

export default function BannerSlideshow({ banners, eventName }: { banners: string[]; eventName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (!banners.length) return null;

  const show = (index: number) => setActiveIndex((index + banners.length) % banners.length);

  return <section aria-label={`${eventName} banner`} className="relative h-56 overflow-hidden rounded-lg border-2 border-black shadow-[6px_6px_0_#39b765] sm:h-80 lg:h-96">
    <img key={banners[activeIndex]} src={banners[activeIndex]} alt={`${eventName} — gambar ${activeIndex + 1}`} className="h-full w-full object-cover transition-opacity duration-500"/>
    {banners.length > 1 && <>
      <button type="button" onClick={() => show(activeIndex - 1)} aria-label="Banner sebelumnya" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-black/60 px-3 py-2 text-xl text-white backdrop-blur hover:bg-black/80">‹</button>
      <button type="button" onClick={() => show(activeIndex + 1)} aria-label="Banner berikutnya" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-black/60 px-3 py-2 text-xl text-white backdrop-blur hover:bg-black/80">›</button>
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2" aria-label="Pilih banner">
        {banners.map((banner, index) => <button key={`${banner}-${index}`} type="button" onClick={() => show(index)} aria-label={`Tampilkan banner ${index + 1}`} aria-current={index === activeIndex} className={`h-2.5 w-2.5 rounded-full border border-white ${index === activeIndex ? 'bg-[#d8ff45]' : 'bg-black/50'}`}/>)}
      </div>
    </>}
  </section>;
}

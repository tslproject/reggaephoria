'use client';

import { createEventAction } from '@/src/app/actions';
import ActionForm from '@/src/app/components/ActionForm';
import FloatingModal from '@/src/app/components/FloatingModal';

export default function EventCreateModal() {
  return <FloatingModal triggerLabel="+ Tambah event" title="Buat event">
    <ActionForm action={createEventAction} submitLabel="Buat event">
      <label className="grid gap-2 text-sm">Nama event<input name="name" required/></label>
      <label className="grid gap-2 text-sm">Slug URL<input name="slug" placeholder="reggaephoria-tangsel" required/></label>
      <label className="grid gap-2 text-sm">Deskripsi<textarea name="description" rows={4} required/></label>
      <label className="grid gap-2 text-sm">Lokasi<input name="location" required/></label>
      <label className="grid gap-2 text-sm">Tanggal & waktu (WIB)<input name="eventDate" type="datetime-local" required/></label>
      <label className="grid gap-2 text-sm">URL banner (opsional, satu URL per baris)<textarea name="banners" rows={3} placeholder="https://contoh.com/banner-1.jpg&#10;https://contoh.com/banner-2.jpg"/></label>
    </ActionForm>
  </FloatingModal>;
}

import { updateEventAction } from '@/src/app/actions';
import ActionForm from '@/src/app/components/ActionForm';
import FloatingModal from '@/src/app/components/FloatingModal';
import { formatJakartaDateTimeLocal } from '@/src/lib/format';

export default function EventEditor({ event }: { event: { id: string; name: string; description: string; location: string; eventDate: Date; banners: string[] } }) {
  return <div className="mt-4"><FloatingModal triggerLabel="Edit event" title={`Edit ${event.name}`}><ActionForm action={updateEventAction} submitLabel="Simpan perubahan"><input type="hidden" name="id" value={event.id}/><label className="grid gap-2 text-sm">Nama<input name="name" defaultValue={event.name} required/></label><label className="grid gap-2 text-sm">Deskripsi<textarea name="description" defaultValue={event.description} rows={3} required/></label><label className="grid gap-2 text-sm">Lokasi<input name="location" defaultValue={event.location} required/></label><label className="grid gap-2 text-sm">Tanggal & waktu (WIB)<input name="eventDate" type="datetime-local" defaultValue={formatJakartaDateTimeLocal(event.eventDate)} required/></label><label className="grid gap-2 text-sm">URL banner (opsional, satu URL per baris)<textarea name="banners" defaultValue={event.banners.join('\n')} rows={3} placeholder="https://contoh.com/banner-1.jpg&#10;https://contoh.com/banner-2.jpg"/></label></ActionForm></FloatingModal></div>;
}

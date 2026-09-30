export const rupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

const JAKARTA_TIME_ZONE = 'Asia/Jakarta';

export function formatJakartaDateTimeLocal(date: Date) {
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: JAKARTA_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).formatToParts(date);
	const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
	return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function parseJakartaDateTimeLocal(value: string) {
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
	const date = new Date(`${value}:00+07:00`);
	return Number.isNaN(date.getTime()) || formatJakartaDateTimeLocal(date) !== value ? null : date;
}

function validPublicOrigin(value: string | undefined) {
	if (!value) return null;
	try {
		const parsed = new URL(value);
		if (!['https:', 'http:'].includes(parsed.protocol)) return null;
		if (process.env.NODE_ENV === 'production' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) return null;
		return parsed.origin;
	} catch {
		return null;
	}
}

export const appUrl = (requestOrigin?: string) =>
	validPublicOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
	validPublicOrigin(requestOrigin) ??
	(process.env.NODE_ENV === 'production' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
export const waLink = (phone: string, message: string) => `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

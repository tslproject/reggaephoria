export const rupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
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

import { prisma } from '@/src/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await prisma.ticketProduct.findUnique({ where: { id: productId }, select: { imageData: true, imageMimeType: true } });
  if (!product?.imageData || !product.imageMimeType) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(product.imageData), {
    headers: {
      'Content-Type': product.imageMimeType,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

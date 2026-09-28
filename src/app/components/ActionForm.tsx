'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/src/app/actions';

export default function ActionForm({ action, children, submitLabel }: { action: (state: ActionState, form: FormData) => Promise<ActionState>; children: React.ReactNode; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, {});
  return <form action={formAction} className="grid gap-4">{children}{state.error && <p role="alert" className="text-sm text-red-300">{state.error}</p>}{state.success && <p role="status" className="text-sm text-[#d8ff45]">{state.success}</p>}<button disabled={pending}>{pending ? 'Memproses…' : submitLabel}</button></form>;
}

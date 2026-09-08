import { createClient } from '@/lib/supabase/server'
import { validationInput, rpcErrorMessage } from './input'

type RpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown
    error: { code?: string; message?: string } | null
  }>
}

export class CrmMutationError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

/** Always use the session JWT. The database derives the actor and checks the admin role. */
export async function callCrmRpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const client = await createClient()
  const { data, error } = await (client as unknown as RpcClient).rpc(name, args)
  if (error) {
    const status = error.code === '42501' ? 403 : error.code === '40001' ? 409
      : error.code === 'P0002' ? 404 : error.code?.startsWith('22') ? 400 : 503
    throw new CrmMutationError(rpcErrorMessage(error), status)
  }
  if (data == null) throw new CrmMutationError('Aucune confirmation reçue. Actualisez le dossier.', 503)
  return data as T
}

export async function validateCrmRequest(input: unknown) {
  const parsed = validationInput.safeParse(input)
  if (!parsed.success) throw new CrmMutationError(parsed.error.issues[0]?.message || 'Formulaire invalide', 400)
  const { entity, id, action, note } = parsed.data
  return callCrmRpc<{ id: string; admin_validation_status: 'approved' | 'rejected'; event_id: string }>(
    'crm_validate_request', { p_entity: entity, p_id: id, p_action: action, p_note: note || null },
  )
}

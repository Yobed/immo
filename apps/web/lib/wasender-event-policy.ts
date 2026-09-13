/**
 * Assign exactly one Wasender webhook event to each conversation action.
 *
 * `messages.upsert` contains every inbound and outbound message, while
 * `messages.received` is the dedicated inbound event. Processing both for an
 * inbound message races across serverless instances and can send Sapphire's
 * reply twice. We retain upsert only for human messages sent from the official
 * WhatsApp device, which preserves the CRM handover trace.
 */
export function shouldProcessWasenderMessageEvent(
  event: string,
  fromMe: boolean | undefined,
): boolean {
  if (event === 'messages.received') return !fromMe
  if (event === 'messages-group.received') return !fromMe
  if (event === 'messages.upsert') return fromMe === true
  return false
}

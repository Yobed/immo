import assert from 'node:assert/strict'

import { buildOpenRouterAttemptPlan } from '../lib/ai.ts'

const plan = buildOpenRouterAttemptPlan([
  'qwen/qwen3.7-flash',
  'openai/gpt-oss-120b:free',
  'deepseek/deepseek-v4-flash-0731',
  'qwen/qwen3-30b-a3b-instruct-2507',
])

assert.deepEqual(plan, [
  { model: 'qwen/qwen3.7-flash', timeout: 7_000 },
  { model: 'deepseek/deepseek-v4-flash-0731', timeout: 7_000 },
])
assert.ok(
  plan.reduce((total, attempt) => total + attempt.timeout, 0) <= 14_000,
  'OpenRouter must leave time for the WhatsApp reply and database trace',
)

console.log('Sapphire OpenRouter time budget: OK')

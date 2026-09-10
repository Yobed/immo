import assert from 'node:assert/strict'

const {
  getOpenRouterModels,
  getOpenRouterTimeoutMs,
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_OPENROUTER_TIMEOUT_MS,
} = await import(
  '../lib/extractors/whatsapp-bien-extractor.ts'
)

assert.equal(DEFAULT_OPENROUTER_MODELS[0], 'qwen/qwen3.7-flash')
assert.ok(DEFAULT_OPENROUTER_MODELS.includes('deepseek/deepseek-v4-flash-0731'))

const original = process.env.OPENROUTER_EXTRACTOR_MODELS
process.env.OPENROUTER_EXTRACTOR_MODELS = ' qwen/qwen3.7-flash, deepseek/deepseek-v4-flash-0731, qwen/qwen3.7-flash '
assert.deepEqual(getOpenRouterModels(), [
  'qwen/qwen3.7-flash',
  'deepseek/deepseek-v4-flash-0731',
])

process.env.OPENROUTER_EXTRACTOR_MODELS = ' , , '
assert.deepEqual(getOpenRouterModels(), DEFAULT_OPENROUTER_MODELS)

process.env.OPENROUTER_EXTRACTOR_TIMEOUT_MS = '2500'
assert.equal(getOpenRouterTimeoutMs(), 2500)
process.env.OPENROUTER_EXTRACTOR_TIMEOUT_MS = 'not-a-number'
assert.equal(getOpenRouterTimeoutMs(), DEFAULT_OPENROUTER_TIMEOUT_MS)

if (original === undefined) delete process.env.OPENROUTER_EXTRACTOR_MODELS
else process.env.OPENROUTER_EXTRACTOR_MODELS = original
delete process.env.OPENROUTER_EXTRACTOR_TIMEOUT_MS

console.log('OpenRouter model chain tests passed')

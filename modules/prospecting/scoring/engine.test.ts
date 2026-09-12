import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateScore } from './engine.ts'
import { classify } from './classification.ts'
import defaults from './default-rules.json'
import type { Rule, ScoringInput } from './types.ts'
const rules = defaults as Rule[]
const input = (extra: Partial<ScoringInput> = {}): ScoringInput => ({
  business: { name: 'Clínica', rating: 4.8, reviews: 482, phone: '+5584999999999' },
  digital: {
    websiteKind: 'website',
    performance: 29,
    seo: 58,
    hasBooking: false,
    hasForm: false,
    hasCTA: true,
    hasWhatsapp: true,
    whatsappOnly: true,
  },
  segment: { priority: 8, booking: true, clientArea: false, highTicket: true },
  aiThreshold: 85,
  ...extra,
})
test('business, site, system and commercial breakdown matches explicit rules', () => {
  const score = calculateScore(input(), rules)
  assert.equal(score.business, 25)
  assert.equal(score.site, 33)
  assert.equal(score.system, 22)
  assert.equal(score.opportunity, 33)
  assert.equal(score.commercial, 13)
  assert.equal(score.final, 71)
  assert.equal(score.classification, 'qualified')
  assert.equal(score.useAI, false)
})
test('uses max(site, system), never adds the two blocks', () => {
  const score = calculateScore(input(), rules)
  assert.equal(
    score.final,
    score.business + Math.max(score.site, score.system) + score.commercial + score.penalties
  )
})
test('all blocks cap and final caps at 100', () => {
  const score = calculateScore(
    input({
      business: { ...input().business, structure: true, commercialStructure: true },
      digital: {
        ...input().digital,
        email: 'a@b.com',
        seo: 1,
        hasViewport: false,
        https: false,
        hasCTA: false,
      },
    }),
    rules
  )
  assert.equal(score.business, 30)
  assert.equal(score.site, 50)
  assert.equal(score.commercial, 20)
  assert.equal(score.final, 100)
  assert.equal(score.useAI, true)
})
test('penalties floor final at zero and missing data is not penalized', () => {
  const score = calculateScore(
    input({
      business: { name: 'X', reviews: 0, rating: 2, franchise: true, lowFit: true },
      digital: {},
      segment: { priority: 2, booking: false, clientArea: false, highTicket: false },
    }),
    rules
  )
  assert.equal(score.penalties, -53)
  assert.equal(score.final, 0)
  const unknown = calculateScore(input({ business: { name: 'X' }, digital: {} }), rules)
  assert.equal(unknown.penalties, 0)
  assert.equal(unknown.site, 0)
  assert.equal(unknown.system, 0)
})
test('no website and social do not inherit unobserved missing website features', () => {
  for (const [kind, expected] of [
    ['none', 35],
    ['social', 30],
  ] as const) {
    const score = calculateScore(input({ digital: { websiteKind: kind } }), rules)
    assert.equal(score.site, expected)
    assert.equal(score.system, 0)
  }
})
test('classification boundaries', () => {
  for (const [n, c] of [
    [0, 'discarded'],
    [39, 'discarded'],
    [40, 'low'],
    [54, 'low'],
    [55, 'opportunity'],
    [69, 'opportunity'],
    [70, 'qualified'],
    [84, 'qualified'],
    [85, 'high'],
    [100, 'high'],
  ] as const)
    assert.equal(classify(n).classification, c)
})
test('AI threshold and eliminators', () => {
  assert.equal(calculateScore(input({ aiThreshold: 71 }), rules).useAI, true)
  assert.equal(calculateScore(input({ aiThreshold: 72 }), rules).useAI, false)
  const closed = calculateScore(
    input({ business: { ...input().business, closed: true }, aiThreshold: 0 }),
    rules
  )
  assert.equal(closed.final, 0)
  assert.equal(closed.useAI, false)
})
test('campaign override wins regardless of row order and can disable a global rule', () => {
  const override = {
    ...rules.find((r) => r.code === 'NO_WEBSITE')!,
    points: 50,
    campaign_id: 'campaign',
  }
  const value = input({ campaignId: 'campaign', digital: { websiteKind: 'none' } })
  assert.equal(calculateScore(value, [override, ...rules]).site, 50)
  assert.equal(calculateScore(value, [...rules, { ...override, enabled: false }]).site, 0)
  assert.equal(calculateScore({ ...value, campaignId: 'other' }, [override, ...rules]).site, 35)
})
test('review and rating tier boundaries', () => {
  for (const [reviews, points] of [
    [4, 0],
    [5, 2],
    [19, 2],
    [20, 4],
    [49, 4],
    [50, 6],
    [99, 6],
    [100, 8],
    [299, 8],
    [300, 10],
  ]) {
    const s = calculateScore(
      input({
        business: { name: 'X', reviews },
        segment: { priority: 0, booking: false, clientArea: false, highTicket: false },
      }),
      rules
    )
    assert.equal(s.business, points)
  }
  for (const [rating, points] of [
    [3.49, 0],
    [3.5, 2],
    [3.99, 2],
    [4, 5],
    [4.49, 5],
    [4.5, 7],
  ]) {
    const s = calculateScore(
      input({
        business: { name: 'X', rating },
        segment: { priority: 0, booking: false, clientArea: false, highTicket: false },
      }),
      rules
    )
    assert.equal(s.business, points)
  }
})
test('system cap and segment-specific booking', () => {
  const digital = {
    ...input().digital,
    hasClientArea: false,
    manualForms: true,
    manualProcesses: true,
    unstructuredCatalog: true,
    integrationNeed: true,
  }
  assert.equal(
    calculateScore(
      input({
        digital,
        business: { ...input().business, multipleLocations: true },
        segment: { ...input().segment, clientArea: true },
      }),
      rules
    ).system,
    50
  )
  assert.equal(
    calculateScore(
      input({
        digital: { websiteKind: 'website', hasBooking: false },
        segment: { ...input().segment, booking: false },
      }),
      rules
    ).system,
    0
  )
})

test('performance and SEO boundaries, unknown metrics and excellent-site penalty', () => {
  for (const [performance, expected] of [
    [0, 12],
    [29, 12],
    [30, 10],
    [49, 10],
    [50, 6],
    [69, 6],
    [70, 3],
    [84, 3],
    [85, 0],
    [100, 0],
  ]) {
    assert.equal(
      calculateScore(input({ digital: { websiteKind: 'website', performance } }), rules).site,
      expected
    )
  }
  for (const [seo, expected] of [
    [0, 7],
    [49, 7],
    [50, 4],
    [69, 4],
    [70, 2],
    [84, 2],
    [85, 0],
    [100, 0],
  ]) {
    assert.equal(
      calculateScore(input({ digital: { websiteKind: 'website', seo } }), rules).site,
      expected
    )
  }
  assert.equal(
    calculateScore(
      input({ digital: { websiteKind: 'website', performance: null, seo: null } }),
      rules
    ).site,
    0
  )
  const excellent = calculateScore(
    input({
      digital: {
        websiteKind: 'website',
        performance: 95,
        seo: 95,
        accessibility: 90,
        bestPractices: 90,
        hasForm: true,
        hasCTA: true,
      },
    }),
    rules
  )
  assert.equal(excellent.penalties, -15)
})

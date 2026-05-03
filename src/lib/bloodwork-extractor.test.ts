import { describe, expect, it } from 'vitest';
import { extractionResponseSchema, parseAndValidate } from './bloodwork-extractor';

describe('extractionResponseSchema', () => {
  it('accepts a well-formed payload', () => {
    const ok = extractionResponseSchema.safeParse({
      markers: [
        { name: 'Vitamin D, 25-Hydroxy', value: 22, unit: 'ng/mL', range_low: 30, range_high: 100 },
        { name: 'Ferritin', value: 80, unit: 'ng/mL' },
      ],
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.markers).toHaveLength(2);
    }
  });

  it('rejects a malformed payload (string value)', () => {
    const bad = extractionResponseSchema.safeParse({
      markers: [{ name: 'Ferritin', value: 'low', unit: 'ng/mL' }],
    });
    expect(bad.success).toBe(false);
  });

  it('rejects a payload missing markers', () => {
    expect(extractionResponseSchema.safeParse({}).success).toBe(false);
    expect(extractionResponseSchema.safeParse({ markers: 'not-an-array' }).success).toBe(false);
  });
});

describe('parseAndValidate', () => {
  it('extracts markers from raw JSON output', () => {
    const raw = JSON.stringify({
      markers: [{ name: 'B12', value: 350, unit: 'pg/mL' }],
    });
    expect(parseAndValidate(raw)).toEqual([
      { name: 'B12', value: 350, unit: 'pg/mL' },
    ]);
  });

  it('salvages valid entries when the array contains junk', () => {
    const raw = JSON.stringify({
      markers: [
        { name: 'Good', value: 1, unit: 'mg' },
        { name: 'Bad', value: 'not-a-number', unit: 'mg' },
      ],
    });
    const result = parseAndValidate(raw);
    expect(result).toEqual([{ name: 'Good', value: 1, unit: 'mg' }]);
  });

  it('returns an empty array on completely unparseable output', () => {
    expect(parseAndValidate('not json at all')).toEqual([]);
  });

  it('strips prose around a JSON blob', () => {
    const raw = `Here are the markers:\n${JSON.stringify({
      markers: [{ name: 'Ferritin', value: 22, unit: 'ng/mL' }],
    })}\nThanks!`;
    expect(parseAndValidate(raw)).toEqual([
      { name: 'Ferritin', value: 22, unit: 'ng/mL' },
    ]);
  });
});

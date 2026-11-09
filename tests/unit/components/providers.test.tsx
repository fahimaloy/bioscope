// @vitest-environment jsdom
//
// Task 1.1 — provider barrel manifest.
//
// Pins the barrel surface declared in `src/components/providers/index.ts`
// against the barrel's actual runtime namespace, per docs/DESIGN_CONTRACT.md
// §8 (barrel manifest constants). `tests/unit/components/primitives.test.tsx`
// pins `UI_PRIMITIVE_EXPORTS`; this suite is its counterpart for the provider
// barrel so the manifest cannot drift silently.
//
// Type-only exports are absent by design: `ProviderExport` is erased at
// compile time and never appears as a runtime key on the namespace.

import { describe, expect, it } from 'vitest';

describe('providers barrel', () => {
  it('exports exactly the documented provider surface', async () => {
    const barrel = await import('@/components/providers');
    const { PROVIDER_EXPORTS } = barrel;

    expect(Array.isArray(PROVIDER_EXPORTS)).toBe(true);
    // Order-insensitive: the manifest records declaration order, but the
    // contract is the *set* of exported names.
    expect(Object.keys(barrel).sort()).toEqual([...PROVIDER_EXPORTS].sort());
  });

  it('does not list type-only exports as runtime values', async () => {
    const barrel = await import('@/components/providers');
    const { PROVIDER_EXPORTS } = barrel;

    expect(PROVIDER_EXPORTS).not.toContain('ProviderExport');
    expect(barrel).not.toHaveProperty('ProviderExport');
  });
});

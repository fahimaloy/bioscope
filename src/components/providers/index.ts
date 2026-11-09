/**
 * The public surface of `@/components/providers`, in declaration order.
 *
 * The barrel is imported by `src/app/layout.tsx`, so its export names are
 * load-bearing: renaming or dropping one is a breaking change no single
 * consumer can see. The list pins that surface so it cannot drift silently.
 *
 * Only runtime values belong here. Type-only exports such as `ProviderExport`
 * are deliberately excluded: they are erased at compile time and therefore
 * have no key on the barrel's runtime namespace.
 */
export const PROVIDER_EXPORTS = [
  'PROVIDER_EXPORTS',
  'QueryProvider',
  'SocketProvider',
  'SocketEventProvider',
  'AuthProvider',
  'AuthInitializer',
  'Providers',
] as const

export type ProviderExport = (typeof PROVIDER_EXPORTS)[number]

export { QueryProvider } from './QueryProvider'
export { SocketProvider, SocketEventProvider } from './SocketProvider'
export { AuthProvider, AuthInitializer } from './AuthProvider'
export { Providers } from './Providers'

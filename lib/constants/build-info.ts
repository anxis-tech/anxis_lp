/**
 * Build information for deploy verification.
 * NEXT_PUBLIC_COMMIT_HASH is injected at build time via the build:prod script.
 */
export const BUILD_COMMIT_HASH = process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev'
export const BUILD_TIMESTAMP = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || new Date().toISOString()

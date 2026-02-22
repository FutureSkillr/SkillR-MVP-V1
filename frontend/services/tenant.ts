/**
 * Resolve the partner brand slug from the current hostname or query params.
 *
 * Production: extract slug from `{slug}.maindset.academy`
 * Dev: `?sponsor=slug` query param on localhost
 */
export function resolveTenantSlug(): string | null {
  // Dev override via query param
  const params = new URLSearchParams(window.location.search);
  const sponsorParam = params.get('sponsor');
  if (sponsorParam) return sponsorParam;

  // Production: extract from subdomain
  const hostname = window.location.hostname;
  const match = hostname.match(/^([a-z0-9-]+)\.maindset\.academy$/);
  if (match && match[1] !== 'www') {
    return match[1];
  }

  return null;
}

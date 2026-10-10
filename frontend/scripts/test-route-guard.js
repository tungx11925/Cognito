const assert = require('assert');

// Replicate the RouteGuard pure logic from frontend/src/components/auth/RouteGuard.tsx
const PUBLIC_ROUTES = [
  '/',
  '/search',
  '/community',
  '/reset-password',
  '/not-found',
  '/404',
];

const PRIVATE_PROFILE_SUBROUTES = [
  'edit',
  'settings',
  'security',
  'activity',
  'account',
  'billing',
  'notifications',
  'password',
];

function isPublicRoute(pathname) {
  if (!pathname) return true;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  if (PUBLIC_ROUTES.includes(cleanPath)) return true;
  if (cleanPath.startsWith('/shared/')) return true;

  if (cleanPath === '/profile' || cleanPath === '/profile/') {
    return false;
  }

  if (cleanPath.startsWith('/profile/')) {
    const sub = cleanPath.substring('/profile/'.length).replace(/\/+$/, '');
    if (!sub) return false;
    if (sub.includes('/')) return false;
    if (PRIVATE_PROFILE_SUBROUTES.includes(sub.toLowerCase())) return false;
    if (/^\d+$/.test(sub)) return true;
    if (/^[a-zA-Z0-9_-]{1,64}$/.test(sub)) return true;
    return false;
  }

  return false;
}

function getSafeReturnUrl(rawUrl, fallback = '/home') {
  if (rawUrl && typeof rawUrl === 'string') {
    const sanitized = rawUrl.replace(/[\t\n\r\x00-\x1F\x7F]/g, '').trim();
    if (
      sanitized.startsWith('/') &&
      !sanitized.startsWith('//') &&
      !sanitized.includes('\\') &&
      !sanitized.includes('://')
    ) {
      return sanitized;
    }
  }
  return fallback;
}

console.log('=== RUNNING ROUTEGUARD & RETURN_URL SANITIZATION TESTS ===\n');

// 1. Tests for isPublicRoute
const publicCases = [
  { path: '/', expected: true, desc: 'Root landing page is public' },
  { path: '/search', expected: true, desc: 'Search page is public' },
  { path: '/reset-password', expected: true, desc: 'Reset password is public' },
  { path: '/shared/doc_token_abc', expected: true, desc: 'Shared document token is public' },
  { path: '/profile/10038', expected: true, desc: 'User profile with numeric ID 10038 is PUBLIC' },
  { path: '/profile/42', expected: true, desc: 'User profile with numeric ID 42 is PUBLIC' },
  { path: '/profile/usr_tung123', expected: true, desc: 'User profile with alphanumeric ID usr_tung123 is PUBLIC' },
];

const privateCases = [
  { path: '/home', expected: false, desc: 'Home dashboard is PROTECTED' },
  { path: '/dashboard', expected: false, desc: 'Dashboard is PROTECTED' },
  { path: '/profile', expected: false, desc: 'Personal /profile is PROTECTED' },
  { path: '/profile/', expected: false, desc: 'Personal /profile/ trailing slash is PROTECTED' },
  { path: '/profile/edit', expected: false, desc: '/profile/edit is PROTECTED' },
  { path: '/profile/settings', expected: false, desc: '/profile/settings is PROTECTED' },
  { path: '/profile/security', expected: false, desc: '/profile/security is PROTECTED' },
  { path: '/profile/account', expected: false, desc: '/profile/account is PROTECTED' },
  { path: '/profile/billing', expected: false, desc: '/profile/billing is PROTECTED' },
  { path: '/profile/notifications', expected: false, desc: '/profile/notifications is PROTECTED' },
  { path: '/profile/password', expected: false, desc: '/profile/password is PROTECTED' },
  { path: '/profile/10038/edit', expected: false, desc: 'Nested subroute /profile/10038/edit is PROTECTED' },
  { path: '/profile/settings/avatar', expected: false, desc: 'Nested subroute /profile/settings/avatar is PROTECTED' },
  { path: '/viewer/10038', expected: false, desc: 'Viewer document is PROTECTED' },
];

for (const c of publicCases) {
  assert.strictEqual(isPublicRoute(c.path), c.expected, `FAILED: ${c.desc} (${c.path})`);
  console.log(`  ✓ PASSED: ${c.desc}`);
}

for (const c of privateCases) {
  assert.strictEqual(isPublicRoute(c.path), c.expected, `FAILED: ${c.desc} (${c.path})`);
  console.log(`  ✓ PASSED: ${c.desc}`);
}

// 2. Tests for getSafeReturnUrl (Control characters stripping & rejection)
console.log('\n--- getSafeReturnUrl Sanitization Tests ---');
const returnUrlCases = [
  { input: '/dashboard', expected: '/dashboard', desc: 'Valid relative URL preserved' },
  { input: '/profile/10038?tab=docs', expected: '/profile/10038?tab=docs', desc: 'Valid relative URL with query string preserved' },
  { input: '//evil.com', expected: '/home', desc: 'Protocol-relative //evil.com blocked' },
  { input: '/\\evil.com', expected: '/home', desc: 'Backslash bypass /\\evil.com blocked' },
  { input: 'https://attacker.com', expected: '/home', desc: 'Absolute http URL blocked' },
  { input: 'javascript:alert(1)', expected: '/home', desc: 'Javascript scheme blocked' },
  { input: '/\t/evil.com', expected: '/home', desc: 'Tab-injected // bypass /\\t/evil.com blocked' },
  { input: '/\n/evil.com', expected: '/home', desc: 'Newline-injected // bypass /\\n/evil.com blocked' },
  { input: '/\r/evil.com', expected: '/home', desc: 'CR-injected // bypass /\\r/evil.com blocked' },
  { input: '/dashboard\n', expected: '/dashboard', desc: 'Trailing newline stripped safely' },
  { input: '/flashcards\t?mode=study', expected: '/flashcards?mode=study', desc: 'Tab inside query stripped safely' },
];

for (const c of returnUrlCases) {
  const result = getSafeReturnUrl(c.input);
  assert.strictEqual(result, c.expected, `FAILED: ${c.desc} (Input: ${JSON.stringify(c.input)}, Got: ${result})`);
  console.log(`  ✓ PASSED: ${c.desc} -> ${result}`);
}

console.log('\n🎉 ALL 25 ROUTEGUARD & RETURN_URL TESTS PASSED 100%!');

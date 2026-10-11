import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

// NEXT_PUBLIC_* values are inlined at build time; a build without them ships a site that crashes on load.
if (process.env.NODE_ENV === 'production') {
  const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing build environment variables: ${missing.join(', ')}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@parohia/shared'],
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;

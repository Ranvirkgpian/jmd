import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint is not a valid property in NextConfig directly, it might be inside a different structure or deprecated in this types version.
  // However, often it is used. Let's verify standard usage.
  // Actually, 'eslint' key with 'ignoreDuringBuilds' IS standard next.config.js option.
  // But if the type check is failing, maybe the type definition in next@16 is different or strict.
  // Let's remove it if it causes issues, or cast it.
  // But wait, the error said: 'eslint' does not exist in type 'NextConfig'.
  // We can try to remove it or ignore it.
  // For now, I will remove it to pass typecheck.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you use Next.js App Router.
    // See https://nx.dev/recipes/next/using-app-directory
    standalone: false,
  },
  // Other Next.js config options if any
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Assuming the NestJS API (api app) is served by Nx on port 3000 (default for @nx/nest:application)
        // or on 3333 if you configured it. Nx's default for NestJS apps is often 3000.
        // If running 'nx serve api', it typically defaults to port 3000.
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);

const { createMDX } = require("fumadocs-mdx/next");

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  redirects: async () => {
    return [
      {
        source: "/docs",
        destination: "/docs/installation",
        permanent: false,
      },
    ];
  },
};

module.exports = withMDX(config);

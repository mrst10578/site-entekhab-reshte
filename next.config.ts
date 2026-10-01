import type { NextConfig } from "next";

const isPages = process.env.GITHUB_ACTIONS === "true";
const repoName = "site-entekhab-reshte";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isPages ? `/${repoName}` : "",
  assetPrefix: isPages ? `/${repoName}/` : undefined,
};

export default nextConfig;

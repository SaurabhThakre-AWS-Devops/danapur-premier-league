import path from "path";
import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_PAGES === "true";
const repo = "danapur-premier-league";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs", "nodemailer"],
  allowedDevOrigins: ["127.0.0.1", "localhost", "*.trycloudflare.com"],
  turbopack: { root: path.join(__dirname) },
  ...(githubPages
    ? {
        output: "export",
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;

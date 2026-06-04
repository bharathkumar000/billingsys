import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdfkit", "sqlite3"],
};

export default nextConfig;

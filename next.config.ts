import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships its own WebAssembly files, so it has to be loaded from node_modules rather than bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;

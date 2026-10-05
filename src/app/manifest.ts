import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TSL",
    short_name: "TSL",
    description: "Watches, cars and property saved from any site, in one list.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfcfa",
    theme_color: "#1f6f55",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
    // Lets Android put TSL in the Share menu. iPhone doesn't support this; it gets a Shortcut instead.
    share_target: { action: "/add", method: "GET", params: { url: "url", text: "text", title: "title" } },
  } as MetadataRoute.Manifest;
}

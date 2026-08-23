import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tijvorya",
    short_name: "Tijvorya",
    description: "Multilingual social commerce with shoppable reels.",
    start_url: "/ar",
    display: "standalone",
    background_color: "#f7f8fa",
    theme_color: "#1769e0",
    orientation: "portrait-primary",
    icons: [
      { src: "/assets/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/assets/favicon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

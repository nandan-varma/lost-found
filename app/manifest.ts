import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lost and Found",
    short_name: "Lost+Found",
    description:
      "A simple way for organizations to track lost and found items.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
  };
}

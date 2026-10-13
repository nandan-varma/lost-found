import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#ffffff",
    description:
      "A simple way for organizations to track lost and found items.",
    display: "standalone",
    name: "Lost and Found",
    short_name: "Lost+Found",
    start_url: "/",
    theme_color: "#111827",
  };
}

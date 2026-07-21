import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/order/", "/booking/"],
      },
    ],
    sitemap: "https://lucyevans.com/sitemap.xml",
  };
}

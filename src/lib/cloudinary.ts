import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export function getWatermarkedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      {
        overlay: { font_family: "Arial", font_size: 24, text: "© Lucy Evans" },
        color: "white",
        opacity: 60,
        gravity: "south_east",
        x: 20,
        y: 20,
      },
    ],
    secure: true,
  });
}

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

type WatermarkOpts = {
  text?: string;
  opacity?: number;
  gravity?: string;
  fontSize?: number;
};

export function getWatermarkedUrl(publicId: string, opts: WatermarkOpts = {}): string {
  const {
    text = "© Lucy Evans",
    opacity = 60,
    gravity = "south_east",
    fontSize = 24,
  } = opts;

  return cloudinary.url(publicId, {
    transformation: [
      { quality: "auto", fetch_format: "auto" },
      {
        overlay: { font_family: "Arial", font_size: fontSize, text },
        color: "white",
        opacity,
        gravity,
        x: 20,
        y: 20,
      },
    ],
    secure: true,
  });
}

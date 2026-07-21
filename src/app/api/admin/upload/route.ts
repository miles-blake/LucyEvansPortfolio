import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise<NextResponse>((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "lucy-evans/photos",
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err || !result) {
          resolve(NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 }));
          return;
        }
        resolve(
          NextResponse.json({
            publicId: result.public_id,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
          })
        );
      }
    );
    stream.end(buffer);
  });
}

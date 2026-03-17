import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/server/cloudinary";
import { auth } from "@/server/auth";

const ALLOWED = {
  image: {
    mimes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSize: 4 * 1024 * 1024, // 4MB
  },
  raw: {
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 8 * 1024 * 1024, // 8MB
  },
  invoice: {
    mimes: ["application/pdf", "image/jpeg", "image/png"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
} as const;

type UploadType = keyof typeof ALLOWED;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const uploadType = (formData.get("type") as UploadType) || "image";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const config = ALLOWED[uploadType];
  if (!config) {
    return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
  }

  if (!(config.mimes as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  if (file.size > config.maxSize) {
    return NextResponse.json(
      { error: `File too large. Max: ${config.maxSize / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: uploadType === "raw" ? "raw" : uploadType === "invoice" ? "auto" : "image",
            folder: `temiqo/${session.user!.id}`,
          },
          (error, result) => {
            if (error || !result) reject(error || new Error("Upload failed"));
            else resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(buffer);
      }
    );

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

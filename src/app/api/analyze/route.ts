import { NextRequest, NextResponse } from "next/server";
import { analyzeScreenshot } from "@/lib/analyzer";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ success: false, error: "Missing imageBase64" }, { status: 400 });
    }

    if (!mimeType || !["image/jpeg","image/png","image/webp","image/gif"].includes(mimeType)) {
      return NextResponse.json({ success: false, error: "Invalid mimeType" }, { status: 400 });
    }

    const result = await analyzeScreenshot(imageBase64, mimeType);
    return NextResponse.json({ success: true, result });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[StyleScan]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

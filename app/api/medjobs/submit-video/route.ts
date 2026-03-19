import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isValidVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "youtu.be" ||
      host === "loom.com" ||
      host === "www.loom.com"
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, videoUrl } = await req.json();

    if (!slug?.trim()) {
      return NextResponse.json({ error: "Profile slug is required" }, { status: 400 });
    }
    if (!videoUrl?.trim()) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }
    if (!isValidVideoUrl(videoUrl.trim())) {
      return NextResponse.json({ error: "Please provide a valid YouTube or Loom URL" }, { status: 400 });
    }

    // Find profile by slug
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("business_profiles")
      .select("id, metadata")
      .eq("slug", slug.trim())
      .eq("type", "student")
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Update metadata with video URL and activate profile
    const updatedMetadata = {
      ...(profile.metadata as Record<string, unknown>),
      video_intro_url: videoUrl.trim(),
    };

    const { error: updateError } = await supabaseAdmin
      .from("business_profiles")
      .update({
        metadata: updatedMetadata,
        is_active: true,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("[medjobs/submit-video] update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[medjobs/submit-video] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

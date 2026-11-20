import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const storageKey = url.searchParams.get("key");

    if (!storageKey) {
      return new Response("Missing image key", {
        status: 400,
      });
    }

    // Prevent path traversal
    const safeKey = path.basename(storageKey);

    // EmDash local uploads directory
    const imagePath = path.join(
      process.cwd(),
      "uploads",
      safeKey
    );

    const imageBuffer = await fs.readFile(imagePath);

    const extension = path.extname(safeKey).toLowerCase();

    const contentType =
      extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".webp"
        ? "image/webp"
        : extension === ".gif"
        ? "image/gif"
        : "image/png";

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Product image proxy error:", error);

    return new Response("Image not found", {
      status: 404,
    });
  }
};
import type { APIRoute } from "astro";
import { getDb } from "emdash/runtime";

const allowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
];

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get("Origin");

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const db = await getDb();

    // TypeScript workaround for EmDash custom table typing
    const queryDb: any = db;

    const products = await queryDb
      .selectFrom("ec_products")
      .select([
        "id",
        "slug",
        "status",
        "product_name",
        "product_image",
        "product_description",
        "published_at",
      ])
      .where("status", "=", "published")
      .where("deleted_at", "is", null)
      .orderBy("published_at", "desc")
      .execute();

    return new Response(
      JSON.stringify({
        success: true,
        count: products.length,
        products,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Failed to fetch EmDash products:", error);

    return new Response(
      JSON.stringify({
        success: false,
        count: 0,
        products: [],
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while fetching products.",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
};
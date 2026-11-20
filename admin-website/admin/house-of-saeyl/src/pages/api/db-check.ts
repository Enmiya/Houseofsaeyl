
import type { APIRoute } from "astro";
import { getDb } from "emdash/runtime";

export const GET: APIRoute = async () => {
  try {
    const db: any = await getDb();

    const result = await db
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
      .where("deleted_at", "is", null)
      .execute();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Products fetched successfully",
        count: result.length,
        products: result,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Product query failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

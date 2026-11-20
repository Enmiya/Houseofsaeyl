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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

function jsonResponse(
  data: unknown,
  status: number,
  headers: Record<string, string>
) {
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request.headers.get("Origin")),
  });
};

export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // 1. Check authorization token
    const authorization = request.headers.get("Authorization");

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return jsonResponse(
        {
          success: false,
          message: "Authentication required.",
        },
        401,
        corsHeaders
      );
    }

    const userToken = authorization.replace("Bearer ", "");

    // 2. Verify Supabase user
    const supabaseUrl = import.meta.env.SUPABASE_URL;
    const supabaseKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY;
    const adminEmail = import.meta.env.ADMIN_EMAIL;

    if (!supabaseUrl || !supabaseKey || !adminEmail) {
      throw new Error("Supabase configuration is missing.");
    }

    const userResponse = await fetch(
      `${supabaseUrl}/auth/v1/user`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    if (!userResponse.ok) {
      return jsonResponse(
        {
          success: false,
          message: "Invalid login session.",
        },
        401,
        corsHeaders
      );
    }

    const user = await userResponse.json();

    // 3. Only admin can add products
    if (user.email?.toLowerCase() !== adminEmail.toLowerCase()) {
      return jsonResponse(
        {
          success: false,
          message: "You are not authorized to add products.",
        },
        403,
        corsHeaders
      );
    }

    // 4. Get form data
    const formData = await request.formData();

    const productName = String(
      formData.get("product_name") || ""
    ).trim();

    const productDescription = String(
      formData.get("product_description") || ""
    ).trim();

    const imageFile = formData.get("product_image");

    if (!productName) {
      return jsonResponse(
        {
          success: false,
          message: "Product name is required.",
        },
        400,
        corsHeaders
      );
    }

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return jsonResponse(
        {
          success: false,
          message: "Please select a product image.",
        },
        400,
        corsHeaders
      );
    }

    // 5. Upload image to EmDash
    const emdashToken = import.meta.env.EMDASH_API_TOKEN;

    if (!emdashToken) {
      throw new Error("EmDash API token is missing.");
    }

    const mediaFormData = new FormData();

    mediaFormData.append("file", imageFile);
    mediaFormData.append("alt", productName);

    const mediaResponse = await fetch(
      "http://localhost:4321/_emdash/api/media",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${emdashToken}`,
        },
        body: mediaFormData,
      }
    );

    if (!mediaResponse.ok) {
      const mediaError = await mediaResponse.text();

      console.error("Media upload error:", mediaError);

      throw new Error("Product image upload failed.");
    }

    const uploadedMedia = await mediaResponse.json();

    console.log("Image uploaded successfully:", uploadedMedia);

    // 6. Save product to database
    const db = (await getDb()) as any;

    const productId = crypto.randomUUID();

    const slug =
      productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const currentDate = new Date().toISOString();

    await db
      .insertInto("ec_products")
      .values({
        id: productId,
        slug: `${slug}-${Date.now()}`,
        status: "published",
        product_name: productName,
        product_image: JSON.stringify(uploadedMedia),
        product_description: productDescription,
        published_at: currentDate,
        created_at: currentDate,
        updated_at: currentDate,
      })
      .execute();

    // 7. Return success
    return jsonResponse(
      {
        success: true,
        message: "Product added successfully.",
        product: {
          id: productId,
          product_name: productName,
          product_description: productDescription,
          product_image: uploadedMedia,
        },
      },
      201,
      corsHeaders
    );
  } catch (error) {
    console.error("Create product error:", error);

    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create product.",
      },
      500,
      corsHeaders
    );
  }
};
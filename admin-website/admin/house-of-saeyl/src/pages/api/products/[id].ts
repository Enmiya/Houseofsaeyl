import type { APIRoute } from "astro";
import { getDb } from "emdash/runtime";
const SUPABASE_URL =
  "https://bgionjnhlojtfhxgqoli.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ALuSSllmkIJbMJkPqBcs-A_6hTI-dZh";

const ADMIN_EMAIL =
  "thehouseofsaeyl@gmail.com";
export const prerender = false;

const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
];

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "PUT, DELETE, OPTIONS",
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
  origin: string | null
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

async function verifyAdmin(request: Request) {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const token = authorization.substring(7);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const user = await response.json();

    return (
      user.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
    );
  } catch {
    return false;
  }
}

export const OPTIONS: APIRoute = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(
      request.headers.get("Origin")
    ),
  });
};

/* UPDATE PRODUCT */

export const PUT: APIRoute = async ({
  request,
  params,
}) => {
  const origin = request.headers.get("Origin");

  try {
    // 1. Admin authentication
    const authorized = await verifyAdmin(request);

    if (!authorized) {
      return jsonResponse(
        {
          success: false,
          message: "Unauthorized access.",
        },
        401,
        origin
      );
    }

    // 2. Product ID validation
    const id = params.id;

    if (!id) {
      return jsonResponse(
        {
          success: false,
          message: "Product ID is required.",
        },
        400,
        origin
      );
    }

    // 3. Receive FormData
    const formData = await request.formData();

    const productName = String(
      formData.get("product_name") || ""
    ).trim();

    const productDescription = String(
      formData.get("product_description") || ""
    ).trim();

    const imageFile = formData.get("product_image");

    // 4. Validation
    if (!productName || !productDescription) {
      return jsonResponse(
        {
          success: false,
          message:
            "Product name and description are required.",
        },
        400,
        origin
      );
    }

    // 5. Prepare database
    const db: any = await getDb();

    // 6. Prepare update data
    const updateData: any = {
      product_name: productName,
      product_description: productDescription,
      updated_at: new Date().toISOString(),
    };

    // 7. Upload new image only if selected
    if (
      imageFile instanceof File &&
      imageFile.size > 0
    ) {
      const emdashToken =
        import.meta.env.EMDASH_API_TOKEN;

      if (!emdashToken) {
        throw new Error(
          "EmDash API token is missing."
        );
      }

      const mediaFormData = new FormData();

      mediaFormData.append(
        "file",
        imageFile
      );

      mediaFormData.append(
        "alt",
        productName
      );

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
        const mediaError =
          await mediaResponse.text();

        console.error(
          "Media upload error:",
          mediaError
        );

        throw new Error(
          "Product image upload failed."
        );
      }

      const uploadedMedia =
        await mediaResponse.json();

      console.log(
        "Updated image uploaded successfully:",
        uploadedMedia
      );

      // Replace old image with new image
      updateData.product_image =
        JSON.stringify(uploadedMedia);
    }

    // 8. Update product in database
    const result = await db
      .updateTable("ec_products")
      .set(updateData)
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    // 9. Return success
    return jsonResponse(
      {
        success: true,
        message: "Product updated successfully.",
      },
      200,
      origin
    );

  } catch (error) {
    console.error(
      "Product update failed:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update product.",
      },
      500,
      origin
    );
  }
};

/* DELETE PRODUCT */

export const DELETE: APIRoute = async ({
  request,
  params,
}) => {
  const origin = request.headers.get("Origin");

  try {
    const authorized = await verifyAdmin(request);

    if (!authorized) {
      return jsonResponse(
        {
          success: false,
          message: "Unauthorized access.",
        },
        401,
        origin
      );
    }

    const id = params.id;

    if (!id) {
      return jsonResponse(
        {
          success: false,
          message: "Product ID is required.",
        },
        400,
        origin
      );
    }

    const db: any = await getDb();

    await db
      .updateTable("ec_products")
      .set({
        deleted_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .execute();

    return jsonResponse(
      {
        success: true,
        message: "Product deleted successfully.",
      },
      200,
      origin
    );
  } catch (error) {
    console.error("Product delete failed:", error);

    return jsonResponse(
      {
        success: false,
        message: "Failed to delete product.",
      },
      500,
      origin
    );
  }
};
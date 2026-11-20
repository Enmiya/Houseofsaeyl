import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  ADMIN_EMAIL
} from "./supabase-config.js";


/* =========================
   ELEMENTS
========================= */

const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const homePage = document.getElementById("homePage");
const productsPage = document.getElementById("productsPage");
const formPage = document.getElementById("formPage");

const productForm = document.getElementById("productForm");

const productList = document.getElementById("productList");
const homeProductList = document.getElementById("homeProductList");

const emptyState = document.getElementById("emptyState");
const homeEmptyState = document.getElementById("homeEmptyState");

const productCount = document.getElementById("productCount");
const homeProductCount = document.getElementById("homeProductCount");

const homeLoading = document.getElementById("homeLoading");
const productsLoading = document.getElementById("productsLoading");

const homeError = document.getElementById("homeError");
const productsError = document.getElementById("productsError");

const breadcrumb = document.getElementById("breadcrumb");

const homeNav = document.getElementById("homeNav");
const productsNav = document.getElementById("productsNav");

const productNameInput = document.getElementById("productName");
const productImageInput = document.getElementById("productImage");
const productDescriptionInput = document.getElementById("productDescription");

const imagePreviewContainer = document.getElementById("imagePreviewContainer");
const imagePreview = document.getElementById("imagePreview");
const removeImageBtn = document.getElementById("removeImageBtn");

const formMessage = document.getElementById("formMessage");


/* =========================
   API CONFIGURATION
========================= */

const API_BASE_URL = "http://localhost:4321";


/* =========================
   SUPABASE
========================= */

const normalizedSupabaseUrl = String(
  SUPABASE_URL ?? ""
).trim();

const normalizedSupabaseKey = String(
  SUPABASE_PUBLISHABLE_KEY ?? ""
).trim();

const normalizedAdminEmail = String(
  ADMIN_EMAIL ?? ""
).trim().toLowerCase();

const configIsReady =
  normalizedSupabaseUrl.startsWith("https://") &&
  normalizedSupabaseKey.startsWith("sb_publishable_") &&
  normalizedAdminEmail.length > 0;

let supabase = null;
let supabaseInitializationError = null;

console.log("Supabase configuration check:", {
  urlLoaded: Boolean(normalizedSupabaseUrl),
  urlValid: normalizedSupabaseUrl.startsWith("https://"),
  publishableKeyLoaded: Boolean(normalizedSupabaseKey),
  publishableKeyValid: normalizedSupabaseKey.startsWith(
    "sb_publishable_"
  ),
  adminEmailLoaded: Boolean(normalizedAdminEmail),
  configIsReady
});

if (configIsReady) {
  try {
    supabase = createClient(
      normalizedSupabaseUrl,
      normalizedSupabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    console.log("Supabase initialized successfully.");

  } catch (error) {
    supabaseInitializationError = error;

    console.error(
      "Supabase initialization failed:",
      error
    );
  }
} else {
  console.error(
    "Supabase configuration is invalid. Check supabase-config.js."
  );
}


/* =========================
   STATE
========================= */

let products = [];

let selectedImage = null;

let editingProductId = null;


/* =========================
   LOGIN
========================= */

function showLogin(message = "") {
  appView.classList.add("hidden");

  loginView.classList.remove("hidden");

  loginError.textContent = message;
}


function showApp() {
  loginView.classList.add("hidden");

  appView.classList.remove("hidden");

  showHome();
}


async function verifyAdminSession() {
  if (!supabase) {
    showLogin("Supabase configuration is missing.");

    return;
  }

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    showLogin();

    return;
  }

  const email =
    (data.session.user.email || "").toLowerCase();

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    await supabase.auth.signOut();

    showLogin("Unauthorized account.");

    return;
  }

  showApp();
}


/* =========================
   LOGIN FORM
========================= */

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabase) {
    showLogin("Supabase configuration is missing.");

    return;
  }

  const email = document
    .getElementById("email")
    .value
    .trim()
    .toLowerCase();

  const password = document
    .getElementById("password")
    .value;

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    showLogin("This email is not authorized.");

    return;
  }

  const button = loginForm.querySelector(
    'button[type="submit"]'
  );

  button.disabled = true;

  button.textContent = "Signing in...";

  loginError.textContent = "";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  button.disabled = false;

  button.textContent = "Sign in";

  if (error) {
    showLogin(error.message);

    return;
  }

  await verifyAdminSession();
});


/* =========================
   AUTH LISTENER
========================= */

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      showLogin();

      return;
    }

    const email =
      (session.user.email || "").toLowerCase();

    if (email !== ADMIN_EMAIL.toLowerCase()) {
      showLogin("Unauthorized account.");

      return;
    }

    showApp();
  });
}


/* =========================
   LOGOUT
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener("click", async () => {

    if (supabase) {
      await supabase.auth.signOut();
    }

    showLogin("You have been signed out.");
  });


/* =========================
   NAVIGATION
========================= */

homeNav.addEventListener("click", showHome);

productsNav.addEventListener("click", showProducts);


function updateNavigation(page) {
  homeNav.classList.toggle(
    "active",
    page === "home"
  );

  productsNav.classList.toggle(
    "active",
    page === "products"
  );
}


function hideAllPages() {
  homePage.classList.add("hidden");

  productsPage.classList.add("hidden");

  formPage.classList.add("hidden");
}


function showHome() {
  hideAllPages();

  homePage.classList.remove("hidden");

  updateNavigation("home");

  breadcrumb.textContent = "Admin / Home";

  loadProducts();
}


function showProducts() {
  hideAllPages();

  productsPage.classList.remove("hidden");

  updateNavigation("products");

  breadcrumb.textContent = "Admin / Products";

  loadProducts();
}


/* =========================
   FETCH PRODUCTS
========================= */

async function loadProducts() {
  homeLoading.classList.remove("hidden");

  productsLoading.classList.remove("hidden");

  homeError.textContent = "";

  productsError.textContent = "";

  homeError.classList.add("hidden");

  productsError.classList.add("hidden");

  homeEmptyState.classList.add("hidden");

  emptyState.classList.add("hidden");

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/products`,
      {
        method: "GET",

        cache: "no-cache"
      }
    );

    if (!response.ok) {
      throw new Error(
        `Server returned ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(
        data.message || "Unable to fetch products."
      );
    }

    products = data.products || [];

    renderHomeProducts();

    renderProducts();

  } catch (error) {
    console.error("Product loading error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load products.";

    homeError.textContent = message;

    productsError.textContent = message;

    homeError.classList.remove("hidden");

    productsError.classList.remove("hidden");

  } finally {
    homeLoading.classList.add("hidden");

    productsLoading.classList.add("hidden");
  }
}


/* =========================
   IMAGE HELPER
========================= */

function getProductImage(product) {
  if (!product.product_image) {
    return "";
  }

  let imageData = product.product_image;

  // Parse JSON string
  if (typeof imageData === "string") {
    try {
      imageData = JSON.parse(imageData);
    } catch {
      if (
        imageData.startsWith("http://") ||
        imageData.startsWith("https://")
      ) {
        return imageData;
      }

      return "";
    }
  }

  if (!imageData || typeof imageData !== "object") {
    return "";
  }

  // Extract EmDash media object
  const media =
    imageData?.data?.item ||
    imageData?.item ||
    imageData?.data ||
    imageData;

  // Get storage key
  const storageKey =
    media?.storageKey ||
    imageData?.storageKey ||
    imageData?.meta?.storageKey;

  // Use our local image proxy instead of direct EmDash media URL
  if (storageKey) {
    return `${API_BASE_URL}/api/product-image?key=${encodeURIComponent(
      storageKey
    )}`;
  }

  // Fallback to media URL
  const imageUrl = media?.url;

  if (imageUrl) {
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `${API_BASE_URL}${imageUrl}`;
  }

  return "";
}


/* =========================
   HOME PRODUCTS
========================= */

function renderHomeProducts() {
  homeProductList.innerHTML = "";

  homeProductCount.textContent =
    `${products.length} product${products.length === 1 ? "" : "s"}`;

  homeEmptyState.classList.toggle(
    "hidden",
    products.length > 0
  );

  products.forEach((product) => {
    const card = document.createElement("div");

    card.className = "home-product-card";


    /* IMAGE */

    const image = document.createElement("img");

    image.className = "home-product-image";

    image.alt =
      product.product_name || "Product";

    const imageUrl = getProductImage(product);

    if (imageUrl) {
      image.src = imageUrl;

    } else {
      image.classList.add("hidden");
    }

    image.onerror = () => {
      image.classList.add("hidden");
    };


    /* DETAILS */

    const details = document.createElement("div");

    details.className = "home-product-details";


    const name = document.createElement("h3");

    name.textContent =
      product.product_name || "Untitled product";


    const description = document.createElement("p");

    description.textContent =
      product.product_description ||
      "No description available.";


    details.append(name, description);

    card.append(image, details);

    homeProductList.append(card);
  });
}


/* =========================
   PRODUCTS LIST
========================= */

function renderProducts() {
  productList.innerHTML = "";

  productCount.textContent =
    `${products.length} product${products.length === 1 ? "" : "s"}`;

  emptyState.classList.toggle(
    "hidden",
    products.length > 0
  );

  products.forEach((product) => {
    const row = document.createElement("div");

    row.className = "product-row";


    /* PRODUCT INFO */

    const info = document.createElement("div");

    info.className = "product-info";


    const image = document.createElement("img");

    image.className = "thumb";

    image.alt =
      product.product_name || "";


    const imageUrl = getProductImage(product);
    console.log("Product:", product.product_name);
    console.log("Image URL:", imageUrl);

    if (imageUrl) {
  image.src = imageUrl;

  image.onload = () => {
    console.log("✅ Product image loaded:", product.product_name);
    console.log("Image dimensions:", image.naturalWidth, image.naturalHeight);
    console.log("Loaded URL:", image.currentSrc);
  };

  image.onerror = () => {
    console.error("❌ Product image failed:", product.product_name);
    console.error("Image URL:", image.src);
    console.error("Image element:", image);
    image.style.visibility = "hidden";
  };

} else {
  console.error("❌ No image URL found:", product.product_name);
  image.style.visibility = "hidden";
}


    const name = document.createElement("span");

    name.className = "product-name";

    name.textContent =
      product.product_name || "Untitled product";


    info.append(image, name);


    /* DESCRIPTION */

    const description = document.createElement("span");

    description.className = "product-description";

    description.textContent =
      product.product_description || "No description";


    /* STATUS */

    const status = document.createElement("span");

    status.className = "status";

    status.textContent =
      product.status || "Published";


    /* ACTIONS */

    const actions = document.createElement("div");

    actions.className = "product-action";


    const editButton = document.createElement("button");

    editButton.className = "edit-btn";

    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      openEditForm(product);
    });


    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-btn";

    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", () => {
      deleteProduct(product);
    });


    actions.append(editButton, deleteButton);

    row.append(info, description, status, actions);

    productList.append(row);
  });
}


/* =========================
   ADD PRODUCT
========================= */

document
  .getElementById("addProductBtn")
  .addEventListener("click", openForm);


document
  .getElementById("backBtn")
  .addEventListener("click", showProducts);


document
  .getElementById("cancelBtn")
  .addEventListener("click", showProducts);


function openForm() {
  productForm.reset();

  selectedImage = null;

  editingProductId = null;

  imagePreview.src = "";

  imagePreviewContainer.classList.add("hidden");

  formMessage.textContent = "";

  document.getElementById("formTitle").textContent =
    "Add product";

  productsPage.classList.add("hidden");

  formPage.classList.remove("hidden");

  breadcrumb.textContent =
    "Admin / Products / Add product";

  updateNavigation("products");
}


/* =========================
   EDIT PRODUCT
========================= */

function openEditForm(product) {
  productForm.reset();

  selectedImage = null;

  editingProductId = product.id;

  productNameInput.value =
    product.product_name || "";

  productDescriptionInput.value =
    product.product_description || "";

  const imageUrl = getProductImage(product);

  if (imageUrl) {
    imagePreview.src = imageUrl;

    imagePreviewContainer.classList.remove("hidden");

  } else {
    imagePreview.src = "";

    imagePreviewContainer.classList.add("hidden");
  }

  formMessage.textContent = "";

  document.getElementById("formTitle").textContent =
    "Edit product";

  productsPage.classList.add("hidden");

  formPage.classList.remove("hidden");

  breadcrumb.textContent =
    "Admin / Products / Edit product";

  updateNavigation("products");
}


/* =========================
   IMAGE PREVIEW
========================= */

productImageInput.addEventListener("change", () => {
  const file = productImageInput.files[0];

  if (!file) {
    selectedImage = null;

    return;
  }

  if (!file.type.startsWith("image/")) {
    formMessage.textContent =
      "Please select a valid image file.";

    productImageInput.value = "";

    selectedImage = null;

    imagePreviewContainer.classList.add("hidden");

    return;
  }

  selectedImage = file;

  const previewUrl = URL.createObjectURL(file);

  imagePreview.src = previewUrl;

  imagePreviewContainer.classList.remove("hidden");

  formMessage.textContent = "";
});


/* =========================
   REMOVE IMAGE
========================= */

removeImageBtn.addEventListener("click", () => {
  productImageInput.value = "";

  selectedImage = null;

  imagePreview.src = "";

  imagePreviewContainer.classList.add("hidden");

  formMessage.textContent = "";
});


/* =========================
   SAVE PRODUCT
========================= */

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = productNameInput.value.trim();

  const description =
    productDescriptionInput.value.trim();


  /* VALIDATION */

  if (!name) {
    formMessage.textContent =
      "Please enter the product name.";

    return;
  }

  if (!description) {
    formMessage.textContent =
      "Please enter the product description.";

    return;
  }

  if (!editingProductId && !productImageInput.files[0]) {
    formMessage.textContent =
      "Please upload a product image.";

    return;
  }


  /* SESSION */

  try {
    const { data } = await supabase.auth.getSession();

    const token = data.session?.access_token;

    if (!token) {
      formMessage.textContent =
        "Your session has expired. Please sign in again.";

      return;
    }


    /* BUTTON */

    const submitButton = productForm.querySelector(
      'button[type="submit"]'
    );

    submitButton.disabled = true;

    submitButton.textContent = "Saving...";


    /* =========================
       CREATE NEW PRODUCT
    ========================= */

    if (!editingProductId) {
      const formData = new FormData();

      formData.append("product_name", name);

      formData.append(
        "product_description",
        description
      );

      formData.append(
        "product_image",
        productImageInput.files[0]
      );


      const response = await fetch(
        `${API_BASE_URL}/api/products/create`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`
          },

          body: formData
        }
      );


      const result = await response.json();


      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to create product."
        );
      }


      formMessage.textContent =
        "Product added successfully!";


      await loadProducts();


      setTimeout(() => {
        showProducts();
      }, 1000);


      return;
    }


    /* =========================
   UPDATE EXISTING PRODUCT
========================= */

const formData = new FormData();

formData.append("product_name", name);

formData.append(
  "product_description",
  description
);

// Add new image only if user selected one
if (productImageInput.files[0]) {
  formData.append(
    "product_image",
    productImageInput.files[0]
  );
}

const response = await fetch(
  `${API_BASE_URL}/api/products/${encodeURIComponent(editingProductId)}`,
  {
    method: "PUT",

    headers: {
      Authorization: `Bearer ${token}`
    },

    body: formData
  }
);

const updateResult = await response.json();

if (!response.ok || !updateResult.success) {
  throw new Error(
    updateResult.message || "Failed to update product."
  );
}

formMessage.textContent =
  "Product updated successfully.";

await loadProducts();

setTimeout(() => {
  showProducts();
}, 700);

    const result = await response.json();


    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to update product."
      );
    }


    formMessage.textContent =
      "Product updated successfully.";


    await loadProducts();


    setTimeout(() => {
      showProducts();
    }, 700);


  } catch (error) {
    console.error("Product save error:", error);

    formMessage.textContent =
      error instanceof Error
        ? error.message
        : "Unable to save product.";

  } finally {
    const submitButton = productForm.querySelector(
      'button[type="submit"]'
    );

    submitButton.disabled = false;

    submitButton.textContent = "Save product";
  }
});


/* =========================
   DELETE PRODUCT
========================= */

async function deleteProduct(product) {
  const confirmed = confirm(
    `Are you sure you want to delete "${product.product_name}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    const { data } = await supabase.auth.getSession();

    const token = data.session?.access_token;

    if (!token) {
      alert(
        "Your session has expired. Please sign in again."
      );

      return;
    }


    const response = await fetch(
      `${API_BASE_URL}/api/products/${encodeURIComponent(product.id)}`,
      {
        method: "DELETE",

        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );


    const result = await response.json();


    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to delete product."
      );
    }


    alert("Product deleted successfully.");

    await loadProducts();


  } catch (error) {
    console.error("Product delete error:", error);

    alert(
      error instanceof Error
        ? error.message
        : "Unable to delete product."
    );
  }
}


/* =========================
   INITIALIZATION
========================= */

verifyAdminSession();
// ===============================
// HOUSE OF SAEYL - WEBSITE
// ===============================

// ===============================
// HEADER SCROLL EFFECT
// ===============================

const header = document.getElementById("siteHeader");

if (header) {
  window.addEventListener(
    "scroll",
    () => {
      header.classList.toggle("scrolled", window.scrollY > 90);
    },
    { passive: true }
  );
}

// ===============================
// MOBILE MENU
// ===============================

const mobileMenu = document.getElementById("mobileMenu");
const menuToggle = document.getElementById("menuToggle");
const menuClose = document.getElementById("menuClose");

if (mobileMenu && menuToggle && menuClose) {
  menuToggle.addEventListener("click", () => {
    mobileMenu.classList.add("open");
  });

  menuClose.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
    });
  });
}

// ===============================
// SCROLL REVEAL
// ===============================

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

// ===============================
// DYNAMIC PRODUCTS
// ===============================

const PRODUCT_API = "http://localhost:4321/api/products";

const productImage = document.getElementById("productImage");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productCounter = document.getElementById("productCounter");
const productWhatsapp = document.getElementById("productWhatsapp");
const productNewBadge = document.getElementById("productNewBadge");
const productStatus = document.getElementById("productStatus");

const previousButton = document.getElementById("previousProduct");
const nextButton = document.getElementById("nextProduct");

let products = [];
let currentProductIndex = 0;

// ===============================
// HIDE PRODUCT IMAGE
// ===============================

function hideProductImage() {
  if (!productImage) return;

  productImage.removeAttribute("src");
  productImage.alt = "";
  productImage.style.display = "none";
}

// ===============================
// SHOW PRODUCT IMAGE
// ===============================

function showProductImage() {
  if (!productImage) return;

  productImage.style.display = "";
}

// ===============================
// IMAGE URL HANDLER
// ===============================

function getProductImageUrl(product) {
  let image = product.product_image;

  if (!image) {
    return null;
  }

  // Parse image JSON string
  if (typeof image === "string") {
    try {
      image = JSON.parse(image);
    } catch (error) {
      if (image.startsWith("http")) {
        return image;
      }

      return null;
    }
  }

  // Extract EmDash media object
  const media =
  image?.data?.item ||
  image?.data?.data?.item ||
  image?.item ||
  image?.data ||
  image;

  // Extract storage key
  const storageKey =
    media?.storageKey ||
    image?.storageKey ||
    media?.meta?.storageKey;

  // IMPORTANT:
  // Use the image proxy instead of direct EmDash media URL
  if (storageKey) {
    const proxyUrl =
      `http://localhost:4321/api/product-image?key=${encodeURIComponent(storageKey)}`;

    console.log("Product image proxy URL:", proxyUrl);

    return proxyUrl;
  }

  // Fallback for external image URLs
  const imageUrl = media?.url;

  if (imageUrl) {
    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return imageUrl;
    }

    return `http://localhost:4321${imageUrl}`;
  }

  console.error(
    "Product image URL not found:",
    product.product_name,
    product
  );

  return null;
} 
// ===============================
// DISPLAY PRODUCT
// ===============================
function createWhatsAppLink(productName) {
  const phoneNumber = "918838612389"; 
  const message = `Hi, I'm interested in ${productName}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

function displayProduct(index) {
  if (!products.length) {
    return;
  }

  currentProductIndex = index;

  const product = products[index];

  // ===============================
  // PRODUCT IMAGE
  // ===============================

  const imageUrl = getProductImageUrl(product);

  console.log("Current product:", product.product_name);
  console.log("Product image URL:", imageUrl);

  if (imageUrl) {
    showProductImage();

    productImage.alt =
      product.product_name || "House of Saeyl product";

    productImage.onerror = function () {
      console.error("Product image failed to load:", imageUrl);

      // Hide broken image instead of showing old image
      hideProductImage();

      this.onerror = null;
    };

    productImage.src = imageUrl;
  } else {
    hideProductImage();
  }

  // ===============================
  // PRODUCT NAME
  // ===============================

  productName.textContent =
    product.product_name || "Untitled Product";

  // ===============================
  // PRODUCT DESCRIPTION
  // ===============================

  productDescription.textContent =
    product.product_description ||
    "Discover this thoughtfully selected object from House of Saeyl.";

  // ===============================
  // PRODUCT COUNTER
  // ===============================

  const currentNumber =
    String(index + 1).padStart(2, "0");

  const totalNumber =
    String(products.length).padStart(2, "0");

  productCounter.innerHTML =
    `${currentNumber} <span>/</span> ${totalNumber}`;

  // ===============================
  // NEW BADGE
  // ===============================

  if (productNewBadge) {
    productNewBadge.hidden =
      currentProductIndex !== products.length - 1;
  }

  // ===============================
  // WHATSAPP
  // ===============================

  productWhatsapp.href = createWhatsAppLink(
    product.product_name || "this product"
  );

  productWhatsapp.style.display = "";

  // ===============================
  // STATUS
  // ===============================

  productStatus.textContent = "";

  // ===============================
  // NAVIGATION
  // ===============================

  previousButton.disabled = index === 0;

  nextButton.disabled =
    index === products.length - 1;
}

// ===============================
// PREVIOUS PRODUCT
// ===============================

previousButton.addEventListener("click", () => {
  if (currentProductIndex > 0) {
    displayProduct(currentProductIndex - 1);
  }
});

// ===============================
// NEXT PRODUCT
// ===============================

nextButton.addEventListener("click", () => {
  if (currentProductIndex < products.length - 1) {
    displayProduct(currentProductIndex + 1);
  }
});

// ===============================
// EMPTY PRODUCT STATE
// ===============================

function showEmptyProducts() {
  products = [];
  currentProductIndex = 0;

  // REMOVE OLD IMAGE
  hideProductImage();

  // PRODUCT NAME
  productName.textContent = "No products available";

  // DESCRIPTION
  productDescription.textContent =
    "New objects will be added soon.";

  // COUNTER
  productCounter.innerHTML =
    "00 <span>/</span> 00";

  // WHATSAPP
  productWhatsapp.style.display = "none";

  // NEW BADGE
  if (productNewBadge) {
    productNewBadge.hidden = true;
  }

  // STATUS
  productStatus.textContent = "";

  // NAVIGATION
  previousButton.disabled = true;
  nextButton.disabled = true;
}

// ===============================
// LOAD PRODUCTS
// ===============================

async function loadProducts() {
  try {
    console.log("Loading products from EmDash...");

    const response = await fetch(PRODUCT_API, {
      method: "GET",
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Product API response:", data);

    if (!data.success || !Array.isArray(data.products)) {
      throw new Error("Invalid product response");
    }

    // ===============================
    // NO PRODUCTS
    // ===============================

    if (data.products.length === 0) {
      console.log("No published products found.");

      showEmptyProducts();

      return;
    }

    // ===============================
    // PRODUCT ORDER
    // ===============================

    /*
      API:
      Newest product first.

      Website:
      Oldest product first.

      NEW badge:
      Latest product only.
    */

    products = [...data.products].reverse();

    console.log("Products loaded:", products);

    // ===============================
    // DISPLAY FIRST PRODUCT
    // ===============================

    displayProduct(0);

  } catch (error) {
    console.error("Unable to load products:", error);

    // ===============================
    // API ERROR STATE
    // ===============================

    hideProductImage();

    productName.textContent =
      "Products temporarily unavailable";

    productDescription.textContent =
      "Please visit again soon to discover our latest objects.";

    productCounter.innerHTML =
      "00 <span>/</span> 00";

    productWhatsapp.style.display = "none";

    if (productNewBadge) {
      productNewBadge.hidden = true;
    }

    productStatus.textContent =
      "Unable to connect to the product service.";

    previousButton.disabled = true;
    nextButton.disabled = true;
  }
}

// ===============================
// START WEBSITE
// ===============================

loadProducts();
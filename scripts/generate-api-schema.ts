/**
 * Generate OpenAPI schema from Zod validators
 * Output: docs/api-schema.json (OpenAPI 3.0.0 format)
 * Run: npm run generate:schema
 */

import fs from "node:fs"
import path from "node:path"
import { createDocument } from "zod-openapi"
import {
  approveUserSchema,
  createUserSchema,
  unapproveUserSchema,
  updateUserPriceMultiplierSchema,
} from "../src/lib/validations/auth"
import { deleteBlobSchema } from "../src/lib/validations/blob"
// Import all schemas
import {
  addToCartSchema,
  batchAddToCartSchema,
  cancelOrderSchema,
  removeFromCartSchema,
  updateCartItemSchema,
  updateOrderItemPriceSchema,
  updateOrderStatusSchema,
} from "../src/lib/validations/checkout"
import {
  createCollectionSchema,
  deleteCollectionSchema,
  toggleCollectionFeaturedSchema,
  updateCollectionSchema,
} from "../src/lib/validations/collection"
import {
  createInspirationSchema,
  deleteInspirationSchema,
  updateInspirationSchema,
} from "../src/lib/validations/inspiration"
import { recordMetricSchema } from "../src/lib/validations/metrics"
import {
  deleteProductSchema,
  toggleProductFeaturedSchema,
  updateProductSchema,
} from "../src/lib/validations/product"
import { searchProductsSchema } from "../src/lib/validations/search"

// Define the OpenAPI spec
const openApiSpec = createDocument({
  openapi: "3.0.0",
  info: {
    title: "Peak Blooms API",
    description: "Server action endpoints documentation for Peak Blooms e-commerce platform",
    version: "1.0.0",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development server",
    },
  ],
  paths: {
    "/api/cart/add": {
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        description: "Add or update a product in the user's shopping cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: addToCartSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Item added to cart successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/cart/update": {
      post: {
        tags: ["Cart"],
        summary: "Update cart item quantity",
        description: "Update the quantity of an item in the cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateCartItemSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Item updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/cart/remove": {
      post: {
        tags: ["Cart"],
        summary: "Remove item from cart",
        description: "Remove a single item from the cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: removeFromCartSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Item removed successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/cart/batch-add": {
      post: {
        tags: ["Cart"],
        summary: "Add multiple items to cart",
        description: "Add multiple products to the cart in a single transaction",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: batchAddToCartSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Items added to cart successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/orders/cancel": {
      post: {
        tags: ["Orders"],
        summary: "Cancel order",
        description: "Cancel a pending order or convert it back to cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: cancelOrderSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Order cancelled successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized",
          },
        },
      },
    },
    "/api/orders/status": {
      post: {
        tags: ["Orders"],
        summary: "Update order status",
        description: "Update order status (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateOrderStatusSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Order status updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/orders/item-price": {
      post: {
        tags: ["Orders"],
        summary: "Update order item price",
        description: "Update the price of an order item (admin only, for market-priced items)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateOrderItemPriceSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Item price updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/products/update": {
      post: {
        tags: ["Products"],
        summary: "Update product",
        description: "Update product details (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateProductSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Product updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/products/delete": {
      post: {
        tags: ["Products"],
        summary: "Delete product",
        description: "Delete a product (admin only, soft delete)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: deleteProductSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Product deleted successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/products/toggle-featured": {
      post: {
        tags: ["Products"],
        summary: "Toggle product featured status",
        description: "Toggle whether a product is featured (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: toggleProductFeaturedSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Product featured status updated",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/products/count": {
      get: {
        tags: ["Products"],
        summary: "Get product count",
        description: "Get the total count of products with optional filters",
        parameters: [
          {
            name: "boxlotOnly",
            in: "query",
            schema: { type: "boolean" },
            description: "Filter to only ROSE type products",
          },
          {
            name: "query",
            in: "query",
            schema: { type: "string", maxLength: 255 },
            description: "Search query for product name or description",
          },
        ],
        responses: {
          200: {
            description: "Product count retrieved successfully",
          },
        },
      },
    },
    "/api/collections/create": {
      post: {
        tags: ["Collections"],
        summary: "Create collection",
        description: "Create a new product collection (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createCollectionSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Collection created successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/collections/update": {
      post: {
        tags: ["Collections"],
        summary: "Update collection",
        description: "Update collection details (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateCollectionSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Collection updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/collections/delete": {
      post: {
        tags: ["Collections"],
        summary: "Delete collection",
        description: "Delete a collection (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: deleteCollectionSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Collection deleted successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/collections/toggle-featured": {
      post: {
        tags: ["Collections"],
        summary: "Toggle collection featured status",
        description: "Toggle whether a collection is featured (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: toggleCollectionFeaturedSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Collection featured status updated",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/inspirations/create": {
      post: {
        tags: ["Inspirations"],
        summary: "Create inspiration",
        description: "Create a new inspiration guide (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createInspirationSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Inspiration created successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/inspirations/update": {
      post: {
        tags: ["Inspirations"],
        summary: "Update inspiration",
        description: "Update inspiration details (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateInspirationSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Inspiration updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/inspirations/delete": {
      post: {
        tags: ["Inspirations"],
        summary: "Delete inspiration",
        description: "Delete an inspiration guide (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: deleteInspirationSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Inspiration deleted successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/admin/users/approve": {
      post: {
        tags: ["Admin"],
        summary: "Approve user",
        description: "Approve a user account (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: approveUserSchema,
            },
          },
        },
        responses: {
          200: {
            description: "User approved successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/admin/users/unapprove": {
      post: {
        tags: ["Admin"],
        summary: "Unapprove user",
        description: "Unapprove or revoke a user account (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: unapproveUserSchema,
            },
          },
        },
        responses: {
          200: {
            description: "User unapproved successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/admin/users/price-multiplier": {
      post: {
        tags: ["Admin"],
        summary: "Update user price multiplier",
        description: "Update a user's price multiplier (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: updateUserPriceMultiplierSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Price multiplier updated successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/admin/users/create": {
      post: {
        tags: ["Admin"],
        summary: "Create user",
        description: "Create a new user account (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: createUserSchema,
            },
          },
        },
        responses: {
          200: {
            description: "User created successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/metrics/record": {
      post: {
        tags: ["Metrics"],
        summary: "Record metric",
        description: "Record a new performance metric (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: recordMetricSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Metric recorded successfully",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
    "/api/search/products": {
      post: {
        tags: ["Search"],
        summary: "Search products",
        description: "Search for products with optional price multiplier applied",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: searchProductsSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Search results retrieved successfully",
          },
          400: {
            description: "Invalid request",
          },
        },
      },
    },
    "/api/blob/delete": {
      post: {
        tags: ["Blob"],
        summary: "Delete blob file",
        description: "Delete a file from Vercel Blob storage (admin only)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: deleteBlobSchema,
            },
          },
        },
        responses: {
          200: {
            description: "Blob deletion result",
          },
          400: {
            description: "Invalid request",
          },
          401: {
            description: "Unauthorized (admin only)",
          },
        },
      },
    },
  },
})

// Write the spec to file
const outputDir = path.join(process.cwd(), "docs")
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const outputPath = path.join(outputDir, "api-schema.json")
fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2))

console.log(`✅ OpenAPI schema generated at: ${outputPath}`)

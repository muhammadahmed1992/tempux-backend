# Listing API Documentation

The Listing API provides comprehensive endpoints for retrieving categories and brands in both top/featured format and alphabetical grouping. This is designed to support category and brand listing pages similar to the Tempus Rex watch category page.

## Overview

The API supports two main types of listings:

1. **Top/Featured Items**: Ordered by priority (order field) with counts
2. **Alphabetical Grouping**: All items grouped by first letter for easy navigation

## Endpoints

### 1. Complete Category Listing

**GET** `/listing/categories`

Get complete category listing with both top categories and alphabetical grouping.

**Query Parameters:**

- `include_product_count` (optional): Include product count for each category (default: true)
- `limit_top_categories` (optional): Maximum number of top categories (default: 8)
- `featured_only` (optional): Show only featured categories with order (default: false)

**Example Request:**

```
GET /listing/categories?include_product_count=true&limit_top_categories=8&featured_only=false
```

**Response:**

```json
{
  "success": true,
  "message": "Category listing retrieved successfully",
  "data": {
    "top_categories": [
      {
        "id": 1,
        "title": "Luxury Watches",
        "image_url": "https://example.com/luxury.png",
        "order": 1,
        "product_count": 150,
        "redirect_url": "/categories/1",
        "featured": true
      },
      {
        "id": 2,
        "title": "Sports Watches",
        "image_url": "https://example.com/sports.png",
        "order": 2,
        "product_count": 89,
        "redirect_url": "/categories/2",
        "featured": true
      }
    ],
    "alphabetical_categories": {
      "A": [
        {
          "id": 15,
          "title": "Adventure Watches",
          "image_url": "https://example.com/adventure.png",
          "order": null,
          "product_count": 23,
          "redirect_url": "/categories/15"
        }
      ],
      "B": [
        {
          "id": 16,
          "title": "Business Watches",
          "image_url": "https://example.com/business.png",
          "order": null,
          "product_count": 45,
          "redirect_url": "/categories/16"
        }
      ]
    },
    "total_categories": 25,
    "total_top_categories": 8
  },
  "statusCode": 200,
  "meta": null
}
```

### 2. Top Categories Only

**GET** `/listing/categories/top`

Get only the top/featured categories.

**Query Parameters:**

- `limit` (optional): Maximum number of categories (default: 8)
- `featured_only` (optional): Show only featured categories (default: false)

**Example Request:**

```
GET /listing/categories/top?limit=6&featured_only=true
```

### 3. Alphabetical Categories Only

**GET** `/listing/categories/alphabetical`

Get all categories grouped alphabetically.

**Query Parameters:**

- `include_product_count` (optional): Include product count (default: true)

**Example Request:**

```
GET /listing/categories/alphabetical?include_product_count=false
```

### 4. Complete Brand Listing

**GET** `/listing/brands`

Get complete brand listing with both top brands and alphabetical grouping.

**Query Parameters:**

- `include_product_count` (optional): Include product count (default: true)
- `include_collection_count` (optional): Include collection count (default: true)
- `limit_top_brands` (optional): Maximum number of top brands (default: 8)
- `featured_only` (optional): Show only featured brands (default: false)

**Example Request:**

```
GET /listing/brands?include_product_count=true&include_collection_count=true&limit_top_brands=10&featured_only=false
```

**Response:**

```json
{
  "success": true,
  "message": "Brand listing retrieved successfully",
  "data": {
    "top_brands": [
      {
        "id": 1,
        "title": "Rolex",
        "image_url": "https://example.com/rolex.png",
        "order": 1,
        "product_count": 89,
        "collection_count": 12,
        "redirect_url": "/brands/1",
        "featured": true
      },
      {
        "id": 2,
        "title": "Omega",
        "image_url": "https://example.com/omega.png",
        "order": 2,
        "product_count": 67,
        "collection_count": 8,
        "redirect_url": "/brands/2",
        "featured": true
      }
    ],
    "alphabetical_brands": {
      "A": [
        {
          "id": 10,
          "title": "Audemars Piguet",
          "image_url": "https://example.com/ap.png",
          "order": null,
          "product_count": 34,
          "collection_count": 5,
          "redirect_url": "/brands/10"
        }
      ],
      "B": [
        {
          "id": 11,
          "title": "Breitling",
          "image_url": "https://example.com/breitling.png",
          "order": null,
          "product_count": 28,
          "collection_count": 4,
          "redirect_url": "/brands/11"
        }
      ]
    },
    "total_brands": 45,
    "total_top_brands": 8
  },
  "statusCode": 200,
  "meta": null
}
```

### 5. Top Brands Only

**GET** `/listing/brands/top`

Get only the top/featured brands.

**Query Parameters:**

- `limit` (optional): Maximum number of brands (default: 8)
- `featured_only` (optional): Show only featured brands (default: false)

**Example Request:**

```
GET /listing/brands/top?limit=6&featured_only=true
```

### 6. Alphabetical Brands Only

**GET** `/listing/brands/alphabetical`

Get all brands grouped alphabetically.

**Query Parameters:**

- `include_product_count` (optional): Include product count (default: true)
- `include_collection_count` (optional): Include collection count (default: true)

**Example Request:**

```
GET /listing/brands/alphabetical?include_product_count=true&include_collection_count=false
```

## Data Structure

### CategoryItemDTO

- `id`: Unique identifier
- `title`: Category name
- `image_url`: Optional image URL
- `order`: Priority order (null for non-featured)
- `product_count`: Number of products in category
- `redirect_url`: URL to redirect to when clicked

### TopCategoryDTO

- Extends CategoryItemDTO
- `featured`: Boolean indicating if category is featured

### BrandItemDTO

- `id`: Unique identifier
- `title`: Brand name
- `image_url`: Optional image URL
- `order`: Priority order (null for non-featured)
- `product_count`: Number of products for brand
- `collection_count`: Number of collections for brand
- `redirect_url`: URL to redirect to when clicked

### TopBrandDTO

- Extends BrandItemDTO
- `featured`: Boolean indicating if brand is featured

## Use Cases

1. **Category Page**: Display top categories as featured tiles and alphabetical list below
2. **Brand Page**: Show top brands prominently and alphabetical navigation
3. **Navigation**: Provide easy A-Z browsing for categories and brands
4. **Featured Items**: Highlight important categories/brands with order priority
5. **Count Display**: Show product/collection counts for better user understanding

## Performance Features

- **Parallel Queries**: Top and alphabetical data fetched simultaneously
- **Count Optimization**: Uses Prisma's `_count` for efficient counting
- **Flexible Limits**: Configurable limits for top items
- **Selective Data**: Option to exclude counts for faster responses

## Frontend Integration Example

```javascript
// Get complete category listing
const categoryResponse = await fetch(
  '/listing/categories?limit_top_categories=8',
);
const categoryData = await categoryResponse.json();

// Display top categories
categoryData.data.top_categories.forEach((category) => {
  console.log(
    `Featured: ${category.title} (${category.product_count} products)`,
  );
});

// Display alphabetical categories
Object.entries(categoryData.data.alphabetical_categories).forEach(
  ([letter, categories]) => {
    console.log(`Letter ${letter}:`);
    categories.forEach((category) => {
      console.log(`  - ${category.title}`);
    });
  },
);

// Get complete brand listing
const brandResponse = await fetch('/listing/brands?limit_top_brands=6');
const brandData = await brandResponse.json();

// Display top brands
brandData.data.top_brands.forEach((brand) => {
  console.log(
    `${brand.title}: ${brand.product_count} products, ${brand.collection_count} collections`,
  );
});
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `500`: Internal server error (with fallback empty data)

## Best Practices

1. **Use Top Categories for Hero Section**: Display featured categories prominently
2. **Alphabetical for Navigation**: Use A-Z grouping for comprehensive browsing
3. **Optimize with Counts**: Include counts when you need to show item quantities
4. **Cache Responses**: These listings don't change frequently, good for caching
5. **Progressive Loading**: Load top items first, then alphabetical for better UX

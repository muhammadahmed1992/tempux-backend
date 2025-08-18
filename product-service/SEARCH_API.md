# Search API Documentation

The Search API provides endpoints to search for brands and collections based on query strings. This is designed for search bar functionality where users can search for brands and their collections.

## Endpoints

### 1. General Search

**GET** `/search`

Search for both brands and collections in a single request.

**Query Parameters:**

- `query` (required): The search string (e.g., "rolex")
- `type` (optional): Filter by type - "brand", "collection", or "all" (default: "all")
- `limit` (optional): Maximum number of results per type (default: 20)
- `page` (optional): Page number for pagination (default: 1)

**Example Request:**

```
GET /search?query=rolex&type=all&limit=10&page=1
```

**Response:**

```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "brands": [
      {
        "id": 1,
        "title": "Rolex",
        "type": "brand",
        "image_url": "https://example.com/rolex-logo.jpg",
        "redirect_url": "/brands/1"
      }
    ],
    "collections": [
      {
        "id": 5,
        "title": "Rolex Day-Date",
        "type": "collection",
        "image_url": "https://example.com/day-date.jpg",
        "brand_id": 1,
        "brand_title": "Rolex",
        "redirect_url": "/brands/1/collections/5"
      },
      {
        "id": 6,
        "title": "Rolex GMT",
        "type": "collection",
        "image_url": "https://example.com/gmt.jpg",
        "brand_id": 1,
        "brand_title": "Rolex",
        "redirect_url": "/brands/1/collections/6"
      }
    ],
    "total_results": 3
  },
  "statusCode": 200,
  "meta": null
}
```

### 2. Brands Only Search

**GET** `/search/brands`

Search for brands only.

**Query Parameters:**

- `query` (required): The search string

**Example Request:**

```
GET /search/brands?query=rolex
```

### 3. Collections Only Search

**GET** `/search/collections`

Search for collections only.

**Query Parameters:**

- `query` (required): The search string

**Example Request:**

```
GET /search/collections?query=day-date
```

## Search Logic

The search uses case-insensitive pattern matching with the following strategies:

1. **Contains**: Matches if the query string is found anywhere in the title
2. **Fuzzy Matching**: Uses partial string matching for better results

## Response Structure

### SearchResultDTO

- `id`: Unique identifier
- `title`: Name of the brand or collection
- `type`: Either "brand" or "collection"
- `image_url`: Optional image URL
- `brand_id`: For collections, the ID of the parent brand
- `brand_title`: For collections, the name of the parent brand
- `redirect_url`: URL to redirect to when clicked

### SearchResponseDTO

- `brands`: Array of brand results
- `collections`: Array of collection results
- `total_results`: Total number of results found

## Use Cases

1. **Search Bar**: Users can type "rolex" and get results for Rolex brand and all its collections
2. **Brand Navigation**: Direct users to specific brand pages
3. **Collection Discovery**: Help users find specific collections within brands
4. **Autocomplete**: Provide suggestions as users type

## Example Frontend Integration

```javascript
// Search for "rolex"
const searchResults = await fetch('/search?query=rolex&type=all');
const data = await searchResults.json();

// Display results
data.data.brands.forEach((brand) => {
  console.log(`Brand: ${brand.title}`);
});

data.data.collections.forEach((collection) => {
  console.log(`Collection: ${collection.title} (${collection.brand_title})`);
});
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request (missing query parameter)
- `500`: Internal server error

## Performance Notes

- Results are limited to 20 per type by default
- Pagination is supported for large result sets
- Search is case-insensitive for better user experience
- Results are ordered alphabetically by title

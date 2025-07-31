Okay, for a front-end engineer interacting with an API that uses this query parser, here are the essential details:

---

### **API Query Parameters: A Front-End Guide**

This API endpoint allows you to fetch data with powerful filtering, sorting, pagination, and field selection capabilities by constructing specific URL query parameters.

**General Structure:**
All parameters are sent as standard URL query strings (e.g., `GET /api/resources?param1=value1&param2=value2`).

---

#### **1. Pagination**

- **`page`**: The desired page number (default: `1`).
  - Example: `?page=2`
- **`pageSize`**: The number of items per page (default: `20` or a backend-defined max).
  - Example: `?pageSize=10`

---

#### **2. Sorting**

- **`sortBy`**: The field name to sort the results by.
  - Example: `?sortBy=name`
- **`sortDir`**: The sorting direction. Must be either `asc` (ascending) or `desc` (descending).
  - Example: `?sortDir=desc`
  - Combined: `?sortBy=name&sortDir=desc`
  - _Default if not provided: Sorted by `created_at` in ascending order._

---

#### **3. Field Selection**

- **`select`**: A comma-separated list of field names you want to receive in the response. Only these fields will be returned for each item.
  - Example: `?select=id,title,price`

---

#### **4. Filtering (`filter` parameter)**

This is the most flexible part, allowing complex data queries. All filters are nested within the `filter` parameter using bracket notation (e.g., `filter[fieldName][operator]=value`).

**A. Basic Equality:**

- **URL:** `?filter[title][eq]=My Product`
  - Finds items where `title` exactly equals "My Product".

**B. Comparison Operators:**

- `eq` (equals)
- `ne` (not equals)
- `gt` (greater than)
- `lt` (less than)
- `gte` (greater than or equals)
- `lte` (less than or equals)
- **URL:** `?filter[price][gt]=50&filter[stock][lte]=10`
  - Finds items with `price` greater than 50 AND `stock` less than or equal to 10.

**C. Text Search Operators:**

- `contains` (substring search)
- `startsWith`
- `endsWith`
- **URL:** `?filter[description][contains]=awesome`
  - Finds items where the `description` contains "awesome".

**D. List Operators:**

- `in` (value is in a comma-separated list)
- `notIn` (value is NOT in a comma-separated list)
- **URL:** `?filter[category][in]=Electronics,Clothing`
  - Finds items whose `category` is either "Electronics" OR "Clothing".

**E. Case-Insensitive Search:**

- Append `[in]` to the operator for case-insensitive matching. Works with `eq`, `contains`, `startsWith`, `endsWith`.
- **URL:** `?filter[title][contains][in]=product`
  - Finds items where `title` contains "product" (e.g., "Product", "product", "PRODUCT").

**F. Logical Operators (`OR` and `AND`):**
You can combine multiple conditions using `or` and `and`.

- **Implicit `AND`:** Multiple top-level `filter` conditions are automatically ANDed together.
  - Example: `?filter[title][eq]=Product A&filter[price][gt]=100` (Title is "Product A" AND Price \> 100)
- **Explicit `OR`:** Use `filter[or][index]` for OR conditions.
  - **URL:** `?filter[or][0][title][eq]=Product A&filter[or][1][price][lt]=50`
    - Finds items where `title` is "Product A" OR `price` is less than 50.
- **Nested Logic (`OR` within `AND`, etc.):** You can nest `and` and `or` as deep as needed.
  - **URL:** `?filter[or][0][title][eq]=Product A&filter[or][1][and][0][category][eq]=Electronics&filter[or][1][and][1][stock][gt]=10`
    - Finds items where:
      - (`title` is "Product A")
      - OR
      - (`category` is "Electronics" AND `stock` is greater than 10)

**G. Automatic Type Coercion:**

- The pipe automatically converts string values like `"true"` to `true`, `"false"` to `false`, and numeric strings (e.g., `"123"`) to actual numbers.

---

#### **5. Custom Filter Expression**

- **`expression`**: Use this parameter to trigger predefined, custom filtering logic on the backend. The allowed values are defined by the backend (e.g., from a `CustomFilter` enum).
- **URL:** `?expression=featured_items`
  - This would tell the backend to apply its specific logic for fetching "featured items."
- **Allowed Values:** Will be provided by the backend, e.g., `featured_items`, `best_selling`, `new_arrivals`.

---

#### **6. Error Handling**

If you send malformed or invalid query parameters (e.g., `sortDir` is not `asc` or `desc`, `filter` is not a valid structure), the API will respond with a `400 Bad Request` error, providing a descriptive message about the validation failure.

---

#### **Example Combined Request URL**

To get the 3rd page, with 15 items, sorted by `updated_at` descending, selecting only `id`, `name`, and `status`, where `status` is `active` OR `category` contains "shoes" (case-insensitive), AND also applying the "new arrivals" custom filter:

```
/api/products?page=3&pageSize=15&sortBy=updated_at&sortDir=desc&select=id,name,status&filter[status][eq]=active&filter[or][1][category][contains][in]=shoes&expression=new_arrivals
```

#### **Nested Relation Filtering (every, some, none) Request URL**

This is used for filtering products based on conditions within their related tables (e.g., productTags).
Filtering by a specific tag: ?filter[productTags][every][tag_id][eq]=123

Finds products where every associated tag has an ID of 123.

Note: You can use [some] to find products where at least one associated tag meets the condition. For example, ?filter[product][productTags][some][tag_id][eq]=123

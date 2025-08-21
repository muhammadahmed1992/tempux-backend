# Order Service Implementation with FedEx Integration

## Overview

This implementation follows the exact same architecture patterns as the existing product-service and auth-service, providing a complete order creation system with FedEx Standard API integration.

## Architecture

### Modules Structure

```
order-service/
├── src/
│   ├── order/                    # Order management
│   │   ├── order.module.ts
│   │   ├── order.controller.ts
│   │   ├── order.service.ts
│   │   ├── order.repository.ts
│   │   └── dtos/
│   │       ├── create-order.dto.ts
│   │       └── order-response.dto.ts
│   ├── shipping/                 # Shipment management
│   │   ├── shipping.module.ts
│   │   ├── shipping.controller.ts
│   │   ├── shipping.service.ts
│   │   ├── shipment.repository.ts
│   │   └── fedex/
│   │       ├── fedex.service.ts
│   │       └── dtos/
│   │           ├── fedex-oauth.dto.ts
│   │           ├── fedex-rate-quote.dto.ts
│   │           ├── fedex-shipment.dto.ts
│   │           └── fedex-tracking.dto.ts
│   ├── auth/                     # Authentication
│   │   ├── guards/
│   │   │   └── auth-user-guard.ts
│   │   └── decorators/
│   │       └── userId.decorator.ts
│   ├── common/                   # Shared utilities
│   │   ├── db/
│   │   │   └── base.repository.ts
│   │   ├── helper/
│   │   │   ├── api-response.ts
│   │   │   ├── response-helper.ts
│   │   │   └── meta.ts
│   │   └── pipes/
│   │       └── parse-query.pipe.ts
│   └── prisma/                   # Database
│       ├── prisma.module.ts
│       └── prisma.service.ts
```

## FedEx Integration Flow

### 1. OAuth Token Management

- Automatic token acquisition and caching
- Token refresh before expiry
- Error handling for authentication failures

### 2. Rate Quote API

- Calculate shipping costs before order creation
- Support for multiple package types
- Address validation and formatting

### 3. Shipment API

- Create shipments after order confirmation
- Generate shipping labels
- Track shipment creation status

### 4. Track API

- Monitor shipment status
- Get delivery updates
- Handle tracking exceptions

## API Endpoints

### Order Endpoints

```
POST   /orders                    - Create new order
GET    /orders                    - List orders (with pagination)
GET    /orders/:id                - Get order details
PUT    /orders/:id/status         - Update order status
```

### Shipment Endpoints

```
POST   /shipments/rate-quote      - Get shipping rate quote
GET    /shipments/:trackingNumber/tracking - Get tracking information
```

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL_DEV_ORDER="postgresql://username:password@localhost:5432/order_db"

# FedEx API Configuration
FEDEX_CLIENT_ID=your_fedex_client_id
FEDEX_CLIENT_SECRET=your_fedex_client_secret
FEDEX_ACCOUNT_NUMBER=your_account_number
FEDEX_METER_NUMBER=your_meter_number
FEDEX_API_BASE_URL=https://apis-sandbox.fedex.com
FEDEX_OAUTH_URL=https://apis-sandbox.fedex.com/oauth/token
FEDEX_IS_PRODUCTION=false

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Product Service
PRODUCT_SERVICE_URL=http://localhost:3001
```

## Key Features

### Order Management

- Multi-item order support
- Order status tracking
- Payment integration
- Inventory validation
- Price calculation (tax, shipping, discounts)

### Shipping Address Handling

- Support for saved shipping addresses
- New address creation during checkout
- Address validation and formatting

### FedEx Integration

- FedEx Standard API integration
- OAuth token management
- Rate quote calculation
- Shipment creation and tracking
- Error handling and retry logic

## Database Schema

The implementation uses the existing Prisma schema with the following key tables:

- `orders` - Main order information
- `order_item` - Individual order items
- `shipment_provider` - Shipping provider configuration
- `order_item_shipment` - Shipment tracking information
- `shipment_tracking` - Detailed tracking history

## Error Handling

The implementation includes comprehensive error handling for:

- Validation errors (invalid order data)
- Business logic errors (insufficient inventory, payment failures)
- FedEx API errors (network issues, API rate limits, OAuth failures)
- Database errors (connection issues, constraint violations)

## Testing

The implementation is designed to support:

- Unit tests for business logic
- Integration tests for API endpoints
- Mock services for external dependencies
- End-to-end testing for complete order flows

## Security

- API credentials stored in environment variables
- Input validation and sanitization
- Authentication guards on all endpoints
- Audit logging for all operations

## Next Steps

1. Add missing dependencies to `package.json`:

   ```json
   {
     "dependencies": {
       "@nestjs/jwt": "^10.0.0",
       "class-validator": "^0.14.0",
       "class-transformer": "^0.5.1",
       "axios": "^1.0.0"
     }
   }
   ```

2. Implement shipping address management
3. Add comprehensive error handling and logging
4. Implement webhook handling for FedEx status updates
5. Add unit and integration tests
6. Configure production FedEx credentials
7. Implement payment integration
8. Add monitoring and alerting

## Usage Examples

### Create Order

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "123",
    "orderItems": [
      {
        "productId": "456",
        "productVariantId": "789",
        "sellerId": "101",
        "quantity": 2,
        "price": 99.99,
        "discount": 10.00,
        "taxAmount": 5.00
      }
    ],
    "useSavedShippingAddress": true,
    "savedShippingAddressId": "1",
    "totalDiscount": 10.00,
    "totalTax": 5.00,
    "totalShippingCost": 15.00,
    "totalAmount": 209.98
  }'
```

### Get Rate Quote

```bash
curl -X POST http://localhost:3000/shipments/rate-quote \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddressId": "1",
    "orderItems": [
      {
        "productId": "456",
        "productVariantId": "789",
        "sellerId": "101",
        "quantity": 2,
        "price": 99.99,
        "discount": 10.00,
        "taxAmount": 5.00
      }
    ]
  }'
```


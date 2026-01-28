# CJDQuick OMS - External Orders API Documentation

**Version:** 1.0
**Last Updated:** 2026-01-28
**Base URL:** `https://cjdquick-api-vr4w.onrender.com`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [API Endpoints](#3-api-endpoints)
4. [Data Models](#4-data-models)
5. [Sample Requests](#5-sample-requests)
6. [Error Handling](#6-error-handling)
7. [Rate Limiting](#7-rate-limiting)
8. [Webhooks (Coming Soon)](#8-webhooks-coming-soon)

---

## 1. Overview

The CJDQuick External Orders API allows clients to programmatically create and manage orders in the OMS system. This API is designed for:

- E-commerce platforms (Shopify, WooCommerce, Magento)
- Custom websites
- ERP integrations
- Third-party marketplaces

### Key Features

| Feature | Description |
|---------|-------------|
| Single Order Creation | Create one order at a time |
| Bulk Order Creation | Create up to 100 orders in one request |
| Order Status Tracking | Get real-time order status |
| Order Cancellation | Cancel orders before fulfillment |

---

## 2. Authentication

All API requests must include an API key in the header.

### Getting Your API Key

1. Contact your CJDQuick administrator
2. API keys are company-specific
3. Store your API key securely - it's shown only once

### Authentication Header

```
X-API-Key: your_api_key_here
```

### Example

```bash
curl -X POST "https://cjdquick-api-vr4w.onrender.com/api/v1/orders/external" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 5619add4da4f9f2afbe05421dc56636a17a9537d30dd4b3027502318c10e9651" \
  -d '{ ... }'
```

### API Key Permissions

| Permission | Description |
|------------|-------------|
| `orders:write` | Create and cancel orders |
| `orders:read` | View order status and details |

---

## 3. API Endpoints

### 3.1 Create Single Order

Creates a single order in the system.

**Endpoint:** `POST /api/v1/orders/external`

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | `application/json` |
| X-API-Key | Yes | Your API key |

**Request Body:**

```json
{
  "externalOrderId": "ORD-2024-001",
  "channel": "WEBSITE",
  "paymentMode": "PREPAID",
  "customer": {
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210"
  },
  "shippingAddress": {
    "line1": "123 MG Road",
    "line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "billingAddress": {
    "line1": "123 MG Road",
    "line2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "country": "India"
  },
  "items": [
    {
      "sku": "SKU-001",
      "name": "Product Name",
      "quantity": 2,
      "unitPrice": 499.00,
      "discount": 50.00,
      "tax": 89.82
    }
  ],
  "charges": {
    "shippingCharge": 50.00,
    "codCharge": 0,
    "giftWrapCharge": 0,
    "discount": 100.00
  },
  "notes": "Please handle with care"
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "order": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "orderNo": "ORD-20240128-0001",
    "externalOrderNo": "ORD-2024-001",
    "status": "PENDING",
    "channel": "WEBSITE",
    "paymentMode": "PREPAID",
    "subtotal": "998.00",
    "taxAmount": "89.82",
    "shippingCharge": "50.00",
    "discount": "100.00",
    "totalAmount": "1037.82",
    "createdAt": "2026-01-28T10:30:00Z"
  },
  "message": "Order created successfully"
}
```

---

### 3.2 Create Bulk Orders

Creates multiple orders in a single request (max 100 orders).

**Endpoint:** `POST /api/v1/orders/external/bulk`

**Request Body:**

```json
{
  "orders": [
    {
      "externalOrderId": "ORD-001",
      "channel": "WEBSITE",
      "paymentMode": "PREPAID",
      "customer": { ... },
      "shippingAddress": { ... },
      "items": [ ... ]
    },
    {
      "externalOrderId": "ORD-002",
      "channel": "WEBSITE",
      "paymentMode": "COD",
      "customer": { ... },
      "shippingAddress": { ... },
      "items": [ ... ]
    }
  ]
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "totalReceived": 2,
  "totalCreated": 2,
  "totalFailed": 0,
  "orders": [
    {
      "externalOrderId": "ORD-001",
      "success": true,
      "orderId": "550e8400-e29b-41d4-a716-446655440001",
      "orderNo": "ORD-20240128-0001"
    },
    {
      "externalOrderId": "ORD-002",
      "success": true,
      "orderId": "550e8400-e29b-41d4-a716-446655440002",
      "orderNo": "ORD-20240128-0002"
    }
  ],
  "errors": []
}
```

---

### 3.3 Get Order by External ID

Retrieves an order using your external order ID.

**Endpoint:** `GET /api/v1/orders/external/{external_order_id}`

**Example:**

```bash
curl -X GET "https://cjdquick-api-vr4w.onrender.com/api/v1/orders/external/ORD-2024-001" \
  -H "X-API-Key: your_api_key"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "orderNo": "ORD-20240128-0001",
  "externalOrderNo": "ORD-2024-001",
  "status": "PROCESSING",
  "channel": "WEBSITE",
  "paymentMode": "PREPAID",
  "customerName": "Rahul Sharma",
  "customerPhone": "9876543210",
  "shippingAddress": {
    "line1": "123 MG Road",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "items": [
    {
      "sku": "SKU-001",
      "name": "Product Name",
      "quantity": 2,
      "unitPrice": "499.00"
    }
  ],
  "subtotal": "998.00",
  "totalAmount": "1037.82",
  "createdAt": "2026-01-28T10:30:00Z",
  "updatedAt": "2026-01-28T11:00:00Z"
}
```

---

### 3.4 Cancel Order

Cancels an order (only if not yet shipped).

**Endpoint:** `POST /api/v1/orders/external/{external_order_id}/cancel`

**Request Body:**

```json
{
  "reason": "Customer requested cancellation"
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CANCELLED"
}
```

---

## 4. Data Models

### 4.1 Customer Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Customer full name |
| email | string | No | Customer email |
| phone | string | Yes | 10-digit phone number |

### 4.2 Address Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| line1 | string | Yes | Address line 1 |
| line2 | string | No | Address line 2 |
| city | string | Yes | City name |
| state | string | Yes | State name |
| pincode | string | Yes | 6-digit PIN code |
| country | string | No | Country (default: India) |

### 4.3 Order Item Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sku | string | Yes | SKU code (must exist in system) |
| name | string | Yes | Product name |
| quantity | integer | Yes | Quantity (min: 1) |
| unitPrice | decimal | Yes | Price per unit |
| discount | decimal | No | Discount on item |
| tax | decimal | No | Tax amount |

### 4.4 Charges Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| shippingCharge | decimal | No | Shipping cost |
| codCharge | decimal | No | COD collection charge |
| giftWrapCharge | decimal | No | Gift wrap charge |
| discount | decimal | No | Order-level discount |

### 4.5 Payment Modes

| Value | Description |
|-------|-------------|
| `PREPAID` | Already paid (online payment) |
| `COD` | Cash on Delivery |

### 4.6 Order Channels

| Value | Description |
|-------|-------------|
| `WEBSITE` | Direct website orders |
| `SHOPIFY` | Shopify store |
| `AMAZON` | Amazon marketplace |
| `FLIPKART` | Flipkart marketplace |
| `WOOCOMMERCE` | WooCommerce store |
| `API` | Generic API integration |
| `MANUAL` | Manually created orders |

### 4.7 Order Status Flow

```
PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → DELIVERED
                ↓           ↓          ↓         ↓
            CANCELLED   CANCELLED  CANCELLED    RTO
```

| Status | Description |
|--------|-------------|
| PENDING | Order received, awaiting confirmation |
| CONFIRMED | Order confirmed, ready for processing |
| PROCESSING | Order being picked/packed |
| PACKED | Order packed, ready for shipment |
| SHIPPED | Order dispatched with courier |
| DELIVERED | Order delivered to customer |
| CANCELLED | Order cancelled |
| RTO | Return to Origin |

---

## 5. Sample Requests

### 5.1 cURL - Create Order

```bash
curl -X POST "https://cjdquick-api-vr4w.onrender.com/api/v1/orders/external" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 5619add4da4f9f2afbe05421dc56636a17a9537d30dd4b3027502318c10e9651" \
  -d '{
    "externalOrderId": "WEB-20240128-001",
    "channel": "WEBSITE",
    "paymentMode": "PREPAID",
    "customer": {
      "name": "Priya Patel",
      "email": "priya@example.com",
      "phone": "9876543210"
    },
    "shippingAddress": {
      "line1": "456 Park Street",
      "city": "Bangalore",
      "state": "Karnataka",
      "pincode": "560001",
      "country": "India"
    },
    "items": [
      {
        "sku": "WATER-PURIFIER-01",
        "name": "Aquapurite RO Water Purifier",
        "quantity": 1,
        "unitPrice": 15999.00,
        "tax": 2879.82
      }
    ],
    "charges": {
      "shippingCharge": 0,
      "discount": 1000.00
    },
    "notes": "Installation required"
  }'
```

### 5.2 JavaScript (Node.js)

```javascript
const axios = require('axios');

const API_KEY = '5619add4da4f9f2afbe05421dc56636a17a9537d30dd4b3027502318c10e9651';
const BASE_URL = 'https://cjdquick-api-vr4w.onrender.com';

async function createOrder(orderData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/v1/orders/external`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        }
      }
    );
    console.log('Order created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
const order = {
  externalOrderId: 'WEB-' + Date.now(),
  channel: 'WEBSITE',
  paymentMode: 'PREPAID',
  customer: {
    name: 'Test Customer',
    phone: '9876543210'
  },
  shippingAddress: {
    line1: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  },
  items: [
    {
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      quantity: 1,
      unitPrice: 999.00
    }
  ]
};

createOrder(order);
```

### 5.3 Python

```python
import requests
import json

API_KEY = '5619add4da4f9f2afbe05421dc56636a17a9537d30dd4b3027502318c10e9651'
BASE_URL = 'https://cjdquick-api-vr4w.onrender.com'

def create_order(order_data):
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
    }

    response = requests.post(
        f'{BASE_URL}/api/v1/orders/external',
        headers=headers,
        json=order_data
    )

    if response.status_code == 201:
        print('Order created successfully!')
        return response.json()
    else:
        print(f'Error: {response.status_code}')
        print(response.json())
        return None

# Example usage
order = {
    'externalOrderId': 'PY-ORDER-001',
    'channel': 'WEBSITE',
    'paymentMode': 'COD',
    'customer': {
        'name': 'Test Customer',
        'phone': '9876543210'
    },
    'shippingAddress': {
        'line1': '123 Test Street',
        'city': 'Delhi',
        'state': 'Delhi',
        'pincode': '110001'
    },
    'items': [
        {
            'sku': 'TEST-SKU-001',
            'name': 'Test Product',
            'quantity': 2,
            'unitPrice': 499.00
        }
    ]
}

result = create_order(order)
print(json.dumps(result, indent=2))
```

### 5.4 PHP

```php
<?php

$apiKey = '5619add4da4f9f2afbe05421dc56636a17a9537d30dd4b3027502318c10e9651';
$baseUrl = 'https://cjdquick-api-vr4w.onrender.com';

function createOrder($orderData) {
    global $apiKey, $baseUrl;

    $ch = curl_init();

    curl_setopt_array($ch, [
        CURLOPT_URL => $baseUrl . '/api/v1/orders/external',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($orderData),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'X-API-Key: ' . $apiKey
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'status' => $httpCode,
        'data' => json_decode($response, true)
    ];
}

// Example usage
$order = [
    'externalOrderId' => 'PHP-ORDER-001',
    'channel' => 'WEBSITE',
    'paymentMode' => 'PREPAID',
    'customer' => [
        'name' => 'Test Customer',
        'phone' => '9876543210'
    ],
    'shippingAddress' => [
        'line1' => '123 Test Street',
        'city' => 'Chennai',
        'state' => 'Tamil Nadu',
        'pincode' => '600001'
    ],
    'items' => [
        [
            'sku' => 'TEST-SKU-001',
            'name' => 'Test Product',
            'quantity' => 1,
            'unitPrice' => 999.00
        ]
    ]
];

$result = createOrder($order);
print_r($result);
```

---

## 6. Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "items[0].sku",
        "message": "SKU not found in system"
      }
    ]
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | VALIDATION_ERROR | Invalid request data |
| 401 | UNAUTHORIZED | Invalid or missing API key |
| 403 | FORBIDDEN | API key lacks required permission |
| 404 | NOT_FOUND | Order or resource not found |
| 409 | DUPLICATE_ORDER | External order ID already exists |
| 422 | SKU_NOT_FOUND | SKU code doesn't exist |
| 422 | INSUFFICIENT_INVENTORY | Not enough stock |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Handling Errors

```javascript
try {
  const result = await createOrder(orderData);
} catch (error) {
  if (error.response) {
    const { code, message, details } = error.response.data.error;

    switch (code) {
      case 'DUPLICATE_ORDER':
        console.log('Order already exists, skipping...');
        break;
      case 'SKU_NOT_FOUND':
        console.log('Invalid SKU:', details);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        console.log('Rate limited, retrying in 60 seconds...');
        await sleep(60000);
        break;
      default:
        console.error('Error:', message);
    }
  }
}
```

---

## 7. Rate Limiting

| Limit Type | Value |
|------------|-------|
| Requests per hour | 1000 |
| Bulk orders per request | 100 |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1706436000
```

### Best Practices

1. **Implement exponential backoff** for retries
2. **Use bulk endpoint** for multiple orders
3. **Cache order status** to reduce API calls
4. **Monitor rate limit headers** in responses

---

## 8. Webhooks (Coming Soon)

Webhook notifications for order status updates will be available in a future release.

### Planned Events

| Event | Description |
|-------|-------------|
| `order.confirmed` | Order confirmed |
| `order.shipped` | Order dispatched |
| `order.delivered` | Order delivered |
| `order.cancelled` | Order cancelled |
| `order.rto` | Order returned |

---

## Support

For API support or to report issues:

- **Email:** support@cjdquick.com
- **Documentation:** https://docs.cjdquick.com
- **API Status:** https://status.cjdquick.com

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-28 | Initial release |

---

*This document is confidential and intended for authorized API users only.*

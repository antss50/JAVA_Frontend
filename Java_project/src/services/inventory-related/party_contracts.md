# Party API Frontend Integration Guide

## Overview

This document provides comprehensive frontend integration guidelines for the Party Module API of the Supermarket Warehouse system. The Party Module uses a simplified, unified approach to manage all parties (customers, suppliers, and employees) through a single REST API.

## Base URL

All Party API endpoints are prefixed with:

```
http://localhost:8080/api/parties
```

## Authentication

- **Required**: JWT Bearer token (if authentication is enabled)
- **Header**: `Authorization: Bearer <access_token>`
- Include this header in all API requests

---

## API Endpoints

### 1. Get All Parties

**Endpoint:** `GET /api/parties`

**Description:** Retrieves a list of all active parties in the system.

**Frontend Implementation:**

```javascript
const getAllParties = async () => {
  try {
    const response = await fetch("/api/parties", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const parties = await response.json();
    return parties;
  } catch (error) {
    console.error("Error fetching parties:", error);
    throw error;
  }
};
```

**Expected Response:**

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "address": "123 Main Street, City, State",
    "partyType": "CUSTOMER",
    "active": true
  },
  {
    "id": 2,
    "name": "ABC Supply Co.",
    "email": "contact@abcsupply.com",
    "phone": "+1987654321",
    "address": "456 Industrial Ave, City, State",
    "partyType": "SUPPLIER",
    "active": true
  }
]
```

**Response Codes:**

- `200 OK`: Successfully retrieved parties list
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 2. Get Party by ID

**Endpoint:** `GET /api/parties/{id}`

**Description:** Retrieves a specific party by its unique identifier.

**Frontend Implementation:**

```javascript
const getPartyById = async (partyId) => {
  try {
    const response = await fetch(`/api/parties/${partyId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return null; // Party not found
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const party = await response.json();
    return party;
  } catch (error) {
    console.error("Error fetching party:", error);
    throw error;
  }
};
```

**Expected Response:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "address": "123 Main Street, City, State",
  "partyType": "CUSTOMER",
  "active": true
}
```

**Response Codes:**

- `200 OK`: Successfully retrieved party details
- `404 Not Found`: Party with specified ID not found
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 3. Get Parties by Type

**Endpoint:** `GET /api/parties/type/{type}`

**Description:** Retrieves all parties of a specific type.

**Valid Party Types:**

- `CUSTOMER`: Customer parties
- `SUPPLIER`: Supplier parties
- `EMPLOYEE`: Employee parties

**Frontend Implementation:**

```javascript
const getPartiesByType = async (partyType) => {
  try {
    const response = await fetch(`/api/parties/type/${partyType}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const parties = await response.json();
    return parties;
  } catch (error) {
    console.error("Error fetching parties by type:", error);
    throw error;
  }
};

// Usage examples
const customers = await getPartiesByType("CUSTOMER");
const suppliers = await getPartiesByType("SUPPLIER");
const employees = await getPartiesByType("EMPLOYEE");
```

**Expected Response:**

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1555123456",
    "address": "789 Oak Drive, City, State",
    "partyType": "CUSTOMER",
    "active": true
  },
  {
    "id": 3,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1555123457",
    "address": "321 Pine Street, City, State",
    "partyType": "CUSTOMER",
    "active": true
  }
]
```

**Response Codes:**

- `200 OK`: Successfully retrieved parties of specified type
- `400 Bad Request`: Invalid party type specified
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `500 Internal Server Error`: Server error

---

### 4. Create Party

**Endpoint:** `POST /api/parties`

**Description:** Creates a new party in the system.

**Frontend Implementation:**

```javascript
const createParty = async (partyData) => {
  try {
    const response = await fetch("/api/parties", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partyData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorData.message}`
      );
    }

    const createdParty = await response.json();
    return createdParty;
  } catch (error) {
    console.error("Error creating party:", error);
    throw error;
  }
};
```

**Request Body Example:**

```json
{
  "name": "New Customer",
  "email": "newcustomer@example.com",
  "phone": "+1234567890",
  "address": "123 New Street, City, State",
  "partyType": "CUSTOMER",
  "active": true
}
```

**Request Validation Rules:**

- `name`: **Required**, not blank, maximum 255 characters
- `email`: Optional, must be valid email format, maximum 100 characters
- `phone`: Optional, maximum 20 characters
- `address`: Optional, maximum 200 characters
- `partyType`: **Required**, must be one of: `CUSTOMER`, `SUPPLIER`, `EMPLOYEE`
- `active`: Optional, defaults to `true` if not provided

**Frontend Form Validation:**

```javascript
const validatePartyData = (partyData) => {
  const errors = [];

  // Required fields
  if (!partyData.name || partyData.name.trim() === "") {
    errors.push("Name is required");
  }
  if (partyData.name && partyData.name.length > 255) {
    errors.push("Name must not exceed 255 characters");
  }

  if (!partyData.partyType) {
    errors.push("Party type is required");
  }
  if (
    partyData.partyType &&
    !["CUSTOMER", "SUPPLIER", "EMPLOYEE"].includes(partyData.partyType)
  ) {
    errors.push("Party type must be CUSTOMER, SUPPLIER, or EMPLOYEE");
  }

  // Optional field validations
  if (partyData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partyData.email)) {
    errors.push("Email must be valid");
  }
  if (partyData.email && partyData.email.length > 100) {
    errors.push("Email must not exceed 100 characters");
  }

  if (partyData.phone && partyData.phone.length > 20) {
    errors.push("Phone number must not exceed 20 characters");
  }

  if (partyData.address && partyData.address.length > 200) {
    errors.push("Address must not exceed 200 characters");
  }

  return errors;
};
```

**Expected Response (201 Created):**

```json
{
  "id": 4,
  "name": "New Customer",
  "email": "newcustomer@example.com",
  "phone": "+1234567890",
  "address": "123 New Street, City, State",
  "partyType": "CUSTOMER",
  "active": true
}
```

**Response Headers:**

- `Location: /api/parties/{id}`: URI of the created party

**Response Codes:**

- `201 Created`: Party successfully created
- `400 Bad Request`: Invalid request data or validation errors
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Party with similar details already exists
- `500 Internal Server Error`: Server error

**Validation Error Response (400 Bad Request):**

```json
{
  "timestamp": "2025-06-19T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "email",
      "message": "Email should be valid"
    }
  ]
}
```

---

### 5. Update Party

**Endpoint:** `PUT /api/parties/{id}`

**Description:** Updates an existing party with new information.

**Frontend Implementation:**

```javascript
const updateParty = async (partyId, partyData) => {
  try {
    const response = await fetch(`/api/parties/${partyId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partyData),
    });

    if (response.status === 404) {
      throw new Error("Party not found");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorData.message}`
      );
    }

    const updatedParty = await response.json();
    return updatedParty;
  } catch (error) {
    console.error("Error updating party:", error);
    throw error;
  }
};
```

**Request Body Example:**

```json
{
  "name": "Updated Customer Name",
  "email": "updated.email@example.com",
  "phone": "+1987654321",
  "address": "456 Updated Street, City, State",
  "partyType": "CUSTOMER",
  "active": false
}
```

**Request Validation:**

- Same validation rules as Create Party
- All fields are optional for update, but if provided must meet validation criteria
- `id` field in request body will be ignored

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "name": "Updated Customer Name",
  "email": "updated.email@example.com",
  "phone": "+1987654321",
  "address": "456 Updated Street, City, State",
  "partyType": "CUSTOMER",
  "active": false
}
```

**Response Codes:**

- `200 OK`: Party successfully updated
- `400 Bad Request`: Invalid request data or validation errors
- `404 Not Found`: Party with specified ID not found
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Update conflicts with existing data
- `500 Internal Server Error`: Server error

---

### 6. Delete Party

**Endpoint:** `DELETE /api/parties/{id}`

**Description:** Deletes a party from the system (soft delete - sets active to false).

**Frontend Implementation:**

```javascript
const deleteParty = async (partyId) => {
  try {
    const response = await fetch(`/api/parties/${partyId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true; // Success (returns 204 No Content or 404 for idempotency)
  } catch (error) {
    console.error("Error deleting party:", error);
    throw error;
  }
};

// Usage with confirmation
const handleDeleteParty = async (partyId, partyName) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${partyName}?`
  );
  if (confirmed) {
    try {
      await deleteParty(partyId);
      alert("Party deleted successfully");
      // Refresh the party list
      await loadParties();
    } catch (error) {
      alert("Failed to delete party: " + error.message);
    }
  }
};
```

**Expected Response:**

- No response body (204 No Content)

**Response Codes:**

- `204 No Content`: Party successfully deleted
- `404 Not Found`: Party with specified ID not found (also returns 204 for idempotency)
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `409 Conflict`: Cannot delete party due to existing relationships
- `500 Internal Server Error`: Server error

---

## Data Models

### PartyDto Structure

```typescript
interface PartyDto {
  id?: number; // Auto-generated, read-only
  name: string; // Required, max 255 characters
  email?: string; // Optional, valid email format, max 100 characters
  phone?: string; // Optional, max 20 characters
  address?: string; // Optional, max 200 characters
  partyType: "CUSTOMER" | "SUPPLIER" | "EMPLOYEE"; // Required
  active?: boolean; // Optional, defaults to true
}
```

### Party Types

| Type       | Description                                       | Usage                         |
| ---------- | ------------------------------------------------- | ----------------------------- |
| `CUSTOMER` | External customers who purchase products/services | Sales transactions, invoicing |
| `SUPPLIER` | External suppliers who provide products/services  | Purchase orders, payments     |
| `EMPLOYEE` | Internal employees of the organization            | Internal operations, HR       |

---

## Complete Frontend Example

Here's a complete React component example demonstrating all API operations:

```javascript
import React, { useState, useEffect } from "react";

const PartyManager = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("ALL");

  // API base configuration
  const API_BASE = "/api/parties";
  const token = localStorage.getItem("authToken"); // Adjust based on your auth system

  const apiCall = async (url, options = {}) => {
    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.status === 204) {
        return null; // No content
      }

      return response.status === 404 ? null : await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  // Load parties based on selected type
  const loadParties = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = API_BASE;
      if (selectedType !== "ALL") {
        url = `${API_BASE}/type/${selectedType}`;
      }

      const data = await apiCall(url);
      setParties(data || []);
    } catch (err) {
      setError("Failed to load parties: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new party
  const createParty = async (partyData) => {
    try {
      const newParty = await apiCall(API_BASE, {
        method: "POST",
        body: JSON.stringify(partyData),
      });

      setParties((prev) => [...prev, newParty]);
      return newParty;
    } catch (err) {
      throw new Error("Failed to create party: " + err.message);
    }
  };

  // Update party
  const updateParty = async (partyId, partyData) => {
    try {
      const updatedParty = await apiCall(`${API_BASE}/${partyId}`, {
        method: "PUT",
        body: JSON.stringify(partyData),
      });

      setParties((prev) =>
        prev.map((p) => (p.id === partyId ? updatedParty : p))
      );
      return updatedParty;
    } catch (err) {
      throw new Error("Failed to update party: " + err.message);
    }
  };

  // Delete party
  const deleteParty = async (partyId) => {
    try {
      await apiCall(`${API_BASE}/${partyId}`, {
        method: "DELETE",
      });

      setParties((prev) => prev.filter((p) => p.id !== partyId));
    } catch (err) {
      throw new Error("Failed to delete party: " + err.message);
    }
  };

  useEffect(() => {
    loadParties();
  }, [selectedType]);

  const partyTypes = ["ALL", "CUSTOMER", "SUPPLIER", "EMPLOYEE"];

  return (
    <div className="party-manager">
      <h2>Party Management</h2>

      {/* Type Filter */}
      <div className="filter-section">
        <label>Filter by Type:</label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {partyTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Error Display */}
      {error && <div className="error">{error}</div>}

      {/* Loading State */}
      {loading && <div className="loading">Loading parties...</div>}

      {/* Parties List */}
      <div className="parties-list">
        {parties.map((party) => (
          <div key={party.id} className="party-card">
            <h3>{party.name}</h3>
            <p>Type: {party.partyType}</p>
            <p>Email: {party.email || "N/A"}</p>
            <p>Phone: {party.phone || "N/A"}</p>
            <p>Status: {party.active ? "Active" : "Inactive"}</p>

            <div className="party-actions">
              <button
                onClick={() => {
                  /* Edit logic */
                }}
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${party.name}?`)) {
                    deleteParty(party.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartyManager;
```

---

## Error Handling Best Practices

### Common Error Scenarios

1. **Network Errors**: Connection issues, timeouts
2. **Authentication Errors**: Invalid or expired tokens
3. **Validation Errors**: Invalid input data
4. **Not Found Errors**: Requesting non-existent parties
5. **Server Errors**: Internal server issues

### Frontend Error Handling Strategy

```javascript
const handleApiError = (error, context) => {
  console.error(`Error in ${context}:`, error);

  // Determine error type and show appropriate message
  if (error.message.includes("401")) {
    // Redirect to login or refresh token
    window.location.href = "/login";
  } else if (error.message.includes("403")) {
    alert("You do not have permission to perform this action");
  } else if (error.message.includes("404")) {
    alert("The requested party was not found");
  } else if (error.message.includes("400")) {
    alert("Invalid data provided. Please check your input");
  } else {
    alert("An unexpected error occurred. Please try again");
  }
};
```

---

## Performance Considerations

### Frontend Optimization Tips

1. **Caching**: Cache party lists and implement smart refresh strategies
2. **Pagination**: For large datasets, implement client-side pagination
3. **Debouncing**: For search/filter operations, debounce API calls
4. **Optimistic Updates**: Update UI immediately, rollback on error
5. **Loading States**: Show appropriate loading indicators

### Example with Caching

```javascript
class PartyApiService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getAllParties(useCache = true) {
    const cacheKey = "all_parties";

    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const parties = await this.apiCall("/api/parties");
    this.cache.set(cacheKey, {
      data: parties,
      timestamp: Date.now(),
    });

    return parties;
  }

  invalidateCache() {
    this.cache.clear();
  }
}
```

---

## Testing Guidelines

### Unit Testing API Calls

```javascript
// Example using Jest and MSW (Mock Service Worker)
import { rest } from "msw";
import { setupServer } from "msw/node";
import { getAllParties, createParty } from "./partyApi";

const server = setupServer(
  rest.get("/api/parties", (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, name: "Test Party", partyType: "CUSTOMER", active: true },
      ])
    );
  }),

  rest.post("/api/parties", (req, res, ctx) => {
    const party = req.body;
    return res(ctx.status(201), ctx.json({ ...party, id: 2 }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("getAllParties returns party list", async () => {
  const parties = await getAllParties();
  expect(parties).toHaveLength(1);
  expect(parties[0].name).toBe("Test Party");
});

test("createParty returns created party with ID", async () => {
  const newParty = {
    name: "New Party",
    partyType: "SUPPLIER",
    active: true,
  };

  const created = await createParty(newParty);
  expect(created.id).toBe(2);
  expect(created.name).toBe("New Party");
});
```

---

## Security Considerations

1. **Authentication**: Always include valid JWT tokens
2. **Input Validation**: Validate all inputs on frontend before sending
3. **XSS Prevention**: Sanitize all displayed data
4. **HTTPS**: Use HTTPS in production
5. **Token Management**: Securely store and refresh tokens

---

## Migration Notes

If you're migrating from the previous complex Party API:

1. **Endpoint Changes**: Update all endpoints to use `/api/parties`
2. **Unified Model**: All party types now use the same `PartyDto` structure
3. **Type Field**: Use `partyType` field instead of separate endpoints
4. **Simplified Operations**: Fewer endpoints, consistent CRUD operations

---

This documentation provides everything needed for frontend developers to successfully integrate with the Party Module API. For additional support or questions, please refer to the API contracts documentation or contact the backend development team.

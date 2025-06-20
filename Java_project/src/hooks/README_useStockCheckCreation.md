# useStockCheckCreation Hook

A custom React hook for creating new stock checks in the inventory management system. This hook handles product selection, form management, and stock check execution for both single and batch operations.

## Features

- **Product Search & Selection**: Search for products and add them to stock check selection
- **Form Management**: Handle expected quantities, notes, and check metadata
- **Batch Operations**: Perform stock checks on multiple products simultaneously
- **Validation**: Built-in validation for stock check data
- **Error Handling**: Comprehensive error handling and loading states
- **Utilities**: Helper functions for check reference generation and state management

## Basic Usage

```jsx
import { useStockCheckCreation } from "../hooks/useStockCheckCreation";

function StockCheckForm() {
  const {
    // State
    products,
    selectedProducts,
    batchResults,

    // Product management
    searchProducts,
    addProductToSelection,
    removeProductFromSelection,
    updateExpectedQuantity,

    // Stock check operations
    performBatchStockCheck,

    // Loading states
    isLoading,
    batchLoading,

    // Error handling
    error,
    clearError,

    // Validation
    isSelectionValid,

    // Utilities
    generateCheckReference,
    clearSelection,
  } = useStockCheckCreation();

  // Your component logic here
}
```

## API Reference

### State Properties

#### Products & Selection

- `products` - Array of products from search results
- `selectedProducts` - Array of products selected for stock check
- `searchQuery` - Current search query string

#### Results

- `batchResults` - Results from batch stock check operation
- `singleResult` - Result from single stock check operation

#### Loading States

- `productsLoading` - Loading state for product search
- `batchLoading` - Loading state for batch stock check
- `singleLoading` - Loading state for single stock check
- `isLoading` - Combined loading state

#### Error States

- `productsError` - Error from product search operations
- `error` - General error state

### Product Management Functions

#### `searchProducts(query)`

Search for products by name or code.

```jsx
// Search for products
await searchProducts("product name");
```

#### `addProductToSelection(product)`

Add a product to the stock check selection.

```jsx
// Add product to selection
addProductToSelection({
  id: 123,
  name: "Product Name",
  currentStock: 100,
  unit: "pcs",
});
```

#### `removeProductFromSelection(productId)`

Remove a product from selection.

```jsx
// Remove product by ID
removeProductFromSelection(123);
```

#### `updateExpectedQuantity(productId, quantity)`

Update the expected quantity for a selected product.

```jsx
// Update expected quantity
updateExpectedQuantity(123, 150);
```

#### `updateProductNotes(productId, notes)`

Update notes for a selected product.

```jsx
// Update product notes
updateProductNotes(123, "Special handling required");
```

#### `clearSelection()`

Clear all selected products.

```jsx
// Clear all selections
clearSelection();
```

### Stock Check Operations

#### `performSingleStockCheck(stockCheckRequest)`

Perform a stock check for a single product.

```jsx
// Single stock check
const result = await performSingleStockCheck({
  productId: 123,
  expectedQuantity: 100,
  checkedBy: "john.doe",
  checkReference: "CHK-001",
  notes: "Monthly check",
});
```

#### `performBatchStockCheck(additionalData)`

Perform batch stock check for all selected products.

```jsx
// Batch stock check
const results = await performBatchStockCheck({
  checkedBy: "john.doe",
  checkReference: "CHK-BATCH-001",
});
```

#### `buildStockCheckRequest(params)`

Build a properly formatted stock check request.

```jsx
// Build request
const request = buildStockCheckRequest({
  productId: 123,
  expectedQuantity: 100,
  checkedBy: "john.doe",
});
```

### Utility Functions

#### `generateCheckReference()`

Generate a unique check reference.

```jsx
// Generate reference
const reference = generateCheckReference();
// Returns: "CHK-20250619-103000-A1B2"
```

#### `clearResults()`

Clear all stock check results.

#### `clearBatchResults()`

Clear batch results only.

#### `clearSingleResult()`

Clear single result only.

#### `clearError()`

Clear all error states.

#### `resetState()`

Reset the entire hook state.

### Validation Functions

#### `validateSelection()`

Validate selected products and return array of error messages.

```jsx
// Validate selection
const errors = validateSelection();
if (errors.length > 0) {
  console.log("Validation errors:", errors);
}
```

#### `isSelectionValid()`

Check if current selection is valid (boolean).

```jsx
// Check if valid
if (isSelectionValid()) {
  // Proceed with stock check
}
```

### Computed Values

- `totalSelectedProducts` - Number of selected products
- `totalExpectedQuantity` - Sum of all expected quantities
- `hasResults` - Boolean indicating if there are any results

## Complete Example

```jsx
import React, { useState } from "react";
import { useStockCheckCreation } from "../hooks/useStockCheckCreation";

function StockCheckForm() {
  const [checkedBy, setCheckedBy] = useState("");
  const [checkReference, setCheckReference] = useState("");

  const {
    products,
    selectedProducts,
    batchResults,
    isLoading,
    error,
    searchProducts,
    addProductToSelection,
    removeProductFromSelection,
    updateExpectedQuantity,
    updateProductNotes,
    performBatchStockCheck,
    generateCheckReference,
    isSelectionValid,
    clearError,
    totalSelectedProducts,
    totalExpectedQuantity,
  } = useStockCheckCreation();

  // Initialize check reference
  React.useEffect(() => {
    if (!checkReference) {
      setCheckReference(generateCheckReference());
    }
  }, [checkReference, generateCheckReference]);

  const handleSearch = async (query) => {
    if (query.length >= 2) {
      await searchProducts(query);
    }
  };

  const handlePerformCheck = async () => {
    if (!isSelectionValid()) {
      alert("Please fix validation errors");
      return;
    }

    try {
      const results = await performBatchStockCheck({
        checkedBy,
        checkReference,
      });
      console.log("Stock check completed:", results);
    } catch (err) {
      console.error("Stock check failed:", err);
    }
  };

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={clearError}>Clear Error</button>
      </div>
    );
  }

  return (
    <div>
      {/* Product Search */}
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      {/* Search Results */}
      {products.map((product) => (
        <div key={product.id} onClick={() => addProductToSelection(product)}>
          {product.name} (Stock: {product.currentStock})
        </div>
      ))}

      {/* Form Fields */}
      <input
        type="text"
        placeholder="Checked by"
        value={checkedBy}
        onChange={(e) => setCheckedBy(e.target.value)}
      />

      <input
        type="text"
        placeholder="Check reference"
        value={checkReference}
        onChange={(e) => setCheckReference(e.target.value)}
      />

      {/* Selected Products */}
      <div>
        <h3>Selected Products ({totalSelectedProducts})</h3>
        <p>Total Expected: {totalExpectedQuantity}</p>

        {selectedProducts.map((product) => (
          <div key={product.id}>
            <span>{product.name}</span>
            <input
              type="number"
              value={product.expectedQuantity}
              onChange={(e) =>
                updateExpectedQuantity(product.id, e.target.value)
              }
            />
            <input
              type="text"
              placeholder="Notes"
              value={product.notes || ""}
              onChange={(e) => updateProductNotes(product.id, e.target.value)}
            />
            <button onClick={() => removeProductFromSelection(product.id)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <button
        onClick={handlePerformCheck}
        disabled={isLoading || selectedProducts.length === 0}
      >
        {isLoading ? "Processing..." : "Perform Stock Check"}
      </button>

      {/* Results */}
      {batchResults && (
        <div>
          <h3>Results</h3>
          <pre>{JSON.stringify(batchResults, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default StockCheckForm;
```

## Integration with Existing Components

To integrate with your existing `StockCheckForm` component, replace the current hook usage:

```jsx
// Before (using useStockCheck for creation - not ideal)
const {
  /* ... */
} = useStockCheck();

// After (using the specialized creation hook)
const {
  products,
  selectedProducts,
  batchResults,
  searchProducts,
  addProductToSelection,
  removeProductFromSelection,
  updateExpectedQuantity,
  updateProductNotes,
  performBatchStockCheck,
  clearSelection,
  // ... other functions
} = useStockCheckCreation();
```

## Error Handling

The hook provides comprehensive error handling:

```jsx
const { error, productsError, clearError } = useStockCheckCreation();

// Handle errors
if (error || productsError) {
  return (
    <div className="error">
      <p>Error: {error || productsError}</p>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
}
```

## Dependencies

This hook depends on:

- `stockCheckService` from the service layer
- Formatters from `utils/stock-check`
- React hooks (`useState`, `useCallback`, `useRef`, `useEffect`)

## Notes

- The hook automatically handles debouncing for product search (300ms delay)
- Check references are automatically generated with timestamp and random suffix
- All API calls include proper error handling and loading states
- State is managed efficiently with proper cleanup on unmount
- Validation is built-in and can be extended as needed

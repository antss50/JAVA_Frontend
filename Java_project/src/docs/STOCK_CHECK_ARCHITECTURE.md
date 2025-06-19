# Stock Check System Architecture

## 📁 File Structure

```
src/
├── hooks/
│   └── useStockCheck.jsx                    # Custom hook with all API integrations
├── services/
│   └── inventory-related/
│       └── stock-check/
│           └── stockCheckService.js         # API service layer
├── utils/
│   └── stock-check/
│       ├── stockFormatter.jsx               # Data formatters
│       └── index.js                         # Centralized exports
├── page/
│   └── hanghoa/
│       ├── StockCheckManagement.jsx         # Main stock check listing
│       └── StockCheckForm.jsx               # New stock check form
└── components/
    └── stock-check/
        └── StockCheckExample.jsx            # Demo/example component
```

## 🏗️ Architecture Overview

### 1. **Custom Hook Layer** (`useStockCheck.jsx`)

- **Purpose**: Centralized state management and API integration
- **Features**:
  - All stock check operations (single, batch, management)
  - Product operations (search, fetch, selection)
  - Variance management
  - Summary and statistics
  - Export functionality
  - Search and filter utilities

### 2. **Service Layer** (`stockCheckService.js`)

- **Purpose**: API communication with automatic data formatting
- **Features**:
  - All API endpoints from documentation
  - Response unwrapping and error handling
  - Automatic formatting using formatters
  - Utility functions for request building

### 3. **Formatter Layer** (`stockFormatter.jsx`)

- **Purpose**: Data transformation for display
- **Features**:
  - Response unwrapping utilities
  - Stock check result formatters
  - Product list formatters (paginated)
  - Line item formatters for multiline interface
  - Helper formatting functions

### 4. **UI Components**

#### **StockCheckManagement.jsx**

- **Purpose**: Main stock check listing and management
- **Features**:
  - Search and filter functionality
  - Paginated results display
  - Summary statistics
  - Export to CSV
  - Variance processing
  - Navigation to form

#### **StockCheckForm.jsx**

- **Purpose**: Create new stock checks (single/batch)
- **Features**:
  - Product search with real-time results
  - Multiline stock check interface
  - Batch stock check execution
  - Results display with summary
  - Draft and completion modes

#### **StockCheckExample.jsx**

- **Purpose**: Demo component showing hook usage
- **Features**:
  - Navigation buttons to main components
  - Quick demo functionality
  - Summary statistics display
  - Recent results display

## 🔄 Data Flow

```
1. Component calls hook → useStockCheck
2. Hook calls service → stockCheckService
3. Service calls API → Backend
4. API response → Service (auto-formatted)
5. Formatted data → Hook state
6. Hook state → Component display
```

## 🎯 Key Features Implemented

### **Data Management**

- ✅ Response unwrapping from standard API format
- ✅ Domain-specific formatters (Stock Check Results, Products)
- ✅ Pagination handling
- ✅ Error state management
- ✅ Loading state management

### **Stock Check Operations**

- ✅ Single stock check
- ✅ Batch stock check
- ✅ Variance management
- ✅ Status filtering
- ✅ Date range filtering

### **Product Operations**

- ✅ Product search
- ✅ Product selection for stock checks
- ✅ Product details formatting

### **UI Features**

- ✅ Real-time search
- ✅ Multiline stock check interface
- ✅ Results display with status indicators
- ✅ Export functionality
- ✅ Responsive design

## 🚀 Usage Examples

### **Using the Hook**

```javascript
import useStockCheck from "../../hooks/useStockCheck.jsx";

const MyComponent = () => {
  const {
    products,
    selectedProducts,
    batchResults,
    addProductToSelection,
    performBatchStockCheck,
  } = useStockCheck();

  // All data is automatically formatted and ready for display
  // All operations are available as simple function calls
};
```

### **Direct Service Usage**

```javascript
import { stockCheckService } from "../../utils/stock-check";

// Get formatted products
const { products, pagination } = await stockCheckService.getProducts();

// Perform stock check
const result = await stockCheckService.performSingleStockCheck({
  productId: 123,
  expectedQuantity: 100,
});
```

### **Using Formatters Directly**

```javascript
import {
  formatStockCheckResult,
  unwrapApiResponse,
} from "../../utils/stock-check";

const apiResponse = await fetch("/api/stock-check");
const data = unwrapApiResponse(apiResponse);
const formattedResult = formatStockCheckResult(data);
```

## 🎨 Component Integration

### **Navigation Routes**

- `/hang-hoa/kiem-kho` → StockCheckManagement
- `/hang-hoa/kiem-kho-moi` → StockCheckForm
- `/hang-hoa/kiem-kho/demo` → StockCheckExample

### **Component Communication**

- Components use the `useStockCheck` hook for all operations
- Navigation between components maintains state
- Error handling is centralized in the hook
- Loading states are managed consistently

## 📱 UI/UX Features

### **Search & Filter**

- Real-time product search
- Status filtering (MATCH, SHORTAGE, OVERAGE)
- Date range filtering
- Clear filters functionality

### **Data Display**

- Formatted numbers and currencies
- Status indicators with colors
- Pagination controls
- Loading overlays

### **User Interactions**

- Product selection for stock checks
- Batch operations
- Export functionality
- Variance processing

## 🔧 Customization Points

### **Adding New Formatters**

Add new formatters to `stockFormatter.jsx` for new data types.

### **Adding New API Endpoints**

Add new functions to `stockCheckService.js` with automatic formatting.

### **Extending the Hook**

Add new operations to `useStockCheck.jsx` for additional functionality.

### **Creating New Components**

Use the hook for state management and display formatted data.

This architecture provides a clean separation of concerns, reusable components, and a consistent data flow that makes the stock check system maintainable and extensible.

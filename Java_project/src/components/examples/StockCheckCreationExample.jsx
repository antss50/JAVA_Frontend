// src/components/examples/StockCheckCreationExample.jsx

import React, { useState } from "react";
import { useStockCheckCreation } from "../../hooks/useStockCheckCreation";

/**
 * Example component demonstrating how to use the useStockCheckCreation hook
 * This shows the basic workflow for creating stock checks
 */
const StockCheckCreationExample = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedBy, setCheckedBy] = useState("");
  const [checkReference, setCheckReference] = useState("");

  const {
    // State
    products,
    selectedProducts,
    batchResults,

    // Loading states
    productsLoading,
    batchLoading,
    isLoading,

    // Error states
    error,
    productsError,

    // Product management
    searchProducts,
    addProductToSelection,
    removeProductFromSelection,
    updateExpectedQuantity,
    updateProductNotes,
    clearSelection,

    // Stock check operations
    performBatchStockCheck,

    // Utilities
    generateCheckReference,
    clearResults,
    clearError,
    resetState,

    // Validation
    isSelectionValid,
    validateSelection,

    // Computed values
    totalSelectedProducts,
    totalExpectedQuantity,
    hasResults,
  } = useStockCheckCreation();

  // Initialize check reference
  React.useEffect(() => {
    if (!checkReference) {
      setCheckReference(generateCheckReference());
    }
  }, [checkReference, generateCheckReference]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      searchProducts(query);
    }
  };

  const handlePerformBatchCheck = async () => {
    if (!checkedBy.trim()) {
      alert("Please enter who is performing the check");
      return;
    }

    if (!isSelectionValid()) {
      const errors = validateSelection();
      alert("Validation errors:\n" + errors.join("\n"));
      return;
    }

    try {
      await performBatchStockCheck({
        checkedBy: checkedBy.trim(),
        checkReference: checkReference,
      });
      alert("Batch stock check completed successfully!");
    } catch (err) {
      alert("Failed to perform stock check: " + err.message);
    }
  };

  const handleNewCheck = () => {
    clearResults();
    clearSelection();
    setCheckReference(generateCheckReference());
    setCheckedBy("");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h2>Stock Check Creation Example</h2>

      {/* Error Display */}
      {(error || productsError) && (
        <div
          style={{
            backgroundColor: "#ffebee",
            color: "#c62828",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <strong>Error:</strong> {error || productsError}
          <button
            onClick={clearError}
            style={{ marginLeft: "10px", padding: "2px 8px" }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Search Section */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Search Products</h3>
        <input
          type="text"
          placeholder="Search products by name or code (min 2 characters)..."
          value={searchQuery}
          onChange={handleSearch}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        />

        {productsLoading && (
          <div style={{ marginTop: "10px" }}>Searching...</div>
        )}

        {products.length > 0 && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "4px",
              marginTop: "10px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => addProductToSelection(product)}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.backgroundColor = "#f5f5f5")
                }
                onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
              >
                <div>
                  <strong>{product.name}</strong>
                  <div style={{ fontSize: "14px", color: "#666" }}>
                    Current Stock: {product.currentStock} {product.unit}
                  </div>
                </div>
                <button
                  style={{
                    padding: "5px 10px",
                    backgroundColor: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check Information */}
      <div
        style={{
          marginBottom: "20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <div>
          <label>
            Checked By:
            <input
              type="text"
              value={checkedBy}
              onChange={(e) => setCheckedBy(e.target.value)}
              placeholder="Enter your name"
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </label>
        </div>
        <div>
          <label>
            Check Reference:
            <input
              type="text"
              value={checkReference}
              onChange={(e) => setCheckReference(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginTop: "5px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </label>
        </div>
      </div>

      {/* Selected Products */}
      <div style={{ marginBottom: "20px" }}>
        <h3>
          Selected Products ({totalSelectedProducts})
          {totalSelectedProducts > 0 && (
            <span
              style={{
                fontSize: "14px",
                fontWeight: "normal",
                marginLeft: "10px",
              }}
            >
              Total Expected: {totalExpectedQuantity}
            </span>
          )}
        </h3>

        {selectedProducts.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#666",
              border: "2px dashed #ddd",
              borderRadius: "4px",
            }}
          >
            No products selected. Use the search above to add products.
          </div>
        ) : (
          <div style={{ border: "1px solid #ddd", borderRadius: "4px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f5f5f5" }}>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Product
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Current Stock
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "right",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Expected Qty
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Notes
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((product, index) => (
                  <tr
                    key={product.id}
                    style={{ borderBottom: "1px solid #eee" }}
                  >
                    <td style={{ padding: "10px" }}>
                      <strong>{product.name}</strong>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        ID: {product.id}
                      </div>
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      {product.currentStock} {product.unit}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <input
                        type="number"
                        value={product.expectedQuantity || ""}
                        onChange={(e) =>
                          updateExpectedQuantity(product.id, e.target.value)
                        }
                        min="0"
                        step="0.01"
                        style={{
                          width: "100px",
                          padding: "5px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          textAlign: "right",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px" }}>
                      <input
                        type="text"
                        value={product.notes || ""}
                        onChange={(e) =>
                          updateProductNotes(product.id, e.target.value)
                        }
                        placeholder="Notes..."
                        style={{
                          width: "100%",
                          padding: "5px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px", textAlign: "center" }}>
                      <button
                        onClick={() => removeProductFromSelection(product.id)}
                        style={{
                          padding: "5px 10px",
                          backgroundColor: "#f44336",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={handlePerformBatchCheck}
          disabled={
            batchLoading || selectedProducts.length === 0 || !checkedBy.trim()
          }
          style={{
            padding: "10px 20px",
            backgroundColor:
              selectedProducts.length > 0 && checkedBy.trim()
                ? "#4caf50"
                : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              selectedProducts.length > 0 && checkedBy.trim()
                ? "pointer"
                : "not-allowed",
            fontSize: "16px",
          }}
        >
          {batchLoading ? "Performing Check..." : "Perform Batch Stock Check"}
        </button>

        <button
          onClick={clearSelection}
          disabled={selectedProducts.length === 0}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ff9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedProducts.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Clear Selection
        </button>

        <button
          onClick={handleNewCheck}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          New Check
        </button>

        <button
          onClick={resetState}
          style={{
            padding: "10px 20px",
            backgroundColor: "#757575",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Reset All
        </button>
      </div>

      {/* Results Display */}
      {hasResults && batchResults && (
        <div style={{ marginTop: "20px" }}>
          <h3>Batch Check Results</h3>
          <div
            style={{
              backgroundColor: "#e8f5e8",
              padding: "15px",
              borderRadius: "4px",
              border: "1px solid #4caf50",
            }}
          >
            <div style={{ marginBottom: "10px" }}>
              <strong>Summary:</strong>
            </div>
            <div>Total Items: {batchResults.summary?.totalItems || 0}</div>
            <div>
              Items with Variance:{" "}
              {batchResults.summary?.itemsWithVariance || 0}
            </div>
            <div>
              Check Reference: {batchResults.summary?.checkReference || "N/A"}
            </div>

            {batchResults.results && batchResults.results.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <strong>Individual Results:</strong>
                <div
                  style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    marginTop: "10px",
                  }}
                >
                  {batchResults.results.map((result, index) => (
                    <div
                      key={index}
                      style={{
                        padding: "8px",
                        margin: "5px 0",
                        backgroundColor: result.hasVariance
                          ? "#ffebee"
                          : "#f1f8e9",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    >
                      <strong>{result.productName || "Product"}</strong> -
                      Status: {result.checkStatus}
                      {result.hasVariance && ` (Variance: ${result.variance})`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0,0,0,0.8)",
            color: "white",
            padding: "20px",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        >
          Processing...
        </div>
      )}
    </div>
  );
};

export default StockCheckCreationExample;

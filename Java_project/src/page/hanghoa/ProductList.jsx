import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import "./product.css";
import { useState, useEffect } from "react";

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [editProductId, setEditProductId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const initialProduct = {
        categoryId: "",
        name: "",
        unit: "",
        purchasePrice: 0,
        sellingPrice: 0,
    };
    
    const [newProduct, setNewProduct] = useState(initialProduct);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/products`, {
                    headers: {
                        Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();

                setProducts(result.content || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/categories`, {
                    headers: {
                        Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();

                setCategories(result.content || []);
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleSearch = async (name) => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products/search?query=${encodeURIComponent(name)}`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setProducts(result.content || result);
            } else {
                console.error('Failed to search product. Status:', response.status);
            }
        } catch (error) {
            console.error('Error searching product:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleNewProduct = async () => {
        setLoading(true);

        const payload = newProduct;

        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok || response.status === 201) {
                const result = await response.json();
                const category = categories.find(cat => cat.id === result.categoryId);

                setProducts((prev) => [...prev, result]);
                setShowCreateModal(false);
                setNewProduct(initialProduct);
            } else {
                console.log("Tạo không thành công. Status: " + response.status);
            }
        } catch (error) {
            console.error('Error creating product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeteleProduct = async (productId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products/${productId}`, {
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    'Content-Type': 'application/json'
                },
                method: 'DELETE'
            });
            if (response.ok) {

                setProducts((prev) => prev.filter(p => p.id !== productId));
            } else {
                console.error('Xoá không thành công. Status:', response.status);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleEditProduct = async (productId) => {
        const updatedProduct = {
            categoryId: newProduct.categoryId,
            name: newProduct.name,
            unit: newProduct.unit,
            purchasePrice: newProduct.purchasePrice,
            sellingPrice: newProduct.sellingPrice,
        };
        console.log("Dữ liệu gửi cập nhật:", updatedProduct);
        console.log("productId:", productId)
        try {
            const response = await fetch(`http://localhost:8080/api/inventory/products/${productId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(updatedProduct)
            });

            if (!response.ok) {
                throw new Error("Cập nhật thất bại");
            }

            const updated = await response.json();


            setProducts(products.map(p => p.id === productId ? updated : p));
            setShowCreateModal(false);
            setNewProduct(initialProduct);
            setEditProductId(null);
        } catch (error) {
            console.error("Lỗi cập nhật:", error);

        }
    };

    return (
        <div className="full-container">
            <Header></Header>
            <Navbar></Navbar>
            <div className="kiemkho-container">
                <form className="kiemkho-search-box">
                    <h4>Tìm kiếm</h4>
                    <input
                        type="text"
                        placeholder="Nhập tên sản phẩm"
                        className="kiemkho-input text-black"
                        value={searchTerm}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchTerm(value);
                            handleSearch(value);
                        }}
                    />
                </form>

                <div className="kiemkho-main-content">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">DANH SÁCH SẢN PHẨM</h2>
                        <button
                            className="kiemkho-button btn btn-success p-2"
                            onClick={() => setShowCreateModal(true)}
                        >
                            + Tạo Sản Phẩm
                        </button>
                    </div>

                    {showCreateModal && (
                        <div className="modal show fade d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Tạo Sản Phẩm Mới</h5>
                                        <button className="btn-close" onClick={() => setShowCreateModal(false)} />
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Tên Sản Phẩm</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.name}
                                                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Phân Loại</label>
                                            <select
                                                className="form-select"
                                                value={newProduct.categoryId}
                                                onChange={(e) =>
                                                    setNewProduct({
                                                        ...newProduct,
                                                        categoryId: parseInt(e.target.value, 10)
                                                    }
                                                    )
                                                }
                                            >
                                                <option value="">Chọn loại hàng</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Đơn Vị Tính</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.unit}
                                                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Giá Nhập</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.purchasePrice}
                                                onChange={(e) => setNewProduct({ ...newProduct, purchasePrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Giá Bán</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newProduct.sellingPrice}
                                                onChange={(e) => setNewProduct({ ...newProduct, sellingPrice: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                setEditProductId(null);
                                                setNewProduct(initialProduct);
                                            }}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={editProductId ? () => handleEditProduct(editProductId) : handleNewProduct}
                                        >
                                            {editProductId ? "Lưu" : "Tạo"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <table className="kiemkho-table">
                        <thead>
                            <tr>
                                <th>Id</th>
                                <th>Tên Sản Phẩm</th>
                                <th>Phân Loại</th>
                                <th>Đơn Vị</th>
                                <th>Giá Nhập</th>
                                <th>Giá Bán</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>{product.id}</td>
                                    <td>{product.name}</td>
                                    <td>{product.categoryName}</td>
                                    <td>{product.unit}</td>
                                    <td>{product.purchasePrice}</td>
                                    <td>{product.sellingPrice}</td>
                                    <td>
                                        <button className="btn btn-danger fs-5 p-0 px-2" onClick={() => handleDeteleProduct(product.id)}>🗑︎</button>
                                        <button
                                            className="btn fw-bold"
                                            onClick={() => {
                                                console.log("🔍 Product cần cập nhật:", product);
                                                console.log("📦 Category của sản phẩm:", product.category);
                                                setEditProductId(product.id);
                                                setNewProduct({
                                                    categoryId: product.categoryId,
                                                    name: product.name,
                                                    unit: product.unit,
                                                    purchasePrice: product.purchasePrice,
                                                    sellingPrice: product.sellingPrice,
                                                });
                                                setShowCreateModal(true);
                                            }}
                                        >
                                            Cập Nhật
                                        </button>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default ProductList;
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import { useState, useEffect } from "react";
import ToastMessage from "../../component/ToastMessage";
import "../../App.css";
import "../hanghoa/product.css";
const SaleAnalyze = () => {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [customerId, setCustomerId] = useState("");

    // ✅ Toast state
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");


    const token = "eyJhbGciOiJIUzM4NCJ9.eyJzdWIiOiJhZG1pbiIsInVzZXJJZCI6MSwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImF1dGhvcml0aWVzIjpbIlJPTEVfQURNSU4iXSwiaWF0IjoxNzQ5ODkwODM5LCJleHAiOjE3NDk5NzcyMzl9.PXFgkGBcwJsCsP9h42_akOHeiwNwILaZXLZGM2XeQ41BrMWxzpaqpSSbaPA7Aob6";
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/products`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    method: 'GET'
                });

                const result = await response.json();
                setProducts(result.content || []);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);

    const handleSelect = (product) => {
        setSelectedProducts(prev => {
            const exists = prev.find(p => p.productId === product.id);
            if (exists) {
                // Uncheck: remove from selection
                return prev.filter(p => p.productId !== product.id);
            } else {
                // Check: add new with default quantity = 1
                return [...prev, {
                    productId: product.id,
                    productName: product.name,
                    quantity: 1,
                    unitPrice: product.sellingPrice,
                    lineTotal: product.sellingPrice
                }];
            }
        });
    };

    const handleQuantityChange = (productId, quantity) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.productId === productId
                    ? { ...p, quantity: quantity, lineTotal: quantity * p.unitPrice }
                    : p
            )
        );
    };

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            customerId: parseInt(customerId), // đảm bảo đúng kiểu số
            saleTimestamp: new Date().toISOString(), // thời gian hiện tại ISO format
            orderLines: selectedProducts.map(p => ({
                productId: p.productId,
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                lineTotal: parseFloat((p.quantity * p.sellingPrice).toFixed(2)),
            })),
        };

        try {
            const response = await fetch('http://localhost:8080/api/sales/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                showToast("Tạo đơn hàng thành công!", "success");
                setSelectedProducts([]);
                setCustomerId("");
                console.log(data);
            } else {
                const errorData = await response.json();
                console.error('Tạo đơn hàng thất bại:', errorData);
                showToast(`Tạo đơn hàng thất bại: ${errorData.message}`, "danger");
            }
        } catch (err) {
            console.error('Lỗi khi gửi đơn hàng:', err);
            alert('Lỗi khi gửi đơn hàng!');
        }
    };

    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.lineTotal, 0);

    return (
        <div className="full-container">
            <Header />
            <Navbar />
            <div className="d-flex">
                <div className="sale-analyze-container d-flex flex-wrap flex-md-nowrap gap-4">
                    <div className="sale-analyze-left rounded-2 flex-fill">
                        <table className="table table-bordered table-hover">
                            <thead className="table-primary">
                                <tr>
                                    <th>Id</th>
                                    <th>Tên Sản Phẩm</th>
                                    <th>Phân Loại</th>
                                    <th>Đơn Vị</th>
                                    <th>Giá Bán</th>
                                    <th>Chọn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.id}</td>
                                        <td>{product.name}</td>
                                        <td>{product.categoryName}</td>
                                        <td>{product.unit}</td>
                                        <td>{product.sellingPrice.toLocaleString()} VNĐ</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.some(p => p.productId === product.id)}
                                                onChange={() => handleSelect(product)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="sale-analyze-right p-5 flex-fill w-25">
                        <form onSubmit={handleSubmit} className="form" style={{maxHeight: '80vh'}}>
                            <div className="mb-3">
                                <label className="form-label">Mã Khách Hàng:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    placeholder="Nhập mã khách hàng"
                                    required
                                />
                            </div>

                            <h6 className="fw-bold">Sản Phẩm Đã Chọn:</h6>
                            {selectedProducts.map((item) => (
                                <div key={item.productId} className="sale-analyze-product">
                                    <span>{item.productName}</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.productId, parseFloat(e.target.value))}
                                        className="form-control"
                                    />
                                    <span>{item.lineTotal.toLocaleString()}đ</span>
                                </div>
                            ))}

                            <div className="sale-analyze-total">
                                Tổng tiền: {totalAmount.toLocaleString()}đ
                            </div>

                            <button type="submit" className="btn btn-success sale-analyze-create-btn">
                                Tạo
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <ToastMessage
                show={toastShow}
                onClose={() => setToastShow(false)}
                message={toastMessage}
                variant={toastVariant}
            />
        </div>
    );
};

export default SaleAnalyze;

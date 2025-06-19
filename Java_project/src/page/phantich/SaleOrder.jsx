import { useState, useEffect } from "react";
import ToastMessage from "../../component/ToastMessage";
import "../../App.css";
import "../hanghoa/product.css";
const SaleOrder = () => {
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const size = 20;

    // ✅ Toast state
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");


    const token = "";
    useEffect(() => {
        const fetchPagedProducts = async () => {
            try {
                const response = await fetch(`http://localhost:8080/api/inventory/products?page=${currentPage}&size=${size}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const result = await response.json();
                setProducts(result.content || []);
                setTotalPages(result.totalPages || 1);
            } catch (error) {
                console.error("Lỗi khi tải trang sản phẩm:", error);
            }
        };

        fetchPagedProducts();
    }, [currentPage]);

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

    const getOrCreateCustomerId = async () => {
        try {
            // 1. Lấy danh sách tất cả parties
            const res = await fetch("http://localhost:8080/api/parties", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const parties = await res.json();

            // 2. Kiểm tra khách hàng có tồn tại không (lọc bằng name + phone)
            const existing = parties.find(
                p => p.name === customerName && p.phone === customerPhone && p.partyType === "CUSTOMER"
            );

            if (existing) {
                return existing.id; // Khách hàng đã tồn tại
            }

            // 3. Tạo khách hàng mới
            const createRes = await fetch("http://localhost:8080/api/parties", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: customerName,
                    phone: customerPhone,
                    partyType: "CUSTOMER",
                    active: true
                })
            });

            if (!createRes.ok) {
                const error = await createRes.json();
                throw new Error(error.message || "Không thể tạo khách hàng");
            }

            const newParty = await createRes.json();
            return newParty.id;
        } catch (err) {
            showToast(`Lỗi khách hàng: ${err.message}`, "danger");
            throw err;
        }
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

        try {
            const customerId = await getOrCreateCustomerId();

            const payload = {
                customerId: customerId,
                saleTimestamp: new Date().toISOString(),
                orderLines: selectedProducts.map(p => ({
                    productId: p.productId,
                    quantity: p.quantity,
                    unitPrice: p.unitPrice,
                    lineTotal: parseFloat((p.quantity * p.unitPrice).toFixed(2)),
                })),
            };

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
                setCustomerName("");
                setCustomerPhone("");
            } else {
                const errorData = await response.json();
                showToast(`Tạo đơn hàng thất bại: ${errorData.message}`, "danger");
            }
        } catch (err) {
            console.error(err);
        }
    };


    const totalAmount = selectedProducts.reduce((sum, p) => sum + p.lineTotal, 0);

    return (
        <div className="full-container">
            <div className="sale-analyze-container d-flex flex-wrap flex-md-nowrap gap-4">
                <div className="left-container">
                    <div className="sale-analyze-left rounded-2">
                        <table className="kiemkho-table">
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
                        <nav className="mt-3">
                            <ul className="pagination justify-content-center">
                                {[...Array(totalPages).keys()].map((page) => (
                                    <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(page)}>
                                            {page + 1}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>
                </div>
                <div className="sale-analyze-right p-5 flex-fill w-25">
                    <form onSubmit={handleSubmit} className="form" style={{ maxHeight: '80vh' }}>
                        <div className="mb-3">
                            <label className="form-label">Tên Khách Hàng:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="Nhập mã khách hàng"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Số điện thoại:</label>
                            <input
                                type="text"
                                className="form-control"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                placeholder="Nhập số điện thoại"
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

            <ToastMessage
                show={toastShow}
                onClose={() => setToastShow(false)}
                message={toastMessage}
                variant={toastVariant}
            />
        </div>
    );
};

export default SaleOrder;

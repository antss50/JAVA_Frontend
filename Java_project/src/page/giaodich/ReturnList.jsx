// File: ReturnList.jsx
import { useEffect, useState } from "react";

const ReturnList = () => {
    const [returns, setReturns] = useState([]);
    const token = ""; // Token của bạn

    useEffect(() => {
        const fetchReturns = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/inventory/stock/movements/type/RETURN", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const result = await res.json();
                if (result.success) {
                    setReturns(result.data || []);
                } else {
                    console.error("Không lấy được dữ liệu trả hàng");
                }
            } catch (err) {
                console.error("Lỗi khi tải danh sách trả hàng:", err);
            }
        };

        fetchReturns();
    }, []);

    return (
        <div className="full-container mt-4">
            <div className="p-5">
                <h3 className="mb-5">PHIẾU TRẢ HÀNG</h3>
                <table className="table table-hover mb-0">
                    <thead className="table-primary text-center">
                        <tr>
                            <th>Mã phiếu</th>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Ngày trả</th>
                            <th>Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {returns.map((item) => (
                            <tr key={item.id}>
                                <td>
                                    <span className="badge bg-secondary">{item.id}</span>
                                </td>
                                <td className="fw-bold">{item.productName}</td>
                                <td>{item.quantity}</td>
                                <td>{new Date(item.eventTimestamp).toLocaleString("vi-VN")}</td>
                                <td>{item.notes || "Không có ghi chú"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReturnList;

import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import ToastMessage from "../../component/ToastMessage";

const ReturnPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { customerId, orderId, orderLines } = location.state || {};
    const [returnReason, setReturnReason] = useState("");
    const [returnData, setReturnData] = useState(
        orderLines?.map(line => ({
            ...line,
            quantityReturned: 0,
            returnAction: "DESTROY"
        })) || []
    );

    const token = "";

    // ✅ Toast state
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                customerId,
                orderId,
                reason: returnReason,
                returnLines: returnData
                    .filter(line => line.quantityReturned > 0)
                    .map(line => ({
                        productId: line.productId,
                        id: line.lineId || line.id,
                        originalOrderLineId: line.lineId || line.id,
                        unitPrice: line.unitPrice,
                        quantityReturned: line.quantityReturned,
                        returnAction: line.returnAction
                    }))
            };

            const res = await fetch(`http://localhost:8080/api/sales/orders/${orderId}/customer-return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                showToast("Trả hàng thành công!", "success")
                navigate("/giao-dich/tra-hang");
            } else {
                const err = await res.json();
                showToast(`Trả hàng thất bại: ${err.message}`, "danger");
            }
        } catch (error) {
            console.error("Return error", error);
            alert("Gửi trả hàng thất bại");
        }
    };

    const updateReturnLine = (index, field, value) => {
        const updated = [...returnData];
        updated[index][field] = value;
        setReturnData(updated);
    };

    return (
        <>
            <div className="full-container mt-5 p-3">
                <h3 className="mb-4">Trả hàng - Đơn hàng số:<span className="text-danger ms-2">{orderId}</span></h3>
                <form className="w-75 mx-auto fs-5" onSubmit={handleReturnSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Lý do trả hàng</label>
                        <input
                            className="form-control"
                            type="text"
                            required
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                        />
                    </div>

                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>Tên sản phẩm</th>
                                <th>SL mua</th>
                                <th>SL trả</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnData.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>
                                        <input
                                            type="number"
                                            min={0}
                                            max={item.quantity}
                                            className="form-control"
                                            value={item.quantityReturned}
                                            onChange={(e) => updateReturnLine(idx, 'quantityReturned', parseFloat(e.target.value))}
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="form-select"
                                            value={item.returnAction}
                                            onChange={(e) => updateReturnLine(idx, 'returnAction', e.target.value)}>
                                            <option value="DESTROY">Hủy</option>
                                            <option value="RETURN_TO_SUPPLIER">Trả NCC</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div>
                        <button className="btn btn-success me-3">
                            Xác nhận trả hàng
                        </button>
                        <button className="btn btn-danger" onClick={() => navigate("/giao-dich/hoa-don")}>
                            Huỷ
                        </button>
                    </div>
                </form>
            </div>
            <ToastMessage
                show={toastShow}
                onClose={() => setToastShow(false)}
                message={toastMessage}
                variant={toastVariant}
            />
        </>
    );
};

export default ReturnPage;

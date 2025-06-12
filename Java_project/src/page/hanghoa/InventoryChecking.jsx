import { useNavigate } from "react-router-dom";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
import "./product.css";

const InventoryChecking = () => {
    const navigate = useNavigate();

    return (
        <div className="full-container">
            <Header></Header>
            <Navbar></Navbar>
            <div className="kiemkho-container">
                <div className="kiemkho-search-box">
                    <h4>Tìm kiếm</h4>
                    <input
                        type="text"
                        placeholder="Nhập mã phiếu kiểm"
                        className="kiemkho-input"
                    />
                    <input
                        type="text"
                        placeholder="Nhập mã hoặc tên hàng"
                        className="kiemkho-input"
                    />
                </div>

                <div className="kiemkho-main-content">
                    <div className="kiemkho-header">
                        <h2 className="kiemkho-title">PHIẾU KIỂM KHO</h2>
                        <button
                            className="kiemkho-button"
                            onClick={() => navigate("/hang-hoa/kiem-kho-chi-tiet")}
                        >
                            + Kiểm kho
                        </button>
                    </div>

                    <table className="kiemkho-table">
                        <thead>
                            <tr>
                                <th>Mã kiểm kho</th>
                                <th>Thời gian</th>
                                <th>Ngày cân bằng</th>
                                <th>Tổng chênh lệch</th>
                                <th>SL lệch tăng</th>
                                <th>SL lệch giảm</th>
                                <th>Ghi chú</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>KK001</td>
                                <td>10:00 06/06/2025</td>
                                <td>07/06/2025</td>
                                <td>+5</td>
                                <td>8</td>
                                <td>3</td>
                                <td>Kiểm kho định kỳ</td>
                                <td>Đã hoàn tất</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
export default InventoryChecking;
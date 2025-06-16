import "./transaction.css"

const ImportProduct = () => {
    return (
        <div className="nhaphang-container full-container">
            <div className="nhaphang-search-box">
                <h4>Tìm kiếm</h4>
                <input
                    type="text"
                    placeholder="Nhập mã nhập hàng"
                    className="nhaphang-input"
                />
                <input
                    type="text"
                    placeholder="Nhập tên hoặc mã nhà cung cấp"
                    className="nhaphang-input"
                />
            </div>

            <div className="nhaphang-main-content">
                <div className="nhaphang-header">
                    <h2 className="nhaphang-title">PHIẾU NHẬP HÀNG</h2>
                    <button className="nhaphang-button">+ Nhập hàng</button>
                </div>

                <table className="nhaphang-table">
                    <thead>
                        <tr>
                            <th>Mã nhập hàng</th>
                            <th>Thời gian</th>
                            <th>Nhà cung cấp</th>
                            <th>Cần trả NCC</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>NH001</td>
                            <td>10:30 06/06/2025</td>
                            <td>Công ty ABC</td>
                            <td>12,000,000đ</td>
                            <td>Hoàn tất</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default ImportProduct;
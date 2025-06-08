import React from "react";
import "./XuatHuy.css";

export default function XuatHuy() {
  return (
    <div className="xuathuy-container">
      <div className="xuathuy-search-box">
        <h4>Tìm kiếm</h4>
        <input
          type="text"
          placeholder="Nhập mã xuất hủy"
          className="xuathuy-input"
        />
        <input
          type="text"
          placeholder="Nhập tên chi nhánh"
          className="xuathuy-input"
        />
      </div>

      <div className="xuathuy-main-content">
        <div className="xuathuy-header">
          <h2 className="xuathuy-title">PHIẾU XUẤT HUỶ</h2>
          <button className="xuathuy-button">+ Xuất huỷ</button>
        </div>

        <table className="xuathuy-table">
          <thead>
            <tr>
              <th>Mã xuất hủy</th>
              <th>Thời gian</th>
              <th>Chi nhánh</th>
              <th>Tổng giá trị</th>
              <th>Ghi chú</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>XH001</td>
              <td>09:45 06/06/2025</td>
              <td>Chi nhánh Hà Nội</td>
              <td>2,500,000đ</td>
              <td>Hàng hỏng do vận chuyển</td>
              <td>Đã xác nhận</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
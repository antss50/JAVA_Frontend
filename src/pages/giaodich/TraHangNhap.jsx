import React from "react";
import "./TraHangNhap.css";

export default function TraHangNhap() {
  return (
    <div className="trahang-container">
      <div className="trahang-search-box">
        <h4>Tìm kiếm</h4>
        <input
          type="text"
          placeholder="Nhập mã trả hàng"
          className="trahang-input"
        />
        <input
          type="text"
          placeholder="Nhập tên hoặc mã nhà cung cấp"
          className="trahang-input"
        />
      </div>

      <div className="trahang-main-content">
        <div className="trahang-header">
          <h2 className="trahang-title">PHIẾU TRẢ HÀNG NHẬP</h2>
          <button className="trahang-button">+ Trả hàng</button>
        </div>

        <table className="trahang-table">
          <thead>
            <tr>
              <th>Mã trả hàng nhập</th>
              <th>Thời gian</th>
              <th>Nhà cung cấp</th>
              <th>Tổng tiền hàng trả</th>
              <th>Giảm giá</th>
              <th>NCC cần trả</th>
              <th>NCC đã trả</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>TH001</td>
              <td>14:15 06/06/2025</td>
              <td>Công ty XYZ</td>
              <td>8,000,000đ</td>
              <td>500,000đ</td>
              <td>7,500,000đ</td>
              <td>7,500,000đ</td>
              <td>Đã thanh toán</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
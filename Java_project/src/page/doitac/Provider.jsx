import React from "react";
import "./Provider.css";
import Header from "../../component/Header";
import Navbar from "../../component/Navbar";
const Provider = ()  => {
  return (
    <div className="ncc-container full-container">
      <Header></Header>
      <Navbar></Navbar>
      <div className="ncc-search-box">
        <h4>Tìm kiếm</h4>
        <input
          type="text"
          placeholder="Nhập mã nhà cung cấp"
          className="ncc-input"
        />
        <input
          type="text"
          placeholder="Nhập tên nhà cung cấp"
          className="ncc-input"
        />
      </div>

      <div className="ncc-main-content">
        <div className="ncc-header">
          <h2 className="ncc-title">NHÀ CUNG CẤP</h2>
          <button className="ncc-button">+ Thêm nhà cung cấp</button>
        </div>

        <table className="ncc-table">
          <thead>
            <tr>
              <th>Mã nhà cung cấp</th>
              <th>Tên nhà cung cấp</th>
              <th>Điện thoại</th>
              <th>Email</th>
              <th>Nợ cần trả hiện tại</th>
              <th>Tổng mua</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NCC001</td>
              <td>Công ty TNHH ABC</td>
              <td>0901234567</td>
              <td>abc@example.com</td>
              <td>5.000.000đ</td>
              <td>120.000.000đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Provider;
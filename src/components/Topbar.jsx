// src/components/Topbar.jsx
import React from "react";
import "./Topbar.css";

const Topbar = () => {
  return (
    <div className="topbar">
      <div className="topbar-left">PHẦN MỀM QUẢN LÝ HÀNG HOÁ</div>
      <div className="topbar-right">
        <button className="login-btn">Tài khoản</button>
      </div>
    </div>
  );
};

export default Topbar;
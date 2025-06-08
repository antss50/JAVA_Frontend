import React, { useState } from "react";
import { FaList } from "react-icons/fa";
import "./KiemKhoChiTiet.css";

export default function KiemKhoChiTiet() {
  const [showPopup, setShowPopup] = useState(false);
  const [search, setSearch] = useState("");
  
  // State quản lý nhóm hàng được chọn (có thể chọn nhiều)
  const [selectedGroups, setSelectedGroups] = useState([]);

  const togglePopup = () => setShowPopup(!showPopup);

  // Danh sách nhóm hàng
  const groups = ["Đồ uống", "Nguyên vật liệu", "Khác"];

  // Xử lý chọn / bỏ chọn checkbox nhóm hàng
  const handleCheckboxChange = (group) => {
    setSelectedGroups(prev => {
      if (prev.includes(group)) {
        return prev.filter(g => g !== group);
      } else {
        return [...prev, group];
      }
    });
  };

  return (
    <div className="kiemkhochitiet-container">
      {/* Tìm kiếm sản phẩm */}
      <div className="kiemkhochitiet-search">
        <input
          type="text"
          placeholder="Nhập tên hoặc mã sản phẩm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={togglePopup} className="group-btn">
          <FaList />
        </button>
      </div>

      {/* Popup chọn nhóm hàng */}
      {showPopup && (
        <div className="popup-overlay" onClick={togglePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h4>Chọn nhóm hàng</h4>
            <form>
              {groups.map((group) => (
                <label key={group} style={{ display: "block", marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedGroups.includes(group)}
                    onChange={() => handleCheckboxChange(group)}
                  />
                  {" "}{group}
                </label>
              ))}
            </form>
            <button onClick={togglePopup}>Đóng</button>
          </div>
        </div>
      )}

      {/* Bảng kiểm kho */}
      <div className="kiemkhochitiet-table-section">
        <table className="kiemkhochitiet-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã hàng hóa</th>
              <th>Tên hàng</th>
              <th>Tồn kho</th>
              <th>Thực tế</th>
              <th>SL lệch</th>
              <th>Giá trị lệch</th>
            </tr>
          </thead>
          <tbody>
            {/* Dữ liệu giả */}
            <tr>
              <td>1</td>
              <td>SP001</td>
              <td>Trà sữa</td>
              <td>50</td>
              <td><input type="number" defaultValue={50} /></td>
              <td>0</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>

        {/* Thông tin bên phải */}
        <div className="kiemkhochitiet-info">
          <label>
            Nhân viên kiểm
            <input type="text" defaultValue="Nguyễn Văn A" />
          </label>
          <label>
            Ngày kiểm
            <input type="date" />
          </label>
          <label>
            Mã phiếu kiểm
            <input type="text" defaultValue="KK20250606-001" />
          </label>
          <label>
            Trạng thái
            <select>
              <option>Nháp</option>
              <option>Hoàn thành</option>
            </select>
          </label>
          <label>
            Tổng SL thực tế
            <input type="number" defaultValue={0} readOnly />
          </label>
          <label>
            Ghi chú
            <textarea />
          </label>
        </div>
      </div>

      {/* Nút lưu */}
      <div className="kiemkhochitiet-buttons">
        <button className="draft">Lưu tạm</button>
        <button className="submit">Hoàn thành</button>
      </div>
    </div>
  );
}
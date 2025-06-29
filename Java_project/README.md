# Hệ Thống Quản Lý Kho Hàng - Frontend

Đây là ứng dụng frontend cho hệ thống quản lý kho hàng được xây dựng bằng React + Vite.

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt](#cài-đặt)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Cấu Trúc Dự Án](#cấu-trúc-dự-án)
- [Tính Năng Chính](#tính-năng-chính)
- [Cấu Hình](#cấu-hình)
- [Scripts Có Sẵn](#scripts-có-sẵn)
- [Xử Lý Sự Cố](#xử-lý-sự-cố)

## 🖥️ Yêu Cầu Hệ Thống

Trước khi bắt đầu, hãy đảm bảo máy tính của bạn đã cài đặt:

- **Node.js** (phiên bản 16.0 trở lên) - [Tải tại đây](https://nodejs.org/)
- **npm** (đi kèm với Node.js) hoặc **yarn**
- **Git** (tùy chọn) - [Tải tại đây](https://git-scm.com/)

### Kiểm Tra Phiên Bản

Mở Command Prompt hoặc PowerShell và chạy các lệnh sau để kiểm tra:

```bash
node --version
npm --version
```

## 🚀 Cài Đặt

### Bước 1: Tải Mã Nguồn

Nếu bạn có Git:

```bash
git clone [repository-url]
cd Java_project
```

Hoặc tải file zip và giải nén vào thư mục `Java_project`.

### Bước 2: Cài Đặt Dependencies

Mở terminal/command prompt tại thư mục dự án và chạy:

```bash
npm install
```

Lệnh này sẽ cài đặt tất cả các package cần thiết được liệt kê trong `package.json`.

## ▶️ Chạy Ứng Dụng

### Chế Độ Development (Phát Triển)

```bash
npm run dev
```

Sau khi chạy lệnh trên:

- Ứng dụng sẽ mở tại: `http://localhost:5173`
- Server sẽ tự động reload khi bạn thay đổi code
- Mở trình duyệt và truy cập địa chỉ trên để xem ứng dụng

### Build cho Production

```bash
npm run build
```

### Xem Preview của Build Production

```bash
npm run preview
```

### Dừng Server Development

Trong terminal đang chạy server, nhấn `Ctrl + C` hoặc chạy:

```bash
npm run stop
```

## 📁 Cấu Trúc Dự Án

```
Java_project/
├── public/                 # File tĩnh công khai
│   └── vite.svg
├── src/                    # Mã nguồn chính
│   ├── components/         # Các component React
│   │   ├── layout/         # Component bố cục
│   │   ├── DisposalForm.jsx
│   │   ├── GoodsReceiptForm.jsx
│   │   └── ...
│   ├── page/              # Các trang chính
│   │   ├── Home.jsx
│   │   ├── baocao/        # Trang báo cáo
│   │   ├── doitac/        # Quản lý đối tác
│   │   ├── giaodich/      # Quản lý giao dịch
│   │   ├── hanghoa/       # Quản lý hàng hóa
│   │   └── phantich/      # Phân tích
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   ├── styles/            # File CSS
│   ├── App.jsx            # Component chính
│   └── main.jsx           # Entry point
├── package.json           # Cấu hình project và dependencies
├── vite.config.js         # Cấu hình Vite
└── eslint.config.js       # Cấu hình ESLint
```

## 🔧 Tính Năng Chính

Hệ thống bao gồm các module sau:

### 📦 Quản Lý Hàng Hóa (`/hanghoa`)

- Danh sách sản phẩm
- Quản lý danh mục
- Kiểm tra tồn kho
- Quản lý hóa đơn

### 🤝 Quản Lý Đối Tác (`/doitac`)

- Quản lý khách hàng
- Quản lý nhà cung cấp

### 💼 Giao Dịch (`/giaodich`)

- Nhập hàng
- Xuất hàng
- Trả hàng
- Hủy sản phẩm
- Quản lý hóa đơn

### 📊 Báo Cáo (`/baocao`)

- Báo cáo ngày
- Báo cáo sản phẩm

### 📈 Phân Tích (`/phantich`)

- Phân tích sản phẩm
- Đơn hàng bán

## ⚙️ Cấu Hình

### Cấu Hình API Backend

Ứng dụng được cấu hình để kết nối với backend Java Spring Boot tại `http://localhost:8080`.

Để thay đổi địa chỉ backend, chỉnh sửa file `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Thay đổi địa chỉ này
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

### Cấu Hình Port

Để thay đổi port chạy ứng dụng (mặc định là 5173), thêm vào `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Port mong muốn
    // ... cấu hình khác
  },
});
```

## 📜 Scripts Có Sẵn

| Script          | Lệnh              | Mô Tả                            |
| --------------- | ----------------- | -------------------------------- |
| **Development** | `npm run dev`     | Chạy server development          |
| **Build**       | `npm run build`   | Build ứng dụng cho production    |
| **Preview**     | `npm run preview` | Xem preview của build production |
| **Lint**        | `npm run lint`    | Kiểm tra lỗi code với ESLint     |
| **Stop**        | `npm run stop`    | Dừng tất cả process Node.js      |

## 🛠️ Xử Lý Sự Cố

### Lỗi Thường Gặp

#### 1. Port đã được sử dụng

```
Error: Port 5173 is already in use
```

**Giải pháp:**

- Dừng process đang chạy với `Ctrl + C`
- Hoặc chạy `npm run stop`
- Hoặc thay đổi port trong `vite.config.js`

#### 2. Lỗi cài đặt dependencies

```
npm ERR! peer dep missing
```

**Giải pháp:**

```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json
# Cài đặt lại
npm install
```

#### 3. Lỗi kết nối API

```
Network Error / CORS Error
```

**Giải pháp:**

- Đảm bảo backend Java đang chạy tại `http://localhost:8080`
- Kiểm tra cấu hình proxy trong `vite.config.js`
- Kiểm tra CORS settings trong backend

#### 4. Trang trắng sau khi build

**Giải pháp:**

- Kiểm tra console trong Developer Tools
- Đảm bảo tất cả import paths đều chính xác
- Kiểm tra file paths trong build output

### Logs và Debug

#### Xem logs chi tiết:

```bash
npm run dev -- --debug
```

#### Xóa cache:

```bash
# Xóa cache Vite
rm -rf node_modules/.vite

# Hoặc trên Windows
rmdir /s node_modules\.vite
```

### Kiểm Tra Trạng Thái Hệ Thống

```bash
# Kiểm tra các process đang chạy
netstat -ano | findstr :5173
netstat -ano | findstr :8080

# Kiểm tra Node.js processes
tasklist | findstr node.exe
```

## 📞 Hỗ Trợ

Nếu gặp vấn đề không thể giải quyết:

1. **Kiểm tra console** trong Developer Tools của trình duyệt
2. **Xem logs** trong terminal đang chạy `npm run dev`
3. **Đảm bảo backend** đang chạy ổn định
4. **Cập nhật dependencies** với `npm update`

---

## 🚀 Bắt Đầu Nhanh

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy ứng dụng
npm run dev

# 3. Mở trình duyệt tại http://localhost:5173
```

**Lưu ý:** Đảm bảo backend Java Spring Boot đang chạy tại port 8080 trước khi sử dụng các tính năng của ứng dụng.

---

_Cập nhật lần cuối: Tháng 6/2025_

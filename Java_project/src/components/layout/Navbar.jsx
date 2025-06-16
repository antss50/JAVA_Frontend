import React from "react";
import "../../App.css";
import NavItem from './NavItem';
import DropdownMenu from './DropdownMenu';

const Navbar = () => {
    const menuItems = {
        hangHoa: {
            title: 'Hàng hoá',
            items: [
                { to: '/hang-hoa/danh-muc', label: 'Danh mục' },
                { to: '/hang-hoa/san-pham', label: 'Sản Phẩm' },
                { to: '/hang-hoa/kiem-kho', label: 'Kiểm kho' }
            ]
        },
        giaoDich: {
            title: 'Giao dịch',
            items: [
                { to: '/giao-dich/hoa-don', label: 'Hoá đơn' },
                { to: '/giao-dich/tra-hang', label: 'Trả hàng' },
                { to: '/giao-dich/nhap-hang', label: 'Nhập hàng' },
                { to: '/giao-dich/tra-hang-nhap', label: 'Trả hàng nhập' },
                { to: '/giao-dich/xuat-huy', label: 'Xuất huỷ' }
            ]
        },
        doiTac: {
            title: 'Đối tác',
            items: [
                { to: '/doi-tac/khach-hang', label: 'Khách hàng' },
                { to: '/doi-tac/nha-cung-cap', label: 'Nhà cung cấp' }
            ]
        },
        baoCao: {
            title: 'Báo cáo',
            items: [
                { to: '/bao-cao/cuoi-ngay', label: 'Cuối ngày' },
                { to: '/bao-cao/hang-hoa', label: 'Hàng hoá' }
            ]
        }
    };

    return (
        <nav className="navbar d-flex justify-content-around mb-4">
            <NavItem to="/home">Tổng Quan</NavItem>
            <DropdownMenu {...menuItems.hangHoa} />
            <DropdownMenu {...menuItems.giaoDich} />
            <DropdownMenu {...menuItems.doiTac} />
            <DropdownMenu {...menuItems.baoCao} />
            <NavItem to="/ban-hang">Nhận Đơn</NavItem>
        </nav>
    );
};

export default Navbar; 
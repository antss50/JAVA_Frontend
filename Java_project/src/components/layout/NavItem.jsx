import React from 'react';
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, children }) => {
    return (
        <NavLink to={to} className="nav-link p-2">
            <span style={{ fontWeight: '500' }}>{children}</span>
        </NavLink>
    );
};

export default NavItem; 
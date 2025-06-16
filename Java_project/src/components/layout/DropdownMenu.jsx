import React from 'react';
import { NavLink } from 'react-router-dom';

const DropdownMenu = ({ title, items }) => {
    return (
        <div className="nav-link dropdown">
            <span>{title}</span>
            <div className="dropdown-content">
                {items.map((item) => (
                    <NavLink key={item.to} to={item.to} className="dropdown-item">
                        {item.label}
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default DropdownMenu; 
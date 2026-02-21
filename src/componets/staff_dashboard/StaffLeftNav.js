import React, { useState } from "react";
import { Nav, Offcanvas, Collapse } from "react-bootstrap";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaUsers,
  FaTools,
  FaComments,
  FaUserCircle,
  FaPlusSquare,
  FaListUl,
  FaTasks,
  FaCheckSquare,
  FaFileInvoiceDollar,
  FaCommentDots
} from "react-icons/fa";
import axios from "axios";
import "../../assets/css/admindashboard.css";
import { Link } from "react-router-dom";
import {
  FaInfoCircle,
  FaBullseye,
} from "react-icons/fa";

// import BRLogo from "../../assets/images/brainrock_logo.png";

const StaffLeftNav = ({ sidebarOpen, setSidebarOpen, isMobile, isTablet }) => {
    // const { logout } = useContext(AuthContext);
    // const { user } = useContext(AuthContext);
// const emp_id = user?.unique_id;  // This is the correct value

    const [userRole, setUserRole] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const toggleSubmenu = (index) => {
    setOpenSubmenu(openSubmenu === index ? null : index);
  };
 
const menuItems = [
  
  {
    icon: <FaTachometerAlt />, // Dashboard
    label: "Dashboard",
    path: "/StaffDashBoard",
    active: true,
  },
  {
    icon: <FaUsers />, // Vendors
    label: "Vendors",
    submenu: [
      {
        icon: <FaPlusSquare />, // Vendor Registration
        label: "Vendor Registration",
        path: "/VendorRegistration",
        active: true,
      },
      {
        icon: <FaListUl />, // All Vendors
        label: "All Vendors",
        path: "/AllVendors",
        active: true,
      },
    ],
  },
  {
    icon: <FaTools />, // Services Request
    label: "Services Request",
    submenu: [
      {
        icon: <FaTasks />, // Staff Services Request
        label: "Staff Services Request",
        path: "/StaffServicesRequest",
        active: true,
      },
      {
        icon: <FaCheckSquare />, // Staff Complete Request
        label: "Staff Complete Request",
        path: "/StaffCompleteRequest",
      },
    ],
  },
  {
    icon: <FaFileInvoiceDollar />, // Bills
    label: "Bills",
    submenu: [
      {
        icon: <FaPlusSquare />, // Add Bill
        label: "Add Bill",
        path: "/StaffBill",
        active: true,
      },
      {
        icon: <FaListUl />, // View Bill
        label: "View Bill",
        path: "/AllBillsDetails",
      },
    ],
  },
  {
    icon: <FaComments />, // Contact with Admin
    label: "Contact with Admin",
    submenu: [
      {
        icon: <FaCommentDots />, // Staff Query
        label: "Staff Query",
        path: "/StaffQuery",
        active: true,
      },
      {
        icon: <FaListUl />, // Staff Query View
        label: "Staff Query View",
        path: "/StaffQueryView",
      },
    ],
  },
  {
    icon: <FaUserCircle />, // Staff Profile
    label: "Staff Profile",
    path: "/StaffProfile",
    active: true,
  },

    
  ];

  //  Auto-close sidebar when switching to mobile or tablet

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        {sidebarOpen && (
          <div className="sidebar-header">
            <div className="logo-container">
              <div className="logo">
                Staff DashBoard
                {/* <span className="logo-text"><img src={BRLogo} alt="text"></img></span> */}
              </div>
            </div>
          </div>
        )}

        <Nav className="sidebar-nav flex-column">
          
        {menuItems
  .filter(item =>
    item.allowedRoles ? item.allowedRoles.includes(userRole) : true
  )
  .map((item, index) => (
    <div key={index}>
      {/* If submenu exists */}
      {item.submenu ? (
        <Nav.Link
          className={`nav-item ${item.active ? "active" : ""}`}
          onClick={() => toggleSubmenu(index)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.label}</span>
          <span className="submenu-arrow">
            {openSubmenu === index ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        </Nav.Link>
      ) : (
        <Link
          to={item.path}
          className={`nav-item nav-link ${item.active ? "active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.label}</span>
        </Link>
      )}

      {/* Submenu */}
      {item.submenu && (
        <Collapse in={openSubmenu === index}>
          <div className="submenu-container">
            {item.submenu.map((subItem, subIndex) => (
              <Link
                key={subIndex}
                to={subItem.path}
                className="submenu-item nav-link"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="submenu-icon">{subItem.icon}</span>
                <span className="nav-text br-text-sub">{subItem.label}</span>
              </Link>
            ))}
          </div>
        </Collapse>
      )}
    </div>
  ))}

        </Nav>

        <div className="sidebar-footer">
          <Nav.Link
            className="nav-item logout-btn"
        //    onClick={logout}
          >
            <span className="nav-icon">
              <FaSignOutAlt />
            </span>
            <span className="nav-text">Logout</span>
          </Nav.Link>
        </div>
      </div>

      {/*  Mobile / Tablet Sidebar (Offcanvas) */}
  <Offcanvas
  show={(isMobile || isTablet) && sidebarOpen}
  onHide={() => setSidebarOpen(false)}
  className="mobile-sidebar"
  placement="start"
  backdrop={true}
  scroll={false}
  enforceFocus={false} //  ADD THIS LINE — fixes close button focus issue
>
  <Offcanvas.Header closeButton className="br-offcanvas-header">
    <Offcanvas.Title className="br-off-title">Menu</Offcanvas.Title>
  </Offcanvas.Header>

  <Offcanvas.Body className="br-offcanvas">
    <Nav className="flex-column">
      {menuItems.map((item, index) => (
        <div key={index}>
          {item.submenu ? (
            <Nav.Link
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => toggleSubmenu(index)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text br-nav-text-mob">{item.label}</span>
              <span className="submenu-arrow">
                {openSubmenu === index ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            </Nav.Link>
          ) : (
            <Link
              to={item.path}
              className={`nav-item nav-link ${item.active ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text br-nav-text-mob">{item.label}</span>
            </Link>
          )}

          {item.submenu && (
            <Collapse in={openSubmenu === index}>
              <div className="submenu-container">
                {item.submenu.map((subItem, subIndex) => (
                  <Link
                    key={subIndex}
                    to={subItem.path}
                    className="submenu-item nav-link"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-text">{subItem.label}</span>
                  </Link>
                ))}
              </div>
            </Collapse>
          )}
        </div>
      ))}
    </Nav>
  </Offcanvas.Body>
</Offcanvas>

    </>
  );
};

export default StaffLeftNav;
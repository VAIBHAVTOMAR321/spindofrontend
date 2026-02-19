import React, { useState } from "react";
import { Nav, Offcanvas, Collapse } from "react-bootstrap";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaImages,
  FaUsers,
  FaBook,
  FaBuilding,
  FaImage,
  FaTools,
  FaComments,
  FaCube,
  FaProjectDiagram,
  FaServer,
  FaUserCircle,
  FaCalendarAlt,
  FaPlusSquare,
  FaListUl,
  FaEdit,
  FaMusic,
  FaGlassCheers,
  FaChalkboardTeacher,
  FaIndustry
} from "react-icons/fa";
import axios from "axios";
import "../../assets/css/admindashboard.css";
import { Link, useNavigate } from "react-router-dom";
import {
  FaInfoCircle,
  FaBullseye,
  FaTasks
} from "react-icons/fa";
import { FaCodePullRequest, FaReceipt } from "react-icons/fa6";

// import BRLogo from "../../assets/images/brainrock_logo.png";

const VendorLeftNav = ({ sidebarOpen, setSidebarOpen, isMobile, isTablet }) => {
  const navigate = useNavigate();
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
      icon: <FaTachometerAlt />,
      label: "Dashboard",
      path: "/VendorDashBoard",
      active: true,
    },
    {
      icon: <FaCodePullRequest />,
      label: "Requests",
      submenu: [
        {
          label: "My Requests",
          path: "/VendorRequests",
          icon: <FaListUl />,
        },
        {
          label: "Completed Requests",
          path: "/CompletedRequests",
          icon: <FaListUl />,
        },
      ],
    },
    {
      icon: <FaReceipt />,
      label: "Bills",
      path: "/VendorAllBills",
    },
    {
      icon: <FaComments />,
      label: "Contact With Admin",
      submenu: [
        {
          label: "Generate Query",
          path: "/GenerateVendorQuery",
          icon: <FaComments />,
        },
        {       
          label: "All Queries",
          path: "/VendorAllQueries",
          icon: <FaListUl />,
        },
      ],
    },
   
    {
      icon: <FaUserCircle />,
      label: "My Profile",
      path: "/VendorProfile",
    },


   
    
   

    // {
    //   icon: <FaCalendarAlt />,
    //   label: "Event",
    //   submenu: [
    //     {
    //       label: "Add Event",
    //       path: "/AddEvent",
    //       icon: <FaPlusSquare />,
    //     },
    //     {
    //       label: "Manage Event",
    //       path: "/ManageEvent",
    //       icon: <FaListUl />,
    //     },
    //   ],
    // },

    
  ];


  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/Login", { replace: true });
  };
  //  Auto-close sidebar when switching to mobile or tablet

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
      >
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo">
             Vendor DashBoard
              {/* <span className="logo-text"><img src={BRLogo} alt="text"></img></span> */}
            </div>
          </div>
        </div>

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
            onClick={handleLogout}
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

export default VendorLeftNav;
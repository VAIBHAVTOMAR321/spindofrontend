import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Badge,
  Dropdown,
  Image,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaBars,
  FaBell,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaSearch,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// 1. Accept searchTerm and setSearchTerm as props
function UserHeader({ toggleSidebar, searchTerm, setSearchTerm }) {
  
  const navigate = useNavigate();

  // Get auth data from localStorage
  const getAuthData = () => {
    const storedAuth = localStorage.getItem('auth');
    return storedAuth ? JSON.parse(storedAuth) : null;
  };

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      text: "New employee joined - Rahul Sharma",
      time: "10 min ago",
      read: false,
    },
    {
      id: 2,
      text: "HR meeting scheduled at 4 PM",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      text: "Payroll processed successfully",
      time: "3 hours ago",
      read: true,
    },
  ]);

  const [unreadCount, setUnreadCount] = useState(2);
  
  // State for user details
  const [userDetails, setUserDetails] = useState({
    first_name: "",
    last_name: "",
    profile_photo: null,
  });
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Function to get display name
  const getDisplayName = () => {
    if (userDetails.first_name && userDetails.last_name) {
      return `${userDetails.first_name} ${userDetails.last_name}`;
    } else if (userDetails.first_name) {
      return userDetails.first_name;
    } else {
      return "Admin";
    }
  };

  // Function to fetch user data with auth handling


  // Fetch user data when component mounts
 

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => prev - 1);
  };
  
  // Get user photo URL
  const getUserPhotoUrl = () => {
    const profilePhoto = userDetails.profile_photo;
    
    console.log('Profile photo from state:', profilePhoto);
    
    if (profilePhoto && !imageError) {
      if (profilePhoto.startsWith('http')) {
        console.log('Full URL profile photo:', profilePhoto);
        return profilePhoto;
      }
      const fullUrl = `https://mahadevaaya.com/eventmanagement/eventmanagement_backend/${profilePhoto}`;
      console.log('Constructed profile photo URL:', fullUrl);
      return fullUrl;
    }
    return null;
  };
  
  // Handle image loading error
  const handleImageError = (e) => {
    console.error('Error loading profile image:', e);
    setImageError(true);
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=0d6efd&color=fff&size=40`;
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate("/", { replace: true });
  };
  return (
    <header className="dashboard-header">
      <Container fluid>
        <Row className="align-items-center">
          <Col xs="auto">
            <Button
              variant="light"
              className="sidebar-toggle"
              onClick={toggleSidebar}
            >
              <FaBars />
            </Button>
          </Col>

          <Col>
            {authError && (
              <Alert variant="danger" className="mb-0 py-1">
                <small>{authError}</small>
              </Alert>
            )}
            {error && (
              <Alert variant="warning" className="mb-0 py-1">
                <small>{error}</small>
              </Alert>
            )}
          </Col>
          <Col xs="auto">
            <div className="header-actions">
              <Dropdown align="end">
                {/* <Dropdown.Toggle variant="light" className="notification-btn">
                  <FaBell />
                  {unreadCount > 0 && (
                    <Badge pill bg="danger" className="notification-badge">
                      {unreadCount}
                    </Badge>
                  )}
                </Dropdown.Toggle> */}

                {/* <Dropdown.Menu className="notification-dropdown">
                  <div className="notification-header">
                    <h6>Notifications</h6>
                  </div>

                  {notifications.map((notif) => (
                    <Dropdown.Item
                      key={notif.id}
                      className={`notification-item ${
                        !notif.read ? "unread" : ""
                      }`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <p>{notif.text}</p>
                      <small>{notif.time}</small>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu> */}
              </Dropdown>

              <Dropdown align="end">
  <Dropdown.Toggle variant="light" className="user-profile-btn">
    {/* <Image
      src={getUserPhotoUrl()}
      roundedCircle
      className="user-avatar"
      onError={handleImageError}
    /> */}
    Admin
  </Dropdown.Toggle>
  <Dropdown.Menu>
    <Dropdown.Item onClick={handleLogout}>
      <FaSignOutAlt className="me-2" /> Logout
    </Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
            </div>
          </Col>
        </Row>
      </Container>
    </header>
  );
}

export default UserHeader;
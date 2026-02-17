// src/components/AdminHeader.js (या जहाँ भी यह file है)

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

// 1. AuthContext से useAuth hook import करें
import { useAuth } from '../context/AuthContext'; // अपने path को यहाँ adjust करें

function AdminHeader({ toggleSidebar, searchTerm, setSearchTerm }) {
  
  const navigate = useNavigate();

  // 2. useAuth hook का उपयोग करके logout function और user data प्राप्त करें
  const { logout, user } = useAuth();

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
  
  // State for user details (profile photo आदि के लिए)
  const [userDetails, setUserDetails] = useState({
    first_name: "",
    last_name: "",
    profile_photo: null,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Function to get display name
  const getDisplayName = () => {
    if (userDetails.first_name && userDetails.last_name) {
      return `${userDetails.first_name} ${userDetails.last_name}`;
    } else if (userDetails.first_name) {
      return userDetails.first_name;
    } else {
      // अगर context से कोई नाम नहीं मिला तो 'Admin' दिखाएं
      return "Admin"; 
    }
  };
  
  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => prev - 1);
  };
  
  const getUserPhotoUrl = () => {
    const profilePhoto = userDetails.profile_photo;
    
    if (profilePhoto && !imageError) {
      if (profilePhoto.startsWith('http')) {
        return profilePhoto;
      }
      const fullUrl = `https://mahadevaaya.com/eventmanagement/eventmanagement_backend/${profilePhoto}`;
      return fullUrl;
    }
    return null;
  };
  
  const handleImageError = (e) => {
    console.error('Error loading profile image:', e);
    setImageError(true);
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=0d6efd&color=fff&size=40`;
  };
  
  // 3. handleLogout function को update करें
  const handleLogout = () => {
    // AuthContext का logout function call करें
    // यह automatically localStorage और state दोनों को clear कर देगा
    logout(); 
    
    // उसके बाद user को login page पर redirect करें
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
            {error && (
              <Alert variant="warning" className="mb-0 py-1">
                <small>{error}</small>
              </Alert>
            )}
          </Col>
          <Col xs="auto">
            <div className="header-actions">
              <Dropdown align="end">
                {/* Notification dropdown code */}
              </Dropdown>

              <Dropdown align="end">
                <Dropdown.Toggle variant="light" className="user-profile-btn">
                  <Image
                    src={getUserPhotoUrl()}
                    roundedCircle
                    className="user-avatar"
                    onError={handleImageError}
                  />
                  {getDisplayName()}
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

export default AdminHeader;
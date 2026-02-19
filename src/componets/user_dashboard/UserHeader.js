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
import { useAuth } from "../context/AuthContext";

// 1. Accept searchTerm and setSearchTerm as props
function UserHeader({ toggleSidebar, searchTerm, setSearchTerm }) {
  
  const navigate = useNavigate();


  // Use AuthContext for authentication (like VendorHeader)
  const { user, tokens } = useAuth();

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

  // Fetch user profile logic (like VendorHeader)
  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
      if (!user?.uniqueId || !tokens?.access) {
        setAuthError("Not authenticated");
        setIsLoading(false);
        return;
      }
      try {
        // Use the same endpoint and logic as UserProfile
        const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/customer/register/?unique_id=${user.uniqueId}`;
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const data = await response.json();
        if (data.status && data.data) {
          // Map to userDetails structure for header
          setUserDetails({
            first_name: data.data.username || "",
            last_name: "", // No last_name in this API, so leave blank
            profile_photo: (() => {
              if (data.data.image) {
                if (data.data.image.startsWith("http")) {
                  return data.data.image;
                } else if (data.data.image.startsWith("/media/customer_images/")) {
                  return `https://mahadevaaya.com/spindo/spindobackend${data.data.image}`;
                } else {
                  return `https://mahadevaaya.com/spindo/spindobackend/media/customer_images/${data.data.image}`;
                }
              }
              return null;
            })()
          });
          setError(null);
        } else {
          setError("Failed to fetch user profile");
        }
      } catch (err) {
        setError("Error fetching user profile");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
    const interval = setInterval(() => {
      if (isMounted) fetchUserProfile();
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, tokens]);

  // Function to get display name
  const getDisplayName = () => {
    // Use username from userDetails (from UserProfile API)
    if (userDetails.first_name) {
      return userDetails.first_name;
    } else {
      return "User";
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
    if (profilePhoto && !imageError) {
      return profilePhoto;
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
  <Dropdown.Toggle variant="light" className="user-profile-btn" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    {getUserPhotoUrl() ? (
      <Image
        src={getUserPhotoUrl()}
        roundedCircle
        className="user-avatar"
        onError={handleImageError}
        style={{ width: 40, height: 40, objectFit: "cover", border: "2px solid #e5e7eb" }}
        alt="User"
      />
    ) : (
      <FaUserCircle style={{ fontSize: 40, color: "#6366f1" }} />
    )}
    <span style={{ fontWeight: 600, color: "#1e293b" }}>
      {getDisplayName()}
    </span>
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
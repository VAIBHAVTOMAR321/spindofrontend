import React, { useContext, useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Dropdown,
  Image,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaBars,
  FaUserCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Define the base URL for the API
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";

function StaffHeader({ toggleSidebar }) {
  const navigate = useNavigate();

  // Use AuthContext for authentication (like UserHeader)
  const { user, tokens, logout } = useAuth();

  // State for user details
  const [userDetails, setUserDetails] = useState({
    username: "",
    image: null,
  });
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Fetch user profile logic (like UserProfile)
  useEffect(() => {
    let isMounted = true;
    const fetchUserProfile = async () => {
      if (!user?.uniqueId || !tokens?.access) {
        setAuthError("Not authenticated");
        setIsLoading(false);
        return;
      }
      try {
        const apiUrl = `${BASE_URL}/api/customer/register/?unique_id=${user.uniqueId}`;
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${tokens.access}` }
        });
        const data = await response.json();
        if (data.status && data.data) {
          // Staff data is returned directly as an object (not an array)
          setUserDetails(data.data);
          setError(null);
        } else {
          setError("Failed to fetch user profile");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
        } else {
          setError(err.message || "Failed to load profile. Please try again later.");
        }
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

  // Function to get display name from state
  const getDisplayName = () => {
    return userDetails.username || "Admin";
  };

  // Get the full URL for the user's profile photo
  const getUserPhotoUrl = () => {
    const profilePhoto = userDetails.image;
    
    if (profilePhoto && !imageError) {
      if (profilePhoto.startsWith('http')) {
        return profilePhoto;
      } else if (profilePhoto.startsWith("/media/customer_images/")) {
        return `${BASE_URL}${profilePhoto}`;
      } else {
        return `${BASE_URL}/media/customer_images/${profilePhoto}`;
      }
    }
    return null;
  };
  
  // Fallback if the profile image fails to load
  const handleImageError = (e) => {
    console.error('Error loading profile image:', e);
    setImageError(true);
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(getDisplayName())}&background=0d6efd&color=fff&size=40`;
  };
  
  // Handle user logout
  const handleLogout = () => {
    // Call the logout function from AuthContext to clear global state
    logout();
    // Then navigate to the login page
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
            <div className="header-actions d-flex align-items-center">
              {/* Show a spinner while loading user data */}
              {isLoading ? (
                <Spinner animation="border" variant="primary" size="sm" />
              ) : (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="light" className="user-profile-btn" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {getUserPhotoUrl() ? (
                      <Image
                        src={getUserPhotoUrl()}
                        roundedCircle
                        className="user-avatar"
                        onError={handleImageError}
                        style={{ width: 40, height: 40, objectFit: "cover", border: "2px solid #e5e7eb" }}
                        alt="Staff"
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
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </header>
  );
}

export default StaffHeader;
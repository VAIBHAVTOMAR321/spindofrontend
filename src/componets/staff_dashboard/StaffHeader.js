import React, { useState, useEffect, useContext } from "react";
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
import axios from "axios";
import AuthContext from "../context/AuthContext";

 // Adjust the import path if needed

// Define the base URL for the API
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";

function StaffHeader({ toggleSidebar }) {
  const navigate = useNavigate();

  // Consume the AuthContext to get tokens and logout function
  const { tokens, logout } = useContext(AuthContext);

  // State for user details, matching the API response structure
  const [userDetails, setUserDetails] = useState({
    can_name: "",
    staff_image: null,
  });
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Function to get display name from state
  const getDisplayName = () => {
    return userDetails.can_name || "Admin";
  };

  // Function to fetch the current user's data using their unique_id
  const fetchUserData = async () => {
    // Ensure we have the token and unique_id before making the request
    if (!tokens?.access || !tokens?.user?.unique_id) {
      setError("Authentication details are missing. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const accessToken = tokens.access;
    const uniqueId = tokens.user.unique_id;

    try {
      // Construct the API URL with the unique_id from the context
      const apiUrl = `${BASE_URL}/api/staffadmin/register/?unique_id=${uniqueId}`;
      
      // Make a GET request with the Authorization header
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Update state with the user data from the API response
      if (response.data.status && response.data.data) {
        // The API returns an array, but with unique_id, it should be one item.
        // We access the first item.
        const staffData = response.data.data[0];
        if(staffData) {
            setUserDetails(staffData);
        } else {
            throw new Error("No staff member found with this ID.");
        }
      } else {
        throw new Error("Could not retrieve user details.");
      }

    } catch (err) {
      console.error("Error fetching user data:", err);
      // Handle specific errors like expired token
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        // Optional: Automatically log the user out
        // handleLogout(); 
      } else {
        setError(err.message || "Failed to load profile. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data when the component mounts or when tokens change
  useEffect(() => {
    fetchUserData();
  }, [tokens]); // Re-run effect if tokens change

  // Get the full URL for the user's profile photo
  const getUserPhotoUrl = () => {
    const profilePhoto = userDetails.staff_image;
    
    if (profilePhoto && !imageError) {
      if (profilePhoto.startsWith('http')) {
        return profilePhoto;
      }
      return `${BASE_URL}${profilePhoto}`;
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
            {/* Display error messages */}
            {error && (
              <Alert variant="danger" className="mb-0 py-1">
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
                  <Dropdown.Toggle variant="light" className="user-profile-btn d-flex align-items-center">
                    {getUserPhotoUrl() ? (
                      <Image
                        src={getUserPhotoUrl()}
                        roundedCircle
                        className="user-avatar me-2"
                        onError={handleImageError}
                        width={32}
                        height={32}
                      />
                    ) : (
                      <FaUserCircle className="user-avatar me-2" size={32} />
                    )}
                    <span>{getDisplayName()}</span>
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
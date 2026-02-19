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



  // State for staff profile (VendorHeader style)
  const [staffData, setStaffData] = useState({
    can_name: "Staff",
    staff_image: ""
  });
  const [imageError, setImageError] = useState(false);

  // Fetch staff profile from staffadmin endpoint (VendorHeader logic)
  const fetchStaffProfile = async () => {
    if (!user?.uniqueId || !tokens?.access) return;
    try {
      const apiUrl = `${BASE_URL}/api/staffadmin/register/?unique_id=${user.uniqueId}`;
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${tokens.access}` }
      });
      const data = await response.json();
      if (data.status && data.data) {
        setStaffData({
          can_name: data.data.can_name || "Staff",
          staff_image: data.data.staff_image || ""
        });
        setImageError(false);
      }
    } catch (error) {
      setImageError(true);
    }
  };

  // Fetch on mount and refetch every 5s (VendorHeader logic)
  useEffect(() => {
    let isMounted = true;
    const loadStaffProfile = async () => {
      if (isMounted && user?.uniqueId && tokens?.access) {
        await fetchStaffProfile();
      }
    };
    loadStaffProfile();
    const interval = setInterval(() => {
      if (isMounted && user?.uniqueId && tokens?.access) {
        loadStaffProfile();
      }
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, tokens]);

  // Get staff image URL (VendorHeader logic)
  const getStaffImageUrl = () => {
    if (staffData.staff_image && !imageError) {
      if (staffData.staff_image.startsWith("http")) {
        return staffData.staff_image;
      } else if (staffData.staff_image.startsWith("/media/")) {
        return `${BASE_URL}${staffData.staff_image}`;
      } else {
        return `${BASE_URL}/media/staff_images/${staffData.staff_image}`;
      }
    }
    return null;
  };

  // Handle image loading error (VendorHeader logic)
  const handleImageError = () => {
    setImageError(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
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

          <Col></Col>

          <Col xs="auto">
            <div className="header-actions d-flex align-items-center">
              <Dropdown align="end">
                <Dropdown.Toggle variant="light" className="user-profile-btn" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {getStaffImageUrl() ? (
                    <Image
                      src={getStaffImageUrl()}
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
                    {staffData.can_name}
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

export default StaffHeader;
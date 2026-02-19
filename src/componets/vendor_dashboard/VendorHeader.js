import React, { useState, useEffect } from "react";
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
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/vendor/register/`;

// Accept toggleSidebar as prop
function VendorHeader({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, tokens } = useAuth();

  // Vendor profile data state
  const [vendorData, setVendorData] = useState({
    username: "Vendor",
    vendor_image: ""
  });
  const [imageError, setImageError] = useState(false);

  // Fetch vendor profile data
  const fetchVendorProfile = async () => {
    if (!user?.uniqueId || !tokens?.access) return;
    try {
      const apiUrl = `${API_URL}?unique_id=${user.uniqueId}`;
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${tokens.access}` }
      });
      const data = await response.json();
      // Only log once if needed, or remove this log entirely to avoid repeated logs
      // console.log("[VendorHeader] Vendor profile data:", data); // Remove or comment out
      if (data.status && data.data) {
        setVendorData({
          username: data.data.username || "Vendor",
          vendor_image: data.data.vendor_image || ""
        });
        setImageError(false);
      }
    } catch (error) {
      console.error("[VendorHeader] Error fetching vendor profile:", error);
    }
  };

  // Fetch on mount and setup refetch interval
  useEffect(() => {
    let isMounted = true;

    const loadVendorProfile = async () => {
      if (isMounted && user?.uniqueId && tokens?.access) {
        await fetchVendorProfile();
      }
    };

    // Fetch immediately on mount
    loadVendorProfile();

    // Set up interval to refetch every 5 seconds
    const interval = setInterval(() => {
      if (isMounted && user?.uniqueId && tokens?.access) {
        loadVendorProfile();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Empty dependency array - runs only once on mount

  // Get vendor image URL with proper path construction
  const getVendorImageUrl = () => {
    if (vendorData.vendor_image && !imageError) {
      if (vendorData.vendor_image.startsWith("http")) {
        return vendorData.vendor_image;
      } else if (vendorData.vendor_image.startsWith("/media/")) {
        return `${BASE_URL}${vendorData.vendor_image}`;
      } else {
        return `${BASE_URL}/media/vendor_images/${vendorData.vendor_image}`;
      }
    }
    return null;
  };

  // Handle image loading error
  const handleImageError = () => {
    console.error("Error loading vendor image");
    setImageError(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("auth");
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
            <div className="header-actions">
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="light"
                  className="user-profile-btn"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {getVendorImageUrl() ? (
                    <Image
                      src={getVendorImageUrl()}
                      roundedCircle
                      className="user-avatar"
                      onError={handleImageError}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        border: "2px solid #e5e7eb"
                      }}
                      alt="Vendor"
                    />
                  ) : (
                    <FaUserCircle style={{ fontSize: 40, color: "#6366f1" }} />
                  )}
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>
                    {vendorData.username}
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

export default VendorHeader;
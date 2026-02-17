import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import "../../../assets/css/admindashboard.css";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";

const VendorRegistration = () => {
  const { tokens, refreshAccessToken } = useAuth();
  // Check device width
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    mobile_number: "",
    email: "",
    state: "",
    district: "",
    block: "",
    password: "",
    address: "",
    category: {
      type: "",
      subtype: ""
    },
    description: ""
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setSidebarOpen(width >= 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "type" || name === "subtype") {
      setFormData(prev => ({
        ...prev,
        category: {
          ...prev.category,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.access}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.status === 401) {
        // Access token expired, try to refresh
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          // Retry request with new access token
          const retryResponse = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${newAccessToken}`,
            },
            body: JSON.stringify(formData),
          });
          
          const retryData = await retryResponse.json();
          
          if (retryResponse.ok) {
            setSuccess(true);
            // Reset form
            setFormData({
              username: "",
              mobile_number: "",
              email: "",
              state: "",
              district: "",
              block: "",
              password: "",
              address: "",
              category: {
                type: "",
                subtype: ""
              },
              description: ""
            });
          } else {
            setError(retryData.message || "Registration failed. Please try again.");
          }
        } else {
          setError("Authentication required. Please log in.");
        }
      } else {
        const data = await response.json();
        
        if (response.ok) {
          setSuccess(true);
          // Reset form
          setFormData({
            username: "",
            mobile_number: "",
            email: "",
            state: "",
            district: "",
            block: "",
            password: "",
            address: "",
            category: {
              type: "",
              subtype: ""
            },
            description: ""
          });
        } else {
          setError(data.message || "Registration failed. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <StaffLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        {/* Main Content */}
        <div className="main-content-dash">
          <StaffHeader toggleSidebar={toggleSidebar} />

          <Container fluid className="dashboard-body dashboard-main-container">
            <h2 className="mb-4">Vendor Registration</h2>
            
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                Vendor registered successfully!
              </Alert>
            )}
            
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="mobile_number">
                    <Form.Label>Mobile Number</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="Enter mobile number"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group controlId="state">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="district">
                    <Form.Label>District</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter district"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group controlId="block">
                    <Form.Label>Block</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter block"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3" controlId="address">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="type">
                    <Form.Label>Category Type</Form.Label>
                    <Form.Select
                      name="type"
                      value={formData.category.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select category type</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Home Services">Home Services</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="subtype">
                    <Form.Label>Category Subtype</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter category subtype"
                      name="subtype"
                      value={formData.category.subtype}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-4" controlId="description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>
              
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Registering...</span>
                  </>
                ) : (
                  "Register Vendor"
                )}
              </Button>
            </Form>
          </Container>
        </div>
      </div>
    </>
  );
};

export default VendorRegistration;
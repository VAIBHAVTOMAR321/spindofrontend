import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import "../../../assets/css/admindashboard.css";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";

const VendorRegistration = () => {
  const { tokens, refreshAccessToken } = useAuth();
  // File input ref
  const fileInputRef = useRef(null);
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
    description: "",
    aadhar_card: ""
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

  // Handle file input change
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    console.log("File input event target:", e.target);
    console.log("Files selected:", files);
    if (files && files.length > 0) {
      const file = files[0];
      console.log("Selected file details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: file
        };
        console.log("Updated formData.aadhar_card:", newData.aadhar_card);
        return newData;
      });
    } else {
      console.log("No files selected");
      setFormData(prev => ({
        ...prev,
        [name]: null
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
      // Debug: Check formData state
      console.log("formData before submission:", formData);
      console.log("aadhar_card in formData:", formData.aadhar_card);
      
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Append all fields to FormData
      formDataToSend.append("username", formData.username);
      formDataToSend.append("mobile_number", formData.mobile_number);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("district", formData.district);
      formDataToSend.append("block", formData.block);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("category[type]", formData.category.type);
      formDataToSend.append("category[subtype]", formData.category.subtype);
      formDataToSend.append("description", formData.description);
      
      // Get file directly from input ref for reliability
      let aadharFile = null;
      if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
        aadharFile = fileInputRef.current.files[0];
        console.log("Appending aadhar_card file from ref:", aadharFile);
        formDataToSend.append("aadhar_card", aadharFile);
      } else if (formData.aadhar_card) {
        // Fallback to state if ref is not available
        console.log("Appending aadhar_card file from state:", formData.aadhar_card);
        formDataToSend.append("aadhar_card", formData.aadhar_card);
      } else {
        console.error("No aadhar_card file selected");
        setError("Please select an Aadhar card file to upload");
        setLoading(false);
        return;
      }
      
      // Debug log to verify FormData contents
      console.log("Sending FormData entries:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
        if (key === "aadhar_card" && (value === null || value === undefined || value === "")) {
          console.error("aadhar_card field is null or empty in FormData");
        }
      }
      
      // Verify aadhar_card is present and valid
      if (!formDataToSend.get("aadhar_card")) {
        console.error("aadhar_card field not found in FormData");
        setError("Please select an Aadhar card file to upload");
        setLoading(false);
        return;
      }
      
      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokens.access}`,
          // Don't set Content-Type header when using FormData
          // The browser will set it automatically with the correct boundary
        },
        body: formDataToSend,
      });
      
      if (response.status === 401) {
        // Access token expired, try to refresh
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          // Retry request with new access token
          const retryResponse = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${newAccessToken}`,
            },
            body: formDataToSend,
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
              description: "",
              aadhar_card: null
            });
            // Clear file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            // Clear file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } else {
            setError(retryData.message || "Registration failed. Please try again.");
          }
        } else {
          setError("Authentication required. Please log in.");
        }
      } else {
        const data = await response.json();
        console.log("Backend response:", data);
        
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
            description: "",
            aadhar_card: null
          });
        } else {
          // Display more detailed error information
          if (data.errors) {
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            setError(errorMessages || "Registration failed. Please try again.");
          } else {
            setError(data.message || "Registration failed. Please try again.");
          }
          console.error("Backend error:", data);
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error("Network error:", err);
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

              <Form.Group className="mb-4" controlId="aadhar_card">
                <Form.Label>Aadhar Card</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  name="aadhar_card"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  required
                />
                <Form.Text className="text-muted">
                  Please upload a clear image of your Aadhar card (PNG, JPG, or JPEG format)
                </Form.Text>
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
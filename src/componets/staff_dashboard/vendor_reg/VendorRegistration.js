import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import "../../../assets/css/admindashboard.css";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";

const VendorRegistration = () => {
  const { tokens, refreshAccessToken } = useAuth();
  const fileInputRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    username: "",
    mobile_number: "",
    email: "",
    state: "Uttarakhand", // Pre-filled and disabled
    district: "",
    block: "",
    password: "",
    address: "",
    category: {
      type: "",
      customType: "", // New field for custom category type
      subtype: ""
    },
    description: "",
    aadhar_card: null
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // --- NEW STATE FOR LOCATION DATA ---
  const [allDistricts, setAllDistricts] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

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

  // --- USE EFFECT TO FETCH ALL DISTRICTS ON MOUNT ---
  useEffect(() => {
    const fetchDistricts = async () => {
      setDistrictsLoading(true);
      setLocationError("");
      try {
        const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/district-blocks/");
        if (!response.ok) throw new Error("Failed to fetch districts");
        const data = await response.json();
        if (data.status && data.data && data.data.districts) {
          setAllDistricts(data.data.districts);
        } else {
          throw new Error("Invalid data format for districts");
        }
      } catch (err) {
        setLocationError(err.message || "Could not load district data.");
      } finally {
        setDistrictsLoading(false);
      }
    };
    fetchDistricts();
  }, []); // Empty dependency array means this runs once on mount

  // --- USE EFFECT TO FETCH BLOCKS WHEN DISTRICT CHANGES ---
  useEffect(() => {
    // Don't fetch if no district is selected
    if (!formData.district) {
      setAvailableBlocks([]); // Clear blocks if district is cleared
      return;
    }

    const fetchBlocks = async () => {
      setBlocksLoading(true);
      setLocationError("");
      try {
        // Use encodeURIComponent to handle spaces in district names like "Udham Singh Nagar"
        const query = encodeURIComponent(formData.district);
        const response = await fetch(`https://mahadevaaya.com/spindo/spindobackend/api/district-blocks/?district=${query}`);
        if (!response.ok) throw new Error("Failed to fetch blocks");
        const data = await response.json();
        if (data.status && data.data && data.data.blocks) {
          setAvailableBlocks(data.data.blocks);
        } else {
          // If the API returns a valid response but no blocks (e.g., bad district name)
          setAvailableBlocks([]);
        }
      } catch (err) {
        setLocationError(err.message || "Could not load block data.");
        setAvailableBlocks([]); // Clear blocks on error
      } finally {
        setBlocksLoading(false);
      }
    };

    fetchBlocks();
  }, [formData.district]); // This effect runs whenever formData.district changes

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "type" || name === "subtype" || name === "customType") {
      setFormData(prev => ({
        ...prev,
        category: {
          ...prev.category,
          [name]: value
        }
      }));
    } else {
      // When district changes, block should be reset
      if (name === 'district') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          block: '' // Reset block
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const aadharFile = fileInputRef.current.files[0];
      
      if (!aadharFile) {
        setError("Please select an Aadhar card file to upload");
        setLoading(false);
        return;
      }
      
      const formDataToSend = new FormData();
      
      // Determine the category type to send
      const categoryTypeToSend = formData.category.type === "Other" 
        ? formData.category.customType 
        : formData.category.type;
      
      // Append all fields to FormData
      formDataToSend.append("username", formData.username);
      formDataToSend.append("mobile_number", formData.mobile_number);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("district", formData.district);
      formDataToSend.append("block", formData.block);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("address", formData.address);
      formDataToSend.append("category[type]", categoryTypeToSend);
      formDataToSend.append("category[subtype]", formData.category.subtype);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("aadhar_card", aadharFile);
      
      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokens.access}`,
        },
        body: formDataToSend,
      });
      
      if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
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
            resetForm();
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
          resetForm();
        } else {
          if (data.errors) {
            const errorMessages = Object.entries(data.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('; ');
            setError(errorMessages || "Registration failed. Please try again.");
          } else {
            setError(data.message || "Registration failed. Please try again.");
          }
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error("Network error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      mobile_number: "",
      email: "",
      state: "Uttarakhand",
      district: "",
      block: "",
      password: "",
      address: "",
      category: {
        type: "",
        customType: "",
        subtype: ""
      },
      description: "",
      aadhar_card: null
    });
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // --- RESET LOCATION STATE ---
    setAvailableBlocks([]);
  };

  return (
    <>
      <div className="dashboard-container">
        <StaffLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />

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

            {locationError && (
              <Alert variant="warning" dismissible onClose={() => setLocationError("")}>
                {locationError}
              </Alert>
            )}
            
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
               <Col md={6} lg={4} sm={12}>
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
               <Col md={6} lg={4} sm={12}>
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
           
              
        
               <Col md={6} lg={4} sm={12}>
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
               <Col md={6} lg={4} sm={12}>
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
              
            
               <Col md={6} lg={4} sm={12}>
                  <Form.Group controlId="state">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      name="state"
                      value={formData.state}
                      disabled // State is fixed
                    />
                  </Form.Group>
                </Col>
               <Col md={6} lg={4} sm={12}>
                  <Form.Group controlId="district">
                    <Form.Label>District</Form.Label>
                    <Form.Select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      disabled={districtsLoading}
                      required
                    >
                      <option value="">Select District</option>
                      {districtsLoading && <option>Loading...</option>}
                      {allDistricts.map((dist) => (
                        <option key={dist.district} value={dist.district}>
                          {dist.district}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
               <Col md={6} lg={4} sm={12}>
                  <Form.Group controlId="block">
                    <Form.Label>Block</Form.Label>
                    <Form.Select
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      disabled={!formData.district || blocksLoading}
                      required
                    >
                      <option value="">Select Block</option>
                      {blocksLoading && <option>Loading...</option>}
                      {availableBlocks.map((block) => (
                        <option key={block} value={block}>
                          {block}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
            
              <Col md={6} lg={8} sm={12}>
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
              </Col>
            
               <Col md={6} lg={4} sm={12}>
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
                      <option value="Other">Other (Specify)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
               <Col md={6} lg={4} sm={12}>
                  {formData.category.type === "Other" && (
                    <Form.Group controlId="customType">
                      <Form.Label>Specify Category Type</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter category type"
                        name="customType"
                        value={formData.category.customType}
                        onChange={handleChange}
                        required={formData.category.type === "Other"}
                      />
                    </Form.Group>
                  )}
                </Col>
            
              
         
                <Col md={6} lg={4} sm={12}>
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
          
              <Col md={6} lg={4} sm={12}>
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
</Col>
<Col md={6} lg={4} sm={12}>
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
              </Col>
              </Row>
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
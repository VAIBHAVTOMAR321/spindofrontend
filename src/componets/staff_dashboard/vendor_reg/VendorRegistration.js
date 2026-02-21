import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Alert, Spinner, Modal, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../../../assets/css/admindashboard.css";
import "../../../assets/css/service-multiselect.css";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";

const VendorRegistration = () => {
  const { tokens, refreshAccessToken } = useAuth();
  const navigate = useNavigate();
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
    category: [], // Changed to array
    description: "",
    aadhar_card: null,
    vendor_image: null
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewType, setPreviewType] = useState(""); // 'image', 'pdf', or 'vendor_image'

  // Helper function to detect file type from URL
  const getFileType = (url) => {
    if (!url) return null;
    const ext = url.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return 'image';
    } else if (ext === 'pdf') {
      return 'pdf';
    }
    return 'unknown';
  };

  // --- NEW STATE FOR LOCATION DATA ---
  const [allDistricts, setAllDistricts] = useState([]);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  
  // --- STATE FOR SERVICE CATEGORIES ---
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");

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
  
  // --- USE EFFECT TO FETCH SERVICE CATEGORIES ---
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/get-service/categories/");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        if (data.status && Array.isArray(data.data)) {
          setCategories(data.data);
        } else {
          throw new Error("Invalid data format for categories");
        }
      } catch (err) {
        setCategoriesError(err.message || "Could not load category data.");
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
  
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      category: checked 
        ? [...prev.category, value] 
        : prev.category.filter(item => item !== value)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      // Generate preview URL if it's an image file
      if (name === 'vendor_image' || file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setImagePreviewUrl(url);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: null
      }));
      if (name === 'vendor_image') {
        setImagePreviewUrl(null);
      }
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
      
      if (formData.category.length === 0) {
        setError("Please select at least one category");
        setLoading(false);
        return;
      }
      
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
       // Append category as array
       formDataToSend.append("category", JSON.stringify(formData.category));
      formDataToSend.append("description", formData.description);
      formDataToSend.append("aadhar_card", aadharFile);
      // Append vendor image if selected
      if (formData.vendor_image) {
        formDataToSend.append("vendor_image", formData.vendor_image);
      }
      
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
      category: [], // Reset category array
      description: "",
      aadhar_card: null,
      vendor_image: null
    });
    // Clear file inputs and preview
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setImagePreviewUrl(null);
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
            <div className="mb-3">
              <Button 
                variant="outline-secondary" 
                onClick={() => navigate('/StaffDashBoard')}
                className="me-2"
              >
                <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
              </Button>
            </div>
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
            
                <Col md={6} lg={8} sm={12}>
                    <Form.Group controlId="category">
                      <Form.Label>Category</Form.Label>
                      {/* Selected categories tags */}
                      <div className="selected-services">
                        {formData.category.map((category, idx) => (
                          <span className="selected-service-tag" key={category}>
                            {category}
                            <button
                              type="button"
                              className="remove-btn"
                              aria-label="Remove"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  category: prev.category.filter((_, i) => i !== idx)
                                }));
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      {/* Dropdown for selecting categories */}
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" id="category-dropdown">
                          {formData.category.length === 0 ? "Select Category" : "Add Category"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu style={{ maxHeight: 300, overflowY: 'auto' }}>
                          {categoriesLoading && <Dropdown.Item disabled>Loading categories...</Dropdown.Item>}
                          {categoriesError && <Dropdown.Item disabled className="text-danger">{categoriesError}</Dropdown.Item>}
                          {!categoriesLoading && categories.length > 0 ? (
                            categories.map((catItem) => {
                              // If category has subcategories, create separate items for each
                              if (Array.isArray(catItem.subcategories) && catItem.subcategories.length > 0) {
                                return catItem.subcategories.map((subcategory) => {
                                  const displayText = `${catItem.category} - ${subcategory}`;
                                  return (
                                    <Dropdown.Item
                                      key={displayText}
                                      onClick={() => {
                                        setFormData(prev => ({
                                          ...prev,
                                          category: [...prev.category, displayText]
                                        }));
                                      }}
                                      disabled={formData.category.includes(displayText)}
                                    >
                                      {displayText}
                                    </Dropdown.Item>
                                  );
                                });
                              } else {
                                // If no subcategories, just show the category name
                                return (
                                  <Dropdown.Item
                                    key={catItem.category}
                                    onClick={() => {
                                      setFormData(prev => ({
                                        ...prev,
                                        category: [...prev.category, catItem.category]
                                      }));
                                    }}
                                    disabled={formData.category.includes(catItem.category)}
                                  >
                                    {catItem.category}
                                  </Dropdown.Item>
                                );
                              }
                            }).flat()
                          ) : (
                            !categoriesLoading && <Dropdown.Item disabled>No categories available</Dropdown.Item>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    </Form.Group>
                  </Col>
                <Col md={6} lg={4} sm={12}>
                   <Form.Group controlId="vendor_image">
                     <Form.Label>Vendor Image</Form.Label>
                     <Form.Control
                       type="file"
                       accept="image/*"
                       name="vendor_image"
                       onChange={handleFileChange}
                     />
                     {imagePreviewUrl && formData.vendor_image && (
                       <div className="mt-3">
                         <Button 
                           variant="info" 
                           onClick={() => {
                             setShowImageModal(true);
                             setPreviewType('vendor_image');
                           }}
                           size="sm"
                         >
                           Preview Vendor Image
                         </Button>
                       </div>
                     )}
                     <Form.Text className="text-muted">
                       Please upload a clear image of the vendor (PNG, JPG, or JPEG format)
                     </Form.Text>
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
                  accept="image/*,.pdf"
                  name="aadhar_card"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  required
                />
                {imagePreviewUrl && (
                  <div className="mt-3">
                    <Button 
                      variant="info" 
                      onClick={() => {
                        setShowImageModal(true);
                        setPreviewType('aadhar');
                      }}
                      size="sm"
                    >
                      Preview Aadhar Card
                    </Button>
                  </div>
                )}
                <Form.Text className="text-muted">
                  Please upload a clear image or PDF of your Aadhar card (PNG, JPG, JPEG, or PDF format)
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

            {/* Image/PDF Preview Modal */}
            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
              <Modal.Header closeButton>
                <Modal.Title>{previewType === 'vendor_image' ? 'Vendor Image' : 'Aadhar Card'} Preview</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
                {imagePreviewUrl && (
                  previewType === 'aadhar' && getFileType(imagePreviewUrl) === 'pdf' ? (
                    <iframe
                      src={imagePreviewUrl}
                      title="Aadhar Card PDF"
                      width="100%"
                      height="500px"
                      style={{ border: "none", borderRadius: 8 }}
                    />
                  ) : (
                    <img
                      src={imagePreviewUrl}
                      alt={previewType === 'vendor_image' ? 'Vendor Image' : 'Aadhar Card'}
                      style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8 }}
                    />
                  )
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowImageModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </Container>
        </div>
      </div>
    </>
  );
};

export default VendorRegistration;
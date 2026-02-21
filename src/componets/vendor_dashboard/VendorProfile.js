import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import VendorLeftNav from "./VendorLeftNav";
import VendorHeader from "./VendorHeader";
import "../../assets/css/admindashboard.css";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/vendor/register/`;

const VendorProfile = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    username: "",
    mobile_number: "",
    state: "",
    district: "",
    block: "",
    email: "",
    address: "",
    description: "",
    aadhar_card: "",
    vendor_image: "",
    unique_id: "",
    category: "",
    is_active: true
  });
  const [editProfile, setEditProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [aadharImagePreview, setAadharImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedAadharFile, setSelectedAadharFile] = useState(null);
  const [showAadharModal, setShowAadharModal] = useState(false);
  const [previewType, setPreviewType] = useState(""); // 'image' or 'pdf'
  const vendorImageInputRef = useRef();
  const aadharImageInputRef = useRef();
  const { user, tokens } = useAuth();

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

  useEffect(() => {
    if (!user?.uniqueId) {
      setError("Vendor not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const apiUrl = `${API_URL}?unique_id=${user.uniqueId}`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        // console.log("Vendor profile data:", data); // Removed for production
        if (data.status && data.data) {
          setProfile(data.data);
          setEditProfile(data.data);
          
          // Construct vendor image URL
          let vendorImageUrl = "";
          if (data.data.vendor_image) {
            if (data.data.vendor_image.startsWith("http")) {
              vendorImageUrl = data.data.vendor_image;
            } else if (data.data.vendor_image.startsWith("/media/")) {
              vendorImageUrl = `${BASE_URL}${data.data.vendor_image}`;
            } else {
              vendorImageUrl = `${BASE_URL}/media/vendor_images/${data.data.vendor_image}`;
            }
            // console.log("Constructed vendor image URL:", vendorImageUrl); // Removed for production
          }
          setImagePreview(vendorImageUrl);
          
          // Construct aadhar card image URL
          let aadharImageUrl = "";
          if (data.data.aadhar_card) {
            if (data.data.aadhar_card.startsWith("http")) {
              aadharImageUrl = data.data.aadhar_card;
            } else if (data.data.aadhar_card.startsWith("/media/")) {
              aadharImageUrl = `${BASE_URL}${data.data.aadhar_card}`;
            } else {
              aadharImageUrl = `${BASE_URL}/media/vendor_aadhar/${data.data.aadhar_card}`;
            }
            // console.log("Constructed aadhar image URL:", aadharImageUrl); // Removed for production
          }
          setAadharImagePreview(aadharImageUrl);
        } else {
          setError("Failed to load vendor profile.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError("Error fetching vendor profile.");
        setLoading(false);
      });
  }, [user, tokens]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setEditProfile((prev) => ({ ...prev, vendor_image: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Immediately upload the vendor image
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const formData = new FormData();
        formData.append('unique_id', user.uniqueId);
        formData.append('vendor_image', file);
        const response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
        const data = await response.json();
        if (response.ok && data.status) {
          setProfile((prev) => ({ ...prev, vendor_image: file.name }));
          setEditProfile((prev) => ({ ...prev, vendor_image: file.name }));
          alert("Vendor image updated successfully!");
        } else {
          setError(data.message || "Failed to update vendor image.");
        }
      } catch (err) {
        setError("Error updating vendor image.");
      } finally {
        setLoading(false);
        setSelectedImageFile(null);
      }
    }
  };

  const handleAadharImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAadharFile(file);
      setEditProfile((prev) => ({ ...prev, aadhar_card: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadharImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Immediately upload the aadhar image
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const formData = new FormData();
        formData.append('unique_id', user.uniqueId);
        formData.append('aadhar_card', file);
        const response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
        const data = await response.json();
        console.log("Aadhar upload response:", data);
        if (response.ok && data.status) {
          setProfile((prev) => ({ ...prev, aadhar_card: data.data.aadhar_card }));
          setEditProfile((prev) => ({ ...prev, aadhar_card: data.data.aadhar_card }));
          
          // Reconstruct aadhar image URL from response
          let aadharImageUrl = "";
          if (data.data.aadhar_card) {
            if (data.data.aadhar_card.startsWith("http")) {
              aadharImageUrl = data.data.aadhar_card;
            } else if (data.data.aadhar_card.startsWith("/media/")) {
              aadharImageUrl = `${BASE_URL}${data.data.aadhar_card}`;
            } else {
              aadharImageUrl = `${BASE_URL}/media/vendor_aadhar/${data.data.aadhar_card}`;
            }
          }
          setAadharImagePreview(aadharImageUrl);
           alert("Aadhar card image updated successfully!");
        } else {
          setError(data.message || "Failed to update aadhar card image.");
        }
      } catch (err) {
        console.error("Aadhar upload error:", err);
        setError("Error updating aadhar card image.");
      } finally {
        setLoading(false);
        setSelectedAadharFile(null);
      }
    }
  };

  const handleEdit = () => {
    setEditProfile((prev) => ({ ...profile, aadhar_card: profile.aadhar_card || editProfile.aadhar_card }));
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEditProfile(profile);
    // Restore vendor image
    let vendorImageUrl = "";
    if (profile.vendor_image) {
      if (profile.vendor_image.startsWith("http")) {
        vendorImageUrl = profile.vendor_image;
      } else if (profile.vendor_image.startsWith("/media/")) {
        vendorImageUrl = `${BASE_URL}${profile.vendor_image}`;
      } else {
        vendorImageUrl = `${BASE_URL}/media/vendor_images/${profile.vendor_image}`;
      }
    }
    setImagePreview(vendorImageUrl);
    
    // Restore aadhar image
    let aadharImageUrl = "";
    if (profile.aadhar_card) {
      if (profile.aadhar_card.startsWith("http")) {
        aadharImageUrl = profile.aadhar_card;
      } else if (profile.aadhar_card.startsWith("/media/")) {
        aadharImageUrl = `${BASE_URL}${profile.aadhar_card}`;
      } else {
        aadharImageUrl = `${BASE_URL}/media/vendor_aadhar/${profile.aadhar_card}`;
      }
    }
    setAadharImagePreview(aadharImageUrl);
    
    setIsEditing(false);
    setSuccess("");
    setError("");
  };

  const handleImagePreviewClick = () => {
    // Click vendor photo to upload new image
    vendorImageInputRef.current?.click();
  };

  const handleAadharPreviewClick = () => {
    if (aadharImagePreview) {
      setPreviewType(getFileType(aadharImagePreview));
      setShowAadharModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Prepare payload: only changed fields + unique_id
    const payload = { unique_id: user.uniqueId };
    Object.keys(editProfile).forEach((key) => {
      if (editProfile[key] !== profile[key]) {
        if ((key === 'vendor_image' || key === 'aadhar_card') && editProfile[key]) {
          // Keep only the filename, not the full path
          payload[key] = editProfile[key].replace(/^\/media\/vendor_images\//, "").replace(/^\/media\/vendor_aadhar\//, "");
        } else if (key !== 'vendor_image' && key !== 'aadhar_card') {
          payload[key] = editProfile[key];
        }
      }
    });

    console.log("[VendorProfile] Update payload:", payload);
    try {
      let response, data;
      const hasImageFile = selectedImageFile || selectedAadharFile;
      
      if (hasImageFile) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          formData.append(key, payload[key]);
        });
        if (selectedImageFile) {
          formData.append('vendor_image', selectedImageFile);
        }
        if (selectedAadharFile) {
          formData.append('aadhar_card', selectedAadharFile);
        }
        response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
      } else {
        // Use JSON if no new images
        response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: JSON.stringify(payload)
        });
      }
      data = await response.json();
      console.log("[VendorProfile] Update response:", data);
      if (response.ok && data.status) {
        setProfile((prev) => ({ ...prev, ...editProfile }));
        setIsEditing(false);
         alert("Profile updated successfully!");
        setSelectedImageFile(null);
        setSelectedAadharFile(null);
      } else {
        setError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      setError("Error updating profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="dashboard-container">
      <VendorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <VendorHeader toggleSidebar={toggleSidebar} />
        <div className="p-3">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/VendorDashBoard')}
            className="me-2"
          >
            <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
          </Button>
        </div>
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12}>
              <Card className="user-profile-card animate__animated animate__fadeIn">
                <Card.Body>
                  <h3 className="mb-4 text-center" style={{ color: '#6366f1', fontWeight: 700, letterSpacing: 1 }}>Vendor Profile</h3>
                  {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  <Row>
                    {/* Images Section */}
                    <Col md={8} className="d-flex flex-column align-items-center">
                      {/* Vendor Image - Circular */}
                      <div style={{ marginBottom: 30 }}>
                        <h6 style={{ fontWeight: 700, color: '#6366f1', marginBottom: 15, textAlign: 'center' }}>Vendor Profile Photo</h6>
                        <div
                          className="position-relative"
                          style={{ 
                            cursor: 'pointer',
                            marginBottom: 16,
                            display: 'inline-block'
                          }}
                          onClick={handleImagePreviewClick}
                          title="Click to upload new photo"
                        >
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Vendor" 
                              className="user-profile-avatar"
                              style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span 
                              className="d-flex align-items-center justify-content-center user-profile-avatar" 
                              style={{ 
                                width: 150, 
                                height: 150,
                                borderRadius: '50%',
                                color: '#aaa', 
                                fontSize: 64,
                                background: '#f0f0f0'
                              }}
                            >
                              <i className="bi bi-person-circle"></i>
                            </span>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={vendorImageInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                          />
                          {/* Always show edit button for vendor photo */}
                          <button
                            type="button"
                            className="user-profile-avatar-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              vendorImageInputRef.current?.click();
                            }}
                            title="Change Photo"
                            style={{ width: 40, height: 40, borderRadius: '50%' }}
                          >
                            <i className="bi bi-pencil" style={{ color: '#6366f1', fontSize: 18 }}></i>
                          </button>
                        </div>
                      </div>

                      {/* Aadhar Card - Rectangular */}
                      <div style={{ marginBottom: 20 }}>
                        <h6 style={{ fontWeight: 700, color: '#6366f1', marginBottom: 15, textAlign: 'center' }}>Aadhar Card</h6>
                        <div
                          className="position-relative"
                          style={{ 
                            cursor: isEditing ? 'pointer' : 'pointer',
                            display: 'inline-block',
                            border: '2px solid #e5e7eb',
                            borderRadius: 8,
                            overflow: 'hidden'
                          }}
                          onClick={isEditing ? () => aadharImageInputRef.current?.click() : handleAadharPreviewClick}
                          title={isEditing ? "Change Aadhar Card" : "Click to view"}
                        >
                          {aadharImagePreview ? (
                            getFileType(aadharImagePreview) === 'pdf' ? (
                              <div style={{ 
                                width: 250,
                                height: 160,
                                background: '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                cursor: 'pointer'
                              }}>
                                <i className="bi bi-file-pdf" style={{ fontSize: 48, color: '#dc2626', marginBottom: 8 }}></i>
                                <span style={{ color: '#dc2626', fontWeight: 600, fontSize: 14 }}>PDF File</span>
                              </div>
                            ) : (
                              <img 
                                src={aadharImagePreview} 
                                alt="Aadhar Card" 
                                style={{ 
                                  width: 250,
                                  height: 160,
                                  objectFit: 'cover',
                                  cursor: 'pointer'
                                }}
                              />
                            )
                          ) : (
                            <div 
                              style={{ 
                                width: 250,
                                height: 160,
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#aaa',
                                fontSize: 48
                              }}
                            >
                              <i className="bi bi-card-image"></i>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            ref={aadharImageInputRef}
                            style={{ display: 'none' }}
                            onChange={handleAadharImageChange}
                          />
                          {/* Show edit button only when editing */}
                          {isEditing && (
                            <button
                              type="button"
                              className="user-profile-avatar-edit-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                aadharImageInputRef.current?.click();
                              }}
                              title="Change Aadhar Card"
                              style={{ width: 40, height: 40, borderRadius: '50%' }}
                            >
                              <i className="bi bi-pencil" style={{ color: '#6366f1', fontSize: 18 }}></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </Col>
                    {/* Details Left */}
                    <Col md={4} className="d-flex flex-column justify-content-center">
                      {!loading && !error && !isEditing && (
                        <div>
                          <div className="user-profile-value"><span className="user-profile-label">Full Name:</span> {profile.username}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Mobile:</span> {profile.mobile_number}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Email:</span> {profile.email}</div>
                          <div className="user-profile-value"><span className="user-profile-label">State:</span> {profile.state}</div>
                          <div className="user-profile-value"><span className="user-profile-label">District:</span> {profile.district}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Block:</span> {profile.block}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Category:</span> {profile.category || "N/A"}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Status:</span> <span style={{ color: profile.is_active ? '#16a34a' : '#dc2626' }}>{profile.is_active ? 'Active' : 'Inactive'}</span></div>
                        </div>
                      )}
                      {!loading && !error && isEditing && (
                        <Form onSubmit={handleSubmit} autoComplete="off" className="user-profile-form">
                          <Form.Group className="mb-3" controlId="username">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="username"
                              value={editProfile.username}
                              onChange={handleChange}
                              required
                              placeholder="Enter your name"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="mobile_number">
                            <Form.Label>Mobile Number</Form.Label>
                            <Form.Control
                              type="text"
                              name="mobile_number"
                              value={editProfile.mobile_number}
                              disabled
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="email">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={editProfile.email}
                              onChange={handleChange}
                              required
                              placeholder="Enter your email"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="state">
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              name="state"
                              value={editProfile.state}
                              onChange={handleChange}
                              required
                              placeholder="Enter your state"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="district">
                            <Form.Label>District</Form.Label>
                            <Form.Control
                              type="text"
                              name="district"
                              value={editProfile.district}
                              onChange={handleChange}
                              required
                              placeholder="Enter your district"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="block">
                            <Form.Label>Block</Form.Label>
                            <Form.Control
                              type="text"
                              name="block"
                              value={editProfile.block}
                              onChange={handleChange}
                              required
                              placeholder="Enter your block"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="category">
                            <Form.Label>Category</Form.Label>
                            <Form.Control
                              type="text"
                              name="category"
                              value={editProfile.category}
                              onChange={handleChange}
                              placeholder="Enter your category"
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="address">
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                              as="textarea"
                              name="address"
                              value={editProfile.address}
                              onChange={handleChange}
                              required
                              placeholder="Enter your address"
                              rows={3}
                            />
                          </Form.Group>
                          <Form.Group className="mb-3" controlId="description">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                              as="textarea"
                              name="description"
                              value={editProfile.description}
                              onChange={handleChange}
                              placeholder="Enter description"
                              rows={3}
                            />
                          </Form.Group>
                          <div className="d-flex justify-content-center mt-4 gap-2">
                            <Button
                              variant="primary"
                              type="submit"
                              className="user-profile-edit-btn"
                              disabled={loading}
                            >
                              {loading ? <Spinner size="sm" animation="border" /> : "Save"}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              className="user-profile-edit-btn"
                              style={{ background: '#fff', color: '#6366f1', border: '1.5px solid #6366f1' }}
                              onClick={handleCancel}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Form>
                      )}
                    </Col>
                    {!isEditing && (
                      <div className="d-flex justify-content-center mt-4">
                        <Button variant="primary" className="user-profile-edit-btn" onClick={handleEdit}>
                          Edit Profile
                        </Button>
                      </div>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Aadhar Card Image Preview Modal */}
          <Modal show={showAadharModal} onHide={() => setShowAadharModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Aadhar Card</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ textAlign: 'center', padding: '20px' }}>
              {aadharImagePreview && (
                previewType === 'pdf' ? (
                  <iframe
                    src={aadharImagePreview}
                    title="Aadhar Card PDF"
                    width="100%"
                    height="500px"
                    style={{ border: "none", borderRadius: 8 }}
                  />
                ) : (
                  <img 
                    src={aadharImagePreview} 
                    alt="Aadhar Card" 
                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px', borderRadius: 8 }}
                  />
                )
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAadharModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </div>
  );
}

export default VendorProfile;


import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert, Modal } from "react-bootstrap";
import StaffLeftNav from "./StaffLeftNav";
import StaffHeader from "./StaffHeader";
import "../../assets/css/admindashboard.css";
import { useAuth } from "../context/AuthContext";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/staffadmin/register/`;

const StaffProfile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState({
    can_name: "",
    mobile_number: "",
    email_id: "",
    address: "",
    staff_image: "",
    can_aadharcard: "",
    unique_id: "",
    is_active: true
  });
  const [editProfile, setEditProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [aadharImagePreview, setAadharImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedAadharFile, setSelectedAadharFile] = useState(null);
  const [showAadharModal, setShowAadharModal] = useState(false);
  const staffImageInputRef = useRef();
  const aadharImageInputRef = useRef();
  const { user, tokens } = useAuth();

  // Refetch profile data
  const refetchProfile = async () => {
    if (!user?.uniqueId) return;
    try {
      const apiUrl = `${API_URL}?unique_id=${user.uniqueId}`;
      const response = await fetch(apiUrl, {
        headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
      });
      const data = await response.json();
      if (data && data.status && data.data) {
        setProfile(data.data);
        setEditProfile(data.data);
        // Update image previews
        let staffImageUrl = "";
        if (data.data.staff_image) {
          if (data.data.staff_image.startsWith("http")) {
            staffImageUrl = data.data.staff_image;
          } else if (data.data.staff_image.startsWith("/media/")) {
            staffImageUrl = `${BASE_URL}${data.data.staff_image}`;
          } else {
            staffImageUrl = `${BASE_URL}/media/staff_images/${data.data.staff_image}`;
          }
        }
        setImagePreview(staffImageUrl);
        let aadharImageUrl = "";
        if (data.data.can_aadharcard) {
          if (typeof data.data.can_aadharcard === 'string') {
            if (data.data.can_aadharcard.startsWith("http")) {
              aadharImageUrl = data.data.can_aadharcard;
            } else if (data.data.can_aadharcard.startsWith("/media/")) {
              aadharImageUrl = `${BASE_URL}${data.data.can_aadharcard}`;
            } else {
              aadharImageUrl = `${BASE_URL}/media/aadhar_cards/${data.data.can_aadharcard}`;
            }
          }
        }
        setAadharImagePreview(aadharImageUrl);
      }
    } catch (err) {
      console.error("Error refetching profile:", err);
    }
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
      setError("Staff not logged in or missing unique ID.");
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
        if (data && data.status && data.data) {
          setProfile(data.data);
          setEditProfile(data.data);
          // Staff image URL
          let staffImageUrl = "";
          if (data.data.staff_image) {
            if (data.data.staff_image.startsWith("http")) {
              staffImageUrl = data.data.staff_image;
            } else if (data.data.staff_image.startsWith("/media/")) {
              staffImageUrl = `${BASE_URL}${data.data.staff_image}`;
            } else {
              staffImageUrl = `${BASE_URL}/media/staff_images/${data.data.staff_image}`;
            }
          }
          setImagePreview(staffImageUrl);
          // Aadhar image URL
          let aadharImageUrl = "";
          if (data.data.can_aadharcard) {
            if (typeof data.data.can_aadharcard === 'string') {
              if (data.data.can_aadharcard.startsWith("http")) {
                aadharImageUrl = data.data.can_aadharcard;
              } else if (data.data.can_aadharcard.startsWith("/media/")) {
                aadharImageUrl = `${BASE_URL}${data.data.can_aadharcard}`;
              } else {
                aadharImageUrl = `${BASE_URL}/media/aadhar_cards/${data.data.can_aadharcard}`;
              }
            }
          }
          setAadharImagePreview(aadharImageUrl);
        } else {
          setError("Failed to load staff profile.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching staff profile.");
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
      setEditProfile((prev) => ({ ...prev, staff_image: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const formData = new FormData();
        formData.append('unique_id', user.uniqueId);
        formData.append('staff_image', file);
        const response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
        const data = await response.json();
        if (response.ok && data.status) {
          await refetchProfile();
          setSuccess("Staff image updated successfully!");
        } else {
          setError(data.message || "Failed to update staff image.");
        }
      } catch (err) {
        setError("Error updating staff image.");
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
      setEditProfile((prev) => ({ ...prev, can_aadharcard: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadharImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const formData = new FormData();
        formData.append('unique_id', user.uniqueId);
        formData.append('can_aadharcard', file);
        const response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
        const data = await response.json();
        if (response.ok && data && data.status) {
          await refetchProfile();
          setSuccess("Aadhar card image updated successfully!");
        } else {
          setError((data && data.message) || "Failed to update aadhar card image.");
        }
      } catch (err) {
        setError("Error updating aadhar card image.");
      } finally {
        setLoading(false);
        setSelectedAadharFile(null);
      }
    }
  };

  const handleEdit = () => {
    setEditProfile((prev) => ({ ...profile, can_aadharcard: profile.can_aadharcard || editProfile.can_aadharcard }));
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEditProfile(profile);
    let staffImageUrl = "";
    if (profile.staff_image) {
      if (profile.staff_image.startsWith("http")) {
        staffImageUrl = profile.staff_image;
      } else if (profile.staff_image.startsWith("/media/")) {
        staffImageUrl = `${BASE_URL}${profile.staff_image}`;
      } else {
        staffImageUrl = `${BASE_URL}/media/staff_images/${profile.staff_image}`;
      }
    }
    setImagePreview(staffImageUrl);
    let aadharImageUrl = "";
    if (profile.can_aadharcard) {
      if (profile.can_aadharcard.startsWith("http")) {
        aadharImageUrl = profile.can_aadharcard;
      } else if (profile.can_aadharcard.startsWith("/media/")) {
        aadharImageUrl = `${BASE_URL}${profile.can_aadharcard}`;
      } else {
        aadharImageUrl = `${BASE_URL}/media/aadhar_cards/${profile.can_aadharcard}`;
      }
    }
    setAadharImagePreview(aadharImageUrl);
    setIsEditing(false);
    setSuccess("");
    setError("");
  };

  const handleImagePreviewClick = () => {
    staffImageInputRef.current?.click();
  };

  const handleAadharPreviewClick = () => {
    if (aadharImagePreview) {
      setShowAadharModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = { unique_id: user.uniqueId };
    Object.keys(editProfile).forEach((key) => {
      if (editProfile[key] !== profile[key]) {
        if ((key === 'staff_image' || key === 'can_aadharcard') && editProfile[key]) {
          payload[key] = editProfile[key].replace(/^\/media\/staff_images\//, "").replace(/^\/media\/aadhar_cards\//, "");
        } else if (key !== 'staff_image' && key !== 'can_aadharcard') {
          payload[key] = editProfile[key];
        }
      }
    });
    try {
      let response, data;
      const hasImageFile = selectedImageFile || selectedAadharFile;
      if (hasImageFile) {
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          formData.append(key, payload[key]);
        });
        if (selectedImageFile) {
          formData.append('staff_image', selectedImageFile);
        }
        if (selectedAadharFile) {
          formData.append('can_aadharcard', selectedAadharFile);
        }
        response = await fetch(API_URL, {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
      } else {
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
      if (response.ok && data.status) {
        setProfile((prev) => ({ ...prev, ...editProfile }));
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
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
      <StaffLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <StaffHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12}>
              <Card className="user-profile-card animate__animated animate__fadeIn">
                <Card.Body>
                  <h3 className="mb-4 text-center" style={{ color: '#6366f1', fontWeight: 700, letterSpacing: 1 }}>Staff Profile</h3>
                  {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  <Row>
                    {/* Images Section */}
                    <Col md={8} className="d-flex flex-column align-items-center">
                      {/* Staff Image - Circular */}
                      <div style={{ marginBottom: 30 }}>
                        <h6 style={{ fontWeight: 700, color: '#6366f1', marginBottom: 15, textAlign: 'center' }}>Staff Profile Photo</h6>
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
                              alt="Staff" 
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
                            ref={staffImageInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                          />
                          <button
                            type="button"
                            className="user-profile-avatar-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              staffImageInputRef.current?.click();
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
                            accept="image/*"
                            ref={aadharImageInputRef}
                            style={{ display: 'none' }}
                            onChange={handleAadharImageChange}
                          />
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
                          <div className="user-profile-value"><span className="user-profile-label">Full Name:</span> {profile.can_name}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Mobile:</span> {profile.mobile_number}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Email:</span> {profile.email_id}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Address:</span> {profile.address}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Status:</span> <span style={{ color: profile.is_active ? '#16a34a' : '#dc2626' }}>{profile.is_active ? 'Active' : 'Inactive'}</span></div>
                        </div>
                      )}
                      {!loading && !error && isEditing && (
                        <Form onSubmit={handleSubmit} autoComplete="off" className="user-profile-form">
                          <Form.Group className="mb-3" controlId="can_name">
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="can_name"
                              value={editProfile.can_name}
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
                          <Form.Group className="mb-3" controlId="email_id">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                              type="email"
                              name="email_id"
                              value={editProfile.email_id}
                              onChange={handleChange}
                              required
                              placeholder="Enter your email"
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
                <img 
                  src={aadharImagePreview} 
                  alt="Aadhar Card" 
                  style={{ maxWidth: '100%', height: 'auto', maxHeight: '500px', borderRadius: 8 }}
                />
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

export default StaffProfile;

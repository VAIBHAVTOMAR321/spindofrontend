import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./userprofile.css";
import UserLeftNav from "./UserLeftNav";
import UserHeader from "./UserHeader";
import "../../assets/css/admindashboard.css";
import { useAuth } from "../context/AuthContext";

const UserProfile = () => {
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
    image: ""
  });
  const [editProfile, setEditProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const fileInputRef = useRef();
  const { user, tokens } = useAuth();

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
      setError("User not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/customer/register/?unique_id=${user.uniqueId}`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.data) {
          setProfile(data.data);
          setEditProfile(data.data);
          // Always use the full backend URL for image preview
          let imageUrl = "";
          if (data.data.image) {
            if (data.data.image.startsWith("http")) {
              imageUrl = data.data.image;
            } else if (data.data.image.startsWith("/media/customer_images/")) {
              imageUrl = `https://mahadevaaya.com/spindo/spindobackend${data.data.image}`;
            } else {
              imageUrl = `https://mahadevaaya.com/spindo/spindobackend/media/customer_images/${data.data.image}`;
            }
          }
          setImagePreview(imageUrl);
        } else {
          setError("Failed to load user profile.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching user profile.");
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
      setEditProfile((prev) => ({ ...prev, image: file.name }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Immediately upload the image
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const formData = new FormData();
        formData.append('unique_id', user.uniqueId);
        formData.append('image', file);
        const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/register/", {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: formData
        });
        const data = await response.json();
        if (response.ok && data.status) {
          setProfile((prev) => ({ ...prev, image: file.name }));
          setEditProfile((prev) => ({ ...prev, image: file.name }));
           alert("Profile image updated successfully!");
        } else {
          setError(data.message || "Failed to update profile image.");
        }
      } catch (err) {
        setError("Error updating profile image.");
      } finally {
        setLoading(false);
        setSelectedImageFile(null);
      }
    }
  };

  const handleEdit = () => {
    // Always use the latest image from imagePreview for edit form
    setEditProfile((prev) => ({ ...profile, image: profile.image || editProfile.image }));
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEditProfile(profile);
    // Always use the full backend URL for image preview
    let imageUrl = "";
    if (profile.image) {
      if (profile.image.startsWith("http")) {
        imageUrl = profile.image;
      } else if (profile.image.startsWith("/media/customer_images/")) {
        imageUrl = `https://mahadevaaya.com/spindo/spindobackend${profile.image}`;
      } else {
        imageUrl = `https://mahadevaaya.com/spindo/spindobackend/media/customer_images/${profile.image}`;
      }
    }
    setImagePreview(imageUrl);
    setIsEditing(false);
    setSuccess("");
    setError("");
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
        // Only send the image filename, not the preview URL or path
        if (key === 'image' && editProfile[key]) {
          payload[key] = editProfile[key].replace(/^\/media\/customer_images\//, "");
        } else if (key !== 'image') {
          payload[key] = editProfile[key];
        }
      }
    });
    console.log("[UserProfile] Update payload:", payload);
    try {
      let response, data;
      if (selectedImageFile) {
        // Use FormData for file upload
        const formData = new FormData();
        Object.keys(payload).forEach((key) => {
          formData.append(key, payload[key]);
        });
        formData.append('image', selectedImageFile); // Attach file
        response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/register/", {
          method: "PUT",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
            // Do not set Content-Type, browser will set it for FormData
          },
          body: formData
        });
      } else {
        // Use JSON if no new image
        response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/register/", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          },
          body: JSON.stringify(payload)
        });
      }
      data = await response.json();
      console.log("[UserProfile] Update response:", data);
      if (response.ok && data.status) {
        setProfile((prev) => ({ ...prev, ...payload }));
        setIsEditing(false);
         alert("Profile updated successfully!");
        setSelectedImageFile(null); // Reset file
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
      <UserLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <UserHeader toggleSidebar={toggleSidebar} />
        <div className="p-3">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/UserDashBoard')}
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
                  <h3 className="mb-4 text-center" style={{ color: '#2b6777', fontWeight: 700, letterSpacing: 1 }}>User Profile</h3>
                  {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  <Row>
                    {/* Image Right */}
                    <Col md={8} className="d-flex flex-column align-items-center justify-content-center">
                      <div
                        className="position-relative"
                        style={{ cursor: 'pointer', marginBottom: 16 }}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        title="Change Profile Image"
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="Profile" className="user-profile-avatar" />
                        ) : (
                          <span className="d-flex align-items-center justify-content-center user-profile-avatar" style={{ color: '#aaa', fontSize: 64 }}>
                            <i className="bi bi-person-circle"></i>
                          </span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleImageChange}
                        />
                        {/* Show edit image button only when editing */}
                        {isEditing && (
                          <button
                            type="button"
                            className="user-profile-avatar-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current && fileInputRef.current.click();
                            }}
                            title="Change Profile Image"
                          >
                            <i className="bi bi-pencil" style={{ color: '#2b6777', fontSize: 20 }}></i>
                          </button>
                        )}
                      </div>
                    </Col>
                    {/* Details Left */}
                    <Col md={4} className="d-flex flex-column justify-content-center">
                      {!loading && !error && !isEditing && (
                        <div>
                          <div className="user-profile-value"><span className="user-profile-label">Full Name:</span> {profile.username}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Mobile Number:</span> {profile.mobile_number}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Email:</span> {profile.email}</div>
                          <div className="user-profile-value"><span className="user-profile-label">State:</span> {profile.state}</div>
                          <div className="user-profile-value"><span className="user-profile-label">District:</span> {profile.district}</div>
                          <div className="user-profile-value"><span className="user-profile-label">Block:</span> {profile.block}</div>
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
                              style={{ background: '#fff', color: '#2b6777', border: '1.5px solid #52ab98' }}
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
                  {/* End of profile row */}
                  </Row>
                </Card.Body>
              </Card>
            </Col>

          </Row>
        </Container>
      </div>
    </div>
  );
}

export default UserProfile;

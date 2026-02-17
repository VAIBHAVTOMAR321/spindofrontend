import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import UserLeftNav from "./UserLeftNav";
import UserHeader from "./UserHeader";
import "../../assets/css/admindashboard.css";
import { useAuth } from "../context/AuthContext";



const UserProfile = () => {
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
          setImagePreview(data.data.image || "");
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setEditProfile((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };


  const handleEdit = () => {
    setEditProfile(profile);
    setImagePreview(profile.image || "");
    setIsEditing(true);
    setSuccess("");
    setError("");
  };

  const handleCancel = () => {
    setEditProfile(profile);
    setImagePreview(profile.image || "");
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
        payload[key] = editProfile[key];
      }
    });
    try {
      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/register/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.status) {
        setProfile((prev) => ({ ...prev, ...payload }));
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
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
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12}>
              <Card className="shadow-lg border-0 rounded-4 p-3 animate__animated animate__fadeIn">
                <Card.Body>
                  <h3 className="mb-4 text-center" style={{ color: '#2b6777', fontWeight: 700 }}>User Profile</h3>
                  {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  <Row>
                    {/* Details Left */}
                    <Col md={8} className="d-flex flex-column justify-content-center">
                      {!loading && !error && !isEditing && (
                        <div>
                          <div className="mb-3"><strong>Full Name:</strong> {profile.username}</div>
                          <div className="mb-3"><strong>Mobile Number:</strong> {profile.mobile_number}</div>
                          <div className="mb-3"><strong>Email:</strong> {profile.email}</div>
                          <div className="mb-3"><strong>State:</strong> {profile.state}</div>
                          <div className="mb-3"><strong>District:</strong> {profile.district}</div>
                          <div className="mb-3"><strong>Block:</strong> {profile.block}</div>
                          <div className="d-flex justify-content-center mt-4">
                            <Button variant="primary" className="px-5 py-2 rounded-pill" style={{ background: "linear-gradient(90deg, #2b6777 0%, #52ab98 100%)", border: "none", fontWeight: 600 }} onClick={handleEdit}>
                              Edit Profile
                            </Button>
                          </div>
                        </div>
                      )}
                      {!loading && !error && isEditing && (
                        <Form onSubmit={handleSubmit} autoComplete="off">
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
                              className="px-5 py-2 rounded-pill"
                              style={{ background: "linear-gradient(90deg, #2b6777 0%, #52ab98 100%)", border: "none", fontWeight: 600 }}
                              disabled={loading}
                            >
                              {loading ? <Spinner size="sm" animation="border" /> : "Save"}
                            </Button>
                            <Button
                              variant="outline-secondary"
                              className="px-5 py-2 rounded-pill"
                              onClick={handleCancel}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </Form>
                      )}
                    </Col>
                    {/* Image Right */}
                    <Col md={4} className="d-flex flex-column align-items-center">
                      <div
                        style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '4px solid #2b6777', background: '#f0f0f0', position: 'relative', marginTop: 0, cursor: 'pointer' }}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        title="Change Profile Image"
                      >
                        {imagePreview ? (
                          <img src={imagePreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="d-flex align-items-center justify-content-center h-100 w-100" style={{ color: '#aaa', fontSize: 64 }}>
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
                        {/* Always show edit image button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            background: '#fff',
                            borderRadius: '50%',
                            padding: 6,
                            boxShadow: '0 0 4px #aaa',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Change Profile Image"
                        >
                          <i className="bi bi-pencil" style={{ color: '#2b6777', fontSize: 20 }}></i>
                        </button>
                      </div>
                    </Col>
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

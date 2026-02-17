import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import UserLeftNav from "./UserLeftNav";
import UserHeader from "./UserHeader";
import "../../assets/css/admindashboard.css";
import { useAuth } from "../context/AuthContext";

const UserQuery = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef();
  const { user, tokens } = useAuth();

  const [query, setQuery] = useState({
    name: "",
    unique_id: user?.uniqueId || "",
    title: "",
    issue: "",
    extra_remark: "",
    issue_image: null,
  });

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

  // Fetch user profile to get the name
  useEffect(() => {
    if (!user?.uniqueId) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/customer/register/?unique_id=${user.uniqueId}`;
    fetch(apiUrl, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.data) {
          setQuery((prev) => ({
            ...prev,
            name: data.data.username || "",
            unique_id: user.uniqueId,
          }));
        } else {
          setError("Failed to load user profile.");
        }
        setProfileLoading(false);
      })
      .catch(() => {
        setError("Error fetching user profile.");
        setProfileLoading(false);
      });
  }, [user?.uniqueId, tokens]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuery((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setImagePreview(URL.createObjectURL(file));
      setQuery((prev) => ({ ...prev, issue_image: file }));
      setError("");
    }
  };

  const validateForm = () => {
    if (!query.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!query.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!query.issue.trim()) {
      setError("Issue description is required");
      return false;
    }
    if (query.issue.trim().length < 10) {
      setError("Issue description should be at least 10 characters long");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let response, data;
      if (query.issue_image) {
        // Send as multipart/form-data if image is present
        const formData = new FormData();
        formData.append("name", query.name);
        formData.append("unique_id", query.unique_id);
        formData.append("title", query.title);
        formData.append("issue", query.issue);
        formData.append("extra_remark", query.extra_remark);
        formData.append("issue_image", query.issue_image);
        response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/issue/", {
          method: "POST",
          headers: {
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          body: formData,
        });
      } else {
        // Send as JSON if no image
        const payload = {
          name: query.name,
          unique_id: query.unique_id,
          title: query.title,
          issue: query.issue,
          extra_remark: query.extra_remark,
          issue_image: null,
        };
        response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/issue/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }
      try {
        data = await response.json();
      } catch (jsonErr) {
        console.error("Failed to parse response JSON:", jsonErr);
        setError("Server returned an invalid response.");
        setLoading(false);
        return;
      }
      if (response.ok && data.status) {
        setSuccess("Your query has been submitted successfully! We'll get back to you soon.");
        setQuery({
          name: user?.name || "",
          unique_id: user?.uniqueId || "",
          title: "",
          issue: "",
          extra_remark: "",
          issue_image: null,
        });
        setImagePreview("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        console.error("Query submission failed:", { status: response.status, statusText: response.statusText, data });
        setError(data.message || "Failed to submit query. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting query:", err);
      setError("Error submitting query. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuery({
      name: user?.name || "",
      unique_id: user?.uniqueId || "",
      title: "",
      issue: "",
      extra_remark: "",
      issue_image: null,
    });
    setImagePreview("");
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
            <Col xs={12} lg={12}>
              <Card className="shadow-lg border-0 rounded-4 p-3 animate__animated animate__fadeIn" style={{ backgroundColor: "#f8f9fa" }}>
                <Card.Body>
                  <div className="text-center mb-4">
                    <h3 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "0.5rem" }}>
                      <i className="bi bi-chat-dots" style={{ marginRight: "10px" }}></i>
                      Submit Your Query
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>We're here to help! Please describe your issue and we'll respond as soon as possible.</p>
                  </div>

                  {profileLoading && (
                    <div className="text-center">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2" style={{ color: "#6c757d" }}>Loading your profile...</p>
                    </div>
                  )}

                  {error && (
                    <Alert variant="danger" onClose={() => setError("")} dismissible>
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert variant="success" onClose={() => setSuccess("")} dismissible>
                      <i className="bi bi-check-circle me-2"></i>
                      {success}
                    </Alert>
                  )}

                  {!profileLoading && (
                  <Form onSubmit={handleSubmit} autoComplete="off">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="name">
                          <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                            <i className="bi bi-person me-2"></i>Full Name
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={query.name}
                            onChange={handleChange}
                            disabled
                            className="border-2"
                            style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}
                            placeholder="Your full name"
                          />
                          <Form.Text className="text-muted">Auto-filled from your profile</Form.Text>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="unique_id">
                          <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                            <i className="bi bi-shield-check me-2"></i>Unique ID
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="unique_id"
                            value={query.unique_id}
                            disabled
                            className="border-2"
                            style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}
                            placeholder="Your unique ID"
                          />
                          <Form.Text className="text-muted">Auto-filled from your profile</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3" controlId="title">
                      <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                        <i className="bi bi-card-heading me-2"></i>Issue Title
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={query.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Login Issue, Payment Problem, etc."
                        className="border-2"
                        style={{ borderColor: "#52ab98" }}
                        maxLength="100"
                      />
                      <Form.Text className="text-muted">{query.title.length}/100 characters</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="issue">
                      <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                        <i className="bi bi-file-text me-2"></i>Describe Your Issue
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="issue"
                        value={query.issue}
                        onChange={handleChange}
                        required
                        placeholder="Please provide detailed information about your issue..."
                        className="border-2"
                        style={{ borderColor: "#52ab98", resize: "none" }}
                        minLength="10"
                        maxLength="1000"
                      />
                      <Form.Text className="text-muted">
                        {query.issue.length}/1000 characters (minimum 10 required)
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="extra_remark">
                      <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                        <i className="bi bi-chat-left-text me-2"></i>Additional Remarks (Optional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="extra_remark"
                        value={query.extra_remark}
                        onChange={handleChange}
                        placeholder="Any additional information that might help us resolve your issue..."
                        className="border-2"
                        style={{ borderColor: "#52ab98", resize: "none" }}
                        maxLength="500"
                      />
                      <Form.Text className="text-muted">{query.extra_remark.length}/500 characters</Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="issue_image">
                      <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                        <i className="bi bi-image me-2"></i>Attach Screenshot/Image (Optional)
                      </Form.Label>
                      <div
                        style={{
                          border: "2px dashed #52ab98",
                          borderRadius: "8px",
                          padding: "30px",
                          textAlign: "center",
                          backgroundColor: "#f0f9f9",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.style.backgroundColor = "#e8f4f8";
                          e.currentTarget.style.borderColor = "#2b6777";
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#f0f9f9";
                          e.currentTarget.style.borderColor = "#52ab98";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = e.dataTransfer.files;
                          if (files.length > 0) {
                            const event = { target: { files } };
                            handleImageChange(event);
                          }
                        }}
                      >
                        {imagePreview ? (
                          <div>
                            <img
                              src={imagePreview}
                              alt="Preview"
                              style={{
                                maxHeight: "150px",
                                maxWidth: "200px",
                                borderRadius: "6px",
                                marginBottom: "10px",
                              }}
                            />
                            <p style={{ color: "#52ab98", fontWeight: 600, marginBottom: 0 }}>Image attached</p>
                            <small style={{ color: "#6c757d" }}>Click to change or drag a different image</small>
                          </div>
                        ) : (
                          <div>
                            <i className="bi bi-cloud-arrow-up" style={{ fontSize: "32px", color: "#52ab98", marginBottom: "10px", display: "block" }}></i>
                            <p style={{ color: "#2b6777", fontWeight: 600, marginBottom: "5px" }}>
                              Drag and drop your image here
                            </p>
                            <small style={{ color: "#6c757d" }}>or click to browse (Max 5MB)</small>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleImageChange}
                      />
                      <Form.Text className="text-muted">Supported formats: JPG, PNG, GIF (Max 5MB)</Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-center gap-3 mt-5">
                      <Button
                        variant="primary"
                        type="submit"
                        className="px-5 py-2 rounded-pill"
                        style={{
                          background: "linear-gradient(90deg, #2b6777 0%, #52ab98 100%)",
                          border: "none",
                          fontWeight: 600,
                          boxShadow: "0 4px 8px rgba(43, 103, 119, 0.2)",
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>Submit Query
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline-secondary"
                        type="button"
                        className="px-5 py-2 rounded-pill"
                        onClick={handleReset}
                        disabled={loading}
                        style={{ fontWeight: 600 }}
                      >
                        <i className="bi bi-arrow-counterclockwise me-2"></i>Reset
                      </Button>
                    </div>
                  </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default UserQuery;

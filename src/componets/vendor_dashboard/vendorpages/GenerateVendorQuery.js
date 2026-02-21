import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import VendorHeader from "../VendorHeader";
import VendorLeftNav from "../VendorLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/vendor/request/`;

const GenerateVendorQuery = () => {
  // Sidebar and device state
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
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

  // Auth
  const { user, tokens } = useAuth();

  // Form state
  const [form, setForm] = useState({
    vendor: user?.uniqueId || "",
    username: user?.username || "",
    title: "",
    issue: "",
    issue_image: null
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef();
  // Ref for scrolling to top of form
  const formTopRef = useRef();

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "issue_image") {
      const file = files[0];
      setForm((prev) => ({ ...prev, issue_image: file }));
      if (file) setImagePreview(URL.createObjectURL(file));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Fetch username from vendor profile API (like UserQuery)
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      vendor: user?.uniqueId || "",
    }));
    if (user?.uniqueId && tokens?.access) {
      const apiUrl = `https://mahadevaaya.com/spindo/spindobackend/api/vendor/register/?unique_id=${user.uniqueId}`;
      fetch(apiUrl, {
        headers: { Authorization: `Bearer ${tokens.access}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status && data.data) {
            setForm((prev) => ({ ...prev, username: data.data.username || "" }));
          }
        });
    }
  }, [user, tokens]);

  const validateForm = () => {
    if (!form.title.trim()) {
      setError("Title is required");
      // Scroll to top to show error
      setTimeout(() => {
        if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return false;
    }
    if (!form.issue.trim()) {
      setError("Issue description is required");
      setTimeout(() => {
        if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return false;
    }
    if (form.issue.trim().length < 10) {
      setError("Issue description should be at least 10 characters long");
      setTimeout(() => {
        if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const formData = new FormData();
      formData.set("vendor", form.vendor || "");
      formData.set("username", form.username || "");
      formData.set("title", form.title);
      formData.set("issue", form.issue);
      if (form.issue_image) formData.set("issue_image", form.issue_image);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access}`
        },
        body: formData
      });
      const data = await response.json();
      // ...existing code...
      if (response.ok && data.status) {
         alert("Query submitted successfully!");
        setForm({
          vendor: user?.uniqueId || "",
          username: user?.username || "",
          title: "",
          issue: "",
          issue_image: null
        });
        setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        // Scroll to top to show success
        setTimeout(() => {
          if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      } else {
        setError(data.message || "Failed to submit query.");
        setTimeout(() => {
          if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch (err) {
      setError("Error submitting query.");
      setTimeout(() => {
        if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      vendor: user?.uniqueId || "",
      username: user?.username || "",
      title: "",
      issue: "",
      issue_image: null
    });
    setImagePreview("");
    setError("");
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Scroll to top on reset
    setTimeout(() => {
      if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

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
            <Col xs={12} lg={12}>
              <Card className="shadow-lg border-0 rounded-4 p-3 animate__animated animate__fadeIn" style={{ backgroundColor: "#f8f9fa" }}>
                <Card.Body>
                  {/* Ref for scrolling to top of form */}
                  <div ref={formTopRef}></div>
                  <div className="text-center mb-4">
                    <h3 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "0.5rem" }}>
                      <i className="bi bi-chat-dots" style={{ marginRight: "10px" }}></i>
                      Submit Your Query
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>Describe your issue and our team will respond as soon as possible.</p>
                  </div>
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
                  <Form onSubmit={handleSubmit} autoComplete="off">
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3" controlId="vendor">
                          <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                            <i className="bi bi-person-badge me-2"></i>Vendor ID
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="vendor"
                            value={form.vendor}
                            disabled
                            className="border-2"
                            style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}
                            placeholder="Vendor ID"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3" controlId="username">
                          <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                            <i className="bi bi-person me-2"></i>Username
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="username"
                            value={form.username}
                            disabled
                            className="border-2"
                            style={{ backgroundColor: "#e8f4f8", borderColor: "#52ab98" }}
                            placeholder="Username"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="title">
                          <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                            <i className="bi bi-card-heading me-2"></i>Issue Title
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Payment Delay, Service Problem, etc."
                            className="border-2"
                            style={{ borderColor: "#52ab98" }}
                            maxLength="100"
                          />
                          <Form.Text className="text-muted">{form.title.length}/100 characters</Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="issue">
                      <Form.Label style={{ color: "#2b6777", fontWeight: 600 }}>
                        <i className="bi bi-file-text me-2"></i>Describe Your Issue
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="issue"
                        value={form.issue}
                        onChange={handleChange}
                        required
                        placeholder="Please provide detailed information about your issue..."
                        className="border-2"
                        style={{ borderColor: "#52ab98", resize: "none" }}
                        minLength="10"
                        maxLength="1000"
                      />
                      <Form.Text className="text-muted">
                        {form.issue.length}/1000 characters (minimum 10 required)
                      </Form.Text>
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
                              Click to browse (Max 5MB)
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={handleChange}
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
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default GenerateVendorQuery;

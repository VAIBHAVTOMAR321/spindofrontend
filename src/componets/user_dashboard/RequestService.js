import React, { useState, useEffect, useRef } from "react";
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, InputGroup, Dropdown, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import UserLeftNav from "../user_dashboard/UserLeftNav";
import UserHeader from "../user_dashboard/UserHeader";
import { useAuth } from "../context/AuthContext";
import "../../assets/css/admindashboard.css";
import "../../assets/css/service-multiselect.css";

const RequestService = () => {
  const { user, tokens } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serviceOptions, setServiceOptions] = useState([]);
  const [serviceError, setServiceError] = useState("");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState("success"); // success or error
  const [alertMessage, setAlertMessage] = useState("");
  // Ref for scrolling to top of form
  const formTopRef = useRef();

  // Auto-dismiss alerts after 5 seconds
  useEffect(() => {
    if (success) {
      setAlertType("success");
      setAlertMessage(success);
      setShowAlertModal(true);
      const timer = setTimeout(() => setShowAlertModal(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      setAlertType("error");
      setAlertMessage(error);
      setShowAlertModal(true);
      const timer = setTimeout(() => setShowAlertModal(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  // Ref for scrolling to service field
  const serviceFieldRef = useRef();

  // Calculate min and max dates for booking (today to next 10 days)
  const getMinMaxDates = () => {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0]; // Today in YYYY-MM-DD format
    
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 10); // Add 10 days
    const maxDateStr = maxDate.toISOString().split('T')[0]; // Max date in YYYY-MM-DD format
    
    return { minDate, maxDate: maxDateStr };
  };

  const { minDate, maxDate } = getMinMaxDates();

  // Fetch service categories/subcategories for dropdown
  useEffect(() => {
    fetch("https://mahadevaaya.com/spindo/spindobackend/api/get-service/categories/")
      .then((res) => res.json())
      .then((data) => {
        if (data.status && Array.isArray(data.data)) {
          // Flatten all subcategories under their category
          const options = [];
          data.data.forEach(cat => {
            if (Array.isArray(cat.subcategories) && cat.subcategories.length > 0) {
              cat.subcategories.forEach(sub => {
                options.push({ label: `${cat.category} - ${sub}`, value: `${cat.category} - ${sub}` });
              });
            } else {
              options.push({ label: cat.category, value: cat.category });
            }
          });
          setServiceOptions(options);
        }
      });
  }, []);
  const [form, setForm] = useState({
    username: "",
    unique_id: user?.uniqueId || "",
    contact_number: "",
    alternate_contact_number: "",
    email: "",
    state: "",
    district: "",
    block: "",
    address: "",
    request_for_services: [],
    schedule_date: "",
    schedule_time: "",
    description: ""
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


  // Fetch full profile from backend and prefill form
  useEffect(() => {
    if (!user?.uniqueId) return;
    setLoading(true);
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/register/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.data) {
          setForm((prev) => ({
            ...prev,
            username: data.data.username || "",
            unique_id: user.uniqueId,
            contact_number: data.data.mobile_number || "",
            alternate_contact_number: data.data.alternate_contact_number || "",
            email: data.data.email || "",
            state: data.data.state || "",
            district: data.data.district || "",
            block: data.data.block || "",
            address: data.data.address || ""
          }));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user, tokens]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (idx, value) => {
    setForm((prev) => {
      const updated = [...prev.request_for_services];
      updated[idx] = value;
      return { ...prev, request_for_services: updated };
    });
  };

  const addServiceField = () => {
    setForm((prev) => ({ ...prev, request_for_services: [...prev.request_for_services, ""] }));
  };

  const removeServiceField = (idx) => {
    setForm((prev) => {
      const updated = prev.request_for_services.filter((_, i) => i !== idx);
      return { ...prev, request_for_services: updated };
    });
  };

  const requiredFields = [
    "username",
    "unique_id",
    "contact_number",
    "state",
    "district",
    "block",
    "address",
    "schedule_date",
    "schedule_time"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setServiceError("");
    // Validation for required fields (except description, email, alternate_contact_number, and request_for_services)
    for (const field of requiredFields) {
      if (!form[field] || form[field].toString().trim() === "") {
        setError("Please fill all required fields.");
        setLoading(false);
        return;
      }
    }
    // Validate at least one service selected
    if (!form.request_for_services || form.request_for_services.length === 0 || form.request_for_services.every(s => !s || s.trim() === "")) {
      setServiceError("Please select at least one service.");
      setLoading(false);
      // Scroll to service field
      if (serviceFieldRef.current) {
        serviceFieldRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const payload = { ...form };
    if (!payload.email) delete payload.email;
    if (!payload.alternate_contact_number) delete payload.alternate_contact_number;
    // Remove empty service tags
    payload.request_for_services = payload.request_for_services.filter((s) => s && s.trim() !== "");
    // Format schedule_time as HH:mm:ss
    if (payload.schedule_time && !payload.schedule_time.match(/^\d{2}:\d{2}:\d{2}$/)) {
      // If value is HH:mm, add :00 seconds
      payload.schedule_time = payload.schedule_time + ":00";
    }
    try {
      const headers = { "Content-Type": "application/json" };
      if (tokens?.access) {
        headers["Authorization"] = `Bearer ${tokens.access}`;
      }
      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.status) {
        setSuccess("Service request submitted successfully!");
        setForm((prev) => ({ ...prev, request_for_services: [], schedule_date: "", schedule_time: "", description: "" }));
        setTimeout(() => {
          navigate('/ViewRequestService');
        }, 1500);
      } else {
        setError(data.message || "Failed to submit request.");
        setTimeout(() => {
          if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch (err) {
      setError("Error submitting request.");
      setTimeout(() => {
        if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <UserLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <UserHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
            <Col xs={12} md={12} lg={12}>
              <Card className="animate__animated animate__fadeIn">
                <Card.Body>
                  {/* Ref for scrolling to top of form */}
                  <div ref={formTopRef}></div>
                  <h3 className="mb-4 text-center" style={{ color: '#2b6777', fontWeight: 700, letterSpacing: 1 }}>Request a Service</h3>
                  {serviceError && (
                    <Alert 
                      variant="warning" 
                      onClose={() => setServiceError("")} 
                      dismissible
                      style={{ marginBottom: 16, borderRadius: 8, fontWeight: 500 }}
                    >
                      <i className="bi bi-info-circle me-2"></i>{serviceError}
                    </Alert>
                  )}

                  {/* Popup Alert Modal */}
                  <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} centered>
                    <Modal.Body style={{ 
                      textAlign: 'center', 
                      padding: '40px 30px',
                      background: alertType === 'success' ? '#ecfdf5' : '#fef2f2'
                    }}>
                      {alertType === 'success' ? (
                        <>
                          <i className="bi bi-check-circle" style={{ fontSize: '48px', color: '#10b981', marginBottom: 16 }}></i>
                          <h5 style={{ color: '#065f46', fontWeight: 700, marginBottom: 8 }}>Success!</h5>
                          <p style={{ color: '#047857', marginBottom: 0, fontSize: 15 }}>{alertMessage}</p>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-exclamation-circle" style={{ fontSize: '48px', color: '#ef4444', marginBottom: 16 }}></i>
                          <h5 style={{ color: '#7f1d1d', fontWeight: 700, marginBottom: 8 }}>Error!</h5>
                          <p style={{ color: '#b91c1c', marginBottom: 0, fontSize: 15 }}>{alertMessage}</p>
                        </>
                      )}
                    </Modal.Body>
                    <Modal.Footer style={{ borderTop: 'none', paddingTop: 0, justifyContent: 'center' }}>
                      <Button 
                        variant={alertType === 'success' ? 'success' : 'danger'} 
                        onClick={() => setShowAlertModal(false)}
                        style={{ minWidth: 100, borderRadius: 8, fontWeight: 600 }}
                      >
                        {alertType === 'success' ? 'OK' : 'Close'}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                  <Form onSubmit={handleSubmit} autoComplete="off">
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control type="text" name="username" value={form.username} disabled />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Number</Form.Label>
                          <Form.Control type="text" name="contact_number" value={form.contact_number} disabled />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Alternate Contact Number</Form.Label>
                          <Form.Control type="text" name="alternate_contact_number" value={form.alternate_contact_number} onChange={handleChange} placeholder="Enter alternate contact number (optional)" />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email (optional)" />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control type="text" name="state" value={form.state} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>District</Form.Label>
                          <Form.Control type="text" name="district" value={form.district} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Block</Form.Label>
                          <Form.Control type="text" name="block" value={form.block} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Schedule Date</Form.Label>
                          <Form.Control 
                            type="date" 
                            name="schedule_date" 
                            value={form.schedule_date} 
                            onChange={handleChange} 
                            min={minDate}
                            max={maxDate}
                            required 
                          />
                          <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>Today to +10 days</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Schedule Time</Form.Label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Form.Select
                              name="schedule_time"
                              value={form.schedule_time}
                              onChange={handleChange}
                              required
                              style={{ maxWidth: 140 }}
                            >
                              <option value="">Select time</option>
                              {Array.from({ length: 14 }, (_, i) => {
                                // 6:00 to 19:00 (7 PM)
                                const hour = 6 + i;
                                const hourStr = hour.toString().padStart(2, '0');
                                return [
                                  <option key={hourStr + ':00'} value={hourStr + ':00'}>{`${hour <= 12 ? hour : hour - 12}:00 ${hour < 12 ? 'AM' : 'PM'}`}</option>,
                                  <option key={hourStr + ':30'} value={hourStr + ':30'}>{`${hour <= 12 ? hour : hour - 12}:30 ${hour < 12 ? 'AM' : 'PM'}`}</option>
                                ];
                              })}
                            </Form.Select>
                          </div>
                          <Form.Text className="text-muted" style={{ fontSize: '0.8rem' }}>6:00 AM - 7:00 PM</Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Request For Services</Form.Label>
                          <div ref={serviceFieldRef} style={{ marginBottom: 8 }}>
                            {form.request_for_services.map((service, idx) => {
                              const label = serviceOptions.find(opt => opt.value === service)?.label || service;
                              return (
                                <span className="selected-service-tag" key={service}>
                                  {label}
                                  <button
                                    type="button"
                                    className="remove-btn"
                                    aria-label="Remove"
                                    onClick={() => {
                                      setForm(prev => ({
                                        ...prev,
                                        request_for_services: prev.request_for_services.filter((_, i) => i !== idx)
                                      }));
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                          <Dropdown>
                            <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" size="lg" style={{ fontSize: 16, fontWeight: 600, padding: '10px 20px' }}>
                              {serviceOptions.length === 0 ? "Loading..." : "Add Service"}
                            </Dropdown.Toggle>
                            <Dropdown.Menu style={{ maxHeight: 250, overflowY: 'auto' }}>
                              {serviceOptions
                                .filter(opt => !form.request_for_services.includes(opt.value))
                                .map(opt => (
                                  <Dropdown.Item
                                    key={opt.value}
                                    onClick={() => {
                                      setForm(prev => ({
                                        ...prev,
                                        request_for_services: [...prev.request_for_services, opt.value]
                                      }));
                                    }}
                                  >
                                    {opt.label}
                                  </Dropdown.Item>
                                ))}
                              {serviceOptions.filter(opt => !form.request_for_services.includes(opt.value)).length === 0 && (
                                <Dropdown.Item disabled>No more services</Dropdown.Item>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Address</Form.Label>
                          <Form.Control as="textarea" name="address" value={form.address} onChange={handleChange} rows={3} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control as="textarea" name="description" value={form.description} onChange={handleChange} rows={3} required />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-center mt-4">
                      <Button variant="primary" type="submit" disabled={loading} style={{ minWidth: 120 }}>
                        {loading ? <Spinner size="sm" animation="border" /> : "Submit Request"}
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

export default RequestService;

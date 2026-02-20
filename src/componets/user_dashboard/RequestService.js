import React, { useState, useEffect, useRef } from "react";
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, InputGroup, Dropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import UserLeftNav from "../user_dashboard/UserLeftNav";
import UserHeader from "../user_dashboard/UserHeader";
import Footer from "../footer/Footer";
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
  // Ref for scrolling to top of form
  const formTopRef = useRef();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
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
          if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
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
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  <Form onSubmit={handleSubmit} autoComplete="off">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Full Name</Form.Label>
                          <Form.Control type="text" name="username" value={form.username} disabled />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Contact Number</Form.Label>
                          <Form.Control type="text" name="contact_number" value={form.contact_number} disabled />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Alternate Contact Number</Form.Label>
                          <Form.Control type="text" name="alternate_contact_number" value={form.alternate_contact_number} onChange={handleChange} placeholder="Enter alternate contact number (optional)" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email (optional)" />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control type="text" name="state" value={form.state} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>District</Form.Label>
                          <Form.Control type="text" name="district" value={form.district} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Block</Form.Label>
                          <Form.Control type="text" name="block" value={form.block} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Address</Form.Label>
                          <Form.Control type="text" name="address" value={form.address} onChange={handleChange} required />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Label>Request For Services</Form.Label>
                        <Form.Group className="mb-3">
                          <Form.Label>Select Service(s)</Form.Label>
                          <div className="selected-services">
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
                            <Dropdown.Toggle variant="outline-primary" id="dropdown-basic">
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
                        <Form.Group className="mb-3 mt-3">
                          <Form.Label>Schedule Date</Form.Label>
                          <Form.Control type="date" name="schedule_date" value={form.schedule_date} onChange={handleChange} required />
                        </Form.Group>
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
                            {form.schedule_time && (
                              <span style={{ fontWeight: 500 }}>
                                {(() => {
                                  const [h, m] = form.schedule_time.split(":");
                                  let hour = parseInt(h, 10);
                                  const ampm = hour >= 12 ? "PM" : "AM";
                                  hour = hour % 12;
                                  if (hour === 0) hour = 12;
                                  return `${hour}:${m} ${ampm}`;
                                })()}
                              </span>
                            )}
                          </div>
                          <Form.Text className="text-muted">Allowed time: 06:00 AM to 07:00 PM</Form.Text>
                        </Form.Group>
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
        <Footer />
      </div>
    </div>
  );
};

export default RequestService;

import React, { useState, useEffect } from "react";
import { Container, Card, Form, Button, Row, Col, Spinner, Alert, InputGroup } from "react-bootstrap";
import UserLeftNav from "../user_dashboard/UserLeftNav";
import UserHeader from "../user_dashboard/UserHeader";
import Footer from "../footer/Footer";
import { useAuth } from "../context/AuthContext";
import "../../assets/css/admindashboard.css";

const RequestService = () => {
  const { user, tokens } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    username: "",
    unique_id: user?.uniqueId || "",
    contact_number: "",
    email: "",
    state: "",
    district: "",
    block: "",
    address: "",
    request_for_services: [""],
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
    payload.request_for_services = payload.request_for_services.filter((s) => s.trim() !== "");
    try {
      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.status) {
        setSuccess("Service request submitted successfully!");
        setForm((prev) => ({ ...prev, request_for_services: [""], schedule_date: "", schedule_time: "", description: "" }));
      } else {
        setError(data.message || "Failed to submit request.");
      }
    } catch (err) {
      setError("Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <UserLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <UserHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12} md={12} lg={12}>
              <Card className="animate__animated animate__fadeIn">
                <Card.Body>
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
                        {form.request_for_services.map((service, idx) => (
                          <InputGroup className="mb-2" key={idx}>
                            <Form.Control
                              type="text"
                              value={service}
                              onChange={(e) => handleServiceChange(idx, e.target.value)}
                              placeholder="Service (e.g. AC Repair)"
                              required
                            />
                            {form.request_for_services.length > 1 && (
                              <Button variant="outline-danger" onClick={() => removeServiceField(idx)}>-</Button>
                            )}
                            {idx === form.request_for_services.length - 1 && (
                              <Button variant="outline-primary" onClick={addServiceField}>+</Button>
                            )}
                          </InputGroup>
                        ))}
                        <Form.Group className="mb-3 mt-3">
                          <Form.Label>Schedule Date</Form.Label>
                          <Form.Control type="date" name="schedule_date" value={form.schedule_date} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Schedule Time</Form.Label>
                          <Form.Control type="time" name="schedule_time" value={form.schedule_time} onChange={handleChange} required />
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

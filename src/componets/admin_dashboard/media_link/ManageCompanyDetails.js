import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Button, Form, Modal, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/company-details/`;

const ManageCompanyDetails = ({ showCardOnly = false }) => {
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

  const { tokens } = useAuth();
  const [companyData, setCompanyData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    company_name: '',
    address: '',
    email: '',
    phone: '',
    profile_link: [''],
    logo: null
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchCompanyDetails = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      if (res.data && res.data.length > 0) {
        setCompanyData(res.data[0]);
      }
    } catch (error) {
      setCompanyData(null);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchCompanyDetails();
    // eslint-disable-next-line
  }, [tokens]);

  const handleEdit = () => {
    if (companyData) {
      setFormData({
        id: companyData.id,
        company_name: companyData.company_name || '',
        address: companyData.address || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        profile_link: companyData.profile_link || [''],
        logo: companyData.logo || null
      });
      setLogoPreview(companyData.logo ? `${BASE_URL}${companyData.logo}` : null);
      setShowModal(true);
      setFormError("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileLinkChange = (index, value) => {
    const updatedLinks = [...formData.profile_link];
    updatedLinks[index] = value;
    setFormData((prev) => ({ ...prev, profile_link: updatedLinks }));
  };

  const addProfileLink = () => {
    setFormData((prev) => ({ ...prev, profile_link: [...prev.profile_link, ''] }));
  };

  const removeProfileLink = (index) => {
    const updatedLinks = formData.profile_link.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, profile_link: updatedLinks }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // If not in edit mode, open modal first with current data
      if (!showModal && companyData) {
        setFormData({
          id: companyData.id,
          company_name: companyData.company_name || '',
          address: companyData.address || '',
          email: companyData.email || '',
          phone: companyData.phone || '',
          profile_link: companyData.profile_link || [''],
          logo: file
        });
        setLogoPreview(URL.createObjectURL(file));
        setShowModal(true);
        setFormError("");
      } else {
        // If already in edit mode, just update the logo
        setFormData((prev) => ({ ...prev, logo: file }));
        setLogoPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) {
      setFormError("Authentication required. Please log in again.");
      return;
    }
    setFormError("");
    try {
      const data = new FormData();
      data.append("id", formData.id);
      data.append("company_name", formData.company_name);
      data.append("address", formData.address);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      
      // Handle profile links as JSON string
      data.append("profile_link", JSON.stringify(formData.profile_link.filter(link => link.trim() !== '')));
      
      if (formData.logo instanceof File) {
        data.append("logo", formData.logo);
      }

      await axios.put(API_URL, data, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Company Details Updated Successfully");
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
        fetchCompanyDetails();
      }, 1500);
    } catch (error) {
      let errorMessage = "Something went wrong";
      
      const responseData = error.response?.data;
      
      if (responseData?.detail) {
        errorMessage = responseData.detail;
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (typeof responseData === 'string') {
        errorMessage = responseData;
      }
      
      setFormError(errorMessage);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setFormData({
      id: '',
      company_name: '',
      address: '',
      email: '',
      phone: '',
      profile_link: [''],
      logo: null
    });
    setLogoPreview(null);
    setFormError("");
    setFormSuccess("");
  };

  if (showCardOnly) {
    return (
      <div className="dashboard-card" onClick={() => navigate('/CompanyDetails')} style={{ cursor: 'pointer' }}>
        <div className="dashboard-card-icon user-icon" title="Company Details">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z" stroke="#fff" strokeWidth="2"/><path d="M12 7v5M9 10h6" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <div className="dashboard-card-title">Company Details</div>
        <div className="dashboard-card-value">{companyData ? '1' : '0'}</div>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-container">
        <AdminLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
        <div className="main-content-dash">
          <AdminHeader toggleSidebar={toggleSidebar} />
          <div className="p-3">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/AdminDashBoard')}
              className="me-2"
            >
              <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
            </Button>
          </div>
          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="p-3">
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 box-style flex-wrap"
                style={{
                 
                }}
              >
                <h3>Company Details</h3>
                <Button
                  variant=""
                  onClick={handleEdit}
                  className="px-4 py-2 fw-bold company-btn"
                  style={{ borderRadius: 12, fontSize: 16 }}
                >
                  Edit Company Details
                </Button>
              </div>

              {companyData ? (
                <Card className="shadow-sm" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
                  <Card.Body className="p-4">
                    <Row>
                      <Col md={3} className="text-center mb-3">
                        {/* Hidden file input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          style={{ display: 'none' }}
                          id="logo-upload"
                        />
                        {/* Clickable logo container */}
                        <div
                          onClick={() => document.getElementById('logo-upload').click()}
                          style={{ cursor: 'pointer', display: 'inline-block' }}
                          title="Click to change logo"
                        >
                          {companyData.logo ? (
                            <img
                              src={`${BASE_URL}${companyData.logo}`}
                              alt="Company Logo"
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 8 }}
                            />
                          ) : (
                            <div style={{
                              width: '200px',
                              height: '200px',
                              backgroundColor: '#f1f5f9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto',
                              borderRadius: 8
                            }}>
                              <span style={{ color: '#94a3b8' }}>Click to add logo</span>
                            </div>
                          )}
                        </div>
                      </Col>
                      <Col md={9}>
                        <h4 style={{ color: '#000', fontWeight: 700, marginBottom: 20 }}>{companyData.company_name}</h4>
                        <p style={{ marginBottom: 10 }}>
                          <strong>Address:</strong> {companyData.address}
                        </p>
                        <p style={{ marginBottom: 10 }}>
                          <strong>Email:</strong> {companyData.email}
                        </p>
                        <p style={{ marginBottom: 10 }}>
                          <strong>Phone:</strong> {companyData.phone}
                        </p>
                        <div style={{ marginBottom: 10 }}>
                          <strong>Profile Links:</strong>
                          <ul style={{ paddingLeft: 20, marginTop: 5 }}>
                            {companyData.profile_link && companyData.profile_link.map((link, index) => (
                              <li key={index}>
                                <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#1b4a8f', fontSize: 12 }}>
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="shadow-sm" style={{ borderRadius: 16, border: '1px solid #e5e7eb' }}>
                  <Card.Body className="text-center p-5">
                    <p style={{ color: '#64748b', fontSize: 18 }}>No company details found.</p>
                  </Card.Body>
                </Card>
              )}

              {/* Edit Modal */}
              <Modal show={showModal} onHide={resetForm} centered size="lg">
                <Modal.Header closeButton style={{ background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>
                  <Modal.Title style={{ fontWeight: 700, color: '#fff' }}>
                    Update Company Details
                  </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: '#f8fafc', borderRadius: 12 }}>
                  {formSuccess && (
                    <div style={{ color: '#15803d', background: '#dcfce7', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>
                      {formSuccess}
                    </div>
                  )}
                  {formError && (
                    <div style={{ color: '#dc2626', background: '#fee2e2', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>
                      {formError}
                    </div>
                  )}
                  <Form onSubmit={handleSubmit} className="p-2">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Company Name</Form.Label>
                          <Form.Control
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                            required
                            style={{ borderRadius: 8, fontSize: 15 }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={{ borderRadius: 8, fontSize: 15 }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            style={{ borderRadius: 8, fontSize: 15 }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Logo</Form.Label>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            style={{ borderRadius: 8, fontSize: 15 }}
                          />
                          {logoPreview && (
                            <div className="mt-2">
                              <img src={logoPreview} alt="Logo Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        style={{ borderRadius: 8, fontSize: 15 }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Profile Links</Form.Label>
                      {formData.profile_link.map((link, index) => (
                        <div key={index} className="d-flex mb-2">
                          <Form.Control
                            value={link}
                            onChange={(e) => handleProfileLinkChange(index, e.target.value)}
                            placeholder="Enter profile link"
                            style={{ borderRadius: 8, fontSize: 15, marginRight: 10 }}
                          />
                          {formData.profile_link.length > 1 && (
                            <Button
                              variant="outline-danger"
                              onClick={() => removeProfileLink(index)}
                              style={{ borderRadius: 8 }}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline-success"
                        onClick={addProfileLink}
                        style={{ borderRadius: 8, marginTop: 5 }}
                      >
                        Add Another Link
                      </Button>
                    </Form.Group>
                    <Button type="submit" className="w-100 fw-bold" style={{ borderRadius: 8, fontSize: 16, background: '#10b981', border: 'none' }}>
                      Update
                    </Button>
                  </Form>
                </Modal.Body>
              </Modal>
            </div>
          </Container>
        </div>
      </div>
    </>
  );
};

export default ManageCompanyDetails;
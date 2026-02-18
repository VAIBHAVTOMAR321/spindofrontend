import React, { useState, useEffect } from "react";
import { Container, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/vendor/register/`;

const RegisteredVendor = ({ showCardOnly = false }) => {
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
  const [vendorData, setVendorData] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [manageMode, setManageMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    mobile_number: '',
    password: ''
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      id: vendor.id,
      mobile_number: vendor.mobile_number,
      password: ''
    });
    setShowModal(true);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      data.append("unique_id", editingVendor?.unique_id);
      data.append("mobile_number", formData.mobile_number);
      if (formData.password) data.append("password", formData.password);

      await axios.put(API_URL, data, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setFormSuccess("Vendor Updated Successfully ✅");
      setTimeout(() => {
        setShowModal(false);
        setFormSuccess("");
        fetchVendors();
      }, 1500);
    } catch (error) {
      let errorMessage = "Something went wrong";
      
      // Check for phone number already exists in multiple places
      const responseData = error.response?.data;
      const responseStr = JSON.stringify(responseData).toLowerCase();
      
      // Check if error message contains "already exists"
      if (responseStr.includes("already exists")) {
        errorMessage = "Phone number already exists.";
      } else if (responseData?.mobile_number) {
        errorMessage = Array.isArray(responseData.mobile_number) 
          ? responseData.mobile_number[0] 
          : responseData.mobile_number;
      } else if (responseData?.errors?.mobile_number) {
        errorMessage = Array.isArray(responseData.errors.mobile_number)
          ? responseData.errors.mobile_number[0]
          : responseData.errors.mobile_number;
      } else if (responseData?.detail) {
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
    setEditingVendor(null);
    setFormData({ id: '', mobile_number: '', password: '' });
    setFormError("");
    setFormSuccess("");
  };

  const fetchVendors = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setVendorData(res.data.data || []);
      setCount(res.data.count || 0);
    } catch (error) {
      setVendorData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };
  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card" onClick={() => window.location.href = '/RegisteredVendor'} style={{ cursor: 'pointer' }}>
        <div className="dashboard-card-icon user-icon" title="Number Of Vendors">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" stroke="#10b981" strokeWidth="2"/><path d="M4 20c0-2.5 3.5-4 8-4s8 1.5 8 4" stroke="#10b981" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Number Of Vendors</div>
        <div className="dashboard-card-value">{count}</div>
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
          <Container fluid className="dashboard-body dashboard-main-container">
            <div className="p-3">
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap totalreg-header-row"
                style={{
                  background: 'linear-gradient(90deg, #f8fafc 60%, #bbf7d0 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(16,185,129,0.10)',
                  padding: '18px 12px',
                  minHeight: 90,
                }}
              >
                <div className="flex-grow-1 d-flex justify-content-center">
                  <Card
                    className="text-center order-2"
                    style={{
                      minWidth: 180,
                      maxWidth: 260,
                      borderRadius: 16,
                      boxShadow: '0 2px 12px 0 rgba(16,185,129,0.10)',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                    }}
                  >
                    <h6 style={{ color: '#10b981', fontWeight: 700, marginTop: 10 }}>Total Vendors</h6>
                    <h2 style={{ color: '#134e4a', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
                <Button
                  variant={manageMode ? "secondary" : "success"}
                  onClick={() => setManageMode(!manageMode)}
                  className="order-3 px-4 py-2 fw-bold"
                  style={{ borderRadius: 12, fontSize: 16 }}
                >
                  {manageMode ? "Close Manage" : "Manage"}
                </Button>
              </div>
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr style={{ fontWeight: 700, color: '#10b981', fontSize: 15 }}>
                      <th>Unique ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>State</th>
                      <th>District</th>
                      <th>Block</th>
                      <th>Category</th>
                      <th>Created</th>
                      {manageMode && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {vendorData
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((vendor) => (
                        <tr key={vendor.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 500 }}>{vendor.unique_id}</td>
                          <td>{vendor.username}</td>
                          <td>{vendor.mobile_number}</td>
                          <td>{vendor.email}</td>
                          <td>{vendor.state}</td>
                          <td>{vendor.district}</td>
                          <td>{vendor.block}</td>
                          <td>{vendor.category}</td>
                          <td>{new Date(vendor.created_at).toLocaleDateString()}</td>
                          {manageMode && (
                            <td>
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => handleEdit(vendor)}
                                style={{ borderRadius: 8, fontWeight: 600 }}
                              >
                                Edit
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </Table>
                <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                  <Button
                    variant="outline-success"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    style={{ minWidth: 80 }}
                  >
                    Previous
                  </Button>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    Page {currentPage} of {Math.ceil(vendorData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline-success"
                    size="sm"
                    disabled={currentPage === Math.ceil(vendorData.length / itemsPerPage) || vendorData.length === 0}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    style={{ minWidth: 80 }}
                  >
                    Next
                  </Button>
                </div>
              </div>
              {/* Edit Modal */}
              <Modal show={showModal} onHide={resetForm} centered>
                <Modal.Header closeButton style={{ background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>
                  <Modal.Title style={{ fontWeight: 700, color: '#fff' }}>
                    Update Vendor
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
                    <Form.Group className="mb-3">
                      <Form.Label>Mobile Number</Form.Label>
                      <Form.Control
                        name="mobile_number"
                        value={formData.mobile_number}
                        onChange={handleChange}
                        required
                        style={{ borderRadius: 8, fontSize: 15 }}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Password (leave blank to keep current)</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        style={{ borderRadius: 8, fontSize: 15 }}
                      />
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

export default RegisteredVendor;

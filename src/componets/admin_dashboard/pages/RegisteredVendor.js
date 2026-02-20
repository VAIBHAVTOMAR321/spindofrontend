import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/vendor/register/`;

const RegisteredVendor = ({ showCardOnly = false }) => {
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
    password: '',
    is_active: 1
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Filter state
  const [filters, setFilters] = useState({
    unique_id: '',
    username: '',
    mobile_number: '',
    state: '',
    district: '',
    block: '',
    category: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data
  const filteredData = vendorData.filter(vendor =>
    (!filters.unique_id || vendor.unique_id?.toString().toLowerCase().includes(filters.unique_id.toLowerCase())) &&
    (!filters.username || vendor.username?.toLowerCase().includes(filters.username.toLowerCase())) &&
    (!filters.mobile_number || vendor.mobile_number?.toString().toLowerCase().includes(filters.mobile_number.toLowerCase())) &&
    (!filters.state || vendor.state?.toLowerCase().includes(filters.state.toLowerCase())) &&
    (!filters.district || vendor.district?.toLowerCase().includes(filters.district.toLowerCase())) &&
    (!filters.block || vendor.block?.toLowerCase().includes(filters.block.toLowerCase())) &&
    (!filters.category || vendor.category?.toLowerCase().includes(filters.category.toLowerCase()))
  );

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Unique ID", "Name", "Mobile", "State", "District", "Block", "Category", "Created"]];
    const rows = filteredData.map(vendor => [
      vendor.unique_id,
      vendor.username,
      vendor.mobile_number,
      vendor.state,
      vendor.district,
      vendor.block,
      vendor.category,
      new Date(vendor.created_at).toLocaleDateString()
    ]);
    autoTable(pdf, {
      head: headers,
      body: rows,
      startY: 10,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(url);
    setShowPdfModal(true);
  };

  const handleImagePreview = (imageUrl) => {
    setImagePreviewUrl(imageUrl);
    setShowImageModal(true);
  };

  const handleDownloadPDF = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = "RegisteredVendor.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      id: vendor.id,
      mobile_number: vendor.mobile_number,
      password: '',
      is_active: vendor.is_active ? 1 : 0
    });
    setShowModal(true);
    setFormError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'is_active') {
      setFormData((prev) => ({ ...prev, is_active: checked ? 1 : 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
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
      data.append("unique_id", editingVendor?.unique_id);
      data.append("mobile_number", formData.mobile_number);
      if (formData.password) data.append("password", formData.password);
      data.append("is_active", formData.is_active);

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
    setFormData({ id: '', mobile_number: '', password: '', is_active: 1 });
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
      <div className="dashboard-card" onClick={() => navigate('/RegisteredVendor')} style={{ cursor: 'pointer' }}>
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
              {/* Filter Inputs */}
              <div className="mb-3">
                <Form className="d-flex flex-wrap gap-2">
                  <Form.Control
                    name="unique_id"
                    value={filters.unique_id}
                    onChange={handleFilterChange}
                    placeholder="Filter Unique ID"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="username"
                    value={filters.username}
                    onChange={handleFilterChange}
                    placeholder="Filter Name"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="mobile_number"
                    value={filters.mobile_number}
                    onChange={handleFilterChange}
                    placeholder="Filter Mobile"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="state"
                    value={filters.state}
                    onChange={handleFilterChange}
                    placeholder="Filter State"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="district"
                    value={filters.district}
                    onChange={handleFilterChange}
                    placeholder="Filter District"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="block"
                    value={filters.block}
                    onChange={handleFilterChange}
                    placeholder="Filter Block"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                  <Form.Control
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    placeholder="Filter Category"
                    style={{ maxWidth: 140, borderRadius: 8 }}
                  />
                </Form>
              </div>
              {/* PDF Download Button */}
              <div className="mb-3 d-flex justify-content-end">
                <Button variant="success" onClick={handleViewPDF} style={{ borderRadius: 10, fontWeight: 600 }}>
                  View Table as PDF
                </Button>
              </div>
              {/* PDF Preview Modal */}
              <Modal show={showPdfModal} onHide={handleClosePdfModal} size="lg" centered>
                <Modal.Header closeButton>
                  <Modal.Title>PDF Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ minHeight: 500 }}>
                  {pdfPreviewUrl ? (
                    <iframe
                      src={pdfPreviewUrl}
                      title="PDF Preview"
                      width="100%"
                      height="500px"
                      style={{ border: "none" }}
                    />
                  ) : (
                    <div>Loading PDF...</div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="success" onClick={handleDownloadPDF}>
                    Download PDF
                  </Button>
                  <Button variant="secondary" onClick={handleClosePdfModal}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
              {/* Image Preview Modal */}
              <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
                <Modal.Header closeButton>
                  <Modal.Title>Aadhar Card Preview</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                  {imagePreviewUrl && (
                    <img
                      src={imagePreviewUrl}
                      alt="Aadhar Card"
                      style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8 }}
                    />
                  )}
                </Modal.Body>
              </Modal>
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
                      <th>Status</th>
                      <th>Aadhar Card</th>
                      <th>Created</th>
                      {manageMode && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((vendor) => (
                        <tr key={vendor.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 500 }}>{
                            typeof vendor.unique_id === 'object' && vendor.unique_id !== null
                              ? JSON.stringify(vendor.unique_id)
                              : vendor.unique_id ?? ''
                          }</td>
                          <td>{
                            typeof vendor.username === 'object' && vendor.username !== null
                              ? JSON.stringify(vendor.username)
                              : vendor.username ?? ''
                          }</td>
                          <td>{
                            typeof vendor.mobile_number === 'object' && vendor.mobile_number !== null
                              ? JSON.stringify(vendor.mobile_number)
                              : vendor.mobile_number ?? ''
                          }</td>
                          <td>{
                            typeof vendor.email === 'object' && vendor.email !== null
                              ? JSON.stringify(vendor.email)
                              : vendor.email ?? ''
                          }</td>
                          <td>{
                            typeof vendor.state === 'object' && vendor.state !== null
                              ? JSON.stringify(vendor.state)
                              : vendor.state ?? ''
                          }</td>
                          <td>{
                            typeof vendor.district === 'object' && vendor.district !== null
                              ? JSON.stringify(vendor.district)
                              : vendor.district ?? ''
                          }</td>
                          <td>{
                            typeof vendor.block === 'object' && vendor.block !== null
                              ? JSON.stringify(vendor.block)
                              : vendor.block ?? ''
                          }</td>
                          <td>{
                            typeof vendor.category === 'object' && vendor.category !== null
                              ? JSON.stringify(vendor.category)
                              : vendor.category ?? ''
                          }</td>
                          <td>
                            {/* Status column: Active/Inactive */}
                            <span style={{
                              color: vendor.is_active ? '#15803d' : '#dc2626',
                              fontWeight: 600,
                              background: vendor.is_active ? '#dcfce7' : '#fee2e2',
                              borderRadius: 8,
                              padding: '2px 10px',
                              fontSize: 14
                            }}>
                              {vendor.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            {vendor.aadhar_card && (
                              <img
                                src={`${BASE_URL}${vendor.aadhar_card}`}
                                alt="Aadhar"
                                width="48"
                                style={{ borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                onClick={() => handleImagePreview(`${BASE_URL}${vendor.aadhar_card}`)}
                              />
                            )}
                          </td>
                          <td>{
                            typeof vendor.created_at === 'object' && vendor.created_at !== null
                              ? JSON.stringify(vendor.created_at)
                              : (vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : '')
                          }</td>
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
                    Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage) || 1}
                  </span>
                  <Button
                    variant="outline-success"
                    size="sm"
                    disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage) || filteredData.length === 0}
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
                  <Modal.Title style={{ fontWeight: 700, color: '#10b981' }}>
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
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="is_active"
                        label="Active Vendor"
                        checked={formData.is_active === 1}
                        onChange={handleChange}
                        style={{ fontSize: 15 }}
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

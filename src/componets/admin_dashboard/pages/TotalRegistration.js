import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import the common layout components
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

// --- Constants for API ---
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/staffadmin/register/`;


const TotalRegistration = () => {
  // --- AdminDashBoard Structure & State ---
  // Check device width
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


  // --- TotalRegistration Logic & State ---
  const { tokens } = useAuth();

  const [staffData, setStaffData] = useState([]);
  const [count, setCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [formError, setFormError] = useState("");
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    unique_id: '',
    can_name: '',
    mobile_number: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data
  const filteredData = staffData.filter(staff =>
    (!filters.unique_id || staff.unique_id?.toString().toLowerCase().includes(filters.unique_id.toLowerCase())) &&
    (!filters.can_name || staff.can_name?.toLowerCase().includes(filters.can_name.toLowerCase())) &&
    (!filters.mobile_number || staff.mobile_number?.toString().toLowerCase().includes(filters.mobile_number.toLowerCase()))
  );

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

    const handleViewPDF = async () => {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const headers = [["Unique ID", "Name", "Mobile", "Email", "Address", "Status", "Created"]];
      const rows = filteredData.map(staff => [
        staff.unique_id,
        staff.can_name,
        staff.mobile_number,
        staff.email_id,
        staff.address,
        Number(staff.is_active) === 1 ? "Active" : "Inactive",
        new Date(staff.created_at).toLocaleDateString()
      ]);
      autoTable(pdf, {
        head: headers,
        body: rows,
        startY: 10,
        margin: { top: 10, right: 10, left: 10, bottom: 10 },
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: "bold" },
        bodyStyles: { textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(url);
      setShowPdfModal(true);
    };

  const handleDownloadPDF = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = "TotalRegistration.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleImagePreview = (imageUrl) => {
    setImagePreviewUrl(imageUrl);
    setShowImageModal(true);
  };

  const [formData, setFormData] = useState({
  unique_id: "", // Add unique_id to the initial state
  can_name: "",
  mobile_number: "",
  email_id: "",
  address: "",
  password: "",
  is_active: true,
  can_aadharcard: null,
});

  // ================= FETCH =================
  const fetchStaff = async () => {
    if (!tokens?.access) return;

    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });

      setStaffData(res.data.data || []);
      setCount(res.data.count || 0);
    } catch (error) {
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [tokens]);

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (type === "file") {
      setFormData({ ...formData, can_aadharcard: files[0] });
    } else if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

// ================= SUBMIT (POST & PUT) =================
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!tokens?.access) return alert("Login again");

  setFormError("");
  try {
    const data = new FormData();

    if (editingId) {
      // ===== PUT (UPDATE) =====
      // Send unique_id in payload, not in path
      data.append("unique_id", formData.unique_id);
      data.append("can_name", formData.can_name);
      data.append("mobile_number", formData.mobile_number);
      data.append("email_id", formData.email_id);
      data.append("address", formData.address);
      data.append("password", formData.password);
      data.append("is_active", formData.is_active ? 1 : 0);

      if (formData.can_aadharcard) {
        data.append("can_aadharcard", formData.can_aadharcard);
      }

      // Use API_URL (no id in path), unique_id is in payload
      await axios.put(API_URL, data, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Staff Updated Successfully ✅");

    } else {
      // ===== POST (CREATE) - No changes needed here =====
      data.append("can_name", formData.can_name);
      data.append("mobile_number", formData.mobile_number);
      data.append("email_id", formData.email_id);
      data.append("address", formData.address);
      data.append("password", formData.password);
      data.append("is_active", formData.is_active ? 1 : 0);

      if (formData.can_aadharcard) {
        data.append("can_aadharcard", formData.can_aadharcard);
      }

      await axios.post(API_URL, data, {
        headers: {
          Authorization: `Bearer ${tokens.access}`
        },
      });

      alert("Staff Created Successfully ✅");
    }

    resetForm();
    fetchStaff();
  } catch (error) {
    // Show specific error for phone already exists
    let errorMessage = "Something went wrong";
    // Check for both error.response.data.mobile_number and error.response.data.errors.mobile_number
    let phoneError = null;
    if (error.response?.data?.mobile_number) {
      phoneError = error.response.data.mobile_number[0];
    } else if (error.response?.data?.errors?.mobile_number) {
      phoneError = error.response.data.errors.mobile_number[0];
    }
    if (phoneError) {
      if (phoneError.toLowerCase().includes("already exists")) {
        errorMessage = "Phone number already exists.";
      } else {
        errorMessage = phoneError;
      }
    } else if (error.response?.data?.unique_id) {
      errorMessage = error.response.data.unique_id[0];
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    }
    setFormError(errorMessage);
  }
};

  // ================= EDIT =================
const handleEdit = (staff) => {
  setEditingId(staff.id);

  setFormData({
    unique_id: staff.unique_id, // Add this line
    can_name: staff.can_name, // Fix: set can_name for update modal
    mobile_number: staff.mobile_number,
    email_id: staff.email_id,
    address: staff.address,
    password: "", // Keep password empty on edit for security
    is_active: staff.is_active === 1, // Ensure is_active is a boolean
    can_aadharcard: null, // Reset file input
  });

  setShowModal(true);
};
  // ================= RESET =================
const resetForm = () => {
  setEditingId(null);
  setShowModal(false);
  setFormData({
    unique_id: "", // Add this line
    can_name: "",
    mobile_number: "",
    email_id: "",
    address: "",
    password: "",
    is_active: true,
    can_aadharcard: null,
  });
};


  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <AdminLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />

        {/* Main Content */}
        <div className="main-content-dash">
          <AdminHeader toggleSidebar={toggleSidebar} />

          <Container fluid className="dashboard-body dashboard-main-container">
            {/* --- TotalRegistration Content Starts Here --- */}
            <div className="p-3">


              {/* Modern Responsive Header Row */}
              <div
                className="mb-4 d-flex align-items-center justify-content-between gap-3 flex-wrap totalreg-header-row"
                style={{
                  background: 'linear-gradient(90deg, #f8fafc 60%, #e0e7ff 100%)',
                  borderRadius: 18,
                  boxShadow: '0 2px 12px 0 rgba(60, 72, 88, 0.10)',
                  padding: '18px 12px',
                  minHeight: 90,
                }}
              >
                <Button
                  onClick={() => setShowModal(true)}
                  variant="success"
                  className="order-1 px-4 py-2 fw-bold"
                  style={{ borderRadius: 12, fontSize: 16 }}
                >
                  + Add Staff
                </Button>
                <div className="flex-grow-1 d-flex justify-content-center">
                  <Card
                    className="text-center order-2"
                    style={{
                      minWidth: 180,
                      maxWidth: 260,
                      borderRadius: 16,
                      boxShadow: '0 2px 12px 0 rgba(99,102,241,0.10)',
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                    }}
                  >
                    <h6 style={{ color: '#059669', fontWeight: 700, marginTop: 10 }}>Total Staff</h6>
                    <h2 style={{ color: '#065f46', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
                <Button
                  variant={manageMode ? "secondary" : "primary"}
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
                    name="can_name"
                    value={filters.can_name}
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
                </Form>
              </div>
              {/* PDF Download Button */}
              <div className="mb-3 d-flex justify-content-end">
                <Button style={{ borderRadius: 10, fontWeight: 600, background: '#059669', borderColor: '#059669' }} onClick={handleViewPDF}>
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
                  <Button variant="primary" onClick={handleDownloadPDF}>
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
              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }} id="staff-table-pdf">
                <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                  <thead style={{ background: '#d1fae5' }}>
                    <tr style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
                      <th>Unique ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Email</th>
                      <th>Address</th>
                      <th>Aadhar</th>
                      <th>Status</th>
                      <th>Created</th>
                      {manageMode && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((staff) => (
                        <tr key={staff.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ fontWeight: 500 }}>{staff.unique_id}</td>
                          <td>{staff.can_name}</td>
                          <td>{staff.mobile_number}</td>
                          <td>{staff.email_id}</td>
                          <td>{staff.address}</td>
                          <td>
                            {staff.can_aadharcard && (
                              <img
                                src={`${BASE_URL}${staff.can_aadharcard}`}
                                alt="Aadhar"
                                width="48"
                                style={{ borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}
                                onClick={() => handleImagePreview(`${BASE_URL}${staff.can_aadharcard}`)}
                              />
                            )}
                          </td>
                          <td>
                            <span className={`badge px-3 py-2 ${Number(staff.is_active) === 1 ? 'bg-success' : 'bg-danger'}`}
                              style={{ fontSize: 13, borderRadius: 8 }}>
                              {Number(staff.is_active) === 1 ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{new Date(staff.created_at).toLocaleDateString()}</td>
                          {manageMode && (
                            <td>
                              <Button
                                size="sm"
                                variant="warning"
                                onClick={() => handleEdit(staff)}
                                style={{ borderRadius: 8, fontWeight: 600 }}
                              >
                                Edit
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                                {/* Pagination Controls */}
                                <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                                  <Button
                                    variant="outline-primary"
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
                                    variant="outline-primary"
                                    size="sm"
                                    disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage) || filteredData.length === 0}
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    style={{ minWidth: 80 }}
                                  >
                                    Next
                                  </Button>
                                </div>
                  </tbody>
                </Table>
              </div>

              {/* MODAL */}
              <Modal show={showModal} onHide={resetForm} centered>
                <Modal.Header closeButton style={{ background: '#f1f5f9', borderBottom: '1px solid #e5e7eb' }}>
                  <Modal.Title style={{ fontWeight: 700, color: '#fff' }}>
                    {editingId ? "Update Staff" : "Add Staff"}
                  </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ background: '#f8fafc', borderRadius: 12 }}>
                  {formError && (
                    <div style={{ color: '#dc2626', background: '#fee2e2', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>
                      {formError}
                    </div>
                  )}
                  <Form onSubmit={handleSubmit} className="p-2">
                    <Form.Control
                      name="can_name"
                      placeholder="Name"
                      value={formData.can_name}
                      onChange={handleChange}
                      className="mb-3"
                      required
                      style={{ borderRadius: 8, fontSize: 15 }}
                    />

                    <Form.Control
                      name="mobile_number"
                      placeholder="Mobile"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="mb-3"
                      required
                      style={{ borderRadius: 8, fontSize: 15 }}
                    />

                    <Form.Control
                      name="email_id"
                      placeholder="Email"
                      value={formData.email_id}
                      onChange={handleChange}
                      className="mb-3"
                      style={{ borderRadius: 8, fontSize: 15 }}
                    />

                    <Form.Control
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mb-3"
                      style={{ borderRadius: 8, fontSize: 15 }}
                    />

                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Password (leave blank to keep current)"
                      value={formData.password}
                      onChange={handleChange}
                      className="mb-3"
                      required={!editingId}
                      style={{ borderRadius: 8, fontSize: 15 }}
                    />

                    <Form.Check
                      type="checkbox"
                      label="Active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="mb-3"
                      style={{ fontSize: 15 }}
                    />

                    <Form.Control
                      type="file"
                      name="can_aadharcard"
                      onChange={handleChange}
                      className="mb-3"
                      style={{ borderRadius: 8, fontSize: 15 }}
                    />

                    <Button type="submit" className="w-100 fw-bold" style={{ borderRadius: 8, fontSize: 16 }}>
                      {editingId ? "Update" : "Create"}
                    </Button>
                  </Form>
                </Modal.Body>
              </Modal>
            </div>
            {/* --- TotalRegistration Content Ends Here --- */}
          </Container>
        </div>
      </div>
    </>
  );
};

export default TotalRegistration;
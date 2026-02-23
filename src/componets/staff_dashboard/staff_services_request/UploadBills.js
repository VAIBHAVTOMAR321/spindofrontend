import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";
import { useAuth } from "../../context/AuthContext";
import "../../../assets/css/admindashboard.css";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/bill-upload/`;

const UploadBills = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const navigate = useNavigate();
  const { tokens } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    regards: "",
    gst_number: "",
    firm_name: "",
    bill_date: new Date().toISOString().split("T")[0],
    file: null,
  });

  const [uploadedBills, setUploadedBills] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState("success");
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingBillId, setEditingBillId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (showAlertModal) {
      const timer = setTimeout(() => setShowAlertModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showAlertModal]);

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

  // Fetch uploaded bills
  const fetchUploadedBills = async () => {
    if (!tokens?.access) return;
    try {
      setIsLoading(true);
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUploadedBills(data.data);
      } else {
        setUploadedBills([]);
      }
    } catch (error) {
      console.error("Error fetching bills:", error);
      setUploadedBills([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedBills();
  }, [tokens]);

  // Filter bills based on search
  const filteredBills = uploadedBills.filter((bill) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    if (searchField === "all") {
      return (
        bill.title?.toLowerCase().includes(searchLower) ||
        bill.gst_number?.toLowerCase().includes(searchLower) ||
        bill.firm_name?.toLowerCase().includes(searchLower)
      );
    } else if (searchField === "title") {
      return bill.title?.toLowerCase().includes(searchLower);
    } else if (searchField === "gst_number") {
      return bill.gst_number?.toLowerCase().includes(searchLower);
    } else if (searchField === "firm_name") {
      return bill.firm_name?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchField]);

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBills = filteredBills.slice(startIndex, endIndex);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setAlertMessage("File size should be less than 2MB");
        setAlertType("error");
        setShowAlertModal(true);
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.regards || !formData.gst_number || !formData.firm_name) {
      setAlertMessage("Please fill all required fields");
      setAlertType("error");
      setShowAlertModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const method = editingBillId ? "PUT" : "POST";
      
      // Use FormData if there's a file, otherwise use JSON
      let fetchOptions = {
        method,
        headers: { 
          Authorization: `Bearer ${tokens.access}`,
        },
      };

      if (formData.file) {
        // Use FormData for file uploads (don't set Content-Type, let browser set it)
        const formDataObj = new FormData();
        formDataObj.append("id", editingBillId || "");
        formDataObj.append("title", formData.title);
        formDataObj.append("company_name", formData.company_name);
        formDataObj.append("regards", formData.regards);
        formDataObj.append("gst_number", formData.gst_number);
        formDataObj.append("firm_name", formData.firm_name);
        formDataObj.append("bill_date", formData.bill_date);
        formDataObj.append("file", formData.file);
        fetchOptions.body = formDataObj;
      } else {
        // Use JSON when no file
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify({
          id: editingBillId,
          title: formData.title,
          company_name: formData.company_name,
          regards: formData.regards,
          gst_number: formData.gst_number,
          firm_name: formData.firm_name,
          bill_date: formData.bill_date,
        });
      }

      const response = await fetch(API_URL, fetchOptions);

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        setAlertMessage(editingBillId ? "Bill updated successfully!" : "Bill uploaded successfully!");
        setAlertType("success");
        setShowAlertModal(true);
        setFormData({
          title: "",
          company_name: "",
          regards: "",
          gst_number: "",
          firm_name: "",
          bill_date: new Date().toISOString().split("T")[0],
          file: null,
        });
        setEditingBillId(null);
        setShowEditModal(false);
        fetchUploadedBills();
      } else {
        throw new Error(responseData.message || "Upload failed");
      }
    } catch (error) {
      setAlertMessage(error.message || "Error uploading bill");
      setAlertType("error");
      setShowAlertModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBill = (bill) => {
    setEditingBillId(bill.id);
    setFormData({
      title: bill.title,
      company_name: bill.company_name,
      regards: bill.regards,
      gst_number: bill.gst_number,
      firm_name: bill.firm_name,
      bill_date: bill.bill_date,
      file: null,
    });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setEditingBillId(null);
    setShowEditModal(false);
    setFormData({
      title: "",
      company_name: "",
      regards: "",
      gst_number: "",
      firm_name: "",
      bill_date: new Date().toISOString().split("T")[0],
      file: null,
    });
  };

  return (
    <div className="dashboard-container">
      <StaffLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <StaffHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <div className="mb-3">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/StaffDashBoard')}
              className="me-2"
            >
              <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
            </Button>
          </div>
          <Row className="justify-content-center mt-4">
            <Col xs={12} lg={12}>
              <Card className="shadow-lg border-0 rounded-4 p-3 animate__animated animate__fadeIn" style={{ backgroundColor: "#f8f9fa" }}>
                <Card.Body>
                  <div className="text-center mb-4">
                    <h3 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "0.5rem" }}>
                      <i className="bi bi-file-earmark-pdf" style={{ marginRight: "10px" }}></i>
                      Upload Bills
                    </h3>
                    <p style={{ color: "#6c757d", fontSize: "14px" }}>Manage and upload bills with details.</p>
                  </div>

                  {/* Upload Form */}
                  <div className="bg-light p-3 rounded mb-4">
                    <h5 className="mb-3" style={{ color: "#2b6777", fontWeight: 600 }}>Upload New Bill</h5>
                    <Form onSubmit={handleSubmit}>
                      <Row className="g-2">
                        <Col lg={3}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Title <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter bill title"
                              name="title"
                              value={formData.title}
                              onChange={handleChange}
                              required
                              style={{ borderColor: "#52ab98" }}
                            />
                          </Form.Group>
                        </Col>
                        <Col lg={3}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Company Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter company name"
                              name="company_name"
                              value={formData.company_name}
                              onChange={handleChange}
                              required
                              style={{ borderColor: "#52ab98" }}
                            />
                          </Form.Group>
                        </Col>
                        <Col lg={3}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Regards <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter regards"
                              name="regards"
                              value={formData.regards}
                              onChange={handleChange}
                              required
                              style={{ borderColor: "#52ab98" }}
                            />
                          </Form.Group>
                        </Col>
                        <Col lg={3}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Bill Date <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="date"
                              name="bill_date"
                              value={formData.bill_date}
                              onChange={handleChange}
                              required
                              style={{ borderColor: "#52ab98" }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col lg={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>GST Number <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter GST number"
                              name="gst_number"
                              value={formData.gst_number}
                              onChange={handleChange}
                              required
                              style={{ borderColor: "#52ab98" }}
                            />
                          </Form.Group>
                        </Col>
                        <Col lg={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>Firm Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Enter firm name"
                              name="firm_name"
                              value={formData.firm_name}
                              onChange={handleChange}
                              required
                              style={{ borderColor: "#52ab98" }}
                            />
                          </Form.Group>
                        </Col>
                        <Col lg={4}>
                          <Form.Group className="mb-3">
                            <Form.Label style={{ fontSize: "0.9rem", fontWeight: 600 }}>File Upload <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                              type="file"
                              onChange={handleFileChange}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              required={!editingBillId}
                              style={{ borderColor: "#52ab98" }}
                            />
                            <Form.Text className="text-muted">Max 2MB</Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>

                      {formData.file && (
                        <Row className="mb-3">
                          <Col lg={12}>
                            <Alert variant="info">
                              <strong>Selected File:</strong> {formData.file.name}
                            </Alert>
                          </Col>
                        </Row>
                      )}

                      <div className="d-flex gap-2">
                        <Button
                          variant="primary"
                          type="submit"
                          disabled={isSubmitting}
                          style={{ borderRadius: 8, fontWeight: 600 }}
                        >
                          {isSubmitting ? "Uploading..." : "Upload Bill"}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setFormData({ title: "", company_name: "BrainRock", regards: "", gst_number: "", firm_name: "", bill_date: new Date().toISOString().split("T")[0], file: null })}
                          style={{ borderRadius: 8, fontWeight: 600 }}
                        >
                          Clear
                        </Button>
                      </div>
                    </Form>
                  </div>

                  {/* Bills Table */}
                  <div>
                    <h5 className="mb-3" style={{ color: "#2b6777", fontWeight: 600 }}>Uploaded Bills</h5>

                    <div className="bg-light p-3 rounded mb-3">
                      <Row className="g-2">
                        <Col lg={4}>
                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: "0.85rem" }}>Search Field</Form.Label>
                            <Form.Select
                              value={searchField}
                              onChange={(e) => setSearchField(e.target.value)}
                              style={{ fontSize: "0.85rem" }}
                            >
                              <option value="all">All Fields</option>
                              <option value="title">Title</option>
                              <option value="gst_number">GST Number</option>
                              <option value="firm_name">Firm Name</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col lg={8}>
                          <Form.Group className="mb-2">
                            <Form.Label style={{ fontSize: "0.85rem" }}>Search</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Search..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              style={{ fontSize: "0.85rem" }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <p style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: 0 }}>
                        Showing {filteredBills.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredBills.length)} of {filteredBills.length} bill(s)
                      </p>
                    </div>

                    {isLoading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-2">Loading bills...</p>
                      </div>
                    ) : filteredBills.length === 0 ? (
                      <Alert variant="info">
                        {uploadedBills.length === 0 ? "No bills uploaded yet." : "No bills match the search criteria."}
                      </Alert>
                    ) : (
                      <div className="table-responsive">
                        <Table striped bordered hover className="mb-0" style={{ fontSize: "0.85rem" }}>
                          <thead className="bg-light">
                            <tr>
                              <th>#</th>
                              <th>Title</th>
                              <th>Company</th>
                              <th>Regards</th>
                              <th>GST Number</th>
                              <th>Firm Name</th>
                              <th>Bill Date</th>
                              <th>File</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedBills.map((bill, index) => (
                              <tr key={bill.id}>
                                <td>{startIndex + index + 1}</td>
                                <td>{bill.title}</td>
                                <td>{bill.company_name || "-"}</td>
                                <td>{bill.regards}</td>
                                <td>{bill.gst_number}</td>
                                <td>{bill.firm_name}</td>
                                <td>{new Date(bill.bill_date).toLocaleDateString()}</td>
                                <td>
                                  {bill.file ? (
                                    <a
                                      href={bill.file.startsWith('http') ? bill.file : `${BASE_URL}${bill.file}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-sm btn-outline-primary"
                                    >
                                      Download
                                    </a>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "0.3rem" }}>
                                    <Button
                                      variant="warning"
                                      size="sm"
                                      onClick={() => handleEditBill(bill)}
                                      style={{ fontSize: "0.75rem" }}
                                    >
                                      Edit
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}

                    {/* Pagination */}
                    {filteredBills.length > 0 && totalPages > 1 && (
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
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          style={{ minWidth: 80 }}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Alert Modal */}
      <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} centered>
        <Modal.Body className="text-center py-4">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            {alertType === "success" ? (
              <i className="bi bi-check-circle" style={{ color: "#28a745" }}></i>
            ) : (
              <i className="bi bi-exclamation-circle" style={{ color: "#dc3545" }}></i>
            )}
          </div>
          <p style={{ fontSize: "1rem", fontWeight: 600, color: alertType === "success" ? "#28a745" : "#dc3545" }}>
            {alertMessage}
          </p>
        </Modal.Body>
      </Modal>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={handleCancelEdit} size="lg" centered>
        <Modal.Header closeButton style={{ backgroundColor: "#f8fafc" }}>
          <Modal.Title style={{ fontWeight: 700 }}>Edit Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className="g-2">
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-2">
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Regards</Form.Label>
                  <Form.Control
                    type="text"
                    name="regards"
                    value={formData.regards}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bill Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="bill_date"
                    value={formData.bill_date}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row className="g-2">
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>GST Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col lg={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Firm Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firm_name"
                    value={formData.firm_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>File Upload (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Bill"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UploadBills;

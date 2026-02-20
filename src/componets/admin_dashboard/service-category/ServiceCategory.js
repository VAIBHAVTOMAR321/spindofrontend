import React, { useState, useEffect } from "react";
import { Container, Table, Button, Modal, Form, Alert, Spinner, Row, Col } from "react-bootstrap";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import "../../../assets/css/admindashboard.css";
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import { useAuth } from "../../context/AuthContext";
import "../../../assets/css/table.css";

// --- Constants for API ---
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/service-category/`;

const ServiceCategory = () => {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  
  // Check device width
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Service categories state
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    prod_name: "",
    prod_desc: "",
    prod_cate: "",
    sub_cate: "",
    prod_img: "",
    status: ""
  });
  
  // Form submission states
  const [submitLoading, setSubmitLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    prod_name: '',
    prod_cate: '',
    sub_cate: '',
    status: ''
  });

  // PDF preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Image preview state
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data
  const filteredData = categories.filter(category =>
    (!filters.prod_name || category.prod_name?.toLowerCase().includes(filters.prod_name.toLowerCase())) &&
    (!filters.prod_cate || category.prod_cate?.toLowerCase().includes(filters.prod_cate.toLowerCase())) &&
    (!filters.sub_cate || category.sub_cate?.toLowerCase().includes(filters.sub_cate.toLowerCase())) &&
    (!filters.status || category.status?.toLowerCase().includes(filters.status.toLowerCase()))
  );
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setSidebarOpen(width >= 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    
    // Fetch categories on component mount
    fetchCategories();
    
    return () => window.removeEventListener("resize", checkDevice);
  }, [tokens]);
  
  // Fetch categories from API
  const fetchCategories = async () => {
    if (!tokens?.access) return;
    
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.get(API_URL, {
        headers: { 
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "application/json"
        }
      });
      
      setCategories(response.data.data || []);
    } catch (err) {
      console.error("FETCH ERROR:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to fetch service categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission (POST & PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.access) {
      setError("Authentication required. Please log in.");
      return;
    }
    
    setSubmitLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const formDataToSend = new FormData();
      
      if (editingId) {
        // PUT (UPDATE)
        formDataToSend.append('id', editingId);
        formDataToSend.append('prod_name', formData.prod_name);
        formDataToSend.append('status', formData.status);
        if (formData.prod_img && typeof formData.prod_img !== 'string') {
          formDataToSend.append('prod_img', formData.prod_img, formData.prod_img.name);
        }
        
        await axios.put(API_URL, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${tokens.access}`,
            "Content-Type": "multipart/form-data"
          }
        });
        
        setSuccess("Service category updated successfully!");
        setShowEditModal(false);
      } else {
        // POST (CREATE)
        formDataToSend.append('prod_name', formData.prod_name);
        formDataToSend.append('prod_desc', formData.prod_desc);
        formDataToSend.append('prod_cate', formData.prod_cate);
        formDataToSend.append('sub_cate', formData.sub_cate);
        formDataToSend.append('status', formData.status);
        if (formData.prod_img && typeof formData.prod_img !== 'string') {
          formDataToSend.append('prod_img', formData.prod_img, formData.prod_img.name);
        }
        
        await axios.post(API_URL, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${tokens.access}`,
            "Content-Type": "multipart/form-data"
          }
        });
        
        setSuccess("Service category added successfully!");
        setShowAddModal(false);
      }
      
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error("SUBMIT ERROR:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || "Something went wrong";
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Handle edit button click
  const handleEdit = (category) => {
    setEditingId(category.id);
    setFormData({
      prod_name: category.prod_name,
      prod_desc: category.prod_desc,
      prod_cate: category.prod_cate,
      sub_cate: category.sub_cate,
      prod_img: category.prod_img || "",
      status: category.status
    });
    setShowEditModal(true);
  };
  
  // Handle delete button click
  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!tokens?.access) {
      setError("Authentication required. Please log in.");
      return;
    }
    
    setSubmitLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const deletePayload = {
        id: selectedCategory.id
      };
      await axios.delete(API_URL, {
        headers: { 
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "application/json"
        },
        data: deletePayload
      });
      
      setSuccess("Service category deleted successfully!");
      setShowDeleteModal(false);
      fetchCategories();
    } catch (err) {
      console.error("DELETE ERROR:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || "Failed to delete service category";
      setError(errorMessage);
    } finally {
      setSubmitLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setFormData({
      prod_name: "",
      prod_desc: "",
      prod_cate: "",
      sub_cate: "",
      prod_img: null,
      status: "draft"
    });
  };

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Product Name", "Description", "Category", "Subcategory", "Status"]];
    const rows = filteredData.map(category => [
      category.prod_name,
      category.prod_desc,
      category.prod_cate,
      category.sub_cate,
      category.status
    ]);
    autoTable(pdf, {
      head: headers,
      body: rows,
      startY: 10,
      margin: { top: 10, right: 10, left: 10, bottom: 10 },
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: "bold" },
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
      link.download = "ServiceCategories.pdf";
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
  
  // Handle add modal close
  const handleAddModalClose = () => {
    setShowAddModal(false);
    resetForm();
  };
  
  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    resetForm();
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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Service Categories</h2>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                Add New Category
              </Button>
            </div>
            
            {success && (
              <Alert variant="success" dismissible onClose={() => setSuccess("")}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert variant="danger" dismissible onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            
            {/* Filter Inputs */}
            <div className="mb-3">
              <Form className="d-flex flex-wrap gap-2">
                <Form.Control
                  name="prod_name"
                  value={filters.prod_name}
                  onChange={handleFilterChange}
                  placeholder="Filter Product Name"
                  style={{ maxWidth: 180, borderRadius: 8 }}
                />
                <Form.Control
                  name="prod_cate"
                  value={filters.prod_cate}
                  onChange={handleFilterChange}
                  placeholder="Filter Category"
                  style={{ maxWidth: 180, borderRadius: 8 }}
                />
                <Form.Control
                  name="sub_cate"
                  value={filters.sub_cate}
                  onChange={handleFilterChange}
                  placeholder="Filter Subcategory"
                  style={{ maxWidth: 180, borderRadius: 8 }}
                />
                <Form.Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  style={{ maxWidth: 140, borderRadius: 8 }}
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </Form.Select>
              </Form>
            </div>

            {/* PDF Button */}
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
                <Modal.Title>Image Preview</Modal.Title>
              </Modal.Header>
              <Modal.Body className="text-center">
                {imagePreviewUrl && (
                  <img src={imagePreviewUrl} alt="Product" 
                    style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 8 }} />
                )}
              </Modal.Body>
            </Modal>
            
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <>
                <Table striped bordered hover responsive>
                  <thead className="table-thead">
                    <tr>
                      <th>ID</th>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Description</th>
                      <th>Category</th>
                      <th>Subcategory</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((category) => (
                          <tr key={category.id}>
                            <td>{category.id}</td>
                            <td>
                              {category.prod_img ? (
                                <img 
                                  src={`${BASE_URL}/${category.prod_img}`} 
                                  alt={category.prod_name} 
                                  onClick={() => handleImagePreview(`${BASE_URL}/${category.prod_img}`)}
                                  style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                />
                              ) : (
                                <span className="text-muted">No image</span>
                              )}
                            </td>
                            <td>{category.prod_name}</td>
                            <td>{category.prod_desc}</td>
                            <td>{category.prod_cate}</td>
                            <td>{category.sub_cate}</td>
                            <td>
                              <span className={`badge bg-${category.status === 'draft' ? 'secondary' : 'success'}`}>
                                {category.status}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEdit(category)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteClick(category)}
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">No service categories found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                {filteredData.length > itemsPerPage && (
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
                      disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      style={{ minWidth: 80 }}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </Container>
        </div>
      </div>

      {/* Add Category Modal */}
      <Modal show={showAddModal} onHide={handleAddModalClose} size="lg">
        <Modal.Header closeButton className="modal-top">
          <Modal.Title>Add New Service Category</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="prod_name">
                  <Form.Label>Service Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter service name"
                    name="prod_name"
                    value={formData.prod_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="prod_cate">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter category"
                    name="prod_cate"
                    value={formData.prod_cate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="sub_cate">
                  <Form.Label>Subcategory</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter subcategory"
                    name="sub_cate"
                    value={formData.sub_cate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="prod_desc">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                name="prod_desc"
                value={formData.prod_desc}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="prod_img">
              <Form.Label>Product Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                name="prod_img"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setFormData(prev => ({
                    ...prev,
                    prod_img: file
                  }));
                }}
              />
              {formData.prod_img && typeof formData.prod_img !== 'string' && (
                <div className="mt-2">
                  <small className="text-muted">Selected file: {formData.prod_img.name}</small>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleAddModalClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Adding...</span>
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal show={showEditModal} onHide={handleEditModalClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Service Category</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} encType="multipart/form-data">
          <Modal.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="edit_prod_name">
                  <Form.Label>Service Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter service name"
                    name="prod_name"
                    value={formData.prod_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="edit_prod_cate">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter category"
                    name="prod_cate"
                    value={formData.prod_cate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="edit_sub_cate">
                  <Form.Label>Subcategory</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter subcategory"
                    name="sub_cate"
                    value={formData.sub_cate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="edit_status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="edit_prod_desc">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description"
                name="prod_desc"
                value={formData.prod_desc}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="edit_prod_img">
              <Form.Label>Product Image</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                name="prod_img"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setFormData(prev => ({
                    ...prev,
                    prod_img: file
                  }));
                }}
              />
              {formData.prod_img && typeof formData.prod_img !== 'string' && (
                <div className="mt-2">
                  <small className="text-muted">Selected file: {formData.prod_img.name}</small>
                </div>
              )}
              {formData.prod_img && typeof formData.prod_img === 'string' && (
                <div className="mt-2">
                  <small className="text-muted">Current image:</small>
                  <div className="mt-1">
                    <img 
                      src={`${BASE_URL}/${formData.prod_img}`} 
                      alt="Current product image" 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="mt-1">
                    <small className="text-muted">URL: {formData.prod_img}</small>
                  </div>
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleEditModalClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitLoading}>
              {submitLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Updating...</span>
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete "{selectedCategory?.prod_name}"? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm} disabled={submitLoading}>
             {submitLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Deleting...</span>
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ServiceCategory;
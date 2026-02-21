import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../context/AuthContext";

import "../../../assets/css/admindashboard.css";
import StaffHeader from "../StaffHeader";
import StaffLeftNav from "../StaffLeftNav";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/requestservices/`;
const ASSIGN_VENDOR_API = `${BASE_URL}/api/assign-vendor/`;
const VENDOR_LIST_API = `${BASE_URL}/api/vendor/register/`;

const StaffServicesRequest = ({ showCardOnly = false }) => {
  // Sidebar and device state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const navigate = useNavigate();
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
  const { tokens } = useAuth();

  // Data state
  const [requestData, setRequestData] = useState([]);
  const [vendorData, setVendorData] = useState([]); // New state for vendor data
  const [count, setCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0); // New state for vendor count
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorCurrentPage, setVendorCurrentPage] = useState(1); // New state for vendor pagination
  const itemsPerPage = 10;
  const [showRequests, setShowRequests] = useState(true); // New state to toggle between requests and vendors

  // Assign vendor state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Multi-vendor assignment state
  const [vendorAssignments, setVendorAssignments] = useState([
    { vendor: '', services: [] }
  ]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");
  const [vendorList, setVendorList] = useState([]);
  const [vendorListLoading, setVendorListLoading] = useState(false);
  // Detail view state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailType, setDetailType] = useState(null); // 'services' or 'assignments'

  // PDF preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    request_id: '',
    username: '',
    contact_number: '',
    status: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Filtered data for requests
  const filteredRequests = requestData.filter(request =>
    (!filters.request_id || request.request_id?.toString().includes(filters.request_id)) &&
    (!filters.username || request.username?.toLowerCase().includes(filters.username.toLowerCase())) &&
    (!filters.contact_number || request.contact_number?.toString().includes(filters.contact_number)) &&
    (!filters.status || request.status?.toLowerCase() === filters.status.toLowerCase())
  );

  // Fetch request services
  const fetchRequestServices = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      // Sanitize request_for_services to ensure it's always string or array
      const sanitizedData = (res.data.data || []).map(request => {
        let { request_for_services } = request;
        // Convert non-string/non-array values to appropriate format
        if (!Array.isArray(request_for_services) && typeof request_for_services !== 'string') {
          // If it's an object, convert to string or array
          if (typeof request_for_services === 'object') {
            request_for_services = JSON.stringify(request_for_services);
          } else {
            // For other types (number, boolean, null, undefined), convert to string
            request_for_services = String(request_for_services);
          }
        }
        // Ensure empty values are handled
        if (!request_for_services) {
          request_for_services = '--';
        }
        return { ...request, request_for_services };
      });
      setRequestData(sanitizedData);
      setCount(sanitizedData.length);
    } catch (error) {
      setRequestData([]);
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  // Fetch vendor list for the table
  const fetchVendorData = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(VENDOR_LIST_API, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      console.log("Vendor Data Response:", res.data);
      const vendorList = Array.isArray(res.data.data) ? res.data.data : (res.data.data ? [res.data.data] : []);
      setVendorData(vendorList);
      setVendorCount(vendorList.length);
    } catch (error) {
      setVendorData([]);
      setVendorCount(0);
      console.error("GET VENDOR DATA ERROR:", error.response?.data || error.message);
    }
  };

  // Fetch vendor list for the modal
  const fetchVendorList = async () => {
    if (!tokens?.access) return;
    setVendorListLoading(true);
    try {
      const res = await axios.get(VENDOR_LIST_API, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      console.log("Vendor List Modal Response:", res.data);
      const vendorList = Array.isArray(res.data.data) ? res.data.data : (res.data.data ? [res.data.data] : []);
      setVendorList(vendorList);
    } catch (error) {
      setVendorList([]);
      console.error("GET VENDOR LIST ERROR:", error.response?.data || error.message);
    } finally {
      setVendorListLoading(false);
    }
  };

  // Assign vendor function
  const assignVendor = async () => {
    if (!selectedRequest) {
      setAssignError("No request selected");
      return;
    }
    // Validate: at least one vendor, no empty vendor, no empty services
    for (let va of vendorAssignments) {
      if (!va.vendor) {
        setAssignError("Please select all vendors");
        return;
      }
      if (!va.services.length) {
        setAssignError("Please select at least one service for each vendor");
        return;
      }
    }
    setAssignLoading(true);
    setAssignSuccess("");
    setAssignError("");
    try {
      const res = await axios.post(
        ASSIGN_VENDOR_API,
        {
          request_id: selectedRequest.request_id,
          assignments: vendorAssignments.map(va => ({
            vendor_unique_id: va.vendor,
            request_for_services: va.services
          }))
        },
        {
          headers: { Authorization: `Bearer ${tokens.access}` },
        }
      );
      setAssignSuccess("Vendors assigned successfully!");
      setVendorAssignments([{ vendor: '', services: [] }]);
      setTimeout(() => {
        fetchRequestServices();
        setShowAssignModal(false);
      }, 1500);
    } catch (error) {
      setAssignError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to assign vendors. Please try again."
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // Open assign vendor modal
  const openAssignModal = (request) => {
    setSelectedRequest(request);
    setVendorAssignments([{ vendor: '', services: [] }]);
    setAssignSuccess("");
    setAssignError("");
    setShowAssignModal(true);
    fetchVendorList(); // Fetch vendors when modal opens
  };

  const handleViewPDF = () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    if (showRequests) {
      // PDF for Service Requests Table
      const headers = [["Request ID", "Username", "Contact", "Email", "State", "District", "Assignments", "Status"]];
      const rows = filteredRequests.map(request => {
        // Format assignments with status and mobile
        let assignmentsText = "Not Assigned";
        if (Array.isArray(request.assignments) && request.assignments.length > 0) {
          assignmentsText = request.assignments.map(assignment => {
            if (Array.isArray(assignment) && Array.isArray(assignment[0])) {
              const services = assignment[0];
              const vendorName = assignment[2];
              const assignmentStatus = assignment[3] || "assigned";
              const vendorMobile = assignment[4] || "--";
              return `${vendorName} (Mobile: ${vendorMobile}): ${services.join(', ')} (${assignmentStatus})`;
            }
            return JSON.stringify(assignment);
          }).join('\n');
        }
        return [
          request.request_id,
          request.username,
          request.contact_number,
          request.email,
          request.state,
          request.district,
          assignmentsText,
          request.status
        ];
      });
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
    } else {
      // PDF for Vendors Table
      const headers = [["Vendor ID", "Username", "Mobile", "Email", "State", "District", "Block", "Category", "Status"]];
      const rows = vendorData.map(vendor => {
        let categories = '';
        if (Array.isArray(vendor.category)) {
          categories = vendor.category.join(', ');
        } else if (typeof vendor.category === 'string') {
          categories = vendor.category;
        } else if (typeof vendor.category === 'object' && vendor.category !== null) {
          categories = Object.values(vendor.category).join(', ');
        }
        return [
          vendor.unique_id,
          vendor.username,
          vendor.mobile_number,
          vendor.email,
          vendor.state,
          vendor.district,
          vendor.block,
          categories,
          vendor.is_active ? 'Active' : 'Inactive'
        ];
      });
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
    }
    
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(url);
    setShowPdfModal(true);
  };

  const handleDownloadPDF = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = showRequests ? "ServiceRequests.pdf" : "VendorList.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  useEffect(() => {
    fetchRequestServices();
    fetchVendorData(); // Fetch vendor data when component mounts
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card">
        <div className="dashboard-card-icon request-icon" title="Request for services">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 20v-6m0 0l-3 3m3-3l3 3M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" stroke="#6366f1" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Request for services</div>
        <div className="dashboard-card-value">{count}</div>
      </div>
    );
  }

  // Full page with table
  return (
    <>
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <StaffLeftNav
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
        {/* Main Content */}
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
                <div className="d-flex gap-3 align-items-center">
                  <Button
                    variant={showRequests ? "primary" : "outline-primary"}
                    onClick={() => setShowRequests(true)}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    Service Requests ({count})
                  </Button>
                  <Button
                    variant={!showRequests ? "primary" : "outline-primary"}
                    onClick={() => setShowRequests(false)}
                    style={{
                      borderRadius: 8,
                      fontWeight: 600,
                    }}
                  >
                    Vendors ({vendorCount})
                  </Button>
                </div>
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
                    <h6 style={{ color: '#6366f1', fontWeight: 700, marginTop: 10 }}>
                      {showRequests ? 'Total Requests' : 'Total Vendors'}
                    </h6>
                    <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 10 }}>
                      {showRequests ? count : vendorCount}
                    </h2>
                  </Card>
                </div>
                <div className="d-flex gap-2">
                  <Button variant="success" onClick={handleViewPDF} style={{ borderRadius: 10, fontWeight: 600 }}>
                    View Table as PDF
                  </Button>
                </div>
              </div>
              
              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                {showRequests ? (
                  // Service Requests Table
                  <>
                    {/* Filters Row */}
                    <div className="mb-3 d-flex gap-2 align-items-center" style={{ overflow: 'auto' }}>
                      <Form className="d-flex gap-2" style={{ minWidth: 'fit-content' }}>
                        <Form.Control
                          name="request_id"
                          value={filters.request_id}
                          onChange={handleFilterChange}
                          placeholder="Filter Request ID"
                          style={{ minWidth: 130, borderRadius: 8 }}
                        />
                        <Form.Control
                          name="username"
                          value={filters.username}
                          onChange={handleFilterChange}
                          placeholder="Filter Username"
                          style={{ minWidth: 130, borderRadius: 8 }}
                        />
                        <Form.Control
                          name="contact_number"
                          value={filters.contact_number}
                          onChange={handleFilterChange}
                          placeholder="Filter Contact"
                          style={{ minWidth: 130, borderRadius: 8 }}
                        />
                        <Form.Select
                          name="status"
                          value={filters.status}
                          onChange={handleFilterChange}
                          style={{ minWidth: 130, borderRadius: 8 }}
                        >
                          <option value="">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="assigned">Assigned</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </Form.Select>
                      </Form>
                    </div>
                    <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                       <thead className="table-thead">
                          <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                            <th>Request ID</th>
                            <th>Username</th>
                            <th>Contact Number</th>
                            <th>Email</th>
                            <th>State</th>
                            <th>District</th>
                            <th>Request for Services</th>
                            <th>Schedule Date</th>
                            <th>Assignments</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                      <tbody>
                        {filteredRequests
                          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                          .map((request) => (
                            <tr key={request.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ fontWeight: 600, color: '#6366f1' }}>{typeof request.request_id === 'string' || typeof request.request_id === 'number' ? request.request_id : '--'}</td>
                              <td>{typeof request.username === 'string' ? request.username : '--'}</td>
                              <td>{typeof request.contact_number === 'string' || typeof request.contact_number === 'number' ? request.contact_number : '--'}</td>
                              <td>{typeof request.email === 'string' ? request.email : '--'}</td>
                              <td>{typeof request.state === 'string' ? request.state : '--'}</td>
                              <td>{typeof request.district === 'string' ? request.district : '--'}</td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setDetailType('services');
                                    setShowDetailModal(true);
                                  }}
                                  style={{ padding: 0, textDecoration: 'none', color: '#6366f1', fontWeight: 600 }}
                                >
                                  {(() => {
                                    const services = request.request_for_services;
                                    let serviceList = [];
                                    if (Array.isArray(services)) {
                                      serviceList = services;
                                    } else if (typeof services === 'string') {
                                      serviceList = services.trim() ? [services] : [];
                                    }
                                    return serviceList.length > 0 ? `${serviceList.length} Service${serviceList.length > 1 ? 's' : ''}` : '--';
                                  })()}
                                </Button>
                              </td>
                              <td>{typeof request.schedule_date === 'string' ? new Date(request.schedule_date).toLocaleDateString() : '--'}</td>
                              <td>
                                {Array.isArray(request.assignments) && request.assignments.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {request.assignments.slice(0, 2).map((assignment, idx) => {
                                      if (Array.isArray(assignment) && assignment.length >= 3) {
                                        const vendorName = assignment[2];
                                        const assignmentStatus = assignment[3] || "assigned";
                                        const vendorMobile = assignment[4] || "--";
                                        return (
                                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexDirection: 'column' }}>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: '#065f46' }}>
                                              {vendorName}
                                            </span>
                                            <span style={{ fontSize: 11, color: '#64748b' }}>
                                              <b>Mobile:</b> {vendorMobile}
                                            </span>
                                            <span
                                              style={{
                                                padding: '2px 8px',
                                                borderRadius: 3,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                backgroundColor: assignmentStatus === "completed" ? "#d4edda" : "#cfe2ff",
                                                color: assignmentStatus === "completed" ? "#155724" : "#004085"
                                              }}
                                            >
                                              {assignmentStatus}
                                            </span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                    {request.assignments.length > 2 && (
                                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                                        +{request.assignments.length - 2} more
                                      </span>
                                    )}
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        setDetailType('assignments');
                                        setShowDetailModal(true);
                                      }}
                                      style={{ padding: 0, textDecoration: 'none', color: '#6366f1', fontWeight: 600, fontSize: 11, marginTop: 2 }}
                                    >
                                      View All
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setDetailType('assignments');
                                      setShowDetailModal(true);
                                    }}
                                    style={{ padding: 0, textDecoration: 'none', color: '#6366f1', fontWeight: 600 }}
                                  >
                                    --
                                  </Button>
                                )}
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    backgroundColor: request.status === 'pending' ? '#fef3c7' : '#d1fae5',
                                    color: request.status === 'pending' ? '#92400e' : '#065f46',
                                  }}
                                >
                                  {typeof request.status === 'string' ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : '--'}
                                </span>
                              </td>
                              <td>{typeof request.created_at === 'string' ? new Date(request.created_at).toLocaleDateString() : '--'}</td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => openAssignModal(request)}
                                  disabled={(() => {
                                    // Get all services from request
                                    let allServices = [];
                                    if (Array.isArray(request.request_for_services)) {
                                      allServices = request.request_for_services;
                                    } else if (typeof request.request_for_services === 'string') {
                                      allServices = request.request_for_services.trim() ? [request.request_for_services] : [];
                                    }
                                    // Get all assigned services
                                    const assignedServices = [];
                                    if (Array.isArray(request.assignments)) {
                                      request.assignments.forEach(assignment => {
                                        if (Array.isArray(assignment) && Array.isArray(assignment[0])) {
                                          assignedServices.push(...assignment[0]);
                                        }
                                      });
                                    }
                                    // Check if all services are assigned
                                    return allServices.length > 0 && allServices.every(service => assignedServices.includes(service));
                                  })()}
                                  style={{
                                    backgroundColor: '#6366f1',
                                    borderColor: '#6366f1',
                                  }}
                                >
                                  Assign Vendor
                                </Button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                    {/* Pagination Controls for Requests */}
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
                        Page {currentPage} of {Math.ceil(filteredRequests.length / itemsPerPage) || 1}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={currentPage === Math.ceil(filteredRequests.length / itemsPerPage) || filteredRequests.length === 0}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        style={{ minWidth: 80 }}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                ) : (
                  // Vendors Table
                  <>
                    <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                      <thead className="table-thead">
                        <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                          <th>Vendor ID</th>
                          <th>Username</th>
                          <th>Mobile Number</th>
                          <th>Email</th>
                          <th>State</th>
                          <th>District</th>
                          <th>Block</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorData
                          .slice((vendorCurrentPage - 1) * itemsPerPage, vendorCurrentPage * itemsPerPage)
                          .map((vendor) => (
                            <tr key={vendor.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ fontWeight: 600, color: '#6366f1' }}>{typeof vendor.unique_id === 'string' || typeof vendor.unique_id === 'number' ? vendor.unique_id : '--'}</td>
                              <td>{typeof vendor.username === 'string' ? vendor.username : '--'}</td>
                              <td>{typeof vendor.mobile_number === 'string' || typeof vendor.mobile_number === 'number' ? vendor.mobile_number : '--'}</td>
                              <td>{typeof vendor.email === 'string' ? vendor.email : '--'}</td>
                              <td>{typeof vendor.state === 'string' ? vendor.state : '--'}</td>
                              <td>{typeof vendor.district === 'string' ? vendor.district : '--'}</td>
                              <td>{typeof vendor.block === 'string' ? vendor.block : '--'}</td>
                              <td>{typeof vendor.category === 'string' ? vendor.category : 'N/A'}</td>
                              <td>
                                <span
                                  style={{
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    backgroundColor: vendor.is_active ? '#d1fae5' : '#fef3c7',
                                    color: vendor.is_active ? '#065f46' : '#92400e',
                                  }}
                                >
                                  {typeof vendor.is_active === 'boolean' ? (vendor.is_active ? 'Active' : 'Inactive') : 'N/A'}
                                </span>
                              </td>
                              <td>{typeof vendor.created_at === 'string' ? new Date(vendor.created_at).toLocaleDateString() : '--'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                    {/* Pagination Controls for Vendors */}
                    <div className="d-flex justify-content-center align-items-center mt-3 gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={vendorCurrentPage === 1}
                        onClick={() => setVendorCurrentPage((prev) => Math.max(prev - 1, 1))}
                        style={{ minWidth: 80 }}
                      >
                        Previous
                      </Button>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        Page {vendorCurrentPage} of {Math.ceil(vendorData.length / itemsPerPage) || 1}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={vendorCurrentPage === Math.ceil(vendorData.length / itemsPerPage) || vendorData.length === 0}
                        onClick={() => setVendorCurrentPage((prev) => prev + 1)}
                        style={{ minWidth: 80 }}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Container>
        </div>
      </div>

      {/* Detail View Modal */}
      <Modal
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Modal.Title style={{ color: '#ffffff', fontWeight: 700 }}>
            {detailType === 'services' ? 'Request for Services Details' : 'Vendor Assignments'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {detailType === 'services' && selectedRequest && (
            <div>
              <h6 style={{ color: '#475569', fontWeight: 600, marginBottom: '1rem' }}>All Services</h6>
              {(() => {
                const services = selectedRequest.request_for_services;
                let serviceList = [];
                if (Array.isArray(services)) {
                  serviceList = services;
                } else if (typeof services === 'string') {
                  serviceList = services.trim() ? [services] : [];
                }
                // Get assigned services
                const assignedServices = [];
                if (Array.isArray(selectedRequest.assignments)) {
                  selectedRequest.assignments.forEach(assignment => {
                    if (Array.isArray(assignment) && Array.isArray(assignment[0])) {
                      assignedServices.push(...assignment[0]);
                    }
                  });
                }
                return serviceList.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {serviceList.map((service, idx) => (
                      <span key={idx}>
                        <span
                          style={{
                            padding: '8px 14px',
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 600,
                            backgroundColor: assignedServices.includes(service) ? '#d1fae5' : '#e0e7ff',
                            color: assignedServices.includes(service) ? '#065f46' : '#3730a3',
                          }}
                        >
                          {service}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : '--';
              })()}
            </div>
          )}
          {detailType === 'assignments' && selectedRequest && (
            <div>
              <h6 style={{ color: '#475569', fontWeight: 600, marginBottom: '1rem' }}>Vendor Assignments</h6>
              {Array.isArray(selectedRequest.assignments) && selectedRequest.assignments.length > 0 ? (
                <div>
                  {selectedRequest.assignments.map((assignment, aIdx) => (
                    <div key={aIdx} className="p-3 border rounded mb-3" style={{ backgroundColor: '#f8fafc' }}>
                      {(() => {
                        if (Array.isArray(assignment) && assignment.length >= 3) {
                          const services = assignment[0];
                          const vendorName = assignment[2];
                          const assignmentStatus = assignment[3] || "assigned";
                          const vendorMobile = assignment[4] || "--";
                          const serviceList = Array.isArray(services) ? services : [services];
                          return (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <div>
                                  <h6 style={{ color: '#6366f1', fontWeight: 700, margin: 0 }}>{vendorName}</h6>
                                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                    <b>Mobile:</b> {vendorMobile}
                                  </div>
                                </div>
                                <span
                                  style={{
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    backgroundColor: assignmentStatus === "completed" ? "#d4edda" : assignmentStatus === "assigned" ? "#cfe2ff" : "#f8f9fa",
                                    color: assignmentStatus === "completed" ? "#155724" : assignmentStatus === "assigned" ? "#004085" : "#6c757d"
                                  }}
                                >
                                  {assignmentStatus.charAt(0).toUpperCase() + assignmentStatus.slice(1)}
                                </span>
                              </div>
                              <div className="d-flex flex-wrap gap-2">
                                {serviceList.map((service, sIdx) => (
                                  <span key={sIdx}>
                                    <span
                                      style={{
                                        padding: '6px 12px',
                                        borderRadius: 4,
                                        fontSize: 13,
                                        fontWeight: 600,
                                        backgroundColor: '#d1fae5',
                                        color: '#065f46',
                                      }}
                                    >
                                      {service}
                                    </span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return '--';
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ color: '#94a3b8' }}>No assignments yet</span>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Assign Vendor Modal */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Modal.Title style={{ color: '#ffffff', fontWeight: 700 }}>
            Assign Vendor
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '2rem' }}>
          {selectedRequest && (
            <>
              <div className="mb-4">
                <h6 style={{ color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Request Details
                </h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-lg">
                      <small style={{ color: '#64748b' }}>Request ID</small>
                      <p style={{ fontWeight: 600, color: '#1e293b' }}>{typeof selectedRequest.request_id === 'string' || typeof selectedRequest.request_id === 'number' ? selectedRequest.request_id : '--'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-lg">
                      <small style={{ color: '#64748b' }}>Customer</small>
                      <p style={{ fontWeight: 600, color: '#1e293b' }}>{typeof selectedRequest.username === 'string' ? selectedRequest.username : '--'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-lg">
                      <small style={{ color: '#64748b' }}>Contact</small>
                      <p style={{ fontWeight: 600, color: '#1e293b' }}>{typeof selectedRequest.contact_number === 'string' || typeof selectedRequest.contact_number === 'number' ? selectedRequest.contact_number : '--'}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-lg">
                      <small style={{ color: '#64748b' }}>Email</small>
                      <p style={{ fontWeight: 600, color: '#1e293b' }}>{typeof selectedRequest.email === 'string' ? selectedRequest.email : '--'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Form>
                {/* Multi-vendor assignment UI */}
                {vendorAssignments.map((va, idx) => {
                  // Compute available vendors (no duplicate selection)
                  const usedVendors = vendorAssignments.map((v, i) => i !== idx ? v.vendor : '').filter(Boolean);
                  // Get all available services from request
                  let allServices = [];
                  if (selectedRequest) {
                    if (Array.isArray(selectedRequest.request_for_services)) {
                      allServices = selectedRequest.request_for_services;
                    } else if (typeof selectedRequest.request_for_services === 'string') {
                      try {
                        const parsed = JSON.parse(selectedRequest.request_for_services);
                        if (Array.isArray(parsed)) {
                          allServices = parsed;
                        } else {
                          allServices = selectedRequest.request_for_services.split(',').map(s => s.trim()).filter(Boolean);
                        }
                      } catch {
                        allServices = selectedRequest.request_for_services.split(',').map(s => s.trim()).filter(Boolean);
                      }
                    }
                  }
                  // Remove services already assigned to other vendors
                  const usedServices = vendorAssignments.flatMap((v, i) => i !== idx ? v.services : []);
                  // Also remove services that are already assigned in the request
                  const alreadyAssignedServices = [];
                  if (Array.isArray(selectedRequest?.assignments)) {
                    selectedRequest.assignments.forEach(assignment => {
                      if (Array.isArray(assignment) && Array.isArray(assignment[0])) {
                        alreadyAssignedServices.push(...assignment[0]);
                      }
                    });
                  }
                  const availableServices = allServices.filter(s => !usedServices.includes(s) && !alreadyAssignedServices.includes(s));
                  return (
                    <div key={idx} className="border rounded p-3 mb-3 bg-light">
                      <Form.Group className="mb-2">
                        <Form.Label style={{ color: '#475569', fontWeight: 600 }}>
                          Select Vendor {vendorAssignments.length > 1 ? idx + 1 : ''} <span style={{ color: '#ef4444' }}>*</span>
                        </Form.Label>
                        <Form.Select
                          value={va.vendor}
                          onChange={e => {
                            const newAssignments = [...vendorAssignments];
                            newAssignments[idx].vendor = e.target.value;
                            setVendorAssignments(newAssignments);
                          }}
                          className="border rounded-lg p-2 bg-white"
                        >
                          <option value="">Select a vendor</option>
                          {vendorList.filter(v => !usedVendors.includes(v.unique_id)).map((vendor) => {
                            let categories = '';
                            if (Array.isArray(vendor.category)) {
                              categories = vendor.category.join(', ');
                            } else if (typeof vendor.category === 'string') {
                              categories = vendor.category;
                            } else if (typeof vendor.category === 'object' && vendor.category !== null) {
                              categories = Object.values(vendor.category).join(', ');
                            }
                            return (
                              <option key={vendor.unique_id} value={vendor.unique_id}>
                                {typeof vendor.username === 'string' ? vendor.username : 'Unknown'}
                                {categories && categories !== 'N/A' && categories !== '{}' ? ` - ${categories}` : ''}
                              </option>
                            );
                          })}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-2">
                        <Form.Label style={{ color: '#475569', fontWeight: 600 }}>
                          Select Services
                        </Form.Label>
                        <Select
                          isMulti
                          closeMenuOnSelect={false}
                          options={availableServices.map(service => ({ value: service, label: service }))}
                          value={va.services.map(s => ({ value: s, label: s }))}
                          onChange={selected => {
                            const newAssignments = [...vendorAssignments];
                            newAssignments[idx].services = selected ? selected.map(opt => opt.value) : [];
                            setVendorAssignments(newAssignments);
                          }}
                          classNamePrefix="react-select"
                          placeholder="Select services..."
                          styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
                        />
                        {va.services.length > 0 && (
                          <div className="mt-2 text-sm text-success">
                            Selected {va.services.length} service(s)
                          </div>
                        )}
                      </Form.Group>
                      {vendorAssignments.length > 1 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setVendorAssignments(vendorAssignments.filter((_, i) => i !== idx));
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  );
                })}
                <Button
                  variant="secondary"
                  className="mb-3"
                  onClick={() => setVendorAssignments([...vendorAssignments, { vendor: '', services: [] }])}
                  disabled={vendorAssignments.length >= vendorList.length}
                >
                  + Add Another Vendor
                </Button>

                {assignSuccess && (
                  <Alert variant="success" className="mb-4">
                    {assignSuccess}
                  </Alert>
                )}

                {assignError && (
                  <Alert variant="danger" className="mb-4">
                    {assignError}
                  </Alert>
                )}

                <div className="d-flex gap-3">
                  <Button
                    variant="primary"
                    onClick={assignVendor}
                    disabled={assignLoading}
                    style={{
                      backgroundColor: '#6366f1',
                      borderColor: '#6366f1',
                      padding: '0.75rem 1.5rem',
                      fontWeight: 600,
                      borderRadius: 8,
                    }}
                  >
                    {assignLoading ? 'Assigning...' : 'Assign Vendors'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAssignModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontWeight: 600,
                      borderRadius: 8,
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>

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
    </>
  );
};

export default StaffServicesRequest;
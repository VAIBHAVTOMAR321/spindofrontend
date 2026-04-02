import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Container, Card, Table, Spinner, Alert, Row, Col, Badge, Form, Button, Modal } from "react-bootstrap";
import UserLeftNav from "../user_dashboard/UserLeftNav";
import UserHeader from "../user_dashboard/UserHeader";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import "../../assets/css/admindashboard.css";

const statusColors = {
  pending: "warning",
  approved: "success"
  // rejected removed
};

const ViewRequestService = () => {
    // Modal for cancellation
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelRequestId, setCancelRequestId] = useState(null);
    const [cancelVendors, setCancelVendors] = useState([]);
    const [cancelVendorOptions, setCancelVendorOptions] = useState([]);
    const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Current time for countdown
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef(null);

  const { user, tokens } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  // Filter state
  const [filters, setFilters] = useState({
    request_id: '',
    username: '',
    email: '',
    contact_number: '',
    alternate_contact_number: ''
  });

  // Filtered and paginated data
  const filteredRequests = (statusFilter === "all"
    ? requests
    : requests.filter(r => (r.status || "").toLowerCase() === statusFilter)
  ).filter(r =>
    (!filters.request_id || (r.request_id || '').toString().toLowerCase().includes(filters.request_id.toLowerCase())) &&
    (!filters.username || (r.username || '').toLowerCase().includes(filters.username.toLowerCase())) &&
    (!filters.email || (r.email || '').toLowerCase().includes(filters.email.toLowerCase())) &&
    (!filters.contact_number || (r.contact_number || '').toString().toLowerCase().includes(filters.contact_number.toLowerCase())) &&
    (!filters.alternate_contact_number || (r.alternate_contact_number || '').toString().toLowerCase().includes(filters.alternate_contact_number.toLowerCase()))
  );
  const totalPages = Math.ceil(filteredRequests.length / entriesPerPage);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  // PDF preview and download
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const handleViewPDF = async () => {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const headers = [["Request ID", "Name", "Email", "Contact", "Alternate Contact", "Address", "Assignments", "Schedule", "Description", "Status"]];
    const rows = filteredRequests.map(req => {
      // Format assignments with status and mobile
      let assignmentsText = "Not Assigned";
      if (Array.isArray(req.assignments) && req.assignments.length > 0) {
        assignmentsText = req.assignments.map(assignment => {
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
        req.request_id,
        req.username,
        req.email,
        req.contact_number,
        req.alternate_contact_number || '-',
        req.address,
        assignmentsText,
        `${req.schedule_date} ${req.schedule_time}`,
        req.description,
        req.status
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
    const pdfBlob = pdf.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    setPdfPreviewUrl(url);
    setShowPdfModal(true);
  };

  const handleDownloadPDF = () => {
    if (pdfPreviewUrl) {
      const link = document.createElement("a");
      link.href = pdfPreviewUrl;
      link.download = "ServiceRequests.pdf";
      link.click();
    }
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };
    // Handle filter change
    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      setCurrentPage(1);
    };
  const location = useLocation();

  // Set statusFilter from navigation state (e.g., from dashboard cards)
  useEffect(() => {
    if (location && location.state && location.state.filter) {
      const filter = location.state.filter.toLowerCase();
      if (["assigned", "pending", "cancelled", "completed"].includes(filter)) {
        setStatusFilter(filter);
      }
    }
    // eslint-disable-next-line
  }, [location.state]);

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

  useEffect(() => {
    if (!user?.uniqueId) {
      setError("User not logged in or missing unique ID.");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/?unique_id=${user.uniqueId}`, {
      headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Server error: ${res.status} ${res.statusText}. Response: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.status && data.data) {
          setRequests(data.data);
        } else {
          setError(data.message || "No service requests found or failed to load service requests.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Could not fetch service requests. " + (err.message || "Please check your internet connection or try again later."));
        setLoading(false);
      });
  }, [user]);

  // Countdown timer - update every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Check if a request is editable (within 5 minutes of created_at)
  const isEditable = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = currentTime;
    const diffMs = now - created;
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes < 5;
  };

  // Get remaining time in seconds for a request
  const getRemainingSeconds = (createdAt) => {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const deadline = new Date(created.getTime() + 5 * 60 * 1000);
    const remaining = Math.max(0, Math.floor((deadline - currentTime) / 1000));
    return remaining;
  };

  // Format seconds as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if any request is still editable
  const anyEditable = requests.some(r => isEditable(r.created_at));

  // Get the request with the most remaining time
  const getBestCountdown = () => {
    let best = 0;
    let bestReq = null;
    requests.forEach(r => {
      if (r.created_at) {
        const remaining = getRemainingSeconds(r.created_at);
        if (remaining > best) {
          best = remaining;
          bestReq = r;
        }
      }
    });
    return { remaining: best, req: bestReq };
  };

  // Open edit modal for a request
  const handleEditOpen = (req) => {
    setEditForm({
      request_id: req.request_id || "",
      username: req.username || "",
      contact_number: req.contact_number || "",
      email: req.email || "",
      address: req.address || "",
      schedule_date: req.schedule_date || "",
      schedule_time: req.schedule_time || "",
      alternate_contact_number: req.alternate_contact_number || ""
    });
    setEditError("");
    setEditSuccess("");
    setShowEditModal(true);
  };

  // Handle edit form change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit edit
  const handleEditSubmit = async () => {
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    try {
      const res = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/update-service-request/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.status) {
        setEditSuccess("Service request updated successfully!");
        // Refresh data
        setTimeout(() => {
          setShowEditModal(false);
          setEditSuccess("");
          window.location.reload();
        }, 1200);
      } else {
        setEditError(data.message || "Failed to update service request.");
      }
    } catch (err) {
      setEditError("Error updating service request.");
    }
    setEditLoading(false);
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
            <Col xs={12}>
              <Card className="animate__animated animate__fadeIn">
                <Card.Body>
                  <h3 className="mb-4 text-center" style={{ color: '#2b6777', fontWeight: 700, letterSpacing: 1 }}>My Service Requests</h3>
                  {/* Edit countdown / contact banner */}
                  {!loading && !error && (
                    anyEditable ? (
                      (() => {
                        const { remaining, req: bestReq } = getBestCountdown();
                        return (
                          <Alert variant="info" className="text-center" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15 }}>
                            <i className="bi bi-pencil-square me-2"></i>
                            You can edit your service requests for up to 5 minutes after creation.
                            {bestReq && <span> Time remaining: <span style={{ color: '#dc2626', fontWeight: 700, fontSize: 18 }}>{formatTime(remaining)}</span></span>}
                          </Alert>
                        );
                      })()
                    ) : (
                      requests.length > 0 && (
                        <Alert variant="warning" className="text-center" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15 }}>
                          <i className="bi bi-telephone me-2"></i>
                          For any changes in service request contact at <a href="tel:+919456346582" style={{ fontWeight: 700, color: '#b45309' }}>+91 9456346582</a>
                        </Alert>
                      )
                    )
                  )}
                  {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}
                  {error && <Alert variant="danger">{error}</Alert>}
                  {!loading && !error && (
                    <>
                      {/* Filters Row */}
                      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center justify-content-between">
                        <Form className="d-flex flex-wrap gap-2">
                          <Form.Control
                            name="request_id"
                            value={filters.request_id}
                            onChange={handleFilterChange}
                            placeholder="Filter Request ID"
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
                            name="email"
                            value={filters.email}
                            onChange={handleFilterChange}
                            placeholder="Filter Email"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                          <Form.Control
                            name="contact_number"
                            value={filters.contact_number}
                            onChange={handleFilterChange}
                            placeholder="Filter Contact"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                          <Form.Control
                            name="alternate_contact_number"
                            value={filters.alternate_contact_number}
                            onChange={handleFilterChange}
                            placeholder="Filter Alternate Contact"
                            style={{ maxWidth: 140, borderRadius: 8 }}
                          />
                        </Form>
                        <div className="d-flex gap-2">
                          <Button variant="success" onClick={handleViewPDF} style={{ borderRadius: 10, fontWeight: 600 }}>
                            View Table as PDF
                          </Button>
                        </div>
                      </div>
                      {/* Status Filter and Pagination Info */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3">
                        <div>
                          <Form.Select
                            style={{ width: 200, display: 'inline-block' }}
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="assigned">Assigned</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </Form.Select>
                        </div>
                        <div>
                          <span style={{ color: '#2b6777', fontWeight: 500 }}>
                            Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1}
                            -{Math.min(currentPage * entriesPerPage, filteredRequests.length)} of {filteredRequests.length}
                          </span>
                        </div>
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
                      <div className="table-responsive">
                        <Table bordered hover className="align-middle text-center">
                        <thead className="table-thead">
                          <tr style={{ background: 'linear-gradient(90deg, #2b6777 60%, #52ab98 100%)', color: '#fff', fontWeight: 600, fontSize: 16, letterSpacing: 1 }}>
                            <th style={{ borderRight: '1px solid #fff' }}>#</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Request ID</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Name</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Email</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Contact</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Alternate Contact</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Address</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Assignments</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Schedule</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Description</th>
                            <th style={{ borderRight: '1px solid #fff' }}>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedRequests.length === 0 ? (
                            <tr><td colSpan={12}>No service requests found.</td></tr>
                          ) : (
                            paginatedRequests.map((req, idx) => (
                              <tr key={req.id} style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.request_id}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.username}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.email}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.contact_number}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.alternate_contact_number || '-'}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.address}</td>
                                {/* Assignments column: show vendor-service pairs with status */}
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>
                                {Array.isArray(req.assignments) && req.assignments.length > 0 ? (
                                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                    {req.assignments.map((assignment, idx) => {
                                      // Handle nested assignment structure: [ [services], vendor_id, vendor_name, status, mobile ]
                                      if (Array.isArray(assignment) && Array.isArray(assignment[0])) {
                                        const services = assignment[0];
                                        const vendorId = assignment[1];
                                        const vendorName = assignment[2];
                                        const assignmentStatus = assignment[3] || "assigned";
                                        const vendorMobile = assignment[4] || "--";
                                        return (
                                          <li key={idx} style={{ fontSize: 12, marginBottom: 6, padding: '6px 8px', backgroundColor: '#f9fafb', borderRadius: 4 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                                              <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#065f46', marginBottom: 2 }}>
                                                  {vendorName || vendorId || '--'}
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 2 }}>
                                                  <b>Mobile:</b> {vendorMobile}
                                                </div>
                                                {services && services.length > 0 && (
                                                  <div style={{ color: '#64748b', fontSize: 11, lineHeight: 1.3 }}>
                                                    {services.join(', ')}
                                                  </div>
                                                )}
                                              </div>
                                              <span
                                                style={{
                                                  padding: '2px 8px',
                                                  borderRadius: 3,
                                                  fontSize: 10,
                                                  fontWeight: 600,
                                                  backgroundColor: assignmentStatus === "completed" ? "#d4edda" : assignmentStatus === "assigned" ? "#cfe2ff" : assignmentStatus === "cancelled" ? "#e0e0e0" : "#f8f9fa",
                                                  color: assignmentStatus === "completed" ? "#155724" : assignmentStatus === "assigned" ? "#004085" : assignmentStatus === "cancelled" ? "#6c757d" : "#6c757d",
                                                  whiteSpace: 'nowrap'
                                                }}
                                              >
                                                {assignmentStatus.charAt(0).toUpperCase() + assignmentStatus.slice(1)}
                                              </span>
                                            </div>
                                          </li>
                                        );
                                      }
                                      // fallback for other assignment formats
                                      return (
                                        <li key={idx} style={{ fontSize: 13, marginBottom: 2 }}>
                                          <span style={{ fontWeight: 600, color: '#065f46' }}>{JSON.stringify(assignment)}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <div style={{ color: '#64748b', fontSize: 13, padding: '4px 6px', backgroundColor: '#f9fafb', borderRadius: 4, display: 'inline-block', maxWidth: '100%', wordBreak: 'break-word' }}>Not Assigned</div>
                                )}
                                </td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>
                                  {req.schedule_date} <br />
                                  <span style={{ fontSize: 12 }}>{req.schedule_time}</span>
                                </td>
                                <td style={{ maxWidth: 200, whiteSpace: 'pre-line', wordBreak: 'break-word', backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>{req.description}</td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>
                                  {req.status?.toLowerCase() === "cancelled" ? (
                                    <Badge bg="secondary" style={{ fontSize: 14, textTransform: 'capitalize' }}>Cancelled</Badge>
                                  ) : req.status?.toLowerCase() === "completed" ? (
                                    <Badge bg="success" style={{ fontSize: 14, textTransform: 'capitalize' }}>Completed</Badge>
                                  ) : (
                                    <Form.Select
                                      size="sm"
                                      style={{ width: 120, fontSize: 13 }}
                                      value={req.status}
                                      onChange={e => {
                                        if (e.target.value === "cancelled") {
                                          setCancelRequestId(req.request_id);
                                            if (Array.isArray(req.assignments)) {
                                              const options = req.assignments
                                                .filter(a => Array.isArray(a) && a[1] && a[2] && (a[3]?.toLowerCase() === "assigned"))
                                                .map(a => ({ vendorId: a[1], vendorName: a[2], services: a[0] }));
                                              setCancelVendorOptions(options);
                                            } else {
                                              setCancelVendorOptions([]);
                                            }
                                          setCancelVendors([]);
                                          setShowCancelModal(true);
                                        }
                                      }}
                                    >
                                      <option value={req.status}>{req.status}</option>
                                      <option value="cancelled">Cancelled</option>
                                    </Form.Select>
                                  )}
                                </td>
                                <td style={{ backgroundColor: isEditable(req.created_at) ? '#fff8e1' : '#f1f5f9' }}>
                                  {(req.status?.toLowerCase() === "pending" || req.status?.toLowerCase() === "assigned") && isEditable(req.created_at) ? (
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleEditOpen(req)}
                                      style={{ borderRadius: 6, fontWeight: 600 }}
                                    >
                                      <i className="bi bi-pencil me-1"></i>Edit
                                    </Button>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: 12 }}>-</span>
                                  )}
                                </td>
                                    {/* Cancel Modal */}
                                    <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)} centered>
                                      <Modal.Header closeButton>
                                        <Modal.Title>Cancel Request</Modal.Title>
                                      </Modal.Header>
                                      <Modal.Body>
                                        {cancelError && <Alert variant="danger">{cancelError}</Alert>}
                                        {cancelSuccess && <Alert variant="success">{cancelSuccess}</Alert>}
                                        <div className="mb-2">Select vendor(s) and service(s) to cancel for request <b>{cancelRequestId}</b>:</div>
                                        <Form>
                                          {cancelVendorOptions.length === 0 ? (
                                            <div>No vendors found for this request.</div>
                                          ) : (
                                            cancelVendorOptions.map((opt, idx) => (
                                              <Form.Check
                                                key={opt.vendorId}
                                                type="checkbox"
                                                id={`cancel-vendor-${opt.vendorId}`}
                                                label={<span><b>{opt.vendorName}</b> <span style={{ fontSize: 12, color: '#888' }}>({opt.services.join(', ')})</span></span>}
                                                checked={cancelVendors.includes(opt.vendorId)}
                                                onChange={e => {
                                                  if (e.target.checked) {
                                                    setCancelVendors(prev => [...prev, opt.vendorId]);
                                                  } else {
                                                    setCancelVendors(prev => prev.filter(id => id !== opt.vendorId));
                                                  }
                                                }}
                                              />
                                            ))
                                          )}
                                        </Form>
                                      </Modal.Body>
                                      <Modal.Footer>
                                        <Button variant="secondary" onClick={() => setShowCancelModal(false)} disabled={cancelLoading}>Close</Button>
                                        <Button
                                          variant="danger"
                                          disabled={cancelLoading || cancelVendors.length === 0}
                                          onClick={async () => {
                                            setCancelLoading(true);
                                            setCancelError("");
                                            setCancelSuccess("");
                                            try {
                                              const payload = {
                                                request_id: cancelRequestId,
                                                vendor_unique_id: cancelVendors,
                                                status: "cancelled"
                                              };
                                              const res = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/customer/requestservices/", {
                                                method: "PUT",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                  ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
                                                },
                                                body: JSON.stringify(payload)
                                              });
                                              const data = await res.json();
                                              if (data.status) {
                                                setCancelSuccess("Request cancelled successfully.");
                                                setTimeout(() => {
                                                  setShowCancelModal(false);
                                                  setCancelSuccess("");
                                                  // Optionally refresh requests
                                                  window.location.reload();
                                                }, 1200);
                                              } else {
                                                setCancelError(data.message || "Failed to cancel request.");
                                              }
                                            } catch (err) {
                                              setCancelError("Error cancelling request.");
                                            }
                                            setCancelLoading(false);
                                          }}
                                        >
                                          Cancel Selected
                                        </Button>
                                      </Modal.Footer>
                                    </Modal>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                      </div>
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-center align-items-center mt-3">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          >
                            Previous
                          </Button>
                          <span style={{ fontWeight: 500, color: '#2b6777' }}>Page {currentPage} of {totalPages}</span>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="ms-2"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                      {/* Edit Modal */}
                      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
                        <Modal.Header closeButton>
                          <Modal.Title>Edit Service Request</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          {editError && <Alert variant="danger">{editError}</Alert>}
                          {editSuccess && <Alert variant="success">{editSuccess}</Alert>}
                          <Form>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Request ID</Form.Label>
                                  <Form.Control type="text" value={editForm.request_id || ""} disabled />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Full Name</Form.Label>
                                  <Form.Control type="text" name="username" value={editForm.username || ""} onChange={handleEditChange} />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Contact Number</Form.Label>
                                  <Form.Control type="text" name="contact_number" value={editForm.contact_number || ""} onChange={handleEditChange} />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Alternate Contact Number</Form.Label>
                                  <Form.Control type="text" name="alternate_contact_number" value={editForm.alternate_contact_number || ""} onChange={handleEditChange} />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Email</Form.Label>
                                  <Form.Control type="email" name="email" value={editForm.email || ""} onChange={handleEditChange} />
                                </Form.Group>
                              </Col>
                              <Col md={3}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Schedule Date</Form.Label>
                                  <Form.Control type="date" name="schedule_date" value={editForm.schedule_date || ""} onChange={handleEditChange} />
                                </Form.Group>
                              </Col>
                              <Col md={3}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Schedule Time</Form.Label>
                                  <Form.Control type="time" name="schedule_time" value={(editForm.schedule_time || "").substring(0, 5)} onChange={e => setEditForm(prev => ({ ...prev, schedule_time: e.target.value + ":00" }))} />
                                </Form.Group>
                              </Col>
                              <Col md={12}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Address</Form.Label>
                                  <Form.Control as="textarea" name="address" value={editForm.address || ""} onChange={handleEditChange} rows={3} />
                                </Form.Group>
                              </Col>
                            </Row>
                          </Form>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={editLoading}>Close</Button>
                          <Button variant="primary" disabled={editLoading} onClick={handleEditSubmit}>
                            {editLoading ? <><Spinner size="sm" animation="border" className="me-1" /> Saving...</> : "Save Changes"}
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default ViewRequestService;

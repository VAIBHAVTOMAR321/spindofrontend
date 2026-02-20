import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert } from "react-bootstrap";
import Select from "react-select";
import axios from "axios";
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
  const [selectedVendor, setSelectedVendor] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");
  const [vendorList, setVendorList] = useState([]);
  const [vendorListLoading, setVendorListLoading] = useState(false);
  // New state for selected services in modal
  const [selectedServices, setSelectedServices] = useState([]);

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
    if (!selectedRequest || !selectedVendor) {
      setAssignError("Please select a vendor");
      return;
    }
    // Optionally, you can require at least one service to be selected:
    // if (!selectedServices.length) {
    //   setAssignError("Please select at least one service");
    //   return;
    // }

    setAssignLoading(true);
    setAssignSuccess("");
    setAssignError("");

    try {
      const res = await axios.post(
        ASSIGN_VENDOR_API,
        {
          request_id: selectedRequest.request_id,
          vendor_unique_id: selectedVendor,
          request_for_services: selectedServices,
        },
        {
          headers: { Authorization: `Bearer ${tokens.access}` },
        }
      );

      setAssignSuccess("Vendor assigned successfully!");
      setSelectedVendor("");
      setSelectedServices([]);
      // Refresh the request data to show the updated assigned vendor
      setTimeout(() => {
        fetchRequestServices();
        setShowAssignModal(false);
      }, 1500);
    } catch (error) {
      setAssignError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to assign vendor. Please try again."
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // Open assign vendor modal
  const openAssignModal = (request) => {
    setSelectedRequest(request);
    setSelectedVendor("");
    setSelectedServices([]);
    setAssignSuccess("");
    setAssignError("");
    setShowAssignModal(true);
    fetchVendorList(); // Fetch vendors when modal opens
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
              </div>
              
              {/* Modern Table */}
              <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                {showRequests ? (
                  // Service Requests Table
                  <>
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
                            <th>Assigned To</th>
                            <th>Assigned By</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                      <tbody>
                        {requestData
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
                                {(() => {
                                  const services = request.request_for_services;
                                  if (Array.isArray(services)) {
                                    return services.length > 0 ? services.join(", ") : '--';
                                  }
                                  if (typeof services === 'string') {
                                    return services.trim() || '--';
                                  }
                                  // Handle other types (number, boolean, object, null, undefined)
                                  return '--';
                                })()}
                              </td>
                              <td>{typeof request.schedule_date === 'string' ? new Date(request.schedule_date).toLocaleDateString() : '--'}</td>
                              <td>{typeof request.assigned_to_name === 'string' ? request.assigned_to_name : '--'}</td>
                              <td>{typeof request.assigned_by_name === 'string' ? request.assigned_by_name : '--'}</td>
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
                        Page {currentPage} of {Math.ceil(requestData.length / itemsPerPage) || 1}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={currentPage === Math.ceil(requestData.length / itemsPerPage) || requestData.length === 0}
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

      {/* Assign Vendor Modal */}
      <Modal
        show={showAssignModal}
        onHide={() => setShowAssignModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Modal.Title style={{ color: '#6366f1', fontWeight: 700 }}>
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
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: '#475569', fontWeight: 600 }}>
                    Select Vendors <span style={{ color: '#ef4444' }}>*</span>
                  </Form.Label>
                  {vendorListLoading ? (
                    <div className="d-flex justify-content-center align-items-center py-3">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <Form.Select
                      value={selectedVendor}
                      onChange={e => setSelectedVendor(e.target.value)}
                      className="border rounded-lg p-3 bg-light"
                      style={{ maxHeight: 300, overflowY: 'auto' }}
                    >
                      <option value="">Select a vendor</option>
                      {vendorList.map((vendor) => {
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
                  )}
                  {vendorList.length === 0 && !vendorListLoading && (
                    <div className="text-muted mt-2 text-sm">
                      No vendors available. Please register vendors first.
                    </div>
                  )}
                </Form.Group>

                {/* New: Multi-select for services using react-select */}
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: '#475569', fontWeight: 600 }}>
                    Select Services
                  </Form.Label>
                  <Select
                    isMulti
                    closeMenuOnSelect={false}
                    options={(() => {
                      let services = [];
                      if (selectedRequest) {
                        if (Array.isArray(selectedRequest.request_for_services)) {
                          services = selectedRequest.request_for_services;
                        } else if (typeof selectedRequest.request_for_services === 'string') {
                          // Try to parse as JSON array, fallback to comma split
                          try {
                            const parsed = JSON.parse(selectedRequest.request_for_services);
                            if (Array.isArray(parsed)) {
                              services = parsed;
                            } else {
                              services = selectedRequest.request_for_services.split(',').map(s => s.trim()).filter(Boolean);
                            }
                          } catch {
                            services = selectedRequest.request_for_services.split(',').map(s => s.trim()).filter(Boolean);
                          }
                        }
                      }
                      return services.map((service) => ({ value: service, label: service }));
                    })()}
                    value={selectedServices.map(s => ({ value: s, label: s }))}
                    onChange={selected => setSelectedServices(selected ? selected.map(opt => opt.value) : [])}
                    classNamePrefix="react-select"
                    placeholder="Select services..."
                    styles={{ menu: base => ({ ...base, zIndex: 9999 }) }}
                  />
                  {selectedServices.length > 0 && (
                    <div className="mt-2 text-sm text-success">
                      Selected {selectedServices.length} service(s)
                    </div>
                  )}
                </Form.Group>

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
    </>
  );
};

export default StaffServicesRequest;
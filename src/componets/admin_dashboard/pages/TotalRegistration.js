import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

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

  try {
    const data = new FormData();

    if (editingId) {
      // ===== PUT (UPDATE) =====
      // Use the unique_id directly from the form state
      data.append("unique_id", formData.unique_id); 
      data.append("can_name", formData.can_name);
      data.append("mobile_number", formData.mobile_number);
      data.append("email_id", formData.email_id);
      data.append("address", formData.address);
      data.append("password", formData.password);
      data.append("is_active", formData.is_active);

      if (formData.can_aadharcard) {
        data.append("can_aadharcard", formData.can_aadharcard);
      }

      await axios.put(`${API_URL}${editingId}/`, data, {
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

      if (formData.can_aadharcard) {
        data.append("can_aadharcard", formData.can_aadharcard);
      }

      await axios.post(API_URL, data, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Staff Created Successfully ✅");
    }

    resetForm();
    fetchStaff();
  } catch (error) {
    console.error("SAVE ERROR:", error.response?.data || error.message);
    // You can display a more specific error message from the backend if needed
    const errorMessage = error.response?.data?.unique_id?.[0] || error.response?.data?.detail || "Something went wrong";
    alert(errorMessage);
  }
};

  // ================= EDIT =================
const handleEdit = (staff) => {
  setEditingId(staff.id);

  setFormData({
    unique_id: staff.unique_id, // Add this line
    can_name: staff.can_name,
    mobile_number: staff.mobile_number,
    email_id: staff.email_id,
    address: staff.address,
    password: "", // Keep password empty on edit for security
    is_active: staff.is_active ?? true,
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
              {/* CARD */}
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="p-3 text-center shadow">
                    <h5>Total Staff</h5>
                    <h3>{count}</h3>
                  </Card>
                </Col>
              </Row>

              {/* TABLE */}
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>Unique ID</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Aadhar</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffData.map((staff) => (
                    <tr key={staff.id}>
                      <td>{staff.unique_id}</td>
                      <td>{staff.can_name}</td>
                      <td>{staff.mobile_number}</td>
                      <td>{staff.email_id}</td>
                      <td>{staff.address}</td>

                      <td>
                        {staff.can_aadharcard && (
                          <img
                            src={`${BASE_URL}${staff.can_aadharcard}`}
                            alt="Aadhar"
                            width="60"
                          />
                        )}
                      </td>

                      <td>{staff.is_active ? "Active" : "Inactive"}</td>
                      <td>
                        {new Date(staff.created_at).toLocaleDateString()}
                      </td>

                      <td>
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => handleEdit(staff)}
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* ADD BUTTON */}
              <Button onClick={() => setShowModal(true)}>Add Staff</Button>

              {/* MODAL */}
              <Modal show={showModal} onHide={resetForm}>
                <Modal.Header closeButton>
                  <Modal.Title>
                    {editingId ? "Update Staff" : "Add Staff"}
                  </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Control
                      name="can_name"
                      placeholder="Name"
                      value={formData.can_name}
                      onChange={handleChange}
                      className="mb-2"
                      required
                    />

                    <Form.Control
                      name="mobile_number"
                      placeholder="Mobile"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      className="mb-2"
                      required
                    />

                    <Form.Control
                      name="email_id"
                      placeholder="Email"
                      value={formData.email_id}
                      onChange={handleChange}
                      className="mb-2"
                    />

                    <Form.Control
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleChange}
                      className="mb-2"
                    />

                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Password (leave blank to keep current)"
                      value={formData.password}
                      onChange={handleChange}
                      className="mb-2"
                      required={!editingId} // Password is required only for new staff
                    />

                    <Form.Check
                      type="checkbox"
                      label="Active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="mb-2"
                    />

                    <Form.Control
                      type="file"
                      name="can_aadharcard"
                      onChange={handleChange}
                      className="mb-2"
                    />

                    <Button type="submit" className="w-100">
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
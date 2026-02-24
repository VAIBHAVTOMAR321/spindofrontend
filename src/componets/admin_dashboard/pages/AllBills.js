import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Modal, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import the common layout components
import AdminHeader from "../AdminHeader";
import AdminLeftNav from "../AdminLeftNav";
import "../../../assets/css/admindashboard.css";

// --- Constants for API ---
const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/billing/`;

const AllBills = () => {
  // --- AdminDashBoard Structure & State ---
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

  // --- AllBills Logic & State ---
  const { tokens } = useAuth();
  const [billsData, setBillsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    invoice_no: '',
    address: '',
    mode_of_pay: '',
    dated_date: ''
  });

  // PDF Modal state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [billPdf, setBillPdf] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionMessageType, setActionMessageType] = useState("");

  // Edit Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBillLoading, setEditBillLoading] = useState(false);
  const [editBillData, setEditBillData] = useState(null);
  const [editFormData, setEditFormData] = useState({
    invoice_no: ["", ""],
    address_1: ["", ""],
    address_2: [""],
    address_3: ["", ""],
    delv_note: "",
    ref_no_date: "",
    buyer_ord_no: "",
    dispatch_doc_no: "",
    dated_1: "",
    mode_of_pay: "Bank Transfer",
    other_ref: "",
    dated_date: "",
    del_note_date: "",
    amount_in_words: "",
    authorized_name: "",
    bill_item: [],
    bank_detail: []
  });
  const [refreshingEdit, setRefreshingEdit] = useState(false);

  // Result Modal state for success/error messages
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState(""); // 'success' or 'error'
  const [resultMessage, setResultMessage] = useState("");

  // Fetch bills on mount
  useEffect(() => {
    fetchBills();
  }, [tokens]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL, {
        headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
      });

      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setBillsData(data);
      setCount(data.length);
      setError("");
    } catch (err) {
      console.error("Error fetching bills:", err);
      setError("Failed to load invoices. Please try again!");
      setBillsData([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Calculate totals for a bill
  const calculateBillTotals = (bill) => {
    if (!bill.bill_item || !Array.isArray(bill.bill_item)) {
      return { amount: "0.00", gst: "0.00", igst: "0.00", grand_total: "0.00" };
    }

    let totalAmount = 0, totalGST = 0, totalIGST = 0;
    
    bill.bill_item.forEach(item => {
      if (Array.isArray(item) && item.length >= 10) {
        // Format: [item_name, hsn, qty, rate, amount, gst%, gst_amount, igst%, igst_amount, unit]
        totalAmount += parseFloat(item[4]) || 0;
        totalGST += parseFloat(item[6]) || 0;
        totalIGST += parseFloat(item[8]) || 0;
      }
    });

    const grandTotal = totalAmount + totalGST + totalIGST;

    return {
      amount: totalAmount.toFixed(2),
      gst: totalGST.toFixed(2),
      igst: totalIGST.toFixed(2),
      grand_total: grandTotal.toFixed(2)
    };
  };

  // Parse bank details from array
  const parseBankDetails = (bankArray) => {
    if (!Array.isArray(bankArray) || bankArray.length === 0) return [];
    
    return bankArray.map(detail => {
      const parts = detail.split(":");
      if (parts.length === 2) {
        return {
          label: parts[0].trim(),
          value: parts[1].trim()
        };
      }
      return { label: "Details", value: detail };
    });
  };

  // Construct full PDF URL
  const constructPdfUrl = (billPdfPath) => {
    if (!billPdfPath) return null;
    if (billPdfPath.startsWith("http")) return billPdfPath;
    return `${BASE_URL}${billPdfPath}`;
  };

  // Filter data
  const filteredData = billsData.filter(bill => {
    const invoiceMatch = !filters.invoice_no || 
      bill.invoice_no?.[0]?.toLowerCase().includes(filters.invoice_no.toLowerCase());
    
    const addressMatch = !filters.address || 
      bill.address_1?.[0]?.toLowerCase().includes(filters.address.toLowerCase());
    
    const paymentMatch = !filters.mode_of_pay || 
      bill.mode_of_pay?.toLowerCase().includes(filters.mode_of_pay.toLowerCase());
    
    const dateMatch = !filters.dated_date || 
      (bill.dated_date && bill.dated_date.includes(filters.dated_date));

    return invoiceMatch && addressMatch && paymentMatch && dateMatch;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedBills = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handle View Details - Fetch bill PDF from API
  const handleViewDetails = async (bill) => {
    setLoadingDetails(true);
    try {
      const billId = bill.bill_id || "";
      const response = await axios.get(API_URL, {
        headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
      });
      
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      
      // Find the specific bill with matching bill_id
      const foundBill = data.find(b => b.bill_id === billId) || bill;
      
      setSelectedBill(foundBill);
      if (foundBill.bill_pdf) {
        setBillPdf(constructPdfUrl(foundBill.bill_pdf));
      }
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching bill details:", err);
      if (bill.bill_pdf) setBillPdf(constructPdfUrl(bill.bill_pdf));
      setSelectedBill(bill);
      setShowDetailsModal(true);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle Edit Bill - Open modal with bill details
  const handleEditBill = async (bill) => {
    setEditBillLoading(true);
    try {
      const billId = bill.bill_id || "";
      const response = await axios.get(API_URL, {
        headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
      });
      
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      const foundBill = data.find(b => b.bill_id === billId) || bill;
      
      setEditBillData(foundBill);
      setEditFormData({
        invoice_no: foundBill.invoice_no || ["", ""],
        address_1: foundBill.address_1 || ["", ""],
        address_2: foundBill.address_2 || [""],
        address_3: foundBill.address_3 || ["", ""],
        delv_note: foundBill.delv_note || "",
        ref_no_date: foundBill.ref_no_date || "",
        buyer_ord_no: foundBill.buyer_ord_no || "",
        dispatch_doc_no: foundBill.dispatch_doc_no || "",
        dated_1: foundBill.dated_1 || "",
        mode_of_pay: foundBill.mode_of_pay || "Bank Transfer",
        other_ref: foundBill.other_ref || "",
        dated_date: foundBill.dated_date || "",
        del_note_date: foundBill.del_note_date || "",
        amount_in_words: foundBill.amount_in_words || "",
        authorized_name: foundBill.authorized_name || "",
        bill_item: foundBill.bill_item || [],
        bank_detail: foundBill.bank_detail || []
      });
      setShowEditModal(true);
    } catch (err) {
      console.error("Error loading bill for edit:", err);
      setResultType("error");
      setResultMessage("Error loading bill details. Please try again");
      setShowResultModal(true);
    } finally {
      setEditBillLoading(false);
    }
  };

  // Refresh bill details in edit modal
  const handleRefreshEditBill = async () => {
    if (!editBillData?.bill_id) return;
    
    setRefreshingEdit(true);
    try {
      const response = await axios.get(API_URL, {
        headers: tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}
      });
      
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      const foundBill = data.find(b => b.bill_id === editBillData.bill_id);
      
      if (foundBill) {
        setEditBillData(foundBill);
        setEditFormData({
          invoice_no: foundBill.invoice_no || ["", ""],
          address_1: foundBill.address_1 || ["", ""],
          address_2: foundBill.address_2 || [""],
          address_3: foundBill.address_3 || ["", ""],
          delv_note: foundBill.delv_note || "",
          ref_no_date: foundBill.ref_no_date || "",
          buyer_ord_no: foundBill.buyer_ord_no || "",
          dispatch_doc_no: foundBill.dispatch_doc_no || "",
          dated_1: foundBill.dated_1 || "",
          mode_of_pay: foundBill.mode_of_pay || "Bank Transfer",
          other_ref: foundBill.other_ref || "",
          dated_date: foundBill.dated_date || "",
          del_note_date: foundBill.del_note_date || "",
          amount_in_words: foundBill.amount_in_words || "",
          authorized_name: foundBill.authorized_name || "",
          bill_item: foundBill.bill_item || [],
          bank_detail: foundBill.bank_detail || []
        });
        setResultType("success");
        setResultMessage("Bill details refreshed!");
        setShowResultModal(true);
        setTimeout(() => setShowResultModal(false), 2000);
      }
    } catch (err) {
      console.error("Error refreshing bill:", err);
      setResultType("error");
      setResultMessage("Error refreshing bill details");
      setShowResultModal(true);
    } finally {
      setRefreshingEdit(false);
    }
  };

  // Save edited bill
  const handleSaveEditBill = async () => {
    if (!editBillData?.bill_id) return;
    
    setEditBillLoading(true);
    setActionMessage("");
    try {
      const response = await axios.put(API_URL, 
        {
          bill_id: editBillData.bill_id,
          ...editFormData
        },
        {
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          }
        }
      );
      
      if (response.data.status || response.status === 200) {
        setResultType("success");
        setResultMessage("Invoice updated successfully!");
        setShowResultModal(true);
        setTimeout(() => {
          setShowResultModal(false);
          setShowEditModal(false);
          setEditBillData(null);
          fetchBills();
        }, 2000);
      } else {
        setResultType("error");
        setResultMessage(response.data.message || "Failed to update invoice");
        setShowResultModal(true);
      }
    } catch (err) {
      console.error("Error updating bill:", err);
      setResultType("error");
      setResultMessage("Error updating invoice. Please try again");
      setShowResultModal(true);
    } finally {
      setEditBillLoading(false);
    }
  };

  // Handle edit form field changes
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address_1_') || name.startsWith('address_2_') || name.startsWith('address_3_') || name.startsWith('invoice_no_')) {
      const [field, index] = name.split('_');
      const arrName = `${field}_${[index.length === 1 ? index : index.slice(0, -1)]}`;
      const idx = parseInt(name.split('_').pop());
      setEditFormData(prev => ({
        ...prev,
        [arrName]: prev[arrName].map((item, i) => i === idx ? value : item)
      }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle address changes for edit form
  const handleEditAddressChange = (arrayName, index, value) => {
    setEditFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => i === index ? value : item)
    }));
  };

  // Handle invoice number changes for edit form
  const handleEditInvoiceNoChange = (index, value) => {
    setEditFormData(prev => ({
      ...prev,
      invoice_no: prev.invoice_no.map((item, i) => i === index ? value : item)
    }));
  };

  // Handle bill item changes for edit form
  const handleEditBillItemChange = (index, field, value) => {
    // Convert bill items to object format if they are in array format
    let formattedItems = [...editFormData.bill_item];
    if (formattedItems.length > 0 && Array.isArray(formattedItems[0])) {
      formattedItems = formattedItems.map(item => ({
        item_name: item[0],
        hsn: item[1],
        qty: item[2],
        rate: item[3],
        amount: item[4],
        gst_percentage: item[5],
        gst_amount: item[6],
        igst_percentage: item[7],
        igst_amount: item[8],
        unit: item[9]
      }));
    }

    const updatedItems = [...formattedItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-calculate amounts
    if (field === 'qty' || field === 'rate' || field === 'gst_percentage' || field === 'igst_percentage') {
      const qty = parseFloat(updatedItems[index].qty) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      const amount = qty * rate;
      
      const gstPct = parseFloat(updatedItems[index].gst_percentage) || 0;
      const gstAmount = (amount * gstPct) / 100;
      
      const igstPct = parseFloat(updatedItems[index].igst_percentage) || 0;
      const igstAmount = (amount * igstPct) / 100;

      updatedItems[index] = {
        ...updatedItems[index],
        amount: amount.toFixed(2),
        gst_amount: gstAmount.toFixed(2),
        igst_amount: igstAmount.toFixed(2)
      };
    }

    // Convert back to array format for API
    const apiFormattedItems = updatedItems.map(item => [
      item.item_name,
      item.hsn,
      item.qty,
      item.rate,
      item.amount,
      item.gst_percentage,
      item.gst_amount,
      item.igst_percentage,
      item.igst_amount,
      item.unit
    ]);

    setEditFormData(prev => ({ ...prev, bill_item: apiFormattedItems }));
  };

  // Handle bank detail changes for edit form
  const handleEditBankDetailChange = (index, value) => {
    const updatedDetails = [...editFormData.bank_detail];
    updatedDetails[index] = value;
    setEditFormData(prev => ({ ...prev, bank_detail: updatedDetails }));
  };

  // Add bill item for edit form
  const addEditBillItem = () => {
    // Convert existing items to object format
    let formattedItems = [...editFormData.bill_item];
    if (formattedItems.length > 0 && Array.isArray(formattedItems[0])) {
      formattedItems = formattedItems.map(item => ({
        item_name: item[0],
        hsn: item[1],
        qty: item[2],
        rate: item[3],
        amount: item[4],
        gst_percentage: item[5],
        gst_amount: item[6],
        igst_percentage: item[7],
        igst_amount: item[8],
        unit: item[9]
      }));
    }

    const newItem = {
      item_name: "",
      hsn: "",
      qty: "",
      rate: "",
      amount: "0.00",
      gst_percentage: "9",
      gst_amount: "0.00",
      igst_percentage: "0",
      igst_amount: "0.00",
      unit: "Nos"
    };

    // Convert back to array format for API
    const apiFormattedItems = [...formattedItems, newItem].map(item => [
      item.item_name,
      item.hsn,
      item.qty,
      item.rate,
      item.amount,
      item.gst_percentage,
      item.gst_amount,
      item.igst_percentage,
      item.igst_amount,
      item.unit
    ]);

    setEditFormData(prev => ({ ...prev, bill_item: apiFormattedItems }));
  };

  // Remove bill item for edit form
  const removeEditBillItem = (index) => {
    if (editFormData.bill_item.length > 1) {
      const updatedItems = [...editFormData.bill_item];
      updatedItems.splice(index, 1);
      setEditFormData(prev => ({ ...prev, bill_item: updatedItems }));
    }
  };

  // Handle Delete Bill
  const handleDeleteBill = async (bill) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    
    setDeleteLoading(true);
    try {
      const response = await axios.delete(API_URL, 
        {
          data: { bill_id: bill.bill_id },
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
          }
        }
      );
      
      if (response.data.status) {
        setResultType("success");
        setResultMessage("Invoice deleted successfully!");
        setShowResultModal(true);
        setTimeout(() => {
          setShowResultModal(false);
          fetchBills();
        }, 2000);
      } else {
        setResultType("error");
        setResultMessage(response.data.message || "Failed to delete invoice");
        setShowResultModal(true);
      }
    } catch (err) {
      console.error("Error deleting bill:", err);
      setResultType("error");
      setResultMessage("Error deleting invoice. Please try again");
      setShowResultModal(true);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Generate PDF
  const generatePDF = () => {
    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      const headers = [["Invoice No", "Address", "Date", "Payment Mode", "Amount", "GST", "IGST", "Grand Total"]];
      
      const rows = filteredData.map(bill => {
        const totals = calculateBillTotals(bill);
        return [
          bill.invoice_no?.join("-") || "N/A",
          bill.address_1?.[0] || "N/A",
          new Date(bill.dated_date).toLocaleDateString(),
          bill.mode_of_pay || "N/A",
          `₹${totals.amount}`,
          `₹${totals.gst}`,
          `₹${totals.igst}`,
          `₹${totals.grand_total}`
        ];
      });

      autoTable(pdf, {
        head: headers,
        body: rows,
        startY: 15,
        margin: { top: 10, right: 10, left: 10, bottom: 10 },
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [43, 103, 119], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 249, 255] }
      });

      const blob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(pdfUrl);
      setShowPdfModal(true);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF!");
    }
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setPdfPreviewUrl(null);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBill(null);
    setBillPdf(null);
  };

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
              {/* Header Card */}
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
                    <h6 style={{ color: '#6366f1', fontWeight: 700, marginTop: 10 }}>Total Invoices</h6>
                    <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 10 }}>{count}</h2>
                  </Card>
                </div>
              </div>

              {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}
              {actionMessage && <Alert variant={actionMessageType} onClose={() => setActionMessage("")} dismissible>{actionMessage}</Alert>}

              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading invoices...</p>
                </div>
              ) : (
                <>
                  {/* Filter Section */}
                  <div className="mb-3">
                    <Form className="d-flex flex-wrap gap-2">
                      <Form.Control
                        name="invoice_no"
                        value={filters.invoice_no}
                        onChange={handleFilterChange}
                        placeholder="Filter Invoice No"
                        style={{ maxWidth: 140, borderRadius: 8 }}
                      />
                      <Form.Control
                        name="address"
                        value={filters.address}
                        onChange={handleFilterChange}
                        placeholder="Filter Address"
                        style={{ maxWidth: 140, borderRadius: 8 }}
                      />
                      <Form.Control
                        name="mode_of_pay"
                        value={filters.mode_of_pay}
                        onChange={handleFilterChange}
                        placeholder="Filter Payment Mode"
                        style={{ maxWidth: 150, borderRadius: 8 }}
                      />
                      <Form.Control
                        name="dated_date"
                        type="date"
                        value={filters.dated_date}
                        onChange={handleFilterChange}
                        style={{ maxWidth: 150, borderRadius: 8 }}
                      />
                    </Form>
                  </div>

                  {/* PDF Export Button */}
                  <div className="mb-3 d-flex justify-content-end">
                    <Button 
                      style={{ borderRadius: 10, fontWeight: 600, background: '#6366f1', borderColor: '#6366f1' }} 
                      onClick={generatePDF}
                    >
                      <i className="bi bi-filetype-pdf me-2"></i>Export as PDF
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
                        <div className="text-center py-5">Generating PDF...</div>
                      )}
                    </Modal.Body>
                  </Modal>

                  {/* Bills Table */}
                  <div className="table-responsive rounded-4 shadow-sm" style={{ background: '#fff', padding: '0.5rem 0.5rem 1rem 0.5rem' }}>
                    <Table className="align-middle mb-0" style={{ minWidth: 700 }}>
                      <thead className="table-thead" style={{ background: '#f1f5f9' }}>
                        <tr style={{ fontWeight: 700, color: '#6366f1', fontSize: 15 }}>
                          <th>Invoice No</th>
                          <th>Address</th>
                          <th>Date</th>
                          <th>Payment Mode</th>
                          <th>Amount</th>
                          <th>GST</th>
                          <th>IGST</th>
                          <th>Grand Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedBills.length === 0 ? (
                          <tr><td colSpan="9" className="text-center">No invoices found</td></tr>
                        ) : (
                          paginatedBills.map((bill, index) => {
                            const totals = calculateBillTotals(bill);
                            return (
                              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ fontWeight: 600, color: '#6366f1' }}>{bill.invoice_no?.join("-") || "N/A"}</td>
                                <td>{bill.address_1?.[0] || "N/A"}</td>
                                <td>{bill.dated_date ? new Date(bill.dated_date).toLocaleDateString() : "N/A"}</td>
                                <td>
                                  <span style={{
                                    padding: '4px 12px',
                                    borderRadius: 6,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    backgroundColor: '#dbeafe',
                                    color: '#0369a1',
                                  }}>
                                    {bill.mode_of_pay || 'N/A'}
                                  </span>
                                </td>
                                <td style={{ fontWeight: 600 }}>₹{totals.amount}</td>
                                <td>₹{totals.gst}</td>
                                <td>₹{totals.igst}</td>
                                <td style={{ fontWeight: 700, color: '#6366f1' }}>₹{totals.grand_total}</td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleViewDetails(bill)}
                                    disabled={editLoading || deleteLoading}
                                    style={{
                                      backgroundColor: '#3b82f6',
                                      borderColor: '#3b82f6',
                                      borderRadius: 6,
                                      fontWeight: 600,
                                      fontSize: 12,
                                      marginRight: '5px'
                                    }}
                                    title="View Details"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </Button>
                                  <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={() => handleEditBill(bill)}
                                    disabled={editLoading || deleteLoading}
                                    style={{
                                      backgroundColor: '#f59e0b',
                                      borderColor: '#f59e0b',
                                      borderRadius: 6,
                                      fontWeight: 600,
                                      fontSize: 12,
                                      marginRight: '5px'
                                    }}
                                    title="Edit Invoice"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteBill(bill)}
                                    disabled={editLoading || deleteLoading}
                                    style={{
                                      backgroundColor: '#ef4444',
                                      borderColor: '#ef4444',
                                      borderRadius: 6,
                                      fontWeight: 600,
                                      fontSize: 12
                                    }}
                                    title="Delete Invoice"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
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
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      disabled={currentPage === totalPages || filteredData.length === 0}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      style={{ minWidth: 80 }}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Container>
        </div>
      </div>

      {/* Edit Invoice Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "#ffffff", fontWeight: 700 }}>Edit Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {editBillLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading invoice details...</p>
            </div>
          ) : (
            <Form>
              {actionMessage && (
                <Alert variant={actionMessageType} className="mb-3">
                  {actionMessage}
                </Alert>
              )}

              {/* Seller Address Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#2b6777", color: "white", fontWeight: 600 }}>
                  Seller Address
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_1[0] || ""} 
                          onChange={(e) => handleEditAddressChange('address_1', 0, e.target.value)}
                          placeholder="e.g., Shri Narayani Associates 2025-26"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>GSTIN</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_1[2] || ""} 
                          onChange={(e) => handleEditAddressChange('address_1', 2, e.target.value)}
                          placeholder="e.g., 05AAQHS9132M2ZF"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address Lines (separated by commas)</Form.Label>
                        <Form.Control 
                          as="textarea"
                          rows={2}
                          value={Array.isArray(editFormData.address_1[1]) ? editFormData.address_1[1].join(", ") : (editFormData.address_1[1] || "")} 
                          onChange={(e) => handleEditAddressChange('address_1', 1, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="e.g., VILLA NO-143, DOON PALM CITY, PATHRI BAGH CHOWK, DEHRADUN-248001"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone Numbers (separated by commas)</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={Array.isArray(editFormData.address_1[3]) ? editFormData.address_1[3].join(", ") : (editFormData.address_1[3] || "")} 
                          onChange={(e) => handleEditAddressChange('address_1', 3, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="e.g., 8958400555, 9359999542"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control 
                          type="email" 
                          value={editFormData.address_1[4] || ""} 
                          onChange={(e) => handleEditAddressChange('address_1', 4, e.target.value)}
                          placeholder="e.g., shrinarayaniassociates@gmail.com"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Ship To Address Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#ffa500", color: "white", fontWeight: 600 }}>
                  Ship To Address
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_2[0] || ""} 
                          onChange={(e) => handleEditAddressChange('address_2', 0, e.target.value)}
                          placeholder="e.g., Polymath Enterprises"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>GSTIN</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_2[2] || ""} 
                          onChange={(e) => handleEditAddressChange('address_2', 2, e.target.value)}
                          placeholder="e.g., 05AZGPC1451Q1ZC"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address Lines (separated by commas)</Form.Label>
                        <Form.Control 
                          as="textarea"
                          rows={2}
                          value={Array.isArray(editFormData.address_2[1]) ? editFormData.address_2[1].join(", ") : (editFormData.address_2[1] || "")} 
                          onChange={(e) => handleEditAddressChange('address_2', 1, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="e.g., Pragati Vihar, Lower Adhoiwala, Near Shiv Mandir, Dehradun"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_2[3] || ""} 
                          onChange={(e) => handleEditAddressChange('address_2', 3, e.target.value)}
                          placeholder="e.g., Uttarakhand"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State Code</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_2[4] || ""} 
                          onChange={(e) => handleEditAddressChange('address_2', 4, e.target.value)}
                          placeholder="e.g., 05"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Bill To Address Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#0369a1", color: "white", fontWeight: 600 }}>
                  Bill To Address
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_3[0] || ""} 
                          onChange={(e) => handleEditAddressChange('address_3', 0, e.target.value)}
                          placeholder="e.g., Polymath Enterprises"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>GSTIN</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_3[2] || ""} 
                          onChange={(e) => handleEditAddressChange('address_3', 2, e.target.value)}
                          placeholder="e.g., 05AZGPC1451Q1ZC"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address Lines (separated by commas)</Form.Label>
                        <Form.Control 
                          as="textarea"
                          rows={2}
                          value={Array.isArray(editFormData.address_3[1]) ? editFormData.address_3[1].join(", ") : (editFormData.address_3[1] || "")} 
                          onChange={(e) => handleEditAddressChange('address_3', 1, e.target.value.split(',').map(s => s.trim()))}
                          placeholder="e.g., Pragati Vihar, Lower Adhoiwala, Near Shiv Mandir, Dehradun"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_3[3] || ""} 
                          onChange={(e) => handleEditAddressChange('address_3', 3, e.target.value)}
                          placeholder="e.g., Uttarakhand"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>State Code</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.address_3[4] || ""} 
                          onChange={(e) => handleEditAddressChange('address_3', 4, e.target.value)}
                          placeholder="e.g., 05"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Invoice Details Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#2b6777", color: "white", fontWeight: 600 }}>
                  Invoice Details
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Invoice No (Part 1)</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.invoice_no[0]} 
                          onChange={(e) => handleEditInvoiceNoChange(0, e.target.value)}
                          placeholder="e.g., INV"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Financial Year</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.invoice_no[1]} 
                          onChange={(e) => handleEditInvoiceNoChange(1, e.target.value)}
                          placeholder="e.g., 2025-26"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Invoice Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          name="dated_date"
                          value={editFormData.dated_date} 
                          onChange={(e) => handleEditFormChange(e)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mode of Payment</Form.Label>
                        <Form.Select 
                          name="mode_of_pay"
                          value={editFormData.mode_of_pay} 
                          onChange={(e) => handleEditFormChange(e)}
                        >
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Cheque">Cheque</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Note</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="delv_note"
                          value={editFormData.delv_note} 
                          onChange={(e) => handleEditFormChange(e)}
                          placeholder="e.g., Delivery Note 12"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Ref No Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          name="ref_no_date"
                          value={editFormData.ref_no_date} 
                          onChange={(e) => handleEditFormChange(e)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Buyer's Order No</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="buyer_ord_no"
                          value={editFormData.buyer_ord_no} 
                          onChange={(e) => handleEditFormChange(e)}
                          placeholder="e.g., BO-4587"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dispatch Doc No</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="dispatch_doc_no"
                          value={editFormData.dispatch_doc_no} 
                          onChange={(e) => handleEditFormChange(e)}
                          placeholder="e.g., DD-9087"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dated</Form.Label>
                        <Form.Control 
                          type="date" 
                          name="dated_1"
                          value={editFormData.dated_1} 
                          onChange={(e) => handleEditFormChange(e)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Other Reference</Form.Label>
                        <Form.Control 
                          type="text" 
                          name="other_ref"
                          value={editFormData.other_ref} 
                          onChange={(e) => handleEditFormChange(e)}
                          placeholder="e.g., Project Ref-22"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Note Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          name="del_note_date"
                          value={editFormData.del_note_date} 
                          onChange={(e) => handleEditFormChange(e)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Bill Items Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#2b6777", color: "white", fontWeight: 600 }}>
                  Bill Items
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table bordered size="sm">
                      <thead style={{ backgroundColor: "#e8f4f8" }}>
                        <tr style={{ fontWeight: 700, color: "#2b6777" }}>
                          <th>Item Name</th>
                          <th>HSN</th>
                          <th>Qty</th>
                          <th>Rate</th>
                          <th>Amount</th>
                          <th>GST %</th>
                          <th>GST Amt</th>
                          <th>IGST %</th>
                          <th>IGST Amt</th>
                          <th>Unit</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editFormData.bill_item && Array.isArray(editFormData.bill_item) && editFormData.bill_item.length > 0 ? (
                          editFormData.bill_item.map((item, idx) => {
                            const formattedItem = Array.isArray(item) ? {
                              item_name: item[0],
                              hsn: item[1],
                              qty: item[2],
                              rate: item[3],
                              amount: item[4],
                              gst_percentage: item[5],
                              gst_amount: item[6],
                              igst_percentage: item[7],
                              igst_amount: item[8],
                              unit: item[9]
                            } : item;

                            return (
                              <tr key={idx} style={{ fontSize: "13px" }}>
                                <td>
                                  <Form.Control 
                                    type="text" 
                                    value={formattedItem.item_name} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'item_name', e.target.value)}
                                    placeholder="Item Name"
                                  />
                                </td>
                                <td>
                                  <Form.Control 
                                    type="text" 
                                    value={formattedItem.hsn} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'hsn', e.target.value)}
                                    placeholder="HSN"
                                  />
                                </td>
                                <td>
                                  <Form.Control 
                                    type="number" 
                                    value={formattedItem.qty} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'qty', e.target.value)}
                                    placeholder="Qty"
                                  />
                                </td>
                                <td>
                                  <Form.Control 
                                    type="number" 
                                    value={formattedItem.rate} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'rate', e.target.value)}
                                    placeholder="Rate"
                                  />
                                </td>
                                <td>₹{formattedItem.amount}</td>
                                <td>
                                  <Form.Control 
                                    type="number" 
                                    value={formattedItem.gst_percentage} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'gst_percentage', e.target.value)}
                                    placeholder="GST %"
                                  />
                                </td>
                                <td>₹{formattedItem.gst_amount}</td>
                                <td>
                                  <Form.Control 
                                    type="number" 
                                    value={formattedItem.igst_percentage} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'igst_percentage', e.target.value)}
                                    placeholder="IGST %"
                                  />
                                </td>
                                <td>₹{formattedItem.igst_amount}</td>
                                <td>
                                  <Form.Control 
                                    type="text" 
                                    value={formattedItem.unit} 
                                    onChange={(e) => handleEditBillItemChange(idx, 'unit', e.target.value)}
                                    placeholder="Unit"
                                  />
                                </td>
                                <td>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => removeEditBillItem(idx)}
                                    disabled={editFormData.bill_item.length <= 1}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr><td colSpan="11" className="text-center">No items</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={addEditBillItem}
                    style={{ marginTop: "10px" }}
                  >
                    <i className="bi bi-plus"></i> Add Item
                  </Button>
                </Card.Body>
              </Card>

              {/* Bank Details Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#2b6777", color: "white", fontWeight: 600 }}>
                  Bank Details
                </Card.Header>
                <Card.Body>
                  {[0, 1, 2, 3].map((index) => (
                    <Form.Group key={index} className="mb-3">
                      <Form.Label>Bank Detail {index + 1}</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={editFormData.bank_detail[index] || ""} 
                        onChange={(e) => handleEditBankDetailChange(index, e.target.value)}
                        placeholder="e.g., Bank Name: XYZ Bank"
                      />
                    </Form.Group>
                  ))}
                </Card.Body>
              </Card>

              {/* Additional Details Section */}
              <Card className="mb-4" style={{ backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>
                <Card.Header style={{ backgroundColor: "#2b6777", color: "white", fontWeight: 600 }}>
                  Additional Details
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Note</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.delv_note} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="delv_note"
                          placeholder="Delivery Note"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Delivery Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={editFormData.del_note_date} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="del_note_date"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reference No Date</Form.Label>
                        <Form.Control 
                          type="date" 
                          value={editFormData.ref_no_date} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="ref_no_date"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Buyer's Order No</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.buyer_ord_no} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="buyer_ord_no"
                          placeholder="Buyer's Order No"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Dispatch Doc No</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.dispatch_doc_no} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="dispatch_doc_no"
                          placeholder="Dispatch Doc No"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Other Reference</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.other_ref} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="other_ref"
                          placeholder="Other Reference"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Amount in Words</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.amount_in_words} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="amount_in_words"
                          placeholder="Amount in Words"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Authorized Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={editFormData.authorized_name} 
                          onChange={(e) => handleEditFormChange(e)}
                          name="authorized_name"
                          placeholder="Authorized Name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowEditModal(false)}
            disabled={editBillLoading}
          >
            Close
          </Button>
          <Button 
            variant="info" 
            onClick={handleRefreshEditBill}
            disabled={editBillLoading || refreshingEdit}
          >
            {refreshingEdit ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-arrow-clockwise me-2"></i>}
            Refresh
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveEditBill}
            disabled={editBillLoading}
          >
            {editBillLoading ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-save me-2"></i>}
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Result Modal */}
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {resultType === "success" ? (
              <span style={{ color: "#28a745" }}>
                <i className="bi bi-check-circle me-2"></i>Success
              </span>
            ) : (
              <span style={{ color: "#dc3545" }}>
                <i className="bi bi-exclamation-circle me-2"></i>Error
              </span>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            {resultType === "success" ? (
              <div>
                <div style={{ fontSize: "48px", color: "#28a745", marginBottom: "15px" }}>
                  <i className="bi bi-check-circle"></i>
                </div>
                <p style={{ fontSize: "16px", color: "#333" }}>
                  {resultMessage}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "48px", color: "#dc3545", marginBottom: "15px" }}>
                  <i className="bi bi-exclamation-circle"></i>
                </div>
                <p style={{ fontSize: "16px", color: "#333" }}>
                  {resultMessage}
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant={resultType === "success" ? "success" : "danger"}
            onClick={() => setShowResultModal(false)}
          >
            {resultType === "success" ? "Continue" : "Close"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Details Modal */}
      <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ color: "#2b6777", fontWeight: 700 }}>Invoice Details</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {loadingDetails ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading invoice details...</p>
            </div>
          ) : (
            selectedBill && (
              <div style={{ backgroundColor: "#fff", padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
                {/* Bill PDF View */}
                {billPdf && (
                  <div className="mb-4" style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px solid #dee2e6" }}>
                    <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                      <i className="bi bi-file-pdf me-2"></i>Bill PDF
                    </h6>
                    <iframe
                      src={billPdf}
                      title="Bill PDF"
                      width="100%"
                      height="300px"
                      style={{ border: "1px solid #dee2e6", borderRadius: "4px" }}
                    />
                    <a href={billPdf} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary mt-2">
                      <i className="bi bi-download me-1"></i>Download PDF
                    </a>
                  </div>
                )}

                     {/* Seller Address & Invoice Info */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                          <Card.Body>
                            <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-geo-alt me-2"></i>Seller Address
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Name:</strong> {selectedBill.address_1?.[0] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Address:</strong> {Array.isArray(selectedBill.address_1?.[1]) ? selectedBill.address_1[1].join(", ") : selectedBill.address_1?.[1] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>GSTIN:</strong> {selectedBill.address_1?.[2] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Phone:</strong> {Array.isArray(selectedBill.address_1?.[3]) ? selectedBill.address_1[3].join(", ") : selectedBill.address_1?.[3] || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>Email:</strong> {selectedBill.address_1?.[4] || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                          <Card.Body>
                            <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-file-text me-2"></i>Invoice Information
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Invoice No:</strong> {selectedBill.invoice_no?.join("-") || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Invoice Date:</strong> {selectedBill.dated_date ? new Date(selectedBill.dated_date).toLocaleDateString() : "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>Payment Mode:</strong> {selectedBill.mode_of_pay || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    
                    {/* Ship To Address */}
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#fff5e6", border: "1px solid #ffa500" }}>
                          <Card.Body>
                            <h6 style={{ color: "#ff8c00", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-truck me-2"></i>Ship To Address
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Name:</strong> {selectedBill.address_2?.[0] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Address:</strong> {Array.isArray(selectedBill.address_2?.[1]) ? selectedBill.address_2[1].join(", ") : selectedBill.address_2?.[1] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>GSTIN:</strong> {selectedBill.address_2?.[2] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>State:</strong> {selectedBill.address_2?.[3] || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>State Code:</strong> {selectedBill.address_2?.[4] || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      {/* Bill To Address */}
                      <Col md={6}>
                        <Card style={{ backgroundColor: "#e6f3ff", border: "1px solid #0369a1" }}>
                          <Card.Body>
                            <h6 style={{ color: "#0369a1", fontWeight: 700, marginBottom: "10px" }}>
                              <i className="bi bi-building me-2"></i>Bill To Address
                            </h6>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Name:</strong> {selectedBill.address_3?.[0] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Address:</strong> {Array.isArray(selectedBill.address_3?.[1]) ? selectedBill.address_3[1].join(", ") : selectedBill.address_3?.[1] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>GSTIN:</strong> {selectedBill.address_3?.[2] || "N/A"}</p>
                            <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>State:</strong> {selectedBill.address_3?.[3] || "N/A"}</p>
                            <p style={{ fontSize: "13px" }}><strong>State Code:</strong> {selectedBill.address_3?.[4] || "N/A"}</p>
                          </Card.Body>
                        </Card>
                      </Col>
                </Row>

                {/* Additional Details */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Card style={{ backgroundColor: "#fff5e6", border: "1px solid #ffa500" }}>
                      <Card.Body>
                        <h6 style={{ color: "#ff8c00", fontWeight: 700, marginBottom: "10px" }}>
                          <i className="bi bi-truck me-2"></i>Delivery Information
                        </h6>
                        <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Delivery Note:</strong> {selectedBill.delv_note || "N/A"}</p>
                        <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Delivery Date:</strong> {selectedBill.del_note_date ? new Date(selectedBill.del_note_date).toLocaleDateString() : "N/A"}</p>
                        <p style={{ fontSize: "13px" }}><strong>Dispatch Doc No:</strong> {selectedBill.dispatch_doc_no || "N/A"}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card style={{ backgroundColor: "#e6f3ff", border: "1px solid #0369a1" }}>
                      <Card.Body>
                        <h6 style={{ color: "#0369a1", fontWeight: 700, marginBottom: "10px" }}>
                          <i className="bi bi-receipt me-2"></i>Reference Information
                        </h6>
                        <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Ref No Date:</strong> {selectedBill.ref_no_date ? new Date(selectedBill.ref_no_date).toLocaleDateString() : "N/A"}</p>
                        <p style={{ fontSize: "13px", marginBottom: "5px" }}><strong>Buyer's Order No:</strong> {selectedBill.buyer_ord_no || "N/A"}</p>
                        <p style={{ fontSize: "13px" }}><strong>Other Reference:</strong> {selectedBill.other_ref || "N/A"}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Line Items */}
                <h6 style={{ color: "#2b6777", fontWeight: 700, marginTop: "20px", marginBottom: "15px" }}>
                  <i className="bi bi-list-check me-2"></i>Line Items
                </h6>
                <div className="table-responsive mb-4">
                  <Table bordered size="sm" style={{ backgroundColor: "#fff" }}>
                    <thead style={{ backgroundColor: "#e8f4f8" }}>
                      <tr style={{ fontWeight: 700, color: "#2b6777" }}>
                        <th>Item Name</th>
                        <th>HSN</th>
                        <th>Qty</th>
                        <th>Rate</th>
                        <th>Amount</th>
                        <th>GST %</th>
                        <th>GST Amt</th>
                        <th>IGST %</th>
                        <th>IGST Amt</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.bill_item && Array.isArray(selectedBill.bill_item) ? (
                        selectedBill.bill_item.map((item, idx) => (
                          <tr key={idx} style={{ fontSize: "13px" }}>
                            <td>{Array.isArray(item) ? item[0] : item.item_name}</td>
                            <td>{Array.isArray(item) ? item[1] : item.hsn}</td>
                            <td>{Array.isArray(item) ? item[2] : item.qty}</td>
                            <td>₹{Array.isArray(item) ? item[3] : item.rate}</td>
                            <td>₹{Array.isArray(item) ? item[4] : item.amount}</td>
                            <td>{Array.isArray(item) ? item[5] : item.gst_percentage}%</td>
                            <td>₹{Array.isArray(item) ? item[6] : item.gst_amount}</td>
                            <td>{Array.isArray(item) ? item[7] : item.igst_percentage}%</td>
                            <td>₹{Array.isArray(item) ? item[8] : item.igst_amount}</td>
                            <td>{Array.isArray(item) ? item[9] : item.unit}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="10" className="text-center">No items</td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Totals */}
                {(() => {
                  const totals = calculateBillTotals(selectedBill);
                  return (
                    <Row className="mb-4">
                      <Col md={{ span: 6, offset: 6 }}>
                        <Card style={{ backgroundColor: "#e8f4f8", border: "2px solid #2b6777" }}>
                          <Card.Body>
                            <Row className="mb-2">
                              <Col xs={8}><strong>Subtotal:</strong></Col>
                              <Col xs={4} className="text-end">₹{totals.amount}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col xs={8}><strong>SGST/CGST:</strong></Col>
                              <Col xs={4} className="text-end">₹{totals.gst}</Col>
                            </Row>
                            <Row className="mb-2">
                              <Col xs={8}><strong>IGST:</strong></Col>
                              <Col xs={4} className="text-end">₹{totals.igst}</Col>
                            </Row>
                            <Row style={{ borderTop: "2px solid #2b6777", paddingTop: "10px" }}>
                              <Col xs={8}><strong style={{ fontSize: "16px" }}>Grand Total:</strong></Col>
                              <Col xs={4} className="text-end" style={{ fontSize: "16px", fontWeight: "bold", color: "#2b6777" }}>₹{totals.grand_total}</Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })()}

                {/* Bank Details */}
                {selectedBill.bank_detail && selectedBill.bank_detail.length > 0 && (
                  <>
                    <h6 style={{ color: "#2b6777", fontWeight: 700, marginTop: "20px", marginBottom: "15px" }}>
                      <i className="bi bi-bank me-2"></i>Bank Details
                    </h6>
                    <div style={{ backgroundColor: "#f8f9fa", padding: "15px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #dee2e6" }}>
                      {selectedBill.bank_detail.map((detail, idx) => (
                        <p key={idx} style={{ margin: "8px 0", fontSize: "13px" }}>{detail}</p>
                      ))}
                    </div>
                  </>
                )}

                {/* Amount in Words & Signature */}
                <Row>
                  <Col md={6}>
                    <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                      <Card.Body>
                        <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                          <i className="bi bi-type me-2"></i>Amount in Words
                        </h6>
                        <p style={{ fontSize: "13px" }}>{selectedBill.amount_in_words || "N/A"}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card style={{ backgroundColor: "#f0f9ff", border: "1px solid #2b6777" }}>
                      <Card.Body>
                        <h6 style={{ color: "#2b6777", fontWeight: 700, marginBottom: "10px" }}>
                          <i className="bi bi-pen me-2"></i>Authorized Signatory
                        </h6>
                        <p style={{ fontSize: "13px" }}>{selectedBill.authorized_name || "N/A"}</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            )
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetailsModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AllBills;

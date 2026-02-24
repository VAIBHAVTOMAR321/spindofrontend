import React, { useState, useEffect } from "react";
import { Container, Form, Button, Row, Col, Card, Spinner, Alert, InputGroup, Table, Modal } from "react-bootstrap";
import { useLocation } from "react-router-dom";

import "../../../assets/css/admindashboard.css";
import "../../../assets/css/service-multiselect.css";
import { useAuth } from "../../context/AuthContext";
import StaffLeftNav from "../StaffLeftNav";
import StaffHeader from "../StaffHeader";

const StaffBill = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const { tokens } = useAuth();

  const initialBillData = {
    address_1: { name: "", address_lines: "", gstin: "", phone_numbers: "", email: "" },
    address_2: { name: "", address_lines: "", gstin: "", state: "", state_code: "" },
    address_3: { name: "", address_lines: "", gstin: "", state: "", state_code: "" },
    invoice_no: ["", ""],
    delv_note: "",
    ref_no_date: new Date().toISOString().split('T')[0],
    buyer_ord_no: "",
    dispatch_doc_no: "",
    dated_1: new Date().toISOString().split('T')[0],
    mode_of_pay: "Bank Transfer",
    other_ref: "",
    dated_date: new Date().toISOString().split('T')[0],
    del_note_date: new Date().toISOString().split('T')[0],
    amount_in_words: "",
    authorized_name: "",
  };

  const [billData, setBillData] = useState(initialBillData);

  const initialBillItem = {
    item_name: "",
    hsn: "",
    qty: "",
    rate: "",
    amount: "0.00",
    cgst_percentage: "9",
    cgst_amount: "0.00",
    sgst_percentage: "9",
    sgst_amount: "0.00",
    unit: "Nos"
  };

  const [billItems, setBillItems] = useState([initialBillItem]);

  const [bankDetails, setBankDetails] = useState(["", "", "", ""]);

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

  const handleBillDataChange = (e) => {
    const { name, value } = e.target;
    const addressKeys = ["address_1", "address_2", "address_3"];
    
    let handled = false;
    for (const key of addressKeys) {
      if (name.startsWith(key)) {
        const field = name.substring(key.length + 1); // e.g., name from "address_1_name"
        setBillData(prev => ({
          ...prev,
          [key]: { ...prev[key], [field]: value }
        }));
        handled = true;
        break;
      }
    }

    if (!handled) {
      if (name.startsWith('invoice_no_')) {
        const idx = parseInt(name.split('_').pop());
        const newInvoiceNo = [...billData.invoice_no];
        newInvoiceNo[idx] = value;
        setBillData(prev => ({ ...prev, invoice_no: newInvoiceNo }));
      } else {
        setBillData(prev => ({ ...prev, [name]: value }));
      }
    }
  };
  
  const handleInvoiceNoChange = (index, value) => {
    const newInvoiceNo = [...billData.invoice_no];
    newInvoiceNo[index] = value;
    setBillData(prev => ({ ...prev, invoice_no: newInvoiceNo }));
  };

  const handleBillItemChange = (index, field, value) => {
    const updatedItems = [...billItems];
    const currentItem = { ...updatedItems[index], [field]: value };

    if (['qty', 'rate', 'cgst_percentage', 'sgst_percentage'].includes(field)) {
      const qty = parseFloat(currentItem.qty) || 0;
      const rate = parseFloat(currentItem.rate) || 0;
      const amount = qty * rate;
      
      const cgstPct = parseFloat(currentItem.cgst_percentage) || 0;
      const cgstAmount = (amount * cgstPct) / 100;
      
      const sgstPct = parseFloat(currentItem.sgst_percentage) || 0;
      const sgstAmount = (amount * sgstPct) / 100;

      currentItem.amount = amount.toFixed(2);
      currentItem.cgst_amount = cgstAmount.toFixed(2);
      currentItem.sgst_amount = sgstAmount.toFixed(2);
    }
    updatedItems[index] = currentItem;
    setBillItems(updatedItems);
  };

  const handleBankDetailChange = (index, value) => {
    const updatedDetails = [...bankDetails];
    updatedDetails[index] = value;
    setBankDetails(updatedDetails);
  };

  const addBillItem = () => {
    setBillItems([...billItems, { ...initialBillItem }]);
  };

  const removeBillItem = (index) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    let totalAmount = 0, totalCGST = 0, totalSGST = 0;
    billItems.forEach(item => {
      totalAmount += parseFloat(item.amount) || 0;
      totalCGST += parseFloat(item.cgst_amount) || 0;
      totalSGST += parseFloat(item.sgst_amount) || 0;
    });
    const grandTotal = totalAmount + totalCGST + totalSGST;
    return {
      amount: totalAmount.toFixed(2),
      cgst: totalCGST.toFixed(2),
      sgst: totalSGST.toFixed(2),
      grand_total: grandTotal.toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formattedBillItems = billItems.map(item => [
        item.item_name,
        item.hsn,
        Number(item.qty),
        Number(item.rate),
        Number(item.amount),
        Number(item.cgst_percentage),
        Number(item.cgst_amount),
        Number(item.sgst_percentage),
        Number(item.sgst_amount),
        item.unit
      ]);

      const payload = {
        ...billData,
        address_1: [
            billData.address_1.name,
            billData.address_1.address_lines.split(',').map(s => s.trim()),
            billData.address_1.gstin,
            billData.address_1.phone_numbers.split(',').map(s => s.trim()),
            billData.address_1.email
        ],
        address_2: [
            billData.address_2.name,
            billData.address_2.address_lines.split(',').map(s => s.trim()),
            billData.address_2.gstin,
            billData.address_2.state,
            billData.address_2.state_code
        ],
        address_3: [
            billData.address_3.name,
            billData.address_3.address_lines.split(',').map(s => s.trim()),
            billData.address_3.gstin,
            billData.address_3.state,
            billData.address_3.state_code
        ],
        bill_item: formattedBillItems,
        bank_detail: bankDetails,
        amount_in_words: billData.amount_in_words || `Indian Rupees ${numberToWords(parseFloat(calculateTotals().grand_total))}`
      };

      const response = await fetch("https://mahadevaaya.com/spindo/spindobackend/api/billing/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.status) {
        setResultType("success");
        setResultMessage("Invoice created successfully!");
        setShowResultModal(true);
        handleReset();
      } else {
        setResultType("error");
        setResultMessage(result.message || "Failed to create invoice.");
        setShowResultModal(true);
      }
    } catch (err) {
      setResultType("error");
      setResultMessage("An error occurred. Please try again.");
      setShowResultModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBillData(initialBillData);
    setBillItems([initialBillItem]);
    setBankDetails(["", "", "", ""]);
  };
  
  // A simple number to words converter
  const numberToWords = (num) => {
      // Basic implementation, can be expanded
      return "Amount in words placeholder";
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const totals = calculateTotals();

  return (
    <div className="dashboard-container">
      <StaffLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <StaffHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-body dashboard-main-container">
          <Row className="justify-content-center mt-4">
            <Col xs={12}>
              <Card className="shadow-lg border-0 rounded-4 p-4">
                <Card.Body>
                  <div className="text-center mb-4">
                    <h2>Create Invoice</h2>
                  </div>

                  <Form onSubmit={handleSubmit}>
                    {/* Address Section */}
                    <Row>
                        {/* Address 1 */}
                        <Col md={4}>
                            <Card className="mb-4">
                                <Card.Header>Seller Details (Address 1)</Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" name="address_1_name" value={billData.address_1.name} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control as="textarea" rows={3} name="address_1_address_lines" value={billData.address_1.address_lines} onChange={handleBillDataChange} />
                                        <Form.Text muted>Enter address lines separated by commas.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>GSTIN</Form.Label>
                                        <Form.Control type="text" name="address_1_gstin" value={billData.address_1.gstin} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Phone Numbers</Form.Label>
                                        <Form.Control type="text" name="address_1_phone_numbers" value={billData.address_1.phone_numbers} onChange={handleBillDataChange} />
                                         <Form.Text muted>Enter phone numbers separated by commas.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control type="email" name="address_1_email" value={billData.address_1.email} onChange={handleBillDataChange} />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Address 2 */}
                        <Col md={4}>
                            <Card className="mb-4">
                                <Card.Header>Ship To Details (Address 2)</Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" name="address_2_name" value={billData.address_2.name} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control as="textarea" rows={3} name="address_2_address_lines" value={billData.address_2.address_lines} onChange={handleBillDataChange} />
                                        <Form.Text muted>Enter address lines separated by commas.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>GSTIN</Form.Label>
                                        <Form.Control type="text" name="address_2_gstin" value={billData.address_2.gstin} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>State</Form.Label>
                                        <Form.Control type="text" name="address_2_state" value={billData.address_2.state} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>State Code</Form.Label>
                                        <Form.Control type="text" name="address_2_state_code" value={billData.address_2.state_code} onChange={handleBillDataChange} />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Address 3 */}
                        <Col md={4}>
                            <Card className="mb-4">
                                <Card.Header>Bill To Details (Address 3)</Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control type="text" name="address_3_name" value={billData.address_3.name} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control as="textarea" rows={3} name="address_3_address_lines" value={billData.address_3.address_lines} onChange={handleBillDataChange} />
                                        <Form.Text muted>Enter address lines separated by commas.</Form.Text>
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>GSTIN</Form.Label>
                                        <Form.Control type="text" name="address_3_gstin" value={billData.address_3.gstin} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>State</Form.Label>
                                        <Form.Control type="text" name="address_3_state" value={billData.address_3.state} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>State Code</Form.Label>
                                        <Form.Control type="text" name="address_3_state_code" value={billData.address_3.state_code} onChange={handleBillDataChange} />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    
                     {/* Invoice Details Section */}
                    <Card className="mb-4">
                      <Card.Header>Invoice Details</Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Invoice No</Form.Label>
                              <Form.Control type="text" value={billData.invoice_no[0]} onChange={(e) => handleInvoiceNoChange(0, e.target.value)} />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Financial Year</Form.Label>
                              <Form.Control type="text" value={billData.invoice_no[1]} onChange={(e) => handleInvoiceNoChange(1, e.target.value)} />
                            </Form.Group>
                          </Col>
                           <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Invoice Date</Form.Label>
                              <Form.Control type="date" name="dated_date" value={billData.dated_date} onChange={handleBillDataChange}/>
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Mode of Payment</Form.Label>
                              <Form.Select name="mode_of_pay" value={billData.mode_of_pay} onChange={handleBillDataChange}>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="Cheque">Cheque</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row className="mt-3">
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Delivery Note</Form.Label>
                              <Form.Control type="text" name="delv_note" value={billData.delv_note} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Ref No Date</Form.Label>
                              <Form.Control type="date" name="ref_no_date" value={billData.ref_no_date} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Buyer's Order No</Form.Label>
                              <Form.Control type="text" name="buyer_ord_no" value={billData.buyer_ord_no} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Dispatch Doc No</Form.Label>
                              <Form.Control type="text" name="dispatch_doc_no" value={billData.dispatch_doc_no} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row className="mt-3">
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Dated</Form.Label>
                              <Form.Control type="date" name="dated_1" value={billData.dated_1} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Other Reference</Form.Label>
                              <Form.Control type="text" name="other_ref" value={billData.other_ref} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Delivery Note Date</Form.Label>
                              <Form.Control type="date" name="del_note_date" value={billData.del_note_date} onChange={handleBillDataChange} />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Bill Items Section */}
                    <Card className="mb-4">
                      <Card.Header>Line Items</Card.Header>
                      <Card.Body>
                        <div className="table-responsive">
                          <Table bordered hover size="sm">
                            <thead>
                              <tr>
                                <th>Item Name</th>
                                <th>HSN</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>Amount</th>
                                <th>CGST %</th>
                                <th>CGST Amt</th>
                                <th>SGST %</th>
                                <th>SGST Amt</th>
                                <th>Unit</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                               {billItems.map((item, index) => (
                                <tr key={index}>
                                  <td><Form.Control size="sm" type="text" value={item.item_name} onChange={(e) => handleBillItemChange(index, 'item_name', e.target.value)} /></td>
                                  <td><Form.Control size="sm" type="text" value={item.hsn} onChange={(e) => handleBillItemChange(index, 'hsn', e.target.value)} /></td>
                                  <td><Form.Control size="sm" type="number" value={item.qty} onChange={(e) => handleBillItemChange(index, 'qty', e.target.value)} /></td>
                                  <td><Form.Control size="sm" type="number" value={item.rate} onChange={(e) => handleBillItemChange(index, 'rate', e.target.value)} /></td>
                                  <td><Form.Control size="sm" type="text" value={item.amount} readOnly /></td>
                                  <td><Form.Control size="sm" type="number" value={item.cgst_percentage} onChange={(e) => handleBillItemChange(index, 'cgst_percentage', e.target.value)} /></td>
                                  <td><Form.Control size="sm" type="text" value={item.cgst_amount} readOnly /></td>
                                  <td><Form.Control size="sm" type="number" value={item.sgst_percentage} onChange={(e) => handleBillItemChange(index, 'sgst_percentage', e.target.value)} /></td>
                                  <td><Form.Control size="sm" type="text" value={item.sgst_amount} readOnly /></td>
                                  <td><Form.Control size="sm" type="text" value={item.unit} onChange={(e) => handleBillItemChange(index, 'unit', e.target.value)} /></td>
                                  <td><Button variant="danger" size="sm" onClick={() => removeBillItem(index)} disabled={billItems.length === 1}><i className="bi bi-trash"></i></Button></td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                        <Button variant="outline-primary" size="sm" onClick={addBillItem} className="mt-3"><i className="bi bi-plus-circle me-1"></i> Add Item</Button>

                        <Row className="mt-4">
                          <Col md={{ span: 6, offset: 6 }}>
                            <Card>
                              <Card.Body>
                                <Row><Col><strong>Subtotal:</strong></Col><Col className="text-end">₹{totals.amount}</Col></Row>
                                <Row><Col><strong>CGST:</strong></Col><Col className="text-end">₹{totals.cgst}</Col></Row>
                                <Row><Col><strong>SGST:</strong></Col><Col className="text-end">₹{totals.sgst}</Col></Row>
                                <Row className="mt-2 pt-2 border-top"><Col><strong>Grand Total:</strong></Col><Col className="text-end"><strong>₹{totals.grand_total}</strong></Col></Row>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    {/* Bank Details & Other Info */}
                    <Row>
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Header>Bank Details</Card.Header>
                                <Card.Body>
                                    {["A/c Holder's Name", "Bank Name", "A/c No", "IFSC Code"].map((label, index) => (
                                    <Form.Group className="mb-3" key={index}>
                                        <Form.Label>{label}</Form.Label>
                                        <Form.Control type="text" value={bankDetails[index]} onChange={(e) => handleBankDetailChange(index, e.target.value)} />
                                    </Form.Group>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                             <Card className="mb-4">
                                <Card.Header>Additional Information</Card.Header>
                                <Card.Body>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Amount in Words</Form.Label>
                                        <Form.Control as="textarea" rows={3} name="amount_in_words" value={billData.amount_in_words} onChange={handleBillDataChange} />
                                    </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Authorized Signatory Name</Form.Label>
                                        <Form.Control type="text" name="authorized_name" value={billData.authorized_name} onChange={handleBillDataChange} />
                                    </Form.Group>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-center gap-3 mt-4">
                      <Button variant="primary" type="submit" size="lg" disabled={loading}>
                        {loading ? <><Spinner size="sm" /> Creating...</> : "Create Invoice"}
                      </Button>
                      <Button variant="outline-secondary" type="button" size="lg" onClick={handleReset} disabled={loading}>Reset</Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Modal show={showResultModal} onHide={() => setShowResultModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>{resultType === "success" ? "Success" : "Error"}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <i className={`bi ${resultType === 'success' ? 'bi-check-circle' : 'bi-x-circle'}`} style={{ fontSize: '4rem', color: resultType === 'success' ? 'green' : 'red' }}></i>
                <p className="mt-3">{resultMessage}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => setShowResultModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>

        </Container>
      </div>
    </div>
  );
};

export default StaffBill;

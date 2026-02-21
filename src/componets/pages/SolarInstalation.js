import React, { useState } from 'react'
import { Container, Row, Col, Form, Button, Alert, Image } from 'react-bootstrap'
import axios from 'axios'
import "../../assets/css/ContactUs.css";
import SolarImg from "../../assets/images/solar.jpg"
import { Link } from 'react-router-dom';

function SolarInstallation() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    address: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // --- VALIDATION HELPER FUNCTION ---
  // This function can be used for both live and submit validation
  const validateField = (name, value) => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return 'Full name is required';
        return null;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(value)) return 'Email is invalid';
        return null;
      case 'mobile_number':
        if (!value.trim()) return 'Mobile number is required';
        // Live validation: check for non-digit characters
        if (!/^\d+$/.test(value)) return 'Mobile number can only contain digits';
        // Live validation: check for length
        if (value.length !== 10) return 'Mobile number must be exactly 10 digits';
        return null;
      case 'address':
        if (!value.trim()) return 'addresss is required';
        return null;
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // --- LIVE VALIDATION ---
    // Perform validation for the current field as the user types
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    // Validate all fields using the helper function
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const response = await axios.post(
        'https://mahadevaaya.com/spindo/spindobackend/api/solar-query/',
        formData
      );
      
      if (response.data) {
        setSubmitted(true);
        setErrors({}); // Clear all errors on successful submission
        setFormData({
          full_name: '',
          email: '',
          mobile_number: '',
          address: ''
        });
      }
    } catch (error) {
      setSubmitError('Failed to submit your query. Please try again later.');
      console.error('Solar query submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Contact Banner */}
      <div className="Contact-banner">
        <div className="site-breadcrumb-wpr">
          <h2 className="breadcrumb-title">Solar Instalation Services</h2>
          <ul className="breadcrumb-menu clearfix">
            <li><a className="breadcrumb-home" href="/" data-discover="true">Home</a></li>
            <li className="px-2">/</li>
            <li><a className="breadcrumb-contact" href="/solar-installation" data-discover="true">Solar Installation</a></li>
          </ul>
        </div>
      </div>

      <div className="contact-us-page">
        
        <Container className='container-box py-5'>
            
          <Row className="align-items-center justify-content-center">
            
            {/* Left Side - Image */}
            <Col lg={6} md={12} className="mb-4 mb-lg-0">
            
              <div className="image-container">
                <div className='contact-img'>
                <h1>PRADHAN MANTRI SURYA GHAR MUFT BIJALI YOJNA</h1>
                <ul>
                    <li>Customized Solar Panel Installation.</li>
                    <li>Energy-Efficient Design.</li>
                    <li>edicated Maintenance and Support Services.</li>
                    <li>We will help you get a Solar Rooftop at Easy EMIs.</li>
      <li>      
  <Link
    to="https://spindo.in/pmsuryaghar.gov.in/consumerLogin" 
    target="_blank" 
    rel="noopener noreferrer"
    className="portal-link"
  >
    Login to PM Surya Ghar Portal
  </Link>
  </li>  

                </ul>
            </div>
                <img src={SolarImg} alt="Solar Installation" className="img-fluid rounded shadow" />
              </div>
            </Col>  
                 
             
           
            
            {/* Right Side - Form */}
            <Col lg={6} md={12}>
              <div className="contact-form-container">
                {submitted && (
                  <Alert variant="success" className="mb-4">
                    Thank you for your solar installation query! We'll get back to you soon.
                  </Alert>
                )}
                
                {submitError && (
                  <Alert variant="danger" className="mb-4">
                    {submitError}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit} noValidate> {/* noValidate prevents default browser validation */}
                  <Row className='contact-img'>
                    <h1>For Installation Booking</h1>
                    <Col md={6} xs={12}>
                      <Form.Group className="mb-3" controlId="formFullName">
                        <Form.Label className="spi-control form-label">Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className={`spi-control ${errors.full_name ? 'is-invalid' : ''}`}
                          placeholder="Enter your full name"
                        />
                        {errors.full_name && (
                          <Form.Control.Feedback type="invalid">
                            {errors.full_name}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} xs={12}>
                      <Form.Group className="mb-3" controlId="formMobile">
                        <Form.Label className="spi-control form-label">Mobile Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="mobile_number"
                          value={formData.mobile_number}
                          onChange={handleChange}
                          className={`spi-control ${errors.mobile_number ? 'is-invalid' : ''}`}
                          placeholder="Enter your mobile number"
                          isInvalid={!!errors.mobile_number} // Helps with accessibility
                        />
                        {errors.mobile_number && (
                          <Form.Control.Feedback type="invalid">
                            {errors.mobile_number}
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3" controlId="formEmail">
                    <Form.Label className="spi-control form-label">Email addresss</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`spi-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="Enter your email"
                      isInvalid={!!errors.email}
                    />
                    {errors.email && (
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-4" controlId="formaddresss">
                    <Form.Label className="spi-control form-label">addresss</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`spi-control ${errors.address ? 'is-invalid' : ''}`}
                      placeholder="Enter your addresss"
                      isInvalid={!!errors.address}
                    />
                    {errors.address && (
                      <Form.Control.Feedback type="invalid">
                        {errors.address}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  
                  <div className="text-center">
                    <Button 
                      variant="primary" 
                      type="submit" 
                      className="submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Send Request'}
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default SolarInstallation;
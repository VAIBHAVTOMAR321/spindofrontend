import React, { useState } from 'react'
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom';
import axios from 'axios'
import "../../assets/css/ContactUs.css";

function ContactUs() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    subject: '', 
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile_number.replace(/\s/g, ''))) {
      newErrors.mobile_number = 'Mobile number must be 10 digits';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
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
        'https://mahadevaaya.com/spindo/spindobackend/api/contact-us/',
        formData
      );
      
      if (response.data) {
        setSubmitted(true);
        setFormData({
          full_name: '',
          email: '',
          mobile_number: '',
          subject: '',
          message: ''
        });
      }
    } catch (error) {
      setSubmitError('Failed to submit your message. Please try again later.');
      console.error('Contact form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Contact Banner */}
      <div className="Contact-banner">
        <div className="site-breadcrumb-wpr">
          <h2 className="breadcrumb-title">Contact Us</h2>
          <ul className="breadcrumb-menu clearfix">
            <li><Link className="breadcrumb-home" to="/" data-discover="true">Home</Link></li>
            <li className="px-2">/</li>
            <li><Link className="breadcrumb-contact" to="/contact" data-discover="true">Contact Us</Link></li>
          </ul>
        </div>
      </div>

      <div className="contact-us-page">
        <Container className='container-box py-5'>
          <Row className="justify-content-center">
            <Col lg={6} md={12}>
              <div className="contact-form-container">
                {submitted && (
                  <Alert variant="success" className="mb-4">
                    Thank you for contacting us! We'll get back to you soon.
                  </Alert>
                )}
                
                {submitError && (
                  <Alert variant="danger" className="mb-4">
                    {submitError}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Row>
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
                    <Form.Label className="spi-control form-label">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`spi-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3" controlId="formSubject">
                    <Form.Label className="spi-control form-label">Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className={`spi-control ${errors.subject ? 'is-invalid' : ''}`}
                      placeholder="Enter subject"
                    />
                    {errors.subject && (
                      <Form.Control.Feedback type="invalid">
                        {errors.subject}
                      </Form.Control.Feedback>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-4" controlId="formMessage">
                    <Form.Label className="spi-control form-label">Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className={`spi-control ${errors.message ? 'is-invalid' : ''}`}
                      placeholder="Enter your message"
                    />
                    {errors.message && (
                      <Form.Control.Feedback type="invalid">
                        {errors.message}
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
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>
            
            <Col lg={6} md={12} className="mt-4 mt-lg-0">
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110204.7463722151!2d77.94709439982626!3d30.32540979245404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390929c356c888af%3A0x4c3562c032518799!2sDehradun%2C%20Uttarakhand!5e0!3m2!1sen!2sin!4v1657179819999!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '600px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Map"
                ></iframe>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default ContactUs;
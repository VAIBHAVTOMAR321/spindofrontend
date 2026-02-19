import React from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";
import "../../assets/css/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer mt-auto py-4">
      <Container>
        <Row>
          {/* Company Info Column */}
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <div className="footer-brand mb-3">
              <h4 className="mb-0">SPINDO</h4>
              <p className="mb-0 small">All Services Under One Roof</p>
            </div>
            <p className="footer-description mb-3">
              The SPINDO is India's Largest Digital Platform for Next-Gen Services. 
              We connect you with trusted service professionals for all your home needs.
            </p>
            <div className="footer-social-links">
              <a href="#" className="social-link me-3" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" className="social-link me-3" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" className="social-link me-3" aria-label="LinkedIn"><FaLinkedinIn /></a>
              <a href="#" className="social-link" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </Col>
          
          {/* Quick Links Column */}
          <Col lg={2} md={6} className="mb-4 mb-lg-0">
            <h5 className="footer-heading mb-3">Quick Links</h5>
            <Nav className="flex-column">
              <Nav.Link href="#home" className="footer-nav-link p-0 mb-2">Home</Nav.Link>
              <Nav.Link href="#about" className="footer-nav-link p-0 mb-2">About Us</Nav.Link>
              <Nav.Link href="#services" className="footer-nav-link p-0 mb-2">Our Services</Nav.Link>
              <Nav.Link href="#how-it-works" className="footer-nav-link p-0 mb-2">How It Works</Nav.Link>
              <Nav.Link href="#testimonials" className="footer-nav-link p-0">Testimonials</Nav.Link>
            </Nav>
          </Col>
          
          {/* Services Column */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <h5 className="footer-heading mb-3">Our Services</h5>
            <Nav className="flex-column">
              <Nav.Link href="#plumbing" className="footer-nav-link p-0 mb-2">Plumbing</Nav.Link>
              <Nav.Link href="#electrical" className="footer-nav-link p-0 mb-2">Electrical</Nav.Link>
              <Nav.Link href="#ac-installation" className="footer-nav-link p-0 mb-2">AC Installation</Nav.Link>
              <Nav.Link href="#beauty" className="footer-nav-link p-0 mb-2">Beauty Treatments</Nav.Link>
              <Nav.Link href="#cleaning" className="footer-nav-link p-0 mb-2">Cleaning</Nav.Link>
              <Nav.Link href="#carpentry" className="footer-nav-link p-0">Carpentry</Nav.Link>
            </Nav>
          </Col>
          
          {/* Contact Info Column */}
          <Col lg={3} md={6} className="mb-4 mb-lg-0">
            <h5 className="footer-heading mb-3">Contact Info</h5>
            <div className="footer-contact">
              <p className="mb-2">
                <i className="bi bi-telephone-fill me-2"></i>
                <a href="tel:+919876543210" className="footer-contact-link">+91 98765 43210</a>
              </p>
              <p className="mb-2">
                <i className="bi bi-envelope-fill me-2"></i>
                <a href="mailto:info@spindo.in" className="footer-contact-link">info@spindo.in</a>
              </p>
              <p className="mb-2">
                <i className="bi bi-geo-alt-fill me-2"></i>
                123 Service Street, Bangalore, India
              </p>
              <p className="mb-0">
                <i className="bi bi-clock-fill me-2"></i>
                Mon-Sat: 9:00 AM - 8:00 PM
              </p>
            </div>
          </Col>
        </Row>
        
        <hr className="my-4 footer-divider" />
        
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="mb-0 footer-copyright">
              Copyright ©{currentYear} SPINDO. All rights reserved
            </p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <div className="footer-bottom-links">
              <a href="#privacy" className="footer-bottom-link me-3">Privacy Policy</a>
              <a href="#terms" className="footer-bottom-link me-3">Terms of Service</a>
              <a href="#sitemap" className="footer-bottom-link">Sitemap</a>
            </div>
          </Col>
        </Row>
        
        <Row className="mt-3">
          <Col className="text-center">
            <p className="mb-0 footer-developer">
              Design and Developed by Brainrock
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
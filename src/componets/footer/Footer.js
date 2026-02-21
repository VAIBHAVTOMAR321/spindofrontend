import React from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import {
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/css/footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  // Function to handle navigation and scroll to top
  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="footer mt-auto py-4">
      <Container>
        <Row>
          {/* Company Info Column */}
          <Col lg={6} md={6} className="mb-4 mb-lg-0">
            <div className="footer-brand mb-3">
              <h4 className="mb-0">SPINDO</h4>
              <p className="mb-0 small">All Services Under One Roof</p>
            </div>
            <p className="footer-description mb-3">
              All Services Under One Roof. The SPINDO is India's Largest Digital Platform for Next-Gen Services.
            </p>
            <div className="footer-social-links">
              <a href="#" className="social-link me-3" aria-label="Facebook">
                <FaFacebookF />
              </a>
              <a href="#" className="social-link me-3" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="#" className="social-link me-3" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </Col>

          {/* Quick Links Column */}
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <h5 className="footer-heading mb-3">Quick Links</h5>
            <Nav className="flex-column">
              <Nav.Link 
                as="button" 
                onClick={() => handleNavigation("/")} 
                className="footer-nav-link p-0 mb-2 text-start"
              >
                Home
              </Nav.Link>
              <Nav.Link 
                as="button" 
                onClick={() => handleNavigation("/AboutUs")} 
                className="footer-nav-link p-0 mb-2 text-start"
              >
                About Us
              </Nav.Link>
              <Nav.Link 
                as="button" 
                onClick={() => handleNavigation("/ServicesPage")} 
                className="footer-nav-link p-0 mb-2 text-start"
              >
                Services
              </Nav.Link>
              <Nav.Link 
                as="button" 
                onClick={() => handleNavigation("/ContactUs")} 
                className="footer-nav-link p-0 mb-2 text-start"
              >
                Contact
              </Nav.Link>
            </Nav>
          </Col>
          
          <Col lg={2} md={6} className="mb-4 mb-lg-0">
            <h5 className="footer-heading mb-3">Contact Info</h5>
            <div className="footer-contact">
              <p className="mb-2">
                <i className="bi bi-telephone-fill me-2"></i>
                <a href="tel:+919876543210" className="footer-contact-link">
                  +91 98765 43210
                </a>
              </p>
              <p className="mb-2">
                <i className="bi bi-envelope-fill me-2"></i>
                <a href="mailto:info@spindo.in" className="footer-contact-link">
                  info@spindo.in
                </a>
              </p>
              <p className="mb-2">
                <i className="bi bi-geo-alt-fill me-2"></i>
                UTTARAKHAND, INDIA
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
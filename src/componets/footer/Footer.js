import React, { useState, useEffect } from "react";
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
  const [companyDetails, setCompanyDetails] = useState(null);

  // Fetch company details from API
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch(
          "https://mahadevaaya.com/spindo/spindobackend/api/company-details/",
        );
        if (!response.ok) {
          throw new Error("Failed to fetch company details");
        }
        const data = await response.json();
        if (data.length > 0) {
          setCompanyDetails(data[0]);
        }
      } catch (err) {
        console.error("Error fetching company details:", err);
      }
    };

    fetchCompanyDetails();
  }, []);

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
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <div className="footer-brand mb-3">
              <h4 className="mb-0">{companyDetails?.company_name || "SPINDO"}</h4>
              <p className="mb-0 small">All Services Under One Roof</p>
            </div>
            <p className="footer-description mb-3">
              All Services Under One Roof. The SPINDO is India's Largest Digital Platform for Next-Gen Services.
            </p>
            <div className="footer-social-links">
              {companyDetails?.profile_link && companyDetails.profile_link.length > 0 && (
                <>
                  {companyDetails.profile_link.map((link, index) => {
                    if (!link || link === "#" || link === "") return null;
                    
                    // Determine social media platform from URL
                    const linkLower = link.toLowerCase();
                    if (linkLower.includes("facebook")) {
                      return (
                        <a 
                          key={index}
                          href={link} 
                          className="social-link me-3" 
                          aria-label="Facebook"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaFacebookF />
                        </a>
                      );
                    } else if (linkLower.includes("twitter") || linkLower.includes("x.com")) {
                      return (
                        <a 
                          key={index}
                          href={link} 
                          className="social-link me-3" 
                          aria-label="Twitter"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaTwitter />
                        </a>
                      );
                    } else if (linkLower.includes("linkedin")) {
                      return (
                        <a 
                          key={index}
                          href={link} 
                          className="social-link me-3" 
                          aria-label="LinkedIn"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaLinkedinIn />
                        </a>
                      );
                    } else if (linkLower.includes("instagram")) {
                      return (
                        <a 
                          key={index}
                          href={link} 
                          className="social-link me-3" 
                          aria-label="Instagram"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaInstagram />
                        </a>
                      );
                    } else {
                      // Default for other links (optional)
                      return null;
                    }
                  })}
                </>
              )}
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
          
          {/* Contact Info Column */}
          <Col lg={4} md={12} className="mb-4 mb-lg-0">
            <h5 className="footer-heading mb-3">Contact Info</h5>
            <div className="footer-contact">
              {companyDetails?.phone && (
                <p className="mb-2">
                  <i className="bi bi-telephone-fill me-2"></i>
                  <a href={`tel:+91${companyDetails.phone}`} className="footer-contact-link">
                    +91 {companyDetails.phone}
                  </a>
                </p>
              )}
              {companyDetails?.email && (
                <p className="mb-2">
                  <i className="bi bi-envelope-fill me-2"></i>
                  <a href={`mailto:${companyDetails.email}`} className="footer-contact-link">
                    {companyDetails.email}
                  </a>
                </p>
              )}
              {companyDetails?.address && (
                <p className="mb-2">
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  {companyDetails.address}
                </p>
              )}
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
          <Col md={6} className="text-center text-md-end mb-3 mb-md-0">
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
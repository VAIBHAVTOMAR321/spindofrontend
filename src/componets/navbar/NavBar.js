import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Button } from "react-bootstrap";
import {
  FaEnvelope,
  FaPhone,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaPhoneAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../../assets/css/NavBar.css";

function NavBar() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const navigate = useNavigate();

  // Base URL for API
  const API_BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";

  // Function to get full logo URL
  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    
    // If it's already a full URL (starts with http), return as is
    if (logoPath.startsWith('http')) {
      return logoPath;
    }
    
    // If it's a relative path, prepend the base URL
    // Remove leading slash if present to avoid double slashes
    const cleanPath = logoPath.startsWith('/') ? logoPath.slice(1) : logoPath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/service-category/`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }
        const data = await response.json();
        if (data.status) {
          // Filter only published services, exclude draft services
          const publishedServices = data.data.filter(service => service.status === 'published');
          setServices(publishedServices);
        } else {
          setError("Failed to load services");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Fetch company details from API
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/company-details/`,
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
      } finally {
        setLogoLoading(false);
      }
    };

    fetchCompanyDetails();
  }, []);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    console.log("Selected Service for Vendor List:", service);
    // Navigate to vendor list page with the selected service
    navigate("/VendorList", {
      state: {
        service: {
          id: service.id,
          prod_name: service.prod_name,
        },
      },
    });
  };

  // --- Helper function to render social links correctly ---
  const renderSocialLinks = () => {
    if (!companyDetails?.profile_link || companyDetails.profile_link.length === 0) {
      return null;
    }

    const links = companyDetails.profile_link;
    const socialIcons = [];

    if (links.some(link => link.includes('facebook.com'))) {
      const facebookLink = links.find(l => l.includes('facebook.com'));
      socialIcons.push(
        <a key="facebook" href={facebookLink} target="_blank" rel="noopener noreferrer" className="text-white me-3">
          <FaFacebook />
        </a>
      );
    }
    if (links.some(link => link.includes('twitter.com'))) {
      const twitterLink = links.find(l => l.includes('twitter.com'));
      socialIcons.push(
        <a key="twitter" href={twitterLink} target="_blank" rel="noopener noreferrer" className="text-white me-3">
          <FaTwitter />
        </a>
      );
    }
    if (links.some(link => link.includes('linkedin.com'))) {
      const linkedinLink = links.find(l => l.includes('linkedin.com'));
      socialIcons.push(
        <a key="linkedin" href={linkedinLink} target="_blank" rel="noopener noreferrer" className="text-white me-3">
          <FaLinkedin />
        </a>
      );
    }
    if (links.some(link => link.includes('instagram.com'))) {
      const instagramLink = links.find(l => l.includes('instagram.com'));
      socialIcons.push(
        <a key="instagram" href={instagramLink} target="_blank" rel="noopener noreferrer" className="text-white">
          <FaInstagram />
        </a>
      );
    }

    return socialIcons;
  };

  return (
    <>
      {/* Top bar with contact info and social links */}
      <div className="top-bar bg-dark text-white py-2 d-none d-lg-block">
        <div className="d-flex justify-content-between align-items-center nav-p">
          <div className="contact-info">
            {companyDetails?.email && (
              <span className="me-3">
                <FaEnvelope />  {companyDetails.email}
              </span>
            )}
            {companyDetails?.phone && (
              <span>
                <FaPhoneAlt /> 91 {companyDetails.phone}{" "}
              </span>
            )}
          </div>
          <div className="social-links">
            {renderSocialLinks()}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <Navbar expand="lg" className="bg-body-tertiary sticky-top">
        <Container>
          <Navbar.Brand href="#home">
            <div className="d-flex align-items-center">
              <Link to="/" className="d-flex align-items-center text-decoration-none">
                {logoLoading ? (
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : companyDetails?.logo ? (
                  <img
                    src={getLogoUrl(companyDetails.logo)}
                    alt={`${companyDetails.company_name || 'Company'} Logo`}
                    className="spi-logo img-fluid me-2"
                    style={{ maxHeight: '50px', width: 'auto' }}
                    onLoad={() => setLogoLoading(false)}
                    onError={(e) => {
                      console.error('Logo failed to load:', e.target.src);
                      e.target.onerror = null;
                      // Try with different path variations if the first attempt fails
                      if (!companyDetails.logo.startsWith('http') && !companyDetails.logo.startsWith('/')) {
                        e.target.src = `${API_BASE_URL}/${companyDetails.logo}`;
                      } else if (companyDetails.logo.startsWith('/')) {
                        e.target.src = `${API_BASE_URL}${companyDetails.logo}`;
                      } else {
                        e.target.src = "https://via.placeholder.com/150x50?text=Logo";
                      }
                      setLogoLoading(false);
                    }}
                  />
                ) : (
                  <div className="spi-logo-placeholder bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{width: "150px", height: "50px", borderRadius: "4px"}}>
                    Logo
                  </div>
                )}
                {companyDetails?.company_name && (
                  <span className="company-name fw-bold text-dark">{companyDetails.company_name}</span>
                )}
              </Link>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Left side navigation items */}
            <Nav className="me-auto">
              <Nav.Link href="/" className="custom-nav-link">
                HOME
              </Nav.Link>
              <Nav.Link href="/AboutUs" className="custom-nav-link">
                ABOUT
              </Nav.Link>

              <NavDropdown
                title="SERVICES"
                id="basic-nav-dropdown"
                className="custom-nav-link"
              >
                {loading ? (
                  <NavDropdown.Item>Loading...</NavDropdown.Item>
                ) : error ? (
                  <NavDropdown.Item>Error: {error}</NavDropdown.Item>
                ) : (
                  services.map((service) => (
                    <NavDropdown.Item
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                    >
                      {service.prod_name.toUpperCase()}
                    </NavDropdown.Item>
                  ))
                )}
                <NavDropdown.Divider />
              </NavDropdown>
              <Nav.Link href="/SolarInstalation" className="custom-nav-link">
                Solar Instalation
              </Nav.Link>
              <Nav.Link href="/ContactUs" className="custom-nav-link">
                Get in Touch
              </Nav.Link>
              <Nav.Link href="/PaymentQR" className="custom-nav-link">
                Payment
              </Nav.Link>
              <Nav.Link href="/Login" className="custom-nav-link">
                Book Services
              </Nav.Link>
            </Nav>

            {/* Right side - Only Register and Login buttons */}
            <Nav className="ms-auto">
              <Link to="/Registration">
                <Button variant="outline-primary" className="me-2">
                  Register
                </Button>
              </Link>
              <Link to="/Login">
                <Button variant="primary">Login</Button>
              </Link>
            </Nav>

            {/* Mobile contact info - only shows in mobile view */}
            <Nav className="mobile-contact d-lg-none">
              {companyDetails?.email && (
                <Nav.Link
                  href={`mailto:${companyDetails.email}`}
                  className="custom-nav-link"
                >
                  <FaEnvelope /> Email
                </Nav.Link>
              )}
              {companyDetails?.phone && (
                <Nav.Link href={`tel:+91${companyDetails.phone}`} className="custom-nav-link">
                  <FaPhone /> Phone
                </Nav.Link>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default NavBar;
import React from "react";


const Footer = () => (
  <footer className="footer mt-auto py-3" style={{ background: '#2b6777', color: '#fff', textAlign: 'center' }}>
    <div className="container">
      <span>© {new Date().getFullYear()} Mahadevaaya. All rights reserved.</span>
    </div>
  </footer>
);

export default Footer;

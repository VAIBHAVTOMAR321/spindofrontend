import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/service-category/`;

const NumberOfServices = ({ showCardOnly = false }) => {
  // Auth
  const { tokens } = useAuth();

  // Data state
  const [count, setCount] = useState(0);

  // Fetch services count
  const fetchServicesCount = async () => {
    if (!tokens?.access) return;
    try {
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      setCount(res.data.data?.length || 0);
    } catch (error) {
      setCount(0);
      console.error("GET ERROR:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchServicesCount();
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #fef3c7 60%, #fde047 100%)', boxShadow: '0 2px 12px 0 rgba(180, 83, 9, 0.10)' }}>
        <div className="dashboard-card-icon service-icon" title="Number Of Services">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" stroke="#b45309" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Number Of Services</div>
        <div className="dashboard-card-value" style={{ color: '#b45309' }}>{count}</div>
      </div>
    );
  }

  return null;
};

export default NumberOfServices;

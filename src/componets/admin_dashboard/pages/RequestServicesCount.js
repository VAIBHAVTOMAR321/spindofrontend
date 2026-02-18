import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const BASE_URL = "https://mahadevaaya.com/spindo/spindobackend";
const API_URL = `${BASE_URL}/api/customer/requestservices/`;

const RequestServicesCount = ({ showCardOnly = false }) => {
  // Auth
  const { tokens } = useAuth();

  // Data state
  const [count, setCount] = useState(0);

  // Fetch request services count
  const fetchRequestServicesCount = async () => {
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
    fetchRequestServicesCount();
    // eslint-disable-next-line
  }, [tokens]);

  if (showCardOnly) {
    return (
      <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #ffe4e6 60%, #ffcdd2 100%)', boxShadow: '0 2px 12px 0 rgba(244, 63, 94, 0.10)' }}>
        <div className="dashboard-card-icon request-icon" title="Request for services">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M12 20v-6m0 0l-3 3m3-3l3 3M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2" stroke="#f43f5e" strokeWidth="2"/></svg>
        </div>
        <div className="dashboard-card-title">Request for services</div>
        <div className="dashboard-card-value" style={{ color: '#f43f5e' }}>{count}</div>
      </div>
    );
  }

  return null;
};

export default RequestServicesCount;

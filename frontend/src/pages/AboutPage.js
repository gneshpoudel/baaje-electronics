import { useState, useEffect } from 'react';
import axios from 'axios';
import './AboutPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AboutPage = () => {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await axios.get(`${API}/about`);
      setAbout(response.data);
    } catch (error) {
      console.error('Error fetching about:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner" data-testid="loading-spinner"></div>;
  }

  return (
    <div className="about-page" data-testid="about-page">
      <div className="about-hero fade-in">
        <div className="container">
          <h1 className="about-title" data-testid="about-title">About Baaje Electronics</h1>
        </div>
      </div>

      <div className="container">
        <div className="about-content slide-up">
          {about?.image_url && (
            <div className="about-image-section">
              <img src={about.image_url} alt="Baaje Electronics" className="about-image" data-testid="about-image" />
            </div>
          )}

          <div className="about-text-section">
            <div className="about-text" data-testid="about-content">
              {about?.content || 'Content not available'}
            </div>

            <div className="about-features">
              <div className="feature-card">
                <h3>Quality Products</h3>
                <p>We offer only the best quality electronics from trusted brands.</p>
              </div>
              <div className="feature-card">
                <h3>Trusted Service</h3>
                <p>Serving Kathmandu with excellence since 2010.</p>
              </div>
              <div className="feature-card">
                <h3>Competitive Prices</h3>
                <p>Best prices in town with no compromise on quality.</p>
              </div>
              <div className="feature-card">
                <h3>After-Sales Support</h3>
                <p>We're here for you even after your purchase.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

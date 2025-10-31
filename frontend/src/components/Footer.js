import './Footer.css';
import { Facebook, Instagram, Phone, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer" data-testid="footer">
      <div className="footer-container container">
        <div className="footer-grid">
          <div className="footer-section">
            <h3 className="footer-heading">Baaje Electronics</h3>
            <p className="footer-text">
              Your trusted partner for quality electronics in Buddhanagar, Kathmandu.
              Serving the community since 2010.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-subheading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/" data-testid="footer-link-home">Home</a></li>
              <li><a href="/about" data-testid="footer-link-about">About Us</a></li>
              <li><a href="/cart" data-testid="footer-link-cart">Cart</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subheading">Contact Us</h4>
            <ul className="footer-contact">
              <li data-testid="footer-location">
                <MapPin size={18} />
                <span>Buddhanagar, Kathmandu, Nepal</span>
              </li>
              <li data-testid="footer-phone">
                <Phone size={18} />
                <span>+977-1-XXXXXXX</span>
              </li>
              <li data-testid="footer-email">
                <Mail size={18} />
                <span>info@baajeelectronics.com</span>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4 className="footer-subheading">Follow Us</h4>
            <div className="social-links">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn" data-testid="social-facebook">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn" data-testid="social-instagram">
                <Instagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Baaje Electronics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

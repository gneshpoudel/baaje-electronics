import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, onLogout, onOpenAuth, cartCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo" data-testid="navbar-logo">
          <span className="logo-text">Baaje Electronics</span>
          <span className="logo-subtitle">Buddhanagar, Kathmandu</span>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" data-testid="nav-home" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/about" className="nav-link" data-testid="nav-about" onClick={() => setIsMenuOpen(false)}>
            About Us
          </Link>
          
          {user && (
            <Link to="/favorites" className="nav-link mobile-only" data-testid="nav-favorites-mobile" onClick={() => setIsMenuOpen(false)}>
              Favorites
            </Link>
          )}
          
          {user ? (
            <Link to="/profile" className="nav-link mobile-only" data-testid="nav-profile-mobile" onClick={() => setIsMenuOpen(false)}>
              Profile
            </Link>
          ) : (
            <button
              className="btn btn-primary mobile-only"
              onClick={() => {
                onOpenAuth('login');
                setIsMenuOpen(false);
              }}
              data-testid="nav-login-mobile"
            >
              Login
            </button>
          )}
        </div>

        <div className="navbar-actions">
          {user && (
            <Link to="/favorites" className="icon-btn desktop-only" data-testid="nav-favorites-desktop">
              <Heart size={22} />
            </Link>
          )}
          
          <Link to="/cart" className="icon-btn cart-btn" data-testid="nav-cart">
            <ShoppingCart size={22} />
            {cartCount > 0 && <span className="cart-badge" data-testid="cart-count">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="user-menu-container desktop-only">
              <button
                className="user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                data-testid="user-menu-button"
              >
                {user.profile_picture ? (
                  <img src={user.profile_picture} alt={user.name} className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    <User size={20} />
                  </div>
                )}
                <span className="user-name">{user.name}</span>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown" data-testid="user-dropdown">
                  <Link to="/profile" onClick={() => setShowUserMenu(false)} data-testid="dropdown-profile">
                    Profile
                  </Link>
                  <Link to="/favorites" onClick={() => setShowUserMenu(false)} data-testid="dropdown-favorites">
                    Favorites
                  </Link>
                  <button onClick={() => { onLogout(); setShowUserMenu(false); }} data-testid="dropdown-logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="btn btn-primary desktop-only"
              onClick={() => onOpenAuth('login')}
              data-testid="nav-login-desktop"
            >
              Login
            </button>
          )}

          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="menu-toggle"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

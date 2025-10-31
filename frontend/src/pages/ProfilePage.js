import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Package, LogOut } from 'lucide-react';
import './ProfilePage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfilePage = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page" data-testid="profile-page">
      <div className="container">
        <div className="profile-header fade-in">
          <div className="profile-info">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user.name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-placeholder">
                <User size={40} />
              </div>
            )}
            <div>
              <h1 className="profile-name" data-testid="profile-name">{user?.name}</h1>
              <p className="profile-email" data-testid="profile-email">{user?.email}</p>
              {user?.auth_provider !== 'email' && (
                <span className="auth-badge" data-testid="auth-badge">
                  Signed in with {user.auth_provider}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-outline logout-btn" onClick={onLogout} data-testid="logout-button">
            <LogOut size={20} />
            Logout
          </button>
        </div>

        <div className="profile-content slide-up">
          <h2 className="section-title">
            <Package size={28} />
            Order History
          </h2>

          {loading ? (
            <div className="spinner"></div>
          ) : orders.length === 0 ? (
            <div className="empty-orders" data-testid="empty-orders">
              <Package size={60} className="empty-icon" />
              <p>No orders yet</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card card" data-testid={`order-card-${order.id}`}>
                  <div className="order-header">
                    <div>
                      <h3 className="order-id" data-testid={`order-id-${order.id}`}>Order #{order.id}</h3>
                      <p className="order-date" data-testid={`order-date-${order.id}`}>
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`order-status status-${order.status}`} data-testid={`order-status-${order.id}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item" data-testid={`order-item-${order.id}-${index}`}>
                        <span>{item.name} x {item.quantity}</span>
                        <span>NPR {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-footer">
                    <span className="order-total-label">Total:</span>
                    <span className="order-total" data-testid={`order-total-${order.id}`}>NPR {order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

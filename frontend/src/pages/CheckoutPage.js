import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import './CheckoutPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CheckoutPage = ({ cart, clearCart, user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: user?.name || '',
    customer_email: user?.email || '',
    customer_phone: '',
    customer_location: ''
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total_amount: total
      };

      await axios.post(`${API}/orders`, orderData);
      
      // EmailJS will be configured by the user later
      // For now, just show success
      
      setOrderPlaced(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  if (orderPlaced) {
    return (
      <div className="checkout-page" data-testid="checkout-page">
        <div className="container">
          <div className="order-success fade-in" data-testid="order-success">
            <CheckCircle size={80} className="success-icon" />
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your order. We'll contact you soon with the details.</p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => navigate('/')} data-testid="continue-shopping-button">
                Continue Shopping
              </button>
              <button className="btn btn-outline" onClick={() => navigate('/profile')} data-testid="view-orders-button">
                View Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page" data-testid="checkout-page">
      <div className="container">
        <h1 className="page-title fade-in" data-testid="checkout-title">Checkout</h1>

        <div className="checkout-container slide-up">
          <form onSubmit={handleSubmit} className="checkout-form" data-testid="checkout-form">
            <h2>Delivery Information</h2>
            
            <div className="form-group">
              <label htmlFor="customer_name">Full Name *</label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
                data-testid="input-name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer_email">Email *</label>
              <input
                type="email"
                id="customer_email"
                name="customer_email"
                value={formData.customer_email}
                onChange={handleChange}
                required
                data-testid="input-email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer_phone">Phone Number *</label>
              <input
                type="tel"
                id="customer_phone"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleChange}
                required
                placeholder="98XXXXXXXX"
                data-testid="input-phone"
              />
            </div>

            <div className="form-group">
              <label htmlFor="customer_location">Location in Kathmandu *</label>
              <input
                type="text"
                id="customer_location"
                name="customer_location"
                value={formData.customer_location}
                onChange={handleChange}
                required
                placeholder="Area, Street, Landmark"
                data-testid="input-location"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary submit-btn"
              disabled={loading}
              data-testid="submit-order-button"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>

          <div className="order-summary card">
            <h2>Order Summary</h2>
            
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item.id} className="summary-item" data-testid={`summary-item-${item.id}`}>
                  <img src={item.image_url} alt={item.name} />
                  <div className="item-details">
                    <p className="item-name">{item.name}</p>
                    <p className="item-quantity">Qty: {item.quantity}</p>
                  </div>
                  <p className="item-price" data-testid={`summary-price-${item.id}`}>NPR {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span data-testid="summary-subtotal">NPR {total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>Free</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span data-testid="summary-total">NPR {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

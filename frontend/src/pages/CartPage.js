import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import './CartPage.css';

const CartPage = ({ cart, updateQuantity, removeFromCart }) => {
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="cart-page" data-testid="cart-page">
        <div className="container">
          <div className="empty-cart" data-testid="empty-cart">
            <ShoppingBag size={80} className="empty-icon" />
            <h2>Your cart is empty</h2>
            <p>Add some products to get started!</p>
            <button className="btn btn-primary" onClick={() => navigate('/')} data-testid="browse-products-button">
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page" data-testid="cart-page">
      <div className="container">
        <h1 className="page-title fade-in" data-testid="cart-title">Shopping Cart</h1>

        <div className="cart-container slide-up">
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.id} className="cart-item" data-testid={`cart-item-${item.id}`}>
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="cart-item-image"
                  onClick={() => navigate(`/product/${item.id}`)}
                />
                <div className="cart-item-details">
                  <h3 className="cart-item-name" onClick={() => navigate(`/product/${item.id}`)}>
                    {item.name}
                  </h3>
                  <p className="cart-item-price" data-testid={`item-price-${item.id}`}>NPR {item.price.toFixed(2)}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      data-testid={`decrease-quantity-${item.id}`}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity" data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      data-testid={`increase-quantity-${item.id}`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    data-testid={`remove-item-${item.id}`}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary card">
            <h2 className="summary-title" data-testid="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span data-testid="subtotal">NPR {total.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span data-testid="total">NPR {total.toFixed(2)}</span>
            </div>
            <button
              className="btn btn-primary checkout-btn"
              onClick={() => navigate('/checkout')}
              data-testid="checkout-button"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

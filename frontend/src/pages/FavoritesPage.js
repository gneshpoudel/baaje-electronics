import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { toast } from 'sonner';
import './FavoritesPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FavoritesPage = ({ addToCart, user }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/favorites/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(favorites.filter(p => p.id !== productId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  if (loading) {
    return <div className="spinner" data-testid="loading-spinner"></div>;
  }

  return (
    <div className="favorites-page" data-testid="favorites-page">
      <div className="container">
        <div className="page-header fade-in">
          <Heart size={40} className="page-icon" />
          <h1 className="page-title" data-testid="page-title">My Favorites</h1>
          <p className="page-subtitle" data-testid="favorites-count">{favorites.length} item(s)</p>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <Heart size={80} className="empty-icon" />
            <h2>No favorites yet</h2>
            <p>Start adding products to your favorites!</p>
            <button className="btn btn-primary" onClick={() => navigate('/')} data-testid="browse-button">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="favorites-grid slide-up">
            {favorites.map((product) => (
              <div key={product.id} className="favorite-card card" data-testid={`favorite-card-${product.id}`}>
                <div className="product-image-wrapper" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={product.image_url} alt={product.name} className="product-image" />
                </div>
                <div className="product-info">
                  <h3 className="product-name" onClick={() => navigate(`/product/${product.id}`)}>
                    {product.name}
                  </h3>
                  <p className="product-price" data-testid={`product-price-${product.id}`}>NPR {product.price.toFixed(2)}</p>
                  <div className="favorite-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAddToCart(product)}
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <ShoppingCart size={18} />
                      Add to Cart
                    </button>
                    <button
                      className="btn btn-outline remove-btn"
                      onClick={() => removeFavorite(product.id)}
                      data-testid={`remove-favorite-${product.id}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;

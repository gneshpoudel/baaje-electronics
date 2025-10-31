import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import './ProductDetailPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProductDetailPage = ({ addToCart, user, onOpenAuth }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${productId}`);
      setProduct(response.data);

      // Fetch related products
      if (response.data.category_id) {
        const relatedRes = await axios.get(`${API}/products?category_id=${response.data.category_id}`);
        setRelatedProducts(relatedRes.data.filter(p => p.id !== parseInt(productId)).slice(0, 4));
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/favorites/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Added to favorites!');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info('Already in favorites');
      } else {
        toast.error('Failed to add to favorites');
      }
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`Added ${quantity} item(s) to cart!`);
  };

  if (loading) {
    return <div className="spinner" data-testid="loading-spinner"></div>;
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p>Product not found</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="product-detail-page" data-testid="product-detail-page">
      <div className="container">
        <button className="back-btn" onClick={() => navigate(-1)} data-testid="back-button">
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="product-detail-container fade-in">
          <div className="product-image-section">
            <img src={product.image_url} alt={product.name} className="main-product-image" data-testid="product-image" />
          </div>

          <div className="product-info-section">
            <h1 className="product-detail-title" data-testid="product-title">{product.name}</h1>
            <p className="product-detail-price" data-testid="product-price">NPR {product.price.toFixed(2)}</p>
            
            {product.description && (
              <p className="product-description" data-testid="product-description">{product.description}</p>
            )}

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="product-specs" data-testid="product-specs">
                <h3>Specifications</h3>
                <ul>
                  {Object.entries(product.specs).map(([key, value]) => (
                    <li key={key} data-testid={`spec-${key}`}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="stock-info" data-testid="stock-info">
              {product.stock > 0 ? (
                <span className="in-stock">In Stock ({product.stock} available)</span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>

            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="quantity-decrease"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max={product.stock}
                  data-testid="quantity-input"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  data-testid="quantity-increase"
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-actions">
              <button
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                data-testid="add-to-cart-button"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button
                className="btn btn-secondary"
                onClick={addToFavorites}
                data-testid="add-to-favorites-button"
              >
                <Heart size={20} />
                Add to Favorites
              </button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="related-section" data-testid="related-section">
            <h2 className="section-title">Related Products</h2>
            <div className="related-grid">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="related-card card"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                  data-testid={`related-product-${relatedProduct.id}`}
                >
                  <img src={relatedProduct.image_url} alt={relatedProduct.name} />
                  <h4>{relatedProduct.name}</h4>
                  <p className="price">NPR {relatedProduct.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import './CategoryPage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CategoryPage = ({ addToCart, user, onOpenAuth }) => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryProducts();
  }, [categoryId]);

  const fetchCategoryProducts = async () => {
    try {
      const [categoryRes, productsRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/products?category_id=${categoryId}`)
      ]);

      const cat = categoryRes.data.find(c => c.id === parseInt(categoryId));
      setCategory(cat);
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error fetching category products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToFavorites = async (productId) => {
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

  const handleAddToCart = (product) => {
    addToCart(product);
    toast.success('Added to cart!');
  };

  if (loading) {
    return <div className="spinner" data-testid="loading-spinner"></div>;
  }

  return (
    <div className="category-page" data-testid="category-page">
      <div className="container">
        <div className="category-header fade-in">
          <h1 className="category-title" data-testid="category-title">{category?.name || 'Products'}</h1>
          <p className="category-count" data-testid="category-count">{products.length} products found</p>
        </div>

        {products.length === 0 ? (
          <p className="no-products" data-testid="no-products">No products in this category</p>
        ) : (
          <div className="products-grid slide-up">
            {products.map((product) => (
              <div key={product.id} className="product-card card" data-testid={`product-card-${product.id}`}>
                <div className="product-image-wrapper" onClick={() => navigate(`/product/${product.id}`)}>
                  <img src={product.image_url} alt={product.name} className="product-image" />
                  <button
                    className="favorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToFavorites(product.id);
                    }}
                    data-testid={`favorite-btn-${product.id}`}
                  >
                    <Heart size={20} />
                  </button>
                </div>
                <div className="product-info">
                  <h3 className="product-name" onClick={() => navigate(`/product/${product.id}`)}>
                    {product.name}
                  </h3>
                  <p className="product-price" data-testid={`product-price-${product.id}`}>NPR {product.price.toFixed(2)}</p>
                  <button
                    className="btn btn-primary add-to-cart-btn"
                    onClick={() => handleAddToCart(product)}
                    data-testid={`add-to-cart-btn-${product.id}`}
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;

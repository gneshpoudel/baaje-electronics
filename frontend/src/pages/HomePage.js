import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, ShoppingCart, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import './HomePage.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = ({ addToCart, user, onOpenAuth }) => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const fetchData = async () => {
    try {
      const [bannersRes, categoriesRes, productsRes] = await Promise.all([
        axios.get(`${API}/banners?active_only=true`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/products`)
      ]);

      setBanners(bannersRes.data);
      setCategories(categoriesRes.data);
      setAllProducts(productsRes.data);
      setFeaturedProducts(productsRes.data.filter(p => p.is_featured));
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
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

  const getFilteredProducts = () => {
    let filtered = allProducts;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'price_low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  };

  if (loading) {
    return <div className="spinner" data-testid="loading-spinner"></div>;
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="home-page" data-testid="home-page">
      {/* Hero Banner */}
      {banners.length > 0 && (
        <section className="hero-section fade-in" data-testid="hero-section">
          <div className="banner-container">
            <div className="banner-slider">
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className={`banner-slide ${index === currentBanner ? 'active' : ''}`}
                  style={{ backgroundImage: `url(${banner.image_url})` }}
                  data-testid={`banner-${index}`}
                >
                  <div className="banner-overlay">
                    <h1 className="banner-title">{banner.title}</h1>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              className="banner-nav prev"
              onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
              data-testid="banner-prev"
            >
              <ChevronLeft size={32} />
            </button>
            <button
              className="banner-nav next"
              onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
              data-testid="banner-next"
            >
              <ChevronRight size={32} />
            </button>

            <div className="banner-dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentBanner ? 'active' : ''}`}
                  onClick={() => setCurrentBanner(index)}
                  data-testid={`banner-dot-${index}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="categories-section container slide-up" data-testid="categories-section">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <div
              key={category.id}
              className="category-card card"
              onClick={() => navigate(`/category/${category.id}`)}
              data-testid={`category-card-${category.id}`}
            >
              <div
                className="category-image"
                style={{ backgroundImage: `url(${category.image_url})` }}
              />
              <h3 className="category-name">{category.name}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Search and Filter */}
      <section className="search-section container" data-testid="search-section">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
            data-testid="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} data-testid="sort-filter">
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-section container" data-testid="featured-section">
          <h2 className="section-title">Featured Products</h2>
          <div className="products-grid">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToFavorites={addToFavorites}
                onNavigate={navigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="products-section container" data-testid="products-section">
        <h2 className="section-title">All Products</h2>
        {filteredProducts.length === 0 ? (
          <p className="no-results" data-testid="no-results">No products found</p>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onAddToFavorites={addToFavorites}
                onNavigate={navigate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart, onAddToFavorites, onNavigate }) => {
  return (
    <div className="product-card card" data-testid={`product-card-${product.id}`}>
      <div className="product-image-wrapper" onClick={() => onNavigate(`/product/${product.id}`)}>
        <img src={product.image_url} alt={product.name} className="product-image" />
        <button
          className="favorite-btn"
          onClick={(e) => {
            e.stopPropagation();
            onAddToFavorites(product.id);
          }}
          data-testid={`favorite-btn-${product.id}`}
        >
          <Heart size={20} />
        </button>
      </div>
      <div className="product-info">
        <h3 className="product-name" onClick={() => onNavigate(`/product/${product.id}`)}>
          {product.name}
        </h3>
        <p className="product-price" data-testid={`product-price-${product.id}`}>NPR {product.price.toFixed(2)}</p>
        <button
          className="btn btn-primary add-to-cart-btn"
          onClick={() => onAddToCart(product)}
          data-testid={`add-to-cart-btn-${product.id}`}
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default HomePage;

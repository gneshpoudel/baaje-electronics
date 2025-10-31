import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Edit2, Trash2, Package, Tag, Image as ImageIcon, FileText, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import './AdminPanel.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [authenticated, setAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      localStorage.setItem('adminToken', response.data.token);
      setAuthenticated(true);
      toast.success('Admin login successful!');
    } catch (error) {
      toast.error('Invalid admin credentials');
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-overlay" onClick={onClose} data-testid="admin-overlay">
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose} data-testid="close-admin">
            <X size={24} />
          </button>
          <div className="admin-login">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin} data-testid="admin-login-form">
              <input
                type="text"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                data-testid="admin-username"
              />
              <input
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                data-testid="admin-password"
              />
              <button type="submit" className="btn btn-primary" data-testid="admin-login-submit">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-overlay" onClick={onClose} data-testid="admin-panel">
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-header">
          <h2>Admin Panel</h2>
          <button className="close-btn" onClick={onClose} data-testid="close-admin-panel">
            <X size={24} />
          </button>
        </div>

        <div className="admin-tabs">
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
            data-testid="tab-products"
          >
            <Package size={20} />
            Products
          </button>
          <button
            className={activeTab === 'categories' ? 'active' : ''}
            onClick={() => setActiveTab('categories')}
            data-testid="tab-categories"
          >
            <Tag size={20} />
            Categories
          </button>
          <button
            className={activeTab === 'banners' ? 'active' : ''}
            onClick={() => setActiveTab('banners')}
            data-testid="tab-banners"
          >
            <ImageIcon size={20} />
            Banners
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
            data-testid="tab-orders"
          >
            <ShoppingBag size={20} />
            Orders
          </button>
          <button
            className={activeTab === 'about' ? 'active' : ''}
            onClick={() => setActiveTab('about')}
            data-testid="tab-about"
          >
            <FileText size={20} />
            About Us
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'products' && <ProductsManager />}
          {activeTab === 'categories' && <CategoriesManager />}
          {activeTab === 'banners' && <BannersManager />}
          {activeTab === 'orders' && <OrdersManager />}
          {activeTab === 'about' && <AboutManager />}
        </div>
      </div>
    </div>
  );
};

// Products Manager
const ProductsManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    stock: '',
    is_featured: false,
    specs: {}
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null
      };

      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product updated!');
      } else {
        await axios.post(`${API}/products`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Product created!');
      }
      
      fetchProducts();
      resetForm();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Product deleted!');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: '',
      image_url: '',
      stock: '',
      is_featured: false,
      specs: {}
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      stock: product.stock,
      is_featured: product.is_featured,
      specs: product.specs || {}
    });
    setShowForm(true);
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>Products ({products.length})</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} data-testid="add-product-btn">
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" data-testid="product-form">
          <input
            type="text"
            placeholder="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="product-name-input"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            data-testid="product-description-input"
          />
          <input
            type="number"
            placeholder="Price (NPR)"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
            step="0.01"
            data-testid="product-price-input"
          />
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            data-testid="product-category-select"
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            data-testid="product-image-input"
          />
          <input
            type="number"
            placeholder="Stock"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
            data-testid="product-stock-input"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              data-testid="product-featured-checkbox"
            />
            Featured Product
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" data-testid="save-product-btn">
              {editingProduct ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list">
        {products.map(product => (
          <div key={product.id} className="item-card" data-testid={`product-item-${product.id}`}>
            <img src={product.image_url} alt={product.name} />
            <div className="item-info">
              <h4>{product.name}</h4>
              <p>NPR {product.price.toFixed(2)} | Stock: {product.stock}</p>
            </div>
            <div className="item-actions">
              <button onClick={() => startEdit(product)} data-testid={`edit-product-${product.id}`}>
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(product.id)} data-testid={`delete-product-${product.id}`}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Categories Manager
const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', image_url: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/categories`);
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    try {
      if (editingCategory) {
        await axios.put(`${API}/categories/${editingCategory.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category updated!');
      } else {
        await axios.post(`${API}/categories`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Category created!');
      }
      
      fetchCategories();
      resetForm();
    } catch (error) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category deleted!');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', image_url: '' });
    setEditingCategory(null);
    setShowForm(false);
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, image_url: category.image_url || '' });
    setShowForm(true);
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>Categories ({categories.length})</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} data-testid="add-category-btn">
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" data-testid="category-form">
          <input
            type="text"
            placeholder="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            data-testid="category-name-input"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            data-testid="category-image-input"
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" data-testid="save-category-btn">
              {editingCategory ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list">
        {categories.map(category => (
          <div key={category.id} className="item-card" data-testid={`category-item-${category.id}`}>
            <img src={category.image_url} alt={category.name} />
            <div className="item-info">
              <h4>{category.name}</h4>
            </div>
            <div className="item-actions">
              <button onClick={() => startEdit(category)} data-testid={`edit-category-${category.id}`}>
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(category.id)} data-testid={`delete-category-${category.id}`}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Banners Manager
const BannersManager = () => {
  const [banners, setBanners] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link: '',
    is_active: true,
    order_index: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${API}/banners`);
      setBanners(response.data);
    } catch (error) {
      toast.error('Failed to fetch banners');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    try {
      const bannerData = {
        ...formData,
        order_index: parseInt(formData.order_index)
      };

      if (editingBanner) {
        await axios.put(`${API}/banners/${editingBanner.id}`, bannerData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Banner updated!');
      } else {
        await axios.post(`${API}/banners`, bannerData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Banner created!');
      }
      
      fetchBanners();
      resetForm();
    } catch (error) {
      toast.error('Failed to save banner');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    
    const token = localStorage.getItem('adminToken');
    try {
      await axios.delete(`${API}/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Banner deleted!');
      fetchBanners();
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      image_url: '',
      link: '',
      is_active: true,
      order_index: 0
    });
    setEditingBanner(null);
    setShowForm(false);
  };

  const startEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link: banner.link || '',
      is_active: banner.is_active,
      order_index: banner.order_index
    });
    setShowForm(true);
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>Banners ({banners.length})</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} data-testid="add-banner-btn">
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form" data-testid="banner-form">
          <input
            type="text"
            placeholder="Banner Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="banner-title-input"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            required
            data-testid="banner-image-input"
          />
          <input
            type="text"
            placeholder="Link (optional)"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            data-testid="banner-link-input"
          />
          <input
            type="number"
            placeholder="Order Index"
            value={formData.order_index}
            onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
            data-testid="banner-order-input"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              data-testid="banner-active-checkbox"
            />
            Active
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" data-testid="save-banner-btn">
              {editingBanner ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="items-list">
        {banners.map(banner => (
          <div key={banner.id} className="item-card" data-testid={`banner-item-${banner.id}`}>
            <img src={banner.image_url} alt={banner.title} />
            <div className="item-info">
              <h4>{banner.title}</h4>
              <p>{banner.is_active ? 'Active' : 'Inactive'}</p>
            </div>
            <div className="item-actions">
              <button onClick={() => startEdit(banner)} data-testid={`edit-banner-${banner.id}`}>
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(banner.id)} data-testid={`delete-banner-${banner.id}`}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Orders Manager
const OrdersManager = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>Orders ({orders.length})</h3>
      </div>

      <div className="orders-admin-list">
        {orders.map(order => (
          <div key={order.id} className="order-admin-card" data-testid={`order-card-${order.id}`}>
            <div className="order-admin-header">
              <div>
                <h4>Order #{order.id}</h4>
                <p>{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <span className="order-status">{order.status}</span>
            </div>
            <div className="order-customer-info">
              <p><strong>Name:</strong> {order.customer_name}</p>
              <p><strong>Email:</strong> {order.customer_email}</p>
              <p><strong>Phone:</strong> {order.customer_phone}</p>
              <p><strong>Location:</strong> {order.customer_location}</p>
            </div>
            <div className="order-items-summary">
              <strong>Items:</strong>
              {order.items.map((item, idx) => (
                <p key={idx}>{item.name} x {item.quantity} - NPR {(item.price * item.quantity).toFixed(2)}</p>
              ))}
            </div>
            <div className="order-total">
              <strong>Total: NPR {order.total_amount.toFixed(2)}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// About Manager
const AboutManager = () => {
  const [about, setAbout] = useState(null);
  const [formData, setFormData] = useState({ content: '', image_url: '' });

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    try {
      const response = await axios.get(`${API}/about`);
      setAbout(response.data);
      setFormData({ content: response.data.content, image_url: response.data.image_url || '' });
    } catch (error) {
      console.error('Failed to fetch about');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    try {
      await axios.put(`${API}/about`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('About Us updated!');
      fetchAbout();
    } catch (error) {
      toast.error('Failed to update About Us');
    }
  };

  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>About Us</h3>
      </div>

      <form onSubmit={handleSubmit} className="admin-form" data-testid="about-form">
        <textarea
          placeholder="About Us Content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          rows="10"
          data-testid="about-content-input"
        />
        <input
          type="text"
          placeholder="Image URL"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          data-testid="about-image-input"
        />
        <button type="submit" className="btn btn-primary" data-testid="save-about-btn">
          Update About Us
        </button>
      </form>
    </div>
  );
};

export default AdminPanel;

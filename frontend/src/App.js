import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import HomePage from '@/pages/HomePage';
import CategoryPage from '@/pages/CategoryPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import FavoritesPage from '@/pages/FavoritesPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AboutPage from '@/pages/AboutPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminPanel from '@/pages/AdminPanel';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import { Toaster } from '@/components/ui/sonner';

function App() {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [cart, setCart] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    // Load user from localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Admin panel shortcut: Ctrl + Alt + A
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        setShowAdmin(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar
          user={user}
          onLogout={handleLogout}
          onOpenAuth={openAuth}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage addToCart={addToCart} user={user} onOpenAuth={openAuth} />} />
            <Route path="/category/:categoryId" element={<CategoryPage addToCart={addToCart} user={user} onOpenAuth={openAuth} />} />
            <Route path="/product/:productId" element={<ProductDetailPage addToCart={addToCart} user={user} onOpenAuth={openAuth} />} />
            <Route path="/favorites" element={user ? <FavoritesPage addToCart={addToCart} user={user} /> : <Navigate to="/" />} />
            <Route path="/cart" element={<CartPage cart={cart} updateQuantity={updateCartQuantity} removeFromCart={removeFromCart} />} />
            <Route path="/checkout" element={<CheckoutPage cart={cart} clearCart={clearCart} user={user} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          </Routes>
        </main>

        <Footer />

        {showAuthModal && (
          <AuthModal
            mode={authMode}
            onClose={() => setShowAuthModal(false)}
            onLogin={handleLogin}
            onSwitchMode={(mode) => setAuthMode(mode)}
          />
        )}

        {showAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}

        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;

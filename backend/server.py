from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import sqlite3
import jwt
import bcrypt
import json
import base64
from contextlib import contextmanager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database setup
DB_PATH = ROOT_DIR / 'baaje_electronics.db'
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Get the port from environment variable for Railway deployment
PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0")

# Database context manager
@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Initialize database
def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                name TEXT NOT NULL,
                profile_picture TEXT,
                auth_provider TEXT DEFAULT 'email',
                created_at TEXT NOT NULL
            )
        ''')
        
        # Categories table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                image_url TEXT,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Products table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category_id INTEGER,
                image_url TEXT,
                specs TEXT,
                stock INTEGER DEFAULT 0,
                is_featured BOOLEAN DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES categories (id)
            )
        ''')
        
        # Banners table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS banners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                image_url TEXT NOT NULL,
                link TEXT,
                is_active BOOLEAN DEFAULT 1,
                order_index INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        ''')
        
        # Orders table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_email TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                customer_location TEXT NOT NULL,
                items TEXT NOT NULL,
                total_amount REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Favorites table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (product_id) REFERENCES products (id),
                UNIQUE(user_id, product_id)
            )
        ''')
        
        # About Us table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS about_us (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                image_url TEXT,
                updated_at TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        
        # Add sample data
        cursor.execute('SELECT COUNT(*) as count FROM categories')
        if cursor.fetchone()['count'] == 0:
            # Sample categories
            categories = [
                ('Fans', 'https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400'),
                ('Lights', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400'),
                ('Heaters', 'https://images.unsplash.com/photo-1545259742-25a6d78aeffc?w=400'),
                ('Wires & Cables', 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=400'),
                ('Switches', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
                ('Home Appliances', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400')
            ]
            now = datetime.now(timezone.utc).isoformat()
            cursor.executemany('INSERT INTO categories (name, image_url, created_at) VALUES (?, ?, ?)',
                             [(cat[0], cat[1], now) for cat in categories])
            
            # Sample products
            products = [
                ('Ceiling Fan Deluxe', 'High-speed ceiling fan with remote control', 4500.0, 1, 'https://images.unsplash.com/photo-1607400201515-c2c41c07e14c?w=600', '{"Speed": "3 levels", "Size": "48 inch", "Warranty": "2 years"}', 25, 1),
                ('Table Fan Pro', 'Portable table fan with oscillation', 2200.0, 1, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', '{"Speed": "3 levels", "Size": "16 inch", "Warranty": "1 year"}', 40, 1),
                ('LED Bulb 12W', 'Energy efficient LED bulb', 350.0, 2, 'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=600', '{"Power": "12W", "Color": "Cool White", "Warranty": "1 year"}', 100, 0),
                ('Smart LED Strip', 'RGB LED strip with app control', 1800.0, 2, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600', '{"Length": "5 meters", "Control": "App & Remote", "Warranty": "1 year"}', 30, 1),
                ('Room Heater 2000W', 'Powerful room heater for winter', 6500.0, 3, 'https://images.unsplash.com/photo-1545259742-25a6d78aeffc?w=600', '{"Power": "2000W", "Features": "Auto shutoff", "Warranty": "2 years"}', 15, 1),
                ('Oil Heater', 'Silent oil-filled heater', 8900.0, 3, 'https://images.unsplash.com/photo-1603893185127-4cc0e48d2b0a?w=600', '{"Power": "2500W", "Features": "Silent operation", "Warranty": "2 years"}', 10, 0),
                ('Copper Wire 2.5mm', 'Premium quality copper wire', 850.0, 4, 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=600', '{"Size": "2.5mm", "Length": "90 meters", "Material": "Pure Copper"}', 50, 0),
                ('HDMI Cable 2m', 'High-speed HDMI cable', 450.0, 4, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', '{"Length": "2 meters", "Version": "HDMI 2.0", "Warranty": "6 months"}', 80, 0),
                ('Modular Switch White', '2-way modular switch', 280.0, 5, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', '{"Type": "2-way", "Color": "White", "Warranty": "1 year"}', 150, 0),
                ('Smart Switch', 'WiFi enabled smart switch', 1200.0, 5, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', '{"Type": "Smart WiFi", "Control": "App & Voice", "Warranty": "1 year"}', 35, 1),
                ('Microwave Oven', '20L microwave oven', 9500.0, 6, 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600', '{"Capacity": "20L", "Power": "800W", "Warranty": "1 year"}', 12, 1),
                ('Electric Kettle', '1.8L electric kettle', 1800.0, 6, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600', '{"Capacity": "1.8L", "Material": "Stainless Steel", "Warranty": "1 year"}', 45, 0)
            ]
            
            cursor.executemany(
                'INSERT INTO products (name, description, price, category_id, image_url, specs, stock, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], now) for p in products]
            )
            
            # Sample banners
            banners = [
                ('Winter Sale - Up to 50% Off!', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200', None, 1, 0),
                ('New Arrivals - Smart Home Devices', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200', None, 1, 1),
                ('Premium Fans - Beat the Heat', 'https://images.unsplash.com/photo-1607400201515-c2c41c07e14c?w=1200', None, 1, 2)
            ]
            cursor.executemany(
                'INSERT INTO banners (title, image_url, link, is_active, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)',
                [(b[0], b[1], b[2], b[3], b[4], now) for b in banners]
            )
            
            # Sample About Us
            about_content = '''Baaje Electronics has been serving Buddhanagar, Kathmandu since 2010. We are your trusted partner for all electronics needs, offering quality products at competitive prices. Our commitment to customer satisfaction and after-sales service has made us a household name in the community.'''
            cursor.execute(
                'INSERT INTO about_us (content, image_url, updated_at) VALUES (?, ?, ?)',
                (about_content, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800', now)
            )
            
            conn.commit()

# Pydantic Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    email: str
    name: str
    profile_picture: Optional[str] = None
    auth_provider: str = 'email'

class Product(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    category_id: Optional[int]
    image_url: Optional[str]
    specs: Optional[dict] = None
    stock: int
    is_featured: bool
    created_at: str

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category_id: Optional[int] = None
    image_url: Optional[str] = None
    specs: Optional[dict] = None
    stock: int = 0
    is_featured: bool = False

class Category(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    image_url: Optional[str] = None

class Banner(BaseModel):
    id: int
    title: str
    image_url: str
    link: Optional[str]
    is_active: bool
    order_index: int
    created_at: str

class BannerCreate(BaseModel):
    title: str
    image_url: str
    link: Optional[str] = None
    is_active: bool = True
    order_index: int = 0

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    customer_location: str
    items: List[dict]
    total_amount: float

class Order(BaseModel):
    id: int
    user_id: Optional[int]
    customer_name: str
    customer_email: str
    customer_phone: str
    customer_location: str
    items: List[dict]
    total_amount: float
    status: str
    created_at: str

class AboutUs(BaseModel):
    id: int
    content: str
    image_url: Optional[str]
    updated_at: str

class AboutUsUpdate(BaseModel):
    content: str
    image_url: Optional[str] = None

# Helper functions
def create_token(user_id: int, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Invalid token')

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_token(credentials)
    # Simple admin check - in production, add admin field to users table
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT email FROM users WHERE id = ?', (payload['user_id'],))
        user = cursor.fetchone()
        if user and user['email'] == 'admin@baajeelectronics.com':
            return payload
    raise HTTPException(status_code=403, detail='Admin access required')

# Auth Routes
@api_router.post('/auth/signup')
async def signup(user: UserSignup):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id FROM users WHERE email = ?', (user.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail='Email already registered')
        
        password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        now = datetime.now(timezone.utc).isoformat()
        
        cursor.execute(
            'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)',
            (user.email, password_hash, user.name, now)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        token = create_token(user_id, user.email)
        return {'token': token, 'user': {'id': user_id, 'email': user.email, 'name': user.name}}

@api_router.post('/auth/login')
async def login(user: UserLogin):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE email = ?', (user.email,))
        db_user = cursor.fetchone()
        
        if not db_user:
            raise HTTPException(status_code=401, detail='Invalid credentials')
        
        if not bcrypt.checkpw(user.password.encode('utf-8'), db_user['password_hash'].encode('utf-8')):
            raise HTTPException(status_code=401, detail='Invalid credentials')
        
        token = create_token(db_user['id'], db_user['email'])
        return {
            'token': token,
            'user': {
                'id': db_user['id'],
                'email': db_user['email'],
                'name': db_user['name'],
                'profile_picture': db_user['profile_picture'],
                'auth_provider': db_user['auth_provider']
            }
        }

@api_router.get('/auth/me')
async def get_current_user(payload = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, email, name, profile_picture, auth_provider FROM users WHERE id = ?',
                      (payload['user_id'],))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail='User not found')
        return dict(user)

# Admin login
@api_router.post('/admin/login')
async def admin_login(credentials: dict):
    username = credentials.get('username')
    password = credentials.get('password')
    
    if username == 'admin' and password == 'admin123':
        # Create or get admin user
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM users WHERE email = ?', ('admin@baajeelectronics.com',))
            admin_user = cursor.fetchone()
            
            if not admin_user:
                password_hash = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                now = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    'INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)',
                    ('admin@baajeelectronics.com', password_hash, 'Admin', now)
                )
                conn.commit()
                user_id = cursor.lastrowid
            else:
                user_id = admin_user['id']
            
            token = create_token(user_id, 'admin@baajeelectronics.com')
            return {'token': token, 'user': {'id': user_id, 'email': 'admin@baajeelectronics.com', 'name': 'Admin'}}
    
    raise HTTPException(status_code=401, detail='Invalid admin credentials')

# Product Routes
@api_router.get('/products', response_model=List[Product])
async def get_products(category_id: Optional[int] = None, featured: Optional[bool] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        query = 'SELECT * FROM products WHERE 1=1'
        params = []
        
        if category_id:
            query += ' AND category_id = ?'
            params.append(category_id)
        if featured is not None:
            query += ' AND is_featured = ?'
            params.append(1 if featured else 0)
        
        query += ' ORDER BY created_at DESC'
        cursor.execute(query, params)
        products = [dict(row) for row in cursor.fetchall()]
        
        # Parse specs JSON
        for p in products:
            if p['specs']:
                p['specs'] = json.loads(p['specs'])
        
        return products

@api_router.get('/products/{product_id}', response_model=Product)
async def get_product(product_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
        product = cursor.fetchone()
        
        if not product:
            raise HTTPException(status_code=404, detail='Product not found')
        
        product_dict = dict(product)
        if product_dict['specs']:
            product_dict['specs'] = json.loads(product_dict['specs'])
        
        return product_dict

@api_router.post('/products')
async def create_product(product: ProductCreate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        specs_json = json.dumps(product.specs) if product.specs else None
        
        cursor.execute(
            '''INSERT INTO products (name, description, price, category_id, image_url, specs, stock, is_featured, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (product.name, product.description, product.price, product.category_id,
             product.image_url, specs_json, product.stock, product.is_featured, now)
        )
        conn.commit()
        return {'id': cursor.lastrowid, 'message': 'Product created'}

@api_router.put('/products/{product_id}')
async def update_product(product_id: int, product: ProductCreate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        specs_json = json.dumps(product.specs) if product.specs else None
        
        cursor.execute(
            '''UPDATE products SET name=?, description=?, price=?, category_id=?, image_url=?, specs=?, stock=?, is_featured=?
               WHERE id=?''',
            (product.name, product.description, product.price, product.category_id,
             product.image_url, specs_json, product.stock, product.is_featured, product_id)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Product not found')
        
        return {'message': 'Product updated'}

@api_router.delete('/products/{product_id}')
async def delete_product(product_id: int, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Product not found')
        
        return {'message': 'Product deleted'}

# Category Routes
@api_router.get('/categories', response_model=List[Category])
async def get_categories():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM categories ORDER BY name')
        return [dict(row) for row in cursor.fetchall()]

@api_router.post('/categories')
async def create_category(category: CategoryCreate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            'INSERT INTO categories (name, image_url, created_at) VALUES (?, ?, ?)',
            (category.name, category.image_url, now)
        )
        conn.commit()
        return {'id': cursor.lastrowid, 'message': 'Category created'}

@api_router.put('/categories/{category_id}')
async def update_category(category_id: int, category: CategoryCreate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE categories SET name=?, image_url=? WHERE id=?',
            (category.name, category.image_url, category_id)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Category not found')
        
        return {'message': 'Category updated'}

@api_router.delete('/categories/{category_id}')
async def delete_category(category_id: int, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM categories WHERE id = ?', (category_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Category not found')
        
        return {'message': 'Category deleted'}

# Banner Routes
@api_router.get('/banners', response_model=List[Banner])
async def get_banners(active_only: bool = False):
    with get_db() as conn:
        cursor = conn.cursor()
        query = 'SELECT * FROM banners'
        if active_only:
            query += ' WHERE is_active = 1'
        query += ' ORDER BY order_index'
        cursor.execute(query)
        return [dict(row) for row in cursor.fetchall()]

@api_router.post('/banners')
async def create_banner(banner: BannerCreate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        cursor.execute(
            'INSERT INTO banners (title, image_url, link, is_active, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            (banner.title, banner.image_url, banner.link, banner.is_active, banner.order_index, now)
        )
        conn.commit()
        return {'id': cursor.lastrowid, 'message': 'Banner created'}

@api_router.put('/banners/{banner_id}')
async def update_banner(banner_id: int, banner: BannerCreate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'UPDATE banners SET title=?, image_url=?, link=?, is_active=?, order_index=? WHERE id=?',
            (banner.title, banner.image_url, banner.link, banner.is_active, banner.order_index, banner_id)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Banner not found')
        
        return {'message': 'Banner updated'}

@api_router.delete('/banners/{banner_id}')
async def delete_banner(banner_id: int, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM banners WHERE id = ?', (banner_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Banner not found')
        
        return {'message': 'Banner deleted'}

# Order Routes
@api_router.post('/orders')
async def create_order(order: OrderCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        items_json = json.dumps(order.items)
        
        cursor.execute(
            '''INSERT INTO orders (customer_name, customer_email, customer_phone, customer_location, items, total_amount, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)''',
            (order.customer_name, order.customer_email, order.customer_phone,
             order.customer_location, items_json, order.total_amount, now)
        )
        conn.commit()
        order_id = cursor.lastrowid
        
        return {'id': order_id, 'message': 'Order created successfully'}

@api_router.get('/orders', response_model=List[Order])
async def get_orders(payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM orders ORDER BY created_at DESC')
        orders = [dict(row) for row in cursor.fetchall()]
        
        for order in orders:
            order['items'] = json.loads(order['items'])
        
        return orders

@api_router.get('/orders/user')
async def get_user_orders(payload = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'SELECT * FROM orders WHERE customer_email = (SELECT email FROM users WHERE id = ?) ORDER BY created_at DESC',
            (payload['user_id'],)
        )
        orders = [dict(row) for row in cursor.fetchall()]
        
        for order in orders:
            order['items'] = json.loads(order['items'])
        
        return orders

# Favorites Routes
@api_router.get('/favorites')
async def get_favorites(payload = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''SELECT p.* FROM products p
               JOIN favorites f ON p.id = f.product_id
               WHERE f.user_id = ?
               ORDER BY f.created_at DESC''',
            (payload['user_id'],)
        )
        products = [dict(row) for row in cursor.fetchall()]
        
        for p in products:
            if p['specs']:
                p['specs'] = json.loads(p['specs'])
        
        return products

@api_router.post('/favorites/{product_id}')
async def add_favorite(product_id: int, payload = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            cursor.execute(
                'INSERT INTO favorites (user_id, product_id, created_at) VALUES (?, ?, ?)',
                (payload['user_id'], product_id, now)
            )
            conn.commit()
            return {'message': 'Added to favorites'}
        except sqlite3.IntegrityError:
            raise HTTPException(status_code=400, detail='Already in favorites')

@api_router.delete('/favorites/{product_id}')
async def remove_favorite(product_id: int, payload = Depends(verify_token)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
            (payload['user_id'], product_id)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Favorite not found')
        
        return {'message': 'Removed from favorites'}

# About Us Routes
@api_router.get('/about', response_model=AboutUs)
async def get_about():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM about_us ORDER BY id DESC LIMIT 1')
        about = cursor.fetchone()
        
        if not about:
            raise HTTPException(status_code=404, detail='About content not found')
        
        return dict(about)

@api_router.put('/about')
async def update_about(about: AboutUsUpdate, payload = Depends(verify_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()
        
        cursor.execute('SELECT id FROM about_us LIMIT 1')
        existing = cursor.fetchone()
        
        if existing:
            cursor.execute(
                'UPDATE about_us SET content=?, image_url=?, updated_at=? WHERE id=?',
                (about.content, about.image_url, now, existing['id'])
            )
        else:
            cursor.execute(
                'INSERT INTO about_us (content, image_url, updated_at) VALUES (?, ?, ?)',
                (about.content, about.image_url, now)
            )
        
        conn.commit()
        return {'message': 'About Us updated'}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Initialize database on startup
@app.on_event('startup')
async def startup():
    init_db()
    logging.info('Database initialized')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host=HOST, port=PORT, reload=False)

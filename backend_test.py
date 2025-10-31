#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class BaajeElectronicsAPITester:
    def __init__(self, base_url="https://electronic-shop-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.user_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": name,
            "status": "PASS" if success else "FAIL",
            "details": details
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success and response.content:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                    self.log_test(name, True, details)
                    return True, response_data
                except:
                    self.log_test(name, True, details)
                    return True, {}
            elif success:
                self.log_test(name, True, details)
                return True, {}
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Error: {response.text[:100]}"
                self.log_test(name, False, details)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_auth(self):
        """Test user authentication"""
        print("\n🔐 Testing User Authentication...")
        
        # Test user signup
        test_user_data = {
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "name": "Test User"
        }
        
        success, response = self.run_test(
            "User Signup",
            "POST",
            "/auth/signup",
            200,
            data=test_user_data
        )
        
        if success and 'token' in response:
            self.user_token = response['token']
            
            # Test user login
            login_data = {
                "email": test_user_data["email"],
                "password": test_user_data["password"]
            }
            
            success, response = self.run_test(
                "User Login",
                "POST",
                "/auth/login",
                200,
                data=login_data
            )
            
            if success and 'token' in response:
                # Test get current user
                self.run_test(
                    "Get Current User",
                    "GET",
                    "/auth/me",
                    200,
                    headers={"Authorization": f"Bearer {self.user_token}"}
                )
        
        return self.user_token is not None

    def test_admin_auth(self):
        """Test admin authentication"""
        print("\n👑 Testing Admin Authentication...")
        
        admin_credentials = {
            "username": "admin",
            "password": "admin123"
        }
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/admin/login",
            200,
            data=admin_credentials
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
        
        return self.admin_token is not None

    def test_products_api(self):
        """Test products API"""
        print("\n📦 Testing Products API...")
        
        # Get all products
        self.run_test(
            "Get All Products",
            "GET",
            "/products",
            200
        )
        
        # Get featured products
        self.run_test(
            "Get Featured Products",
            "GET",
            "/products?featured=true",
            200
        )
        
        # Get specific product
        self.run_test(
            "Get Product by ID",
            "GET",
            "/products/1",
            200
        )
        
        # Test product creation (admin required)
        if self.admin_token:
            test_product = {
                "name": "Test Product",
                "description": "Test Description",
                "price": 999.99,
                "category_id": 1,
                "image_url": "https://example.com/test.jpg",
                "stock": 10,
                "is_featured": False,
                "specs": {"test": "value"}
            }
            
            self.run_test(
                "Create Product (Admin)",
                "POST",
                "/products",
                200,
                data=test_product,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )

    def test_categories_api(self):
        """Test categories API"""
        print("\n🏷️ Testing Categories API...")
        
        # Get all categories
        self.run_test(
            "Get All Categories",
            "GET",
            "/categories",
            200
        )
        
        # Test category creation (admin required)
        if self.admin_token:
            test_category = {
                "name": "Test Category",
                "image_url": "https://example.com/test-cat.jpg"
            }
            
            self.run_test(
                "Create Category (Admin)",
                "POST",
                "/categories",
                200,
                data=test_category,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )

    def test_banners_api(self):
        """Test banners API"""
        print("\n🖼️ Testing Banners API...")
        
        # Get all banners
        self.run_test(
            "Get All Banners",
            "GET",
            "/banners",
            200
        )
        
        # Get active banners only
        self.run_test(
            "Get Active Banners",
            "GET",
            "/banners?active_only=true",
            200
        )

    def test_orders_api(self):
        """Test orders API"""
        print("\n🛒 Testing Orders API...")
        
        # Test order creation
        test_order = {
            "customer_name": "Test Customer",
            "customer_email": "test@example.com",
            "customer_phone": "9812345678",
            "customer_location": "Test Location, Kathmandu",
            "items": [
                {
                    "id": 1,
                    "name": "Test Product",
                    "price": 100.0,
                    "quantity": 2
                }
            ],
            "total_amount": 200.0
        }
        
        self.run_test(
            "Create Order",
            "POST",
            "/orders",
            200,
            data=test_order
        )
        
        # Test get orders (admin required)
        if self.admin_token:
            self.run_test(
                "Get All Orders (Admin)",
                "GET",
                "/orders",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )
        
        # Test get user orders (user required)
        if self.user_token:
            self.run_test(
                "Get User Orders",
                "GET",
                "/orders/user",
                200,
                headers={"Authorization": f"Bearer {self.user_token}"}
            )

    def test_favorites_api(self):
        """Test favorites API"""
        print("\n❤️ Testing Favorites API...")
        
        if self.user_token:
            # Get user favorites
            self.run_test(
                "Get User Favorites",
                "GET",
                "/favorites",
                200,
                headers={"Authorization": f"Bearer {self.user_token}"}
            )
            
            # Add to favorites
            self.run_test(
                "Add to Favorites",
                "POST",
                "/favorites/1",
                200,
                headers={"Authorization": f"Bearer {self.user_token}"}
            )
            
            # Remove from favorites
            self.run_test(
                "Remove from Favorites",
                "DELETE",
                "/favorites/1",
                200,
                headers={"Authorization": f"Bearer {self.user_token}"}
            )

    def test_about_api(self):
        """Test about API"""
        print("\n📄 Testing About API...")
        
        # Get about content
        self.run_test(
            "Get About Content",
            "GET",
            "/about",
            200
        )
        
        # Update about content (admin required)
        if self.admin_token:
            test_about = {
                "content": "Updated test content for Baaje Electronics",
                "image_url": "https://example.com/about.jpg"
            }
            
            self.run_test(
                "Update About Content (Admin)",
                "PUT",
                "/about",
                200,
                data=test_about,
                headers={"Authorization": f"Bearer {self.admin_token}"}
            )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Baaje Electronics API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        # Test authentication first
        user_auth_success = self.test_user_auth()
        admin_auth_success = self.test_admin_auth()
        
        # Test all APIs
        self.test_products_api()
        self.test_categories_api()
        self.test_banners_api()
        self.test_orders_api()
        self.test_favorites_api()
        self.test_about_api()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if user_auth_success:
            print("✅ User Authentication: Working")
        else:
            print("❌ User Authentication: Failed")
            
        if admin_auth_success:
            print("✅ Admin Authentication: Working")
        else:
            print("❌ Admin Authentication: Failed")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BaajeElectronicsAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'failed_tests': tester.tests_run - tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
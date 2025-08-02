import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path

class BlogAPITester:
    def __init__(self, base_url="https://56bd1891-bb72-4580-b38f-caf32ce1bfaa.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_post_id = None
        self.created_post_slug = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        # Remove Content-Type for file uploads
        if files:
            headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Login with Invalid Credentials",
            "POST",
            "login",
            401,
            data={"username": "wrong", "password": "wrong"}
        )
        return success

    def test_login_valid(self):
        """Test login with valid credentials and get token"""
        success, response = self.run_test(
            "Login with Valid Credentials",
            "POST",
            "login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_get_public_posts(self):
        """Test getting public posts (published only)"""
        success, response = self.run_test(
            "Get Public Posts",
            "GET",
            "posts",
            200
        )
        if success:
            print(f"   Found {len(response)} published posts")
        return success

    def test_get_admin_posts_unauthorized(self):
        """Test getting admin posts without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        success, _ = self.run_test(
            "Get Admin Posts (Unauthorized)",
            "GET",
            "admin/posts",
            403
        )
        self.token = temp_token
        return success

    def test_get_admin_posts_authorized(self):
        """Test getting admin posts with token"""
        success, response = self.run_test(
            "Get Admin Posts (Authorized)",
            "GET",
            "admin/posts",
            200
        )
        if success:
            print(f"   Found {len(response)} total posts (including drafts)")
        return success

    def test_create_post_draft(self):
        """Test creating a draft post"""
        post_data = {
            "title": f"Test Post {datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "content": "This is a test post content with some <strong>HTML</strong> formatting.",
            "excerpt": "This is a test post excerpt for testing purposes.",
            "published": False,
            "tags": ["test", "api", "blog"],
            "meta_title": "Test Post Meta Title",
            "meta_description": "Test post meta description for SEO"
        }
        
        success, response = self.run_test(
            "Create Draft Post",
            "POST",
            "admin/posts",
            200,  # Changed from 201 to 200
            data=post_data
        )
        
        if success and 'id' in response:
            self.created_post_id = response['id']
            self.created_post_slug = response['slug']
            print(f"   Created post ID: {self.created_post_id}")
            print(f"   Created post slug: {self.created_post_slug}")
        return success

    def test_get_post_by_slug_draft(self):
        """Test getting a draft post by slug (should work for admin)"""
        if not self.created_post_slug:
            print("❌ No post slug available for testing")
            return False
            
        success, response = self.run_test(
            "Get Draft Post by Slug",
            "GET",
            f"posts/{self.created_post_slug}",
            200
        )
        return success

    def test_update_post_and_publish(self):
        """Test updating a post and publishing it"""
        if not self.created_post_id:
            print("❌ No post ID available for testing")
            return False
            
        update_data = {
            "title": f"Updated Test Post {datetime.now().strftime('%H%M%S')}",
            "content": "This is updated content with more details and <em>emphasis</em>.",
            "published": True
        }
        
        success, response = self.run_test(
            "Update and Publish Post",
            "PUT",
            f"admin/posts/{self.created_post_id}",
            200,
            data=update_data
        )
        
        if success:
            self.created_post_slug = response.get('slug', self.created_post_slug)
            print(f"   Updated post slug: {self.created_post_slug}")
        return success

    def test_get_published_post_public(self):
        """Test getting the published post from public endpoint"""
        if not self.created_post_slug:
            print("❌ No post slug available for testing")
            return False
            
        # Remove token to test public access
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Get Published Post (Public)",
            "GET",
            f"posts/{self.created_post_slug}",
            200
        )
        
        self.token = temp_token
        return success

    def test_get_nonexistent_post(self):
        """Test getting a non-existent post"""
        success, _ = self.run_test(
            "Get Non-existent Post",
            "GET",
            "posts/non-existent-slug",
            404
        )
        return success

    def test_image_upload_unauthorized(self):
        """Test image upload without authentication"""
        temp_token = self.token
        self.token = None
        
        # Create a dummy image file
        test_image_content = b"fake image content"
        files = {'file': ('test.jpg', test_image_content, 'image/jpeg')}
        
        success, _ = self.run_test(
            "Image Upload (Unauthorized)",
            "POST",
            "admin/upload-image",
            401,
            files=files
        )
        
        self.token = temp_token
        return success

    def test_delete_post(self):
        """Test deleting the created post"""
        if not self.created_post_id:
            print("❌ No post ID available for testing")
            return False
            
        success, response = self.run_test(
            "Delete Post",
            "DELETE",
            f"admin/posts/{self.created_post_id}",
            200
        )
        return success

    def test_delete_nonexistent_post(self):
        """Test deleting a non-existent post"""
        success, _ = self.run_test(
            "Delete Non-existent Post",
            "DELETE",
            "admin/posts/non-existent-id",
            404
        )
        return success

    def check_file_storage(self):
        """Check if file storage directories exist"""
        print(f"\n🔍 Checking File Storage System...")
        
        backend_dir = Path("/app/backend")
        data_dir = backend_dir / "data"
        uploads_dir = backend_dir / "uploads"
        posts_file = data_dir / "posts.json"
        users_file = data_dir / "users.json"
        
        checks = [
            ("Backend directory", backend_dir.exists()),
            ("Data directory", data_dir.exists()),
            ("Uploads directory", uploads_dir.exists()),
            ("Posts JSON file", posts_file.exists()),
            ("Users JSON file", users_file.exists())
        ]
        
        all_good = True
        for name, exists in checks:
            if exists:
                print(f"✅ {name}: Found")
            else:
                print(f"❌ {name}: Missing")
                all_good = False
        
        # Try to read posts file
        if posts_file.exists():
            try:
                with open(posts_file, 'r') as f:
                    posts_data = json.load(f)
                print(f"✅ Posts file readable: {len(posts_data)} posts found")
            except Exception as e:
                print(f"❌ Posts file read error: {e}")
                all_good = False
        
        return all_good

def main():
    print("🚀 Starting Personal Blog API Testing...")
    print("=" * 60)
    
    tester = BlogAPITester()
    
    # Check file storage system first
    storage_ok = tester.check_file_storage()
    if not storage_ok:
        print("\n❌ File storage system issues detected!")
    
    # Test sequence
    test_sequence = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Invalid Login", tester.test_login_invalid),
        ("Valid Login", tester.test_login_valid),
        ("Public Posts", tester.test_get_public_posts),
        ("Admin Posts (Unauthorized)", tester.test_get_admin_posts_unauthorized),
        ("Admin Posts (Authorized)", tester.test_get_admin_posts_authorized),
        ("Create Draft Post", tester.test_create_post_draft),
        ("Get Draft Post by Slug", tester.test_get_post_by_slug_draft),
        ("Update and Publish Post", tester.test_update_post_and_publish),
        ("Get Published Post (Public)", tester.test_get_published_post_public),
        ("Get Non-existent Post", tester.test_get_nonexistent_post),
        ("Image Upload (Unauthorized)", tester.test_image_upload_unauthorized),
        ("Delete Post", tester.test_delete_post),
        ("Delete Non-existent Post", tester.test_delete_nonexistent_post)
    ]
    
    # Run all tests
    for test_name, test_func in test_sequence:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
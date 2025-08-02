import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = React.createContext();

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/login`, { username, password });
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('token', access_token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Header Component
const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
            My Personal Blog
          </Link>
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
            <Link to="/blog" className="text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="text-blue-600 hover:text-blue-800 transition-colors">Admin</Link>
                <button 
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="text-blue-600 hover:text-blue-800 transition-colors">Login</Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

// Footer Component  
const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          <p>&copy; 2025 My Personal Blog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// Home Page
const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data.slice(0, 3)); // Show only 3 latest posts
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to My Blog
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Discover insights, stories, and thoughts on technology, life, and everything in between.
        </p>
        <Link 
          to="/blog"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Explore All Posts
        </Link>
      </section>

      {/* Featured Posts Section */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No posts available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                {post.featured_image && (
                  <img 
                    src={post.featured_image.startsWith('http') ? post.featured_image : `${BACKEND_URL}${post.featured_image}`}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    {post.tags.length > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{post.tags[0]}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                  >
                    Read More →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// Blog Listing Page with Search and Filter
const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedTag]);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API}/tags`);
      setAllTags(response.data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const filterPosts = () => {
    let filtered = [...posts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(post =>
        post.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200">{part}</mark>
      ) : (
        part
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">All Blog Posts</h1>
      
      {/* Search and Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Posts
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search by title, content, or excerpt..."
            />
          </div>

          {/* Tag Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tag
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!searchQuery && !selectedTag}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Filter Results Info */}
        <div className="mt-4 text-sm text-gray-600">
          {searchQuery || selectedTag ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Showing {filteredPosts.length} of {posts.length} posts</span>
              {searchQuery && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedTag && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Tag: {selectedTag}
                </span>
              )}
            </div>
          ) : (
            <span>Showing all {posts.length} posts</span>
          )}
        </div>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-600 bg-white rounded-xl border">
          {searchQuery || selectedTag ? (
            <div>
              <p className="text-lg mb-2">No posts found matching your criteria.</p>
              <p>Try adjusting your search or filter options.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <p>No posts available yet. Check back soon!</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-sm border p-8 hover:shadow-md transition-shadow">
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>By {post.author}</span>
                {post.tags.length > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <div className="flex space-x-2">
                      {post.tags.map((tag, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTag(tag)}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            selectedTag === tag
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 hover:text-blue-600 transition-colors">
                <Link to={`/blog/${post.slug}`}>
                  {searchQuery ? highlightText(post.title, searchQuery) : post.title}
                </Link>
              </h2>
              <p className="text-gray-600 mb-6">
                {searchQuery ? highlightText(post.excerpt, searchQuery) : post.excerpt}
              </p>
              <Link 
                to={`/blog/${post.slug}`}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Read Full Post
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

// Individual Blog Post Page
const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API}/posts/${slug}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Post not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The post you're looking for doesn't exist.</p>
          <Link to="/blog" className="text-blue-600 hover:text-blue-800">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/blog" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Blog
        </Link>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>By {post.author}</span>
          {post.tags.length > 0 && (
            <>
              <span className="mx-2">•</span>
              <div className="flex space-x-2">
                {post.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-6">{post.title}</h1>
        {post.featured_image && (
          <img 
            src={`${BACKEND_URL}${post.featured_image}`}
            alt={post.title}
            className="w-full h-64 object-cover rounded-xl mb-8"
          />
        )}
      </div>
      
      <div className="prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </article>
  );
};

// Login Page
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const success = await login(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Admin Login</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Default credentials: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Blog Post Editor Component
const BlogPostEditor = ({ isEdit = false, postId = null }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && postId) {
      fetchPost();
    }
  }, [isEdit, postId]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`${API}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const post = response.data.find(p => p.id === postId);
      if (post) {
        setTitle(post.title);
        setContent(post.content);
        setExcerpt(post.excerpt);
        setTags(post.tags.join(', '));
        setMetaTitle(post.meta_title || '');
        setMetaDescription(post.meta_description || '');
        setPublished(post.published);
        setFeaturedImage(post.featured_image || '');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/admin/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFeaturedImage(response.data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageUrl = async () => {
    if (!imageUrl.trim()) return;

    setImageUploading(true);
    try {
      const response = await axios.post(`${API}/admin/save-image-url`, 
        { image_url: imageUrl }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setFeaturedImage(response.data.url);
      setImageUrl('');
    } catch (error) {
      console.error('Error saving image URL:', error);
      alert('Failed to save image URL. Please check the URL and try again.');
    } finally {
      setImageUploading(false);
    }
  };

  const insertFormatting = (before, after = '') => {
    const textarea = document.getElementById('content-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const beforeText = content.substring(0, start);
    const afterText = content.substring(end);
    
    const newContent = beforeText + before + selectedText + after + afterText;
    setContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length, 
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleSubmit = async (e, shouldPublish = false) => {
    e.preventDefault();
    setLoading(true);

    const postData = {
      title,
      content,
      excerpt,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      published: shouldPublish || published,
      featured_image: featuredImage || null
    };

    try {
      if (isEdit) {
        await axios.put(`${API}/admin/posts/${postId}`, postData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/admin/posts`, postData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link to="/admin" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-gray-900">
          {isEdit ? 'Edit Post' : 'Create New Post'}
        </h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Content</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="Enter your blog post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt *
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                required
                placeholder="Brief description of your post"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content * 
                <span className="text-sm text-gray-500 ml-2">
                  Use the formatting buttons below to add HTML formatting
                </span>
              </label>
              
              {/* Rich Text Formatting Toolbar */}
              <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-50 rounded-lg border">
                <button
                  type="button"
                  onClick={() => insertFormatting('<h2>', '</h2>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<h3>', '</h3>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Heading 3"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<strong>', '</strong>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<em>', '</em>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm italic"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<a href="">', '</a>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Link"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<ul>\n<li>', '</li>\n</ul>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<ol>\n<li>', '</li>\n</ol>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Numbered List"
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<blockquote>', '</blockquote>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Quote"
                >
                  Quote
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<code>', '</code>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
                  title="Inline Code"
                >
                  Code
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<pre><code>', '</code></pre>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Code Block"
                >
                  Code Block
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<br>')}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  title="Line Break"
                >
                  Break
                </button>
              </div>

              <textarea
                id="content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows="12"
                required
                placeholder="Write your blog post content here. Use the formatting buttons above or add HTML tags manually."
              />
              
              <div className="mt-2 text-xs text-gray-500">
                Preview: Your content will be rendered with HTML formatting on the blog post page.
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image
              </label>
              
              {/* Image Upload Mode Selector */}
              <div className="flex space-x-4 mb-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="file"
                    checked={uploadMode === 'file'}
                    onChange={(e) => setUploadMode(e.target.value)}
                    className="mr-2"
                  />
                  Upload File
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="url"
                    checked={uploadMode === 'url'}
                    onChange={(e) => setUploadMode(e.target.value)}
                    className="mr-2"
                  />
                  Use URL
                </label>
              </div>

              <div className="space-y-2">
                {uploadMode === 'file' ? (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={imageUploading}
                  />
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={imageUploading}
                    />
                    <button
                      type="button"
                      onClick={handleImageUrl}
                      disabled={imageUploading || !imageUrl.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Add URL
                    </button>
                  </div>
                )}
                
                {imageUploading && <p className="text-sm text-gray-500">Processing image...</p>}
                {featuredImage && (
                  <div className="mt-2">
                    <img 
                      src={featuredImage.startsWith('http') ? featuredImage : `${BACKEND_URL}${featuredImage}`} 
                      alt="Featured" 
                      className="w-32 h-32 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="mt-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter tags separated by commas (e.g., technology, programming, web)"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SEO-friendly title (defaults to post title)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Brief description for search engines"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Publishing</h2>
          
          <div className="flex items-center space-x-3 mb-6">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// New Post Component
const NewPost = () => <BlogPostEditor />;

// Edit Post Component  
const EditPost = () => {
  const { id } = useParams();
  return <BlogPostEditor isEdit={true} postId={id} />;
};

// Admin Dashboard
const AdminDashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchAdminPosts();
  }, []);

  const fetchAdminPosts = async () => {
    try {
      const response = await axios.get(`${API}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching admin posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`${API}/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link 
          to="/admin/posts/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          New Post
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">All Posts</h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{post.title}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    {post.published ? (
                      <span className="text-green-600">Published</span>
                    ) : (
                      <span className="text-yellow-600">Draft</span>
                    )}
                    <span className="mx-2">•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link 
                    to={`/admin/posts/edit/${post.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
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

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/posts/new" element={
                <ProtectedRoute>
                  <NewPost />
                </ProtectedRoute>
              } />
              <Route path="/admin/posts/edit/:id" element={
                <ProtectedRoute>
                  <EditPost />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
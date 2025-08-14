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

// Header Component - Cup of Jo style
const Header = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="bg-white">
      <div className="max-w-screen-xl mx-auto px-5 py-6">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <Link to="/" className="text-4xl font-serif font-normal tracking-tighter">
              Ruhmani
            </Link>
          </div>
          
          <nav className="w-full border-t border-b border-gray-300 py-4">
            <ul className="flex justify-center space-x-8">
              <li><Link to="/" className="font-sans uppercase text-xs tracking-wider hover:underline">Home</Link></li>
              <li><Link to="/blog" className="font-sans uppercase text-xs tracking-wider hover:underline">Blog</Link></li>
              <li><Link to="/about" className="font-sans uppercase text-xs tracking-wider hover:underline">About</Link></li>
              <li><Link to="/contact" className="font-sans uppercase text-xs tracking-wider hover:underline">Contact</Link></li>
              {isAuthenticated && (
                <>
                  <li><Link to="/admin" className="font-sans uppercase text-xs tracking-wider hover:underline">Admin</Link></li>
                  <li>
                    <button 
                      onClick={logout}
                      className="font-sans uppercase text-xs tracking-wider hover:underline"
                    >
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

// Footer Component - Cup of Jo style
const Footer = () => {
  return (
    <footer className="bg-gray-100 py-12 mt-16">
      <div className="max-w-screen-xl mx-auto px-5">
        <div className="flex flex-col items-center">
          <div className="mb-6">
            <div className="text-3xl font-serif font-normal tracking-tighter mb-4">Ruhmani</div>
            <div className="flex justify-center space-x-8">
              <a href="#" className="font-sans uppercase text-xs tracking-wider hover:underline">Instagram</a>
              <a href="#" className="font-sans uppercase text-xs tracking-wider hover:underline">Twitter</a>
              <a href="#" className="font-sans uppercase text-xs tracking-wider hover:underline">Facebook</a>
              <a href="#" className="font-sans uppercase text-xs tracking-wider hover:underline">Pinterest</a>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-600">
            <p className="mb-2">© 2025 Ruhmani. All rights reserved.</p>
            <p>Designed with love in Bharat 🇮🇳 	&#x1f1ee;&#x1f1f3; </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Home Page - Cup of Jo style
const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API}/posts`);
      setPosts(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-8">
      {/* Featured Post */}
      {posts.length > 0 && (
        <div className="mb-16 border-b border-gray-300 pb-16">
          <article className="mb-8">
            {posts[0].featured_image && (
              <Link to={`/blog/${posts[0].slug}`} className="block mb-6">
                <img 
                  src={posts[0].featured_image.startsWith('http') ? posts[0].featured_image : `${BACKEND_URL}${posts[0].featured_image}`}
                  alt={posts[0].title}
                  className="w-full h-96 object-cover"
                />
              </Link>
            )}
            <div className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-sans">
              <span>{new Date(posts[0].created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h2 className="text-3xl font-serif font-normal mb-4">
              <Link to={`/blog/${posts[0].slug}`} className="hover:underline">{posts[0].title}</Link>
            </h2>
            <p className="text-gray-700 mb-6">{posts[0].excerpt}</p>
            <Link 
              to={`/blog/${posts[0].slug}`}
              className="inline-block font-sans uppercase text-xs tracking-wider hover:underline"
            >
              Continue Reading
            </Link>
          </article>
        </div>
      )}
      
      {/* More Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {posts.slice(1).map((post) => (
          <article key={post.id} className="mb-12">
            {post.featured_image && (
              <Link to={`/blog/${post.slug}`} className="block mb-4">
                <img 
                  src={post.featured_image.startsWith('http') ? post.featured_image : `${BACKEND_URL}${post.featured_image}`}
                  alt={post.title}
                  className="w-full h-56 object-cover"
                />
              </Link>
            )}
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-sans">
              <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h3 className="text-xl font-serif font-normal mb-3">
              <Link to={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
            </h3>
            <Link 
              to={`/blog/${post.slug}`}
              className="inline-block font-sans uppercase text-xs tracking-wider hover:underline"
            >
              Continue Reading
            </Link>
          </article>
        ))}
      </div>
      
      {/* Newsletter Signup */}
      <div className="bg-gray-100 py-12 mb-16">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-serif font-normal mb-4">Join the Newsletter</h3>
          <p className="text-gray-700 mb-6">Sign up to get the latest posts and updates delivered directly to your inbox.</p>
          <form className="flex flex-col sm:flex-row gap-4">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
            />
            <button className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm font-sans uppercase tracking-wider">
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Blog Listing Page - Cup of Jo style
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query)
      );
    }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-gray-600">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-serif font-normal mb-4">Blog</h1>
        <p className="text-gray-700 max-w-2xl mx-auto">Thoughts on technology, design, and life.</p>
      </div>
      
      {/* Search and Filter Section */}
      <div className="mb-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
            placeholder="Search posts..."
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 text-sm"
          >
            <option value="">All Topics</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>
      
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          {searchQuery || selectedTag ? (
            <div>
              <p className="mb-4">No posts found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="text-gray-900 hover:underline font-sans text-sm"
              >
                View all posts
              </button>
            </div>
          ) : (
            <p>No posts available yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <article key={post.id} className="mb-12">
              {post.featured_image && (
                <Link to={`/blog/${post.slug}`} className="block mb-4">
                  <img 
                    src={post.featured_image.startsWith('http') ? post.featured_image : `${BACKEND_URL}${post.featured_image}`}
                    alt={post.title}
                    className="w-full h-56 object-cover"
                  />
                </Link>
              )}
              <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-sans">
                <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h2 className="text-xl font-serif font-normal mb-3">
                <Link to={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
              </h2>
              <Link 
                to={`/blog/${post.slug}`}
                className="inline-block font-sans uppercase text-xs tracking-wider hover:underline"
              >
                Continue Reading
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

// About  Page - Cup of Jo style
const AboutPage = () => {
  return (
    <div className="max-w-screen-xl mx-auto px-5 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-serif font-normal mb-4">About</h1>
        <p className="text-gray-700 max-w-2xl mx-auto">Thoughts on technology, design, and life.</p>
        <br></br>
        <div>
          <p>Welcome to Ruhmani your one-stop hub for ideas that matter.
            From the latest in AI and technology to deep dives into finance, geopolitics, science, space, and even local politics, we bring you clear, engaging, and insightful stories that keep you informed and inspired.
            We believe knowledge should be simple, accessible, and impactful—whether you’re tracking the stock market, exploring nature, or decoding the future of tech.
            Stay curious. Stay ahead. 🚀
          </p>
        </div>
      </div>
        
    </div>
  );
};

// Contact  Page - Cup of Jo style
const ContactPage = () => {
  return (
    <div className="max-w-screen-xl mx-auto px-5 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-serif font-normal mb-4">Contact</h1>
        <p className="text-gray-700 max-w-2xl mx-auto">Get in touch with us.</p><br></br>
        <div>
          <p>Got a question, idea, or feedback? We’d love to hear from you.</p><br></br>
              <p>Whether it’s about AI, technology, finance, science, or anything we write about, your thoughts help us create better stories.</p><br></br>
              <ul>
                <li>
                  📩 Email: info@ruhmani.com
                </li>
                <li>
                  🌐 Social: https://www.instagram.com/ruhmanistudio
                </li>
              </ul><br></br>
              <p>We read every message—because great conversations start with a simple hello.</p>
        </div>
      </div>
    </div>
  );
};
// Individual Blog Post Page - Cup of Jo style
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
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-gray-600">Loading post...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-normal mb-4">Post Not Found</h1>
          <p className="text-gray-700 mb-8">The post you're looking for doesn't exist.</p>
          <Link to="/blog" className="text-gray-900 hover:underline">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-screen-md mx-auto px-5 py-8">
      <div className="mb-12">
        <div className="text-xs text-gray-500 mb-4 uppercase tracking-wider font-sans">
          <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h1 className="text-4xl font-serif font-normal mb-6">{post.title}</h1>
        {post.featured_image && (
          <img 
            src={post.featured_image.startsWith('http') ? post.featured_image : `${BACKEND_URL}${post.featured_image}`}
            alt={post.title}
            className="w-full mb-8"
          />
        )}
      </div>
      
      <div className="prose max-w-none mb-16">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
      
      <div className="border-t border-gray-300 pt-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gray-500 mb-4 font-sans">Share This Post</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-700 hover:text-gray-900">Twitter</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Facebook</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Pinterest</a>
              <a href="#" className="text-gray-700 hover:text-gray-900">Email</a>
            </div>
          </div>
          <div>
            <Link to="/blog" className="text-gray-900 hover:underline font-sans">← Back to Blog</Link>
          </div>
        </div>
      </div>
    </article>
  );
};

// Login Page - Cup of Jo style
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
    <div className="min-h-screen flex items-center justify-center py-16">
      <div className="max-w-md w-full">
        <h2 className="text-2xl font-serif font-normal text-center mb-8">Admin Login</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-sans">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-700 mb-2 font-sans">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-4 hover:bg-gray-800 disabled:opacity-50 transition-colors font-sans"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Blog Post Editor Component - Fixed and Improved UI
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
  const [uploadMode, setUploadMode] = useState('file');
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
    <div className="max-w-screen-md mx-auto px-5 py-8">
      <div className="mb-8">
        <Link to="/admin" className="text-gray-900 hover:underline mb-4 inline-block font-sans">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-serif font-normal mb-6">
          {isEdit ? 'Edit Post' : 'Create New Post'}
        </h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
        <div className="bg-white p-6 border border-gray-200 rounded-sm">
          <h2 className="text-lg font-serif font-normal mb-4">Post Content</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                required
                placeholder="Enter your blog post title"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Excerpt *
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                rows="3"
                required
                placeholder="Brief description of your post"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Content * 
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2 p-3 bg-gray-100 border">
                <button
                  type="button"
                  onClick={() => insertFormatting('<h2>', '</h2>')}
                  className="px-3 py-1 bg-white border text-sm"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<h3>', '</h3>')}
                  className="px-3 py-1 bg-white border text-sm"
                  title="Heading 3"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<strong>', '</strong>')}
                  className="px-3 py-1 bg-white border font-bold text-sm"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<em>', '</em>')}
                  className="px-3 py-1 bg-white border italic text-sm"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<a href="">', '</a>')}
                  className="px-3 py-1 bg-white border text-sm"
                  title="Link"
                >
                  Link
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<ul>\n<li>', '</li>\n</ul>')}
                  className="px-3 py-1 bg-white border text-sm"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('<ol>\n<li>', '</li>\n</ol>')}
                  className="px-3 py-1 bg-white border text-sm"
                  title="Numbered List"
                >
                  1. List
                </button>
              </div>

              <textarea
                id="content-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500 font-mono text-sm"
                rows="12"
                required
                placeholder="Write your blog post content here..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Featured Image
              </label>
              
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

              <div className="space-y-3">
                {uploadMode === 'file' ? (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full"
                      disabled={imageUploading}
                    />
                    {imageUploading && <p className="mt-2 text-sm text-gray-500">Uploading image...</p>}
                  </div>
                ) : (
                  <div>
                    <div className="flex space-x-2">
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                        disabled={imageUploading}
                      />
                      <button
                        type="button"
                        onClick={handleImageUrl}
                        disabled={imageUploading || !imageUrl.trim()}
                        className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-sans"
                      >
                        Add
                      </button>
                    </div>
                    {imageUploading && <p className="mt-2 text-sm text-gray-500">Saving image URL...</p>}
                  </div>
                )}
                
                {featuredImage && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-700 mb-2">Current Image:</div>
                    <img 
                      src={featuredImage.startsWith('http') ? featuredImage : `${BACKEND_URL}${featuredImage}`} 
                      alt="Featured" 
                      className="w-full max-w-xs h-auto object-contain border p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage('')}
                      className="mt-2 text-sm text-gray-900 hover:underline font-sans"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Tags
                <span className="text-gray-500 ml-1">(comma separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                placeholder="technology, programming, web"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-sm">
          <h2 className="text-lg font-serif font-normal mb-4">SEO Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Meta Title
                <span className="text-gray-500 ml-1">(optional)</span>
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                placeholder="SEO title (defaults to post title)"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2 font-sans">
                Meta Description
                <span className="text-gray-500 ml-1">(optional)</span>
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-gray-500"
                rows="3"
                placeholder="Brief description for search engines"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 border border-gray-200 rounded-sm">
          <h2 className="text-lg font-serif font-normal mb-4">Publishing</h2>
          
          <div className="flex items-center space-x-3 mb-6">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500"
            />
            <label htmlFor="published" className="text-sm text-gray-700 font-sans">
              Publish immediately
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="px-6 py-3 bg-gray-300 text-gray-900 hover:bg-gray-400 disabled:opacity-50 transition-colors font-sans"
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="px-6 py-3 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition-colors font-sans"
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

// Admin Dashboard - Cup of Jo style
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
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-5 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl font-serif font-normal">Admin Dashboard</h1>
        <Link 
          to="/admin/posts/new"
          className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors font-sans"
        >
          New Post
        </Link>
      </div>

      <div className="border border-gray-300">
        <div className="px-6 py-4 border-b border-gray-300 bg-gray-100">
          <h2 className="text-lg font-serif font-normal">All Posts</h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            <p>No posts yet. Create your first post!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-300">
            {posts.map((post) => (
              <div key={post.id} className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">{post.title}</h3>
                  <div className="text-sm text-gray-500 mt-1 font-sans">
                    {post.published ? (
                      <span className="text-green-600">Published</span>
                    ) : (
                      <span className="text-yellow-600">Draft</span>
                    )}
                    <span className="mx-2">•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-3 font-sans">
                  <Link 
                    to={`/admin/posts/edit/${post.id}`}
                    className="text-gray-900 hover:underline"
                  >
                    Edit
                  </Link>
                  <Link 
                    to={`/blog/${post.slug}`}
                    className="text-gray-900 hover:underline"
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
        <div className="min-h-screen bg-white">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
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
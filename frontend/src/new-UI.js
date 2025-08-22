// src/App.jsx
import React, { useState, useEffect } from "react";

const posts = [
  {
    id: 1,
    title: "How to Keep Creating Even When It’s Hard",
    date: "August 1, 2025",
    excerpt:
      "Creative work isn’t always easy, and it’s not always flowing. Here’s how to stay connected to your creativity during tough seasons.",
    image: "https://source.unsplash.com/featured/?writing,desk",
    tags: ["Creativity", "Mindset"],
  },
  {
    id: 2,
    title: "Finding Your Voice as a Writer",
    date: "July 15, 2025",
    excerpt:
      "Your voice matters. Discover how to lean into your own tone and truth in your writing.",
    image: "https://source.unsplash.com/featured/?notebook,pen",
    tags: ["Writing", "Voice"],
  },
  {
    id: 3,
    title: "Why Your Story Is Worth Sharing",
    date: "June 30, 2025",
    excerpt:
      "We often downplay our own experiences. But your story can offer insight and healing to others.",
    image: "https://source.unsplash.com/featured/?storytelling,writer",
    tags: ["Storytelling", "Inspiration"],
  },
  {
    id: 4,
    title: "Creating from a Place of Rest",
    date: "June 1, 2025",
    excerpt:
      "You don’t need to hustle to create meaningful work. Rest is a creative tool.",
    image: "https://source.unsplash.com/featured/?rest,creative",
    tags: ["Creativity", "Rest"],
  },
  {
    id: 5,
    title: "The Power of Daily Journaling",
    date: "May 15, 2025",
    excerpt:
      "Keeping a daily journal isn’t just about writing — it’s about noticing your life.",
    image: "https://source.unsplash.com/featured/?journal,writing",
    tags: ["Writing", "Habits"],
  },
];

const allTags = ["All", ...new Set(posts.flatMap((p) => p.tags))];

export default function App() {
  const [activeTag, setActiveTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(3);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const filteredPosts =
    activeTag === "All"
      ? posts
      : posts.filter((post) => post.tags.includes(activeTag));

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredPosts.length;

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white text-black font-serif min-h-screen relative">
      <header className="text-center py-12 border-b px-4">
        <h1 className="text-4xl tracking-wide font-bold">The Creative Blog</h1>
        <p className="mt-2 text-gray-600 text-lg">
          Thoughts on creativity, life, and the stories we tell
        </p>
      </header>

      <nav className="flex flex-wrap justify-center gap-4 mt-8 px-4">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setActiveTag(tag);
              setVisibleCount(3);
            }}
            className={`px-4 py-2 text-sm border rounded-full transition ${
              activeTag === tag
                ? "bg-black text-white"
                : "text-black border-gray-300 hover:bg-gray-100"
            }`}
          >
            {tag}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid gap-12">
        {visiblePosts.map((post) => (
          <article
            key={post.id}
            className="grid md:grid-cols-3 gap-6 animate-fadeIn"
          >
            <img
              src={post.image}
              alt="Post visual"
              className="w-full h-48 object-cover rounded md:col-span-1"
            />
            <div className="space-y-3 md:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
              <time className="text-sm text-gray-500 block">{post.date}</time>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">{post.excerpt}</p>
              <a href="#" className="text-blue-600 font-medium hover:underline">
                Read more →
              </a>
            </div>
          </article>
        ))}

        {canLoadMore && (
          <div className="text-center">
            <button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              className="mt-8 px-6 py-2 text-sm font-medium border rounded hover:bg-gray-100"
            >
              Load more posts
            </button>
          </div>
        )}
      </main>

      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 text-sm rounded shadow-md hover:bg-gray-800 transition"
        >
          ↑ Top
        </button>
      )}

      <footer className="text-center py-12 text-sm text-gray-500 border-t px-4">
        © 2025 The Creative Blog — All rights reserved.
      </footer>
    </div>
  );
}

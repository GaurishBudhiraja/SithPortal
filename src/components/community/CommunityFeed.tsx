import React, { useState, useEffect, useRef } from 'react';

import { Rocket, Plus, Loader2 } from 'lucide-react';
import { postsAPI } from '../../lib/api';
import { socket } from '../../lib/socket';
import { toast } from 'react-hot-toast';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import styles from './CommunityFeed.module.css';

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  title: string;
  content: string;
  imageUrl?: string;
  likes: Array<{ user: string; createdAt: string }>;
  comments: Array<{
    _id: string;
    user: { _id: string; username: string; avatar?: string };
    content: string;
    createdAt: string;
  }>;
  shares: Array<{ user: string; sharedTo: string; createdAt: string }>;
  createdAt: string;
  updatedAt: string;
}

const CommunityFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPosts();

    socket.on('post_created', (newPost: Post) => {
      setPosts(prev => [newPost, ...prev]);
    });

    socket.on('post_updated', (updatedPost: Post) => {
      setPosts(prev =>
        prev.map(post => (post._id === updatedPost._id ? updatedPost : post))
      );
    });

    return () => {
      socket.off('post_created');
      socket.off('post_updated');
    };
  }, []);

  const loadPosts = async (pageNum = 1) => {
    try {
      const response = await postsAPI.getAllPosts(pageNum);
      const newPosts = response.data;

      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === 10);
    } catch (error) {
      toast.error('Failed to load Sith Network posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
    socket.emit('new_post', newPost);
    toast.success('Post launched to the Sith Network!');
  };

  const handleLikePost = async (postId: string) => {
    try {
      const response = await postsAPI.likePost(postId);
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? {
                ...post,
                likes: response.data.isLiked
                  ? [...post.likes, { user: 'current-user', createdAt: new Date().toISOString() }]
                  : post.likes.filter(like => like.user !== 'current-user'),
              }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleCommentAdded = (postId: string, newComment: any) => {
    setPosts(prev =>
      prev.map(post =>
        post._id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );
  };

  const loadMorePosts = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage);
  };

  // Show animation when card enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll(`.${styles['snap-section']}`);
    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, [posts]);

useEffect(() => {
  if (!window.chatbase || window.chatbase("getState") !== "initialized") {
    window.chatbase = (...args) => {
      if (!window.chatbase.q) window.chatbase.q = [];
      window.chatbase.q.push(args);
    };
    window.chatbase = new Proxy(window.chatbase, {
      get(target, prop) {
        if (prop === "q") return target.q;
        return (...args) => target(prop, ...args);
      }
    });

    const onLoad = () => {
      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "Vi1JfOoDp_0ahiDRwvjau";
      script.setAttribute("domain", "www.chatbase.co");
      document.body.appendChild(script);
    };

    const adjustChatbasePosition = () => {
      const interval = setInterval(() => {
        const iframe = document.querySelector("iframe[src*='chatbase']");
        if (iframe) {
          iframe.style.bottom = "90px"; // move up by 90px
          iframe.style.right = "20px"; // optional fine-tuning
          clearInterval(interval);
        }
      }, 500);
    };

    if (document.readyState === "complete") {
      onLoad();
      adjustChatbasePosition();
    } else {
      window.addEventListener("load", () => {
        onLoad();
        adjustChatbasePosition();
      });
    }
  }
}, []);


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col"
      style={{
        backgroundImage: "url('/space-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Header */}
        <div className="bg-gray-800 border-b border-red-900 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-700 rounded-lg sith-glow">
                <Rocket className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-green-400 sith-text-glow">
                  Sith Network
                </h1>
                <p className="text-sm text-gray-500">Share your dark side experiences</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreatePost(true)}
              className="lightsaber-btn flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-violet-700 transition-colors sith-glow"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Post</span>
            </button>
          </div>
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <CreatePost
            onClose={() => setShowCreatePost(false)}
            onPostCreated={handlePostCreated}
          />
        )}

        {/* Scroll Snapping Feed */}
        <div className={styles['parallax-container']} ref={containerRef}>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                No posts in the network yet
              </h2>
              <p className="text-gray-500 mb-4">Be the first to share your Sith wisdom</p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="lightsaber-btn px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors sith-glow"
              >
                Launch Your First Post
              </button>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <div key={post._id} className={styles['snap-section']}>
                  <div className="w-full max-w-2xl px-6">
                    <PostCard
                      post={post}
                      onLike={() => handleLikePost(post._id)}
                      onCommentAdded={comment => handleCommentAdded(post._id, comment)}
                    />
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMorePosts}
                    className="lightsaber-btn px-6 py-3 bg-gray-700 text-red-400 rounded-lg hover:bg-gray-600 transition-colors border border-red-800"
                  >
                    Load More Posts
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityFeed;

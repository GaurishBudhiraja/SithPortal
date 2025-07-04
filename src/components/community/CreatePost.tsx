import React, { useState } from 'react';
import { X, Rocket, Image, Upload, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { postsAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

interface PostForm {
  title: string;
  content: string;
  imageUrl: string;
}

const CreatePost: React.FC<CreatePostProps> = ({ onClose, onPostCreated }) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PostForm>();

  const title = watch('title');
  const content = watch('content');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    toast.error('Image size must be less than 5MB');
    return;
  }

  setLoading(true);
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'RTLpreset'); // 🔁 Replace with actual preset
  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/deqvbbcru/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.secure_url) {
      setImagePreview(data.secure_url);
      setValue('imageUrl', data.secure_url);
      setImageFile(file);
    } else {
      toast.error('Upload failed');
    }
  } catch (err) {
    toast.error('Failed to upload image');
  } finally {
    setLoading(false);
  }
};



  const onSubmit = async (data: PostForm) => {
    setLoading(true);
    const payload = {
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl?.trim() || '', // Safe fallback
  };
    try {
      const response = await postsAPI.createPost(payload.title, payload.content, payload.imageUrl || '');
      onPostCreated(response.data.post);
      toast.success("Post launched successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to launch post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-red-900 w-full max-w-2xl max-h-[90vh] overflow-auto sith-glow">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-red-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-900 rounded-lg sith-glow">
              <Rocket className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-red-400 sith-text-glow">Launch New Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-red-400 mb-2">Post Title *</label>
            <input
              {...register('title', {
                required: 'Title is required',
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              type="text"
              className="w-full px-4 py-3 border border-red-800 rounded-lg bg-gray-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your post title..."
              maxLength={100}
            />
            <div className="flex justify-between mt-1">
              {errors.title && (
                <p className="text-sm text-red-400">{errors.title.message}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{title?.length || 0}/100</p>
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-red-400 mb-2">Content *</label>
            <textarea
              {...register('content', {
                required: 'Content is required',
                maxLength: { value: 2000, message: 'Max 2000 characters' },
              })}
              rows={6}
              className="w-full px-4 py-3 border border-red-800 rounded-lg bg-gray-700 text-red-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Share your Sith wisdom..."
              maxLength={2000}
            />
            <div className="flex justify-between mt-1">
              {errors.content && (
                <p className="text-sm text-red-400">{errors.content.message}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">{content?.length || 0}/2000</p>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-red-400 mb-2">Add Image</label>

            <div className="mb-4">
              <label className="cursor-pointer block w-full p-4 rounded-lg text-center border border-dashed border-red-600 hover:bg-gray-700">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-400">Upload from device</p>
                <p className="text-xs text-gray-500">Max 5MB</p>
              </label>
            </div>

            {imagePreview && (
              <div className="mb-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-48 object-cover rounded-lg border border-red-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                    setValue('imageUrl', '');
                  }}
                  className="mt-2 text-sm text-red-400 hover:text-red-300"
                >
                  Remove image
                </button>
              </div>
            )}

            {/* URL Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Image className="h-5 w-5 text-red-600" />
              </div>
              <input
                {...register('imageUrl')}
                type="url"
                className="w-full pl-10 pr-4 py-3 border border-red-800 rounded-lg bg-gray-700 text-red-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Or paste image URL..."
                disabled={!!imageFile}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Upload from device or add image URL</p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-red-900">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title?.trim() || !content?.trim()}
              className="lightsaber-btn flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed sith-glow"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Launching...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Launch Post</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;

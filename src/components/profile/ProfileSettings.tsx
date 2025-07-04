import React, { useState } from 'react';
import { User, Mail, Edit, Save, X, Upload, Camera } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import { usersAPI } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface ProfileForm {
  username: string;
  bio: string;
  avatar: string;
}

const ProfileSettings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileForm>({
    defaultValues: {
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    }
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Avatar size must be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    setLoading(true);
    try {
      let finalAvatar = data.avatar;
      
      // If user uploaded a file, use the preview (in production, upload to cloud)
      if (avatarFile && avatarPreview) {
        finalAvatar = avatarPreview;
      }
      
      const response = await usersAPI.updateProfile({
        ...data,
        avatar: finalAvatar
      });
      updateUser(response.data.user);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview('');
      toast.success('Sith profile updated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getDisplayAvatar = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatar) return user.avatar;
    return null;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-red-900 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-900 rounded-lg sith-glow">
              <User className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-red-400 sith-text-glow">Sith Profile</h1>
              <p className="text-sm text-gray-500">Manage your dark side identity</p>
            </div>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="lightsaber-btn flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors sith-glow"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-auto bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-sm border border-red-900 overflow-hidden sith-glow">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-800 h-32 relative">
              <div className="absolute -bottom-16 left-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-800 rounded-full border-4 border-red-600 shadow-lg flex items-center justify-center sith-glow-strong overflow-hidden">
                    {getDisplayAvatar() ? (
                      <img 
                        src={getDisplayAvatar()!} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                        <span className="text-red-300 font-bold text-2xl">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors sith-glow">
                      <Camera className="w-5 h-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="pt-20 pb-8 px-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">
                      Sith Name
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          {...register('username', {
                            required: 'Sith name is required',
                            minLength: {
                              value: 3,
                              message: 'Sith name must be at least 3 characters'
                            },
                            maxLength: {
                              value: 20,
                              message: 'Sith name must be less than 20 characters'
                            }
                          })}
                          type="text"
                          className="w-full px-3 py-2 border border-red-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-700 text-red-300"
                        />
                        {errors.username && (
                          <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-red-300 font-medium">{user?.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">
                      Email
                    </label>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-red-600" />
                      <p className="text-red-300">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">
                    Sith Biography
                  </label>
                  {isEditing ? (
                    <textarea
                      {...register('bio', {
                        maxLength: {
                          value: 200,
                          message: 'Bio must be less than 200 characters'
                        }
                      })}
                      rows={4}
                      className="w-full px-3 py-2 border border-red-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-gray-700 text-red-300"
                      placeholder="Tell us about your path to the dark side..."
                    />
                  ) : (
                    <p className="text-gray-400 whitespace-pre-wrap">
                      {user?.bio || 'No biography added yet.'}
                    </p>
                  )}
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-400">{errors.bio.message}</p>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="lightsaber-btn flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors sith-glow"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="lightsaber-btn flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-red-900">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400 sith-text-glow">
                      {user?.friends?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Allies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400 sith-text-glow">
                      {formatJoinDate(user?.createdAt || '')}
                    </div>
                    <div className="text-sm text-gray-500">Joined Order</div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
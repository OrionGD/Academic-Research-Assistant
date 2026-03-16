import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  Moon, 
  LogOut,
  ChevronRight,
  Camera,
  CheckCircle2,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../utils/helpers';
import { authService } from '../services/api/authService';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    institution: 'Stanford University', // Placeholder for extended metadata
    field: 'Artificial Intelligence',
    bio: 'I am a researcher focused on Natural Language Processing and its applications in academic research automation.'
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || ''
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authService.updateProfile({
        displayName: formData.displayName,
        // In a real app, institution/field/bio would be part of the UpdateUserPayload
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      // Global interceptor handles toast
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'billing', label: 'Billing', icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Account Settings</h1>
        <p className="text-text-secondary mt-1">Manage your profile, preferences, and security settings.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-accent-primary text-bg-dark shadow-lg shadow-accent-primary/20" 
                  : "text-text-secondary hover:bg-surface-medium hover:text-text-primary"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-8">
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-xl">
                <h3 className="text-xl font-bold text-text-primary mb-8">Personal Information</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-surface-medium flex items-center justify-center text-accent-primary border-4 border-surface-light shadow-lg overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-accent-primary text-bg-dark rounded-full border-2 border-surface-dark shadow-lg hover:bg-accent-highlight transition-all">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-text-primary text-lg">{user?.displayName || 'Research User'}</h4>
                    <p className="text-text-secondary text-sm">{formData.institution} • {formData.field}</p>
                    <div className="flex items-center gap-2 mt-2 text-accent-primary font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 size={14} /> Verified Account
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-surface-dark border border-surface-light rounded-2xl text-text-secondary/50 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Field of Research</label>
                    <input
                      type="text"
                      value={formData.field}
                      onChange={(e) => setFormData({...formData, field: e.target.value})}
                      className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary"
                    />
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-surface-light flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-accent-primary text-bg-dark px-8 py-3 rounded-2xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-xl">
                <h3 className="text-xl font-bold text-text-primary mb-6">Bio</h3>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all resize-none text-text-primary placeholder:text-text-secondary/30"
                  placeholder="Tell us about your research interests..."
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-xl">
                <h3 className="text-xl font-bold text-text-primary mb-8">Password & Security</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 bg-surface-medium border border-surface-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-primary focus:bg-surface-dark transition-all text-text-primary"
                      />
                    </div>
                  </div>
                  <button className="bg-accent-primary text-bg-dark px-8 py-3 rounded-2xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Two-Factor Authentication</h3>
                    <p className="text-sm text-text-secondary mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <button className="px-6 py-2 bg-accent-primary/10 text-accent-primary rounded-xl font-bold text-sm hover:bg-accent-primary/20 transition-all">Enable</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-dark p-8 rounded-3xl border border-surface-light shadow-xl space-y-8"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6">App Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-surface-medium rounded-2xl border border-surface-light">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-surface-dark rounded-xl text-accent-primary shadow-sm border border-surface-light">
                      <Moon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">Dark Mode</p>
                      <p className="text-xs text-text-secondary">Switch between light and dark themes.</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-accent-primary rounded-full relative transition-all shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-bg-dark rounded-full shadow-sm"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-medium rounded-2xl border border-surface-light">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-surface-dark rounded-xl text-accent-primary shadow-sm border border-surface-light">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">Language</p>
                      <p className="text-xs text-text-secondary">Select your preferred language.</p>
                    </div>
                  </div>
                  <select className="bg-surface-dark border border-surface-light text-text-primary rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-accent-primary transition-all">
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

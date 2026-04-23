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
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '../../utils/helpers';
import { authService } from '../../shared/services/api/authService';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    institution: user?.institution || 'Stanford University',
    field: user?.field || 'Artificial Intelligence',
    bio: user?.bio || 'I am a researcher focused on Natural Language Processing and its applications in academic research automation.'
  });
  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: 'English (US)'
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        institution: user.institution || prev.institution,
        field: user.field || prev.field,
        bio: user.bio || prev.bio
      }));
    }
  }, [user]);

  const handleUpdatePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await authService.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      toast.success('Password updated successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Failed to update password';
      toast.error(message);
    }
  };

  const handleEnable2FA = () => {
    setIs2FAEnabled((prev) => !prev);
    toast.success(is2FAEnabled ? 'Two-factor authentication disabled' : 'Two-factor authentication enabled successfully!');
  };

  const handleAvatarUpload = async () => {
    const newAvatarUrl = prompt("Enter new avatar image URL:", user?.photoURL || "");
    if (newAvatarUrl) {
      setIsSaving(true);
      try {
        await authService.updateProfile({ photoURL: newAvatarUrl });
        toast.success('Avatar updated successfully. Please refresh for changes.');
      } catch(error) {
         toast.error('Failed to update avatar');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authService.updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
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
                  ? "bg-gold-main text-[#0E0E10] shadow-lg shadow-gold-main/20" 
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )}
            >
              <tab.icon size={18} className={activeTab === tab.id ? "text-[#0E0E10]" : "text-text-muted"} />
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
              <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl">
                <h3 className="text-xl font-bold text-text-primary mb-8">Personal Information</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-8 mb-10">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-bg-elevated flex items-center justify-center text-gold-main border-4 border-bg-secondary shadow-lg overflow-hidden">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={40} />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 p-2 bg-gold-main text-[#0E0E10] rounded-full border-2 border-bg-secondary shadow-lg hover:bg-gold-hover transition-all" onClick={handleAvatarUpload}>
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="font-bold text-text-primary text-lg">{user?.name || 'Research User'}</h4>
                    <p className="text-text-secondary text-sm">{formData.institution} • {formData.field}</p>
                    <div className="flex items-center gap-2 mt-2 text-gold-main font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 size={14} /> Verified Account
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Email Address</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-bg-secondary border border-silver-muted/20 rounded-2xl text-text-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Field of Research</label>
                    <input
                      type="text"
                      value={formData.field}
                      onChange={(e) => setFormData({...formData, field: e.target.value})}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-silver-muted/20 flex justify-end">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-gold flex items-center gap-2 px-8"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl">
                <h3 className="text-xl font-bold text-text-primary mb-6">Bio</h3>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="input-field w-full resize-none placeholder:text-text-muted/30"
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
              <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl">
                <h3 className="text-xl font-bold text-text-primary mb-8">Password & Security</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-text-secondary mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                      className="input-field w-full"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-secondary mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                  <button onClick={handleUpdatePassword} className="btn-gold px-8">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Two-Factor Authentication</h3>
                    <p className="text-sm text-text-secondary mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <button onClick={handleEnable2FA} className={cn("px-6 py-2 rounded-xl font-bold text-sm transition-all border", is2FAEnabled ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" : "bg-gold-main/10 text-gold-main hover:bg-gold-main/20 border-gold-main/20")}>
                    {is2FAEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl space-y-8"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6">App Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-bg-secondary rounded-xl text-gold-main shadow-sm border border-silver-muted/20">
                      <Moon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">Dark Mode</p>
                      <p className="text-xs text-text-secondary">Switch between light and dark themes.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-all shadow-inner",
                      preferences.darkMode ? "bg-gold-main" : "bg-silver-muted/30"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-[#0E0E10] rounded-full shadow-sm transition-all",
                      preferences.darkMode ? "right-1" : "left-1"
                    )}></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-bg-secondary rounded-xl text-gold-main shadow-sm border border-silver-muted/20">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary">Language</p>
                      <p className="text-xs text-text-secondary">Select your preferred language.</p>
                    </div>
                  </div>
                  <select 
                    value={preferences.language}
                    onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="bg-bg-secondary border border-silver-muted/30 text-text-primary rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-gold-main/30 transition-all"
                  >
                    <option>English (US)</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl space-y-8"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6">Notification Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10">
                  <div>
                    <p className="font-bold text-text-primary">Email Notifications</p>
                    <p className="text-xs text-text-secondary">Receive email updates about your documents and analysis.</p>
                  </div>
                  <button className="w-12 h-6 bg-gold-main rounded-full relative transition-all shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#0E0E10] rounded-full shadow-sm"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10">
                  <div>
                    <p className="font-bold text-text-primary">Analysis Complete</p>
                    <p className="text-xs text-text-secondary">Get notified when document analysis is finished.</p>
                  </div>
                  <button className="w-12 h-6 bg-gold-main rounded-full relative transition-all shadow-inner">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-[#0E0E10] rounded-full shadow-sm"></div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'billing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-bg-secondary p-8 rounded-3xl border border-silver-muted/20 shadow-xl space-y-8"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6">Billing & Subscription</h3>
              
              <div className="bg-bg-elevated p-8 rounded-2xl border border-silver-muted/10 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-lg font-bold text-text-primary">Current Plan: Pro Researcher</h4>
                    <p className="text-sm text-text-secondary mt-1">Billing cycle: Monthly</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gold-main">$29.00</p>
                    <p className="text-xs text-text-muted">/ month</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="btn-gold px-6 py-2 flex-1">Upgrade Plan</button>
                  <button className="px-6 py-2 border border-silver-muted/20 text-text-secondary rounded-xl hover:bg-bg-secondary transition-all flex-1">Cancel Subscription</button>
                </div>
              </div>

              <h4 className="text-md font-bold text-text-primary mb-4">Payment Methods</h4>
              <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-8 bg-bg-secondary rounded border border-silver-muted/20 flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold">VISA</span>
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">•••• •••• •••• 4242</p>
                    <p className="text-xs text-text-secondary">Expires 12/28</p>
                  </div>
                </div>
                <button className="text-gold-main text-sm font-bold hover:underline">Edit</button>
              </div>

              <h4 className="text-md font-bold text-text-primary mb-4">Billing History</h4>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-bg-elevated rounded-2xl border border-silver-muted/10">
                    <div>
                      <p className="font-bold text-text-primary">Invoice #INV-2026-0{i}</p>
                      <p className="text-xs text-text-secondary">Paid on April {10 - i}, 2026</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-text-primary">$29.00</p>
                      <button className="text-gold-main text-sm font-bold hover:underline">Download</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

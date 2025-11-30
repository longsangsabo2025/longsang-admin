import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save, 
  Upload, 
  Eye, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Settings,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Star
} from "lucide-react";
import { AppShowcaseData, AppFeature } from "@/types/app-showcase.types";
import { AppShowcaseService } from "@/services/app-showcase.service";
import { useNavigate } from "react-router-dom";

export const AppShowcaseAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'features' | 'branding' | 'links'>('general');
  
  const [formData, setFormData] = useState<AppShowcaseData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await AppShowcaseService.loadData("sabo-arena");
    if (data) {
      setFormData(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData) return;
    
    setSaving(true);
    const success = await AppShowcaseService.saveData(formData);
    setSaving(false);
    
    if (success) {
      // Dispatch event to notify other tabs/windows
      window.dispatchEvent(new Event('app-showcase-updated'));
      alert("✅ Đã lưu thành công!");
    } else {
      alert("❌ Lưu thất bại, vui lòng thử lại!");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file || !formData) return;
    
    const imageUrl = await AppShowcaseService.uploadImage(file);
    
    // Update nested field
    const keys = field.split('.');
    const updatedData = { ...formData };
    let current: any = updatedData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = imageUrl;
    
    setFormData(updatedData);
  };

  const addFeature = () => {
    if (!formData) return;
    
    const newFeature: AppFeature = {
      id: `feature-${Date.now()}`,
      title: "New Feature",
      description: "Feature description",
      icon: "Star"
    };
    
    setFormData({
      ...formData,
      features: [...formData.features, newFeature]
    });
  };

  const updateFeature = (index: number, updates: Partial<AppFeature>) => {
    if (!formData) return;
    
    const newFeatures = [...formData.features];
    newFeatures[index] = { ...newFeatures[index], ...updates };
    
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const deleteFeature = (index: number) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive text-xl mb-4">❌ Không tìm thấy dữ liệu</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="bg-dark-surface border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app-showcase')}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold gradient-text">App Showcase CMS</h1>
                <p className="text-sm text-muted-foreground">Quản lý nội dung {formData.appName}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/app-showcase')}
                className="px-4 py-2 rounded-lg glass-panel text-foreground flex items-center gap-2 hover:bg-foreground/5"
              >
                <Eye size={18} />
                Xem trước
              </button>
              <motion.button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-neon-cyan text-dark-bg font-semibold flex items-center gap-2 hover:bg-neon-cyan/90 disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save size={18} />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-dark-surface border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'general', label: 'Thông tin chung', icon: Settings },
              { id: 'features', label: 'Tính năng', icon: Star },
              { id: 'branding', label: 'Branding', icon: Palette },
              { id: 'links', label: 'Liên kết', icon: LinkIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-neon-cyan text-neon-cyan'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'general' && (
          <GeneralTab formData={formData} setFormData={setFormData} onImageUpload={handleImageUpload} />
        )}
        
        {activeTab === 'features' && (
          <FeaturesTab 
            features={formData.features}
            onAdd={addFeature}
            onUpdate={updateFeature}
            onDelete={deleteFeature}
          />
        )}
        
        {activeTab === 'branding' && (
          <BrandingTab formData={formData} setFormData={setFormData} />
        )}
        
        {activeTab === 'links' && (
          <LinksTab formData={formData} setFormData={setFormData} />
        )}
      </div>
    </div>
  );
};

// General Tab Component
const GeneralTab = ({ formData, setFormData, onImageUpload }: any) => (
  <div className="max-w-4xl space-y-6">
    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Settings size={20} />
        Thông tin cơ bản
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Tên ứng dụng</label>
          <input
            type="text"
            value={formData.appName}
            onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Tagline</label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Hero Section</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Badge Text</label>
          <input
            type="text"
            value={formData.hero.badge}
            onChange={(e) => setFormData({ 
              ...formData, 
              hero: { ...formData.hero, badge: e.target.value }
            })}
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
          />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Số người dùng</label>
            <input
              type="text"
              value={formData.hero.stats.users}
              onChange={(e) => setFormData({ 
                ...formData, 
                hero: { 
                  ...formData.hero, 
                  stats: { ...formData.hero.stats, users: e.target.value }
                }
              })}
              className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2">Rating</label>
            <input
              type="text"
              value={formData.hero.stats.rating}
              onChange={(e) => setFormData({ 
                ...formData, 
                hero: { 
                  ...formData.hero, 
                  stats: { ...formData.hero.stats, rating: e.target.value }
                }
              })}
              className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2">Số giải đấu</label>
            <input
              type="text"
              value={formData.hero.stats.tournaments}
              onChange={(e) => setFormData({ 
                ...formData, 
                hero: { 
                  ...formData.hero, 
                  stats: { ...formData.hero.stats, tournaments: e.target.value }
                }
              })}
              className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">CTA Section</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Tiêu đề CTA</label>
          <input
            type="text"
            value={formData.cta.heading}
            onChange={(e) => setFormData({ 
              ...formData, 
              cta: { ...formData.cta, heading: e.target.value }
            })}
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Mô tả CTA</label>
          <textarea
            value={formData.cta.description}
            onChange={(e) => setFormData({ 
              ...formData, 
              cta: { ...formData.cta, description: e.target.value }
            })}
            rows={2}
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  </div>
);

// Features Tab Component
const FeaturesTab = ({ features, onAdd, onUpdate, onDelete }: any) => (
  <div className="max-w-6xl space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Quản lý tính năng</h2>
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-neon-cyan text-dark-bg rounded-lg font-semibold flex items-center gap-2 hover:bg-neon-cyan/90"
      >
        <Plus size={18} />
        Thêm tính năng
      </button>
    </div>

    <div className="space-y-4">
      {features.map((feature: AppFeature, index: number) => (
        <div key={feature.id} className="glass-panel rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold">Feature #{index + 1}</h3>
            <button
              onClick={() => onDelete(index)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
            >
              <Trash2 size={18} />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Tiêu đề</label>
              <input
                type="text"
                value={feature.title}
                onChange={(e) => onUpdate(index, { title: e.target.value })}
                className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2">Mô tả</label>
              <textarea
                value={feature.description}
                onChange={(e) => onUpdate(index, { description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none resize-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Icon name</label>
              <input
                type="text"
                value={feature.icon}
                onChange={(e) => onUpdate(index, { icon: e.target.value })}
                placeholder="Trophy, Star, Zap..."
                className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Screenshot URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={feature.screenshot || ''}
                  onChange={(e) => onUpdate(index, { screenshot: e.target.value })}
                  placeholder="URL hoặc upload..."
                  className="flex-1 px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
                />
                <label className="px-4 py-3 bg-dark-surface border border-border rounded-lg cursor-pointer hover:bg-foreground/5 flex items-center justify-center">
                  <Upload size={18} />
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Branding Tab Component
const BrandingTab = ({ formData, setFormData }: any) => (
  <div className="max-w-4xl space-y-6">
    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Palette size={20} />
        Màu sắc thương hiệu
      </h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Primary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.branding.primaryColor}
              onChange={(e) => setFormData({
                ...formData,
                branding: { ...formData.branding, primaryColor: e.target.value }
              })}
              className="w-16 h-12 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.branding.primaryColor}
              onChange={(e) => setFormData({
                ...formData,
                branding: { ...formData.branding, primaryColor: e.target.value }
              })}
              className="flex-1 px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none font-mono"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Secondary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.branding.secondaryColor}
              onChange={(e) => setFormData({
                ...formData,
                branding: { ...formData.branding, secondaryColor: e.target.value }
              })}
              className="w-16 h-12 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.branding.secondaryColor}
              onChange={(e) => setFormData({
                ...formData,
                branding: { ...formData.branding, secondaryColor: e.target.value }
              })}
              className="flex-1 px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none font-mono"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Accent Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.branding.accentColor}
              onChange={(e) => setFormData({
                ...formData,
                branding: { ...formData.branding, accentColor: e.target.value }
              })}
              className="w-16 h-12 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={formData.branding.accentColor}
              onChange={(e) => setFormData({
                ...formData,
                branding: { ...formData.branding, accentColor: e.target.value }
              })}
              className="flex-1 px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <ImageIcon size={20} />
        Logo & Hình ảnh
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">App Logo</label>
          <div className="flex gap-4 items-center">
            {formData.branding.logo && (
              <img src={formData.branding.logo} alt="Logo" className="w-20 h-20 rounded-lg object-cover" />
            )}
            <label className="px-6 py-3 bg-dark-surface border border-border rounded-lg cursor-pointer hover:bg-foreground/5 flex items-center gap-2">
              <Upload size={18} />
              Upload logo
              <input type="file" className="hidden" accept="image/*" />
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Links Tab Component
const LinksTab = ({ formData, setFormData }: any) => (
  <div className="max-w-4xl space-y-6">
    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Download Links</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">App Store URL</label>
          <input
            type="url"
            value={formData.downloads.appStore || ''}
            onChange={(e) => setFormData({
              ...formData,
              downloads: { ...formData.downloads, appStore: e.target.value }
            })}
            placeholder="https://apps.apple.com/..."
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2">Google Play URL</label>
          <input
            type="url"
            value={formData.downloads.googlePlay || ''}
            onChange={(e) => setFormData({
              ...formData,
              downloads: { ...formData.downloads, googlePlay: e.target.value }
            })}
            placeholder="https://play.google.com/..."
            className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
          />
        </div>
      </div>
    </div>

    <div className="glass-panel rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Social Media Links</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(formData.social).map(([platform, url]) => (
          <div key={platform}>
            <label className="block text-sm font-semibold mb-2 capitalize">{platform}</label>
            <input
              type="url"
              value={(url as string) || ''}
              onChange={(e) => setFormData({
                ...formData,
                social: { ...formData.social, [platform]: e.target.value }
              })}
              placeholder={`https://${platform}.com/...`}
              className="w-full px-4 py-3 bg-dark-bg border border-border rounded-lg focus:border-neon-cyan focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

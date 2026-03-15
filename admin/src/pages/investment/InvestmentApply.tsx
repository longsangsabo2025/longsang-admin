import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  DollarSign,
  FileText,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GlowCard } from '@/components/GlowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { projectsData } from '@/data/projects-data';

interface FormData {
  // Step 1: Personal Information
  fullName: string;
  email: string;
  phone: string;
  address: string;

  // Step 2: Investment Details
  investmentAmount: string;
  investmentPurpose: string;
  companyName?: string;
  investorType: 'individual' | 'institution' | 'fund' | '';

  // Step 3: Experience & Verification
  investmentExperience: string;
  riskTolerance: 'low' | 'medium' | 'high' | '';
  identityDocument: string;

  // Step 4: Legal Agreements
  agreeTerms: boolean;
  agreeRisk: boolean;
  agreePrivacy: boolean;
}

const InvestmentApply = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const project = projectsData.find((p) => p.slug === slug);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    investmentAmount: '',
    investmentPurpose: '',
    companyName: '',
    investorType: '',
    investmentExperience: '',
    riskTolerance: '',
    identityDocument: '',
    agreeTerms: false,
    agreeRisk: false,
    agreePrivacy: false,
  });

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submission to API
      try {
        const projectData = project || { id: 0, name: 'Unknown Project' };

        const response = await fetch('http://localhost:3001/api/investment/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: projectData.id,
            projectSlug: slug,
            projectName: projectData.name,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            investmentAmount: formData.investmentAmount,
            investorType: formData.investorType,
            companyName: formData.companyName,
            investmentPurpose: formData.investmentPurpose,
            investmentExperience: formData.investmentExperience,
            riskTolerance: formData.riskTolerance,
            identityDocument: formData.identityDocument,
            agreeTerms: formData.agreeTerms,
            agreeRisk: formData.agreeRisk,
            agreePrivacy: formData.agreePrivacy,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to submit application');
        }

        setSubmitted(true);

        setTimeout(() => {
          navigate(`/project-showcase/${slug}`);
        }, 5000);
      } catch (error) {
        console.error('Error submitting application:', error);
        alert('Có lỗi xảy ra khi gửi đơn. Vui lòng thử lại.');
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.email && formData.phone && formData.address;
      case 2:
        return formData.investmentAmount && formData.investorType && formData.investmentPurpose;
      case 3:
        return formData.investmentExperience && formData.riskTolerance && formData.identityDocument;
      case 4:
        return formData.agreeTerms && formData.agreeRisk && formData.agreePrivacy;
      default:
        return false;
    }
  };

  if (!project) {
    return <div>Project not found</div>;
  }

  // Success State
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-2xl"
        >
          <GlowCard color="yellow" className="p-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-white" />
            </motion.div>

            <h2 className="text-3xl font-bold mb-4">Đăng Ký Thành Công! 🎉</h2>
            <p className="text-gray-400 mb-6">
              Cảm ơn bạn đã quan tâm đầu tư vào{' '}
              <span className="text-yellow-400 font-semibold">{project.name}</span>.
            </p>
            <p className="text-gray-400 mb-8">
              Đội ngũ chúng tôi sẽ xem xét hồ sơ và liên hệ với bạn trong vòng{' '}
              <span className="text-cyan-400 font-semibold">48 giờ</span> để thảo luận chi tiết về
              cơ hội đầu tư.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <Award className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Ưu tiên xử lý</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <Shield className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Bảo mật tuyệt đối</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">ROI hấp dẫn</div>
              </div>
            </div>

            <p className="text-sm text-gray-500">Tự động quay lại trang dự án sau 5 giây...</p>
          </GlowCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Progress */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">Đăng Ký Đầu Tư</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step === currentStep
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white scale-110'
                    : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-gray-500'
                }`}
              >
                {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
              </div>
              {step < totalSteps && (
                <div
                  className={`w-12 h-1 mx-1 transition-colors ${
                    step < currentStep ? 'bg-green-500' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <div className="text-center">
          <h2 className="text-xl font-semibold text-yellow-400">
            {currentStep === 1 && 'Bước 1: Thông Tin Cá Nhân'}
            {currentStep === 2 && 'Bước 2: Chi Tiết Đầu Tư'}
            {currentStep === 3 && 'Bước 3: Kinh Nghiệm & Xác Minh'}
            {currentStep === 4 && 'Bước 4: Điều Khoản & Cam Kết'}
          </h2>
        </div>
      </motion.div>

      {/* Form Steps */}
      <form onSubmit={handleSubmit}>
        <GlowCard color="yellow" className="p-8 mb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Họ và Tên *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="email@example.com"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Số Điện Thoại *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="0901234567"
                    className="bg-white/5 border-white/10"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Địa Chỉ *
                  </label>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Số nhà, đường, quận/huyện, thành phố"
                    className="bg-white/5 border-white/10 min-h-[80px]"
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Investment Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Số Tiền Đầu Tư (VNĐ) *
                  </label>
                  <Input
                    type="number"
                    value={formData.investmentAmount}
                    onChange={(e) => updateFormData('investmentAmount', e.target.value)}
                    placeholder="100,000,000"
                    className="bg-white/5 border-white/10"
                    min="50000000"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Số tiền tối thiểu: 50,000,000 VNĐ</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Loại Nhà Đầu Tư *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'individual', label: 'Cá Nhân' },
                      { value: 'institution', label: 'Tổ Chức' },
                      { value: 'fund', label: 'Quỹ Đầu Tư' },
                    ].map((type) => (
                      <Button
                        key={type.value}
                        type="button"
                        variant={formData.investorType === type.value ? 'default' : 'outline'}
                        onClick={() => updateFormData('investorType', type.value)}
                        className={
                          formData.investorType === type.value
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                            : 'border-white/10'
                        }
                      >
                        {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {formData.investorType === 'institution' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-medium mb-2">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Tên Công Ty/Tổ Chức
                    </label>
                    <Input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateFormData('companyName', e.target.value)}
                      placeholder="ABC Investment Co., Ltd"
                      className="bg-white/5 border-white/10"
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Mục Đích Đầu Tư *
                  </label>
                  <Textarea
                    value={formData.investmentPurpose}
                    onChange={(e) => updateFormData('investmentPurpose', e.target.value)}
                    placeholder="Mô tả ngắn gọn mục đích và kỳ vọng đầu tư của bạn"
                    className="bg-white/5 border-white/10 min-h-[100px]"
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Experience & Verification */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Kinh Nghiệm Đầu Tư *</label>
                  <Textarea
                    value={formData.investmentExperience}
                    onChange={(e) => updateFormData('investmentExperience', e.target.value)}
                    placeholder="Mô tả kinh nghiệm đầu tư của bạn (nếu có)"
                    className="bg-white/5 border-white/10 min-h-[100px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mức Độ Chấp Nhận Rủi Ro *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'low', label: 'Thấp', color: 'from-green-500 to-emerald-500' },
                      {
                        value: 'medium',
                        label: 'Trung Bình',
                        color: 'from-yellow-500 to-orange-500',
                      },
                      { value: 'high', label: 'Cao', color: 'from-red-500 to-pink-500' },
                    ].map((risk) => (
                      <Button
                        key={risk.value}
                        type="button"
                        variant={formData.riskTolerance === risk.value ? 'default' : 'outline'}
                        onClick={() => updateFormData('riskTolerance', risk.value)}
                        className={
                          formData.riskTolerance === risk.value
                            ? `bg-gradient-to-r ${risk.color}`
                            : 'border-white/10'
                        }
                      >
                        {risk.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Số CMND/CCCD/Hộ Chiếu *
                  </label>
                  <Input
                    type="text"
                    value={formData.identityDocument}
                    onChange={(e) => updateFormData('identityDocument', e.target.value)}
                    placeholder="001234567890"
                    className="bg-white/5 border-white/10"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Thông tin này được bảo mật tuyệt đối</p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Legal Agreements */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.agreeTerms}
                      onChange={(e) => updateFormData('agreeTerms', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <span className="text-sm">
                      Tôi đã đọc và đồng ý với{' '}
                      <a href="#" className="text-yellow-400 hover:underline">
                        Điều Khoản & Điều Kiện
                      </a>{' '}
                      của chương trình đầu tư
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.agreeRisk}
                      onChange={(e) => updateFormData('agreeRisk', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <span className="text-sm">
                      Tôi hiểu và chấp nhận{' '}
                      <a href="#" className="text-red-400 hover:underline">
                        Các Rủi Ro
                      </a>{' '}
                      có thể xảy ra khi đầu tư vào dự án khởi nghiệp
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.agreePrivacy}
                      onChange={(e) => updateFormData('agreePrivacy', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <span className="text-sm">
                      Tôi đồng ý với{' '}
                      <a href="#" className="text-cyan-400 hover:underline">
                        Chính Sách Bảo Mật
                      </a>{' '}
                      về việc thu thập và sử dụng thông tin cá nhân
                    </span>
                  </label>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    <Shield className="w-4 h-4 inline mr-2" />
                    <strong>Lưu ý:</strong> Thông tin của bạn được bảo mật theo tiêu chuẩn quốc tế.
                    Chúng tôi cam kết không chia sẻ dữ liệu với bên thứ ba mà không có sự đồng ý của
                    bạn.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlowCard>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay Lại
          </Button>

          <Button
            type="submit"
            disabled={!canProceed()}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
          >
            {currentStep === totalSteps ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Hoàn Tất Đăng Ký
              </>
            ) : (
              <>
                Tiếp Theo
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvestmentApply;

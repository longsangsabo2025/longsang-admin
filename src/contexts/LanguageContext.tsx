import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.experience': 'Experience',
    'nav.skills': 'Skills',
    'nav.education': 'Education',
    'nav.contact': 'Contact',
    
    // Hero Section
    'hero.hello': "Hello, I'm",
    'hero.name': 'VÕ LONG SANG',
    'hero.title': 'Engineer & Leader',
    'hero.position': 'Petroleum Refining Engineer',
    'hero.subtitle': 'Business Development Specialist',
    'hero.description': 'Innovating energy solutions with technical excellence and business acumen. 5+ years of experience transforming challenges into opportunities.',
    'hero.contactMe': 'Contact Me',
    'hero.viewWork': 'View My Work',
    'hero.years': 'Years',
    'hero.oilGas': 'Oil & Gas',
    'hero.expert': 'Expert',
    'hero.businessOwner': 'Business Owner',
    'hero.scrollExplore': 'Scroll to explore',

    // About Section
    'about.badge': 'About Me',
    'about.title': 'Who I Am',
    'about.description1': 'Full-stack Developer with extensive experience in building web and mobile applications integrated with AI. Currently developing innovative solutions at AINewbieVN while managing SABO Billiards as Owner & Manager.',
    'about.description2': 'Specialized in full-stack development, AI integration, and mobile app development using cutting-edge technologies like React, TypeScript, Flutter, Node.js, and PostgreSQL. Expert in building real-time systems, designing scalable architectures, and deploying production applications on AWS, Firebase, and Vercel.',
    'about.description3': 'Passionate about leveraging technology to solve real-world problems through automation and intelligent systems. Strong background in both technical engineering and business development, with a proven track record in creating user-centric applications and managing cross-functional teams.',
    'about.dateOfBirth': 'Date of Birth',
    'about.education': 'Education',
    'about.email': 'Email',
    'about.location': 'Location',
    'about.years': 'Years of Experience',
    'about.techEngineering': 'Tech & Engineering',
    'about.projects': 'Projects Built',
    'about.webMobile': 'Web & Mobile Apps',
    'about.clients': 'Happy Clients',
    'about.industries': 'Across Industries',
    'about.fullStackDev': 'Full-stack Dev',
    'about.aiIntegration': 'AI Integration',
    'about.businessOwner': 'Business Owner',
    'about.mobileDev': 'Mobile Dev',

    // Experience Section
    'experience.badge': 'My Journey',
    'experience.title': 'Professional Experience',
    'experience.description': 'Over 5 years of diverse experience across Oil & Gas, Manufacturing, and Business Management',

    // Skills Section
    'skills.badge': 'What I Know',
    'skills.title': 'Skills & Expertise',
    'skills.description': 'A comprehensive skill set combining technical engineering knowledge with business acumen',
    'skills.technical': 'Technical Skills',
    'skills.software': 'Software & Tools',
    'skills.competencies': 'Professional Competencies',
    'skills.competenciesDesc': 'Core soft skills that drive success',
    'skills.communication': 'Communication',
    'skills.teamwork': 'Teamwork',
    'skills.problemSolving': 'Problem Solving',
    'skills.selfLearning': 'Self-Learning',

    // Education Section
    'education.badge': 'Learning Journey',
    'education.title': 'Education & Certifications',
    'education.description': 'Academic foundation and professional certifications that validate my expertise',
    'education.university': 'PetroVietnam University',
    'education.degree': 'Bachelor of Engineering',
    'education.major': 'Major',
    'education.petroleum': 'Petroleum Refining Engineering',
    'education.duration': 'Duration',
    'education.gpa': 'GPA',
    'education.language': 'Language Proficiency',
    'education.ielts': 'IELTS: 5.5 (Issued by PVU)',
    'education.certifications': 'Certifications & Training',
    'education.continuousLearning': 'Continuous Learning:',
    'education.learningDesc': 'Committed to professional development through industry certifications, safety training, and quality management systems to stay current with best practices.',

    // Contact Section
    'contact.title': "LET'S WORK TOGETHER",
    'contact.description': "Ready to start your next project? Let's create something amazing!",
    'contact.email': 'Email',
    'contact.phone': 'Phone',
    'contact.location': 'Location',
    'contact.emailDesc': 'Click to send an email',
    'contact.phoneDesc': 'Available Mon-Sat 9am-6pm',
    'contact.nameField': 'Your Name',
    'contact.emailField': 'Your Email',
    'contact.subjectField': 'Subject',
    'contact.messageField': 'Your Message',
    'contact.sendMessage': 'Send Message',
    'contact.sending': 'Sending...',

    // Footer
    'footer.quickLinks': 'Quick Links',
    'footer.services': 'Services',
    'footer.connect': 'Connect',
    'footer.downloadCV': 'Download CV',
    'footer.copyright': '© 2025 Võ Long Sang. All rights reserved.',
    'footer.madeWith': 'Made with',
    'footer.and': 'and',
    'footer.engineeringConsult': 'Engineering Consultation',
    'footer.businessDev': 'Business Development',
    'footer.operationsManagement': 'Operations Management',
    'footer.strategicAdvisory': 'Strategic Advisory',
  },
  vi: {
    // Navigation
    'nav.home': 'Trang chủ',
    'nav.about': 'Về tôi',
    'nav.experience': 'Kinh nghiệm',
    'nav.skills': 'Kỹ năng',
    'nav.education': 'Học vấn',
    'nav.contact': 'Liên hệ',
    
    // Hero Section
    'hero.hello': 'Xin chào, tôi là',
    'hero.name': 'VÕ LONG SANG',
    'hero.title': 'Kỹ sư & Nhà lãnh đạo',
    'hero.position': 'Kỹ sư Lọc dầu',
    'hero.subtitle': 'Chuyên viên Phát triển Kinh doanh',
    'hero.description': 'Đổi mới giải pháp năng lượng với kiến thức kỹ thuật và tài kinh doanh. Hơn 5 năm kinh nghiệm biến thách thức thành cơ hội.',
    'hero.contactMe': 'Liên hệ tôi',
    'hero.viewWork': 'Xem công việc',
    'hero.years': 'Năm',
    'hero.oilGas': 'Dầu khí',
    'hero.expert': 'Chuyên gia',
    'hero.businessOwner': 'Chủ doanh nghiệp',
    'hero.scrollExplore': 'Cuộn để khám phá',

    // About Section
    'about.badge': 'Về tôi',
    'about.title': 'Tôi là ai',
    'about.description1': 'Lập trình viên Full-stack với kinh nghiệm phong phú trong xây dựng ứng dụng web và mobile tích hợp AI. Hiện đang phát triển các giải pháp sáng tạo tại AINewbieVN đồng thời quản lý SABO Billiards với vai trò Chủ sở hữu & Quản lý.',
    'about.description2': 'Chuyên về phát triển full-stack, tích hợp AI và phát triển ứng dụng di động sử dụng các công nghệ tiên tiến như React, TypeScript, Flutter, Node.js và PostgreSQL. Chuyên gia xây dựng hệ thống thời gian thực, thiết kế kiến trúc có thể mở rộng và triển khai ứng dụng sản xuất trên AWS, Firebase và Vercel.',
    'about.description3': 'Đam mê việc tận dụng công nghệ để giải quyết các vấn đề thực tế thông qua tự động hóa và hệ thống thông minh. Nền tảng vững chắc về cả kỹ thuật và phát triển kinh doanh, với thành tích đã được chứng minh trong việc tạo ra các ứng dụng lấy người dùng làm trung tâm và quản lý các nhóm đa chức năng.',
    'about.dateOfBirth': 'Ngày sinh',
    'about.education': 'Học vấn',
    'about.email': 'Email',
    'about.location': 'Địa điểm',
    'about.years': 'Năm kinh nghiệm',
    'about.techEngineering': 'Công nghệ & Kỹ thuật',
    'about.projects': 'Dự án đã xây dựng',
    'about.webMobile': 'Ứng dụng Web & Mobile',
    'about.clients': 'Khách hàng hài lòng',
    'about.industries': 'Nhiều ngành nghề',
    'about.fullStackDev': 'Lập trình Full-stack',
    'about.aiIntegration': 'Tích hợp AI',
    'about.businessOwner': 'Chủ doanh nghiệp',
    'about.mobileDev': 'Lập trình Mobile',

    // Experience Section
    'experience.badge': 'Hành trình của tôi',
    'experience.title': 'Kinh nghiệm nghề nghiệp',
    'experience.description': 'Hơn 5 năm kinh nghiệm đa dạng trong lĩnh vực Dầu khí, Sản xuất và Quản lý Kinh doanh',

    // Skills Section
    'skills.badge': 'Những gì tôi biết',
    'skills.title': 'Kỹ năng & Chuyên môn',
    'skills.description': 'Bộ kỹ năng toàn diện kết hợp kiến thức kỹ thuật với tài kinh doanh',
    'skills.technical': 'Kỹ năng kỹ thuật',
    'skills.software': 'Phần mềm & Công cụ',
    'skills.competencies': 'Năng lực nghề nghiệp',
    'skills.competenciesDesc': 'Kỹ năng mềm cốt lõi thúc đẩy thành công',
    'skills.communication': 'Giao tiếp',
    'skills.teamwork': 'Làm việc nhóm',
    'skills.problemSolving': 'Giải quyết vấn đề',
    'skills.selfLearning': 'Tự học',

    // Education Section
    'education.badge': 'Hành trình học tập',
    'education.title': 'Học vấn & Chứng chỉ',
    'education.description': 'Nền tảng học thuật và chứng chỉ nghề nghiệp xác nhận chuyên môn của tôi',
    'education.university': 'Đại học Dầu khí Việt Nam',
    'education.degree': 'Kỹ sư',
    'education.major': 'Chuyên ngành',
    'education.petroleum': 'Kỹ thuật Lọc dầu',
    'education.duration': 'Thời gian',
    'education.gpa': 'Điểm trung bình',
    'education.language': 'Trình độ ngoại ngữ',
    'education.ielts': 'IELTS: 5.5 (Cấp bởi ĐH Dầu khí VN)',
    'education.certifications': 'Chứng chỉ & Đào tạo',
    'education.continuousLearning': 'Học tập liên tục:',
    'education.learningDesc': 'Cam kết phát triển nghề nghiệp thông qua các chứng chỉ ngành, đào tạo an toàn và hệ thống quản lý chất lượng để luôn cập nhật với các thực tiễn tốt nhất.',

    // Contact Section
    'contact.title': 'CÙNG NHAU LÀM VIỆC',
    'contact.description': 'Sẵn sàng bắt đầu dự án tiếp theo? Hãy cùng tạo ra điều tuyệt vời!',
    'contact.email': 'Email',
    'contact.phone': 'Điện thoại',
    'contact.location': 'Địa điểm',
    'contact.emailDesc': 'Nhấp để gửi email',
    'contact.phoneDesc': 'Có sẵn Thứ 2-7 9h-18h',
    'contact.nameField': 'Tên của bạn',
    'contact.emailField': 'Email của bạn',
    'contact.subjectField': 'Tiêu đề',
    'contact.messageField': 'Tin nhắn của bạn',
    'contact.sendMessage': 'Gửi tin nhắn',
    'contact.sending': 'Đang gửi...',

    // Footer
    'footer.quickLinks': 'Liên kết nhanh',
    'footer.services': 'Dịch vụ',
    'footer.connect': 'Kết nối',
    'footer.downloadCV': 'Tải CV',
    'footer.copyright': '© 2025 Võ Long Sang. Tất cả quyền được bảo lưu.',
    'footer.madeWith': 'Được tạo với',
    'footer.and': 'và',
    'footer.engineeringConsult': 'Tư vấn kỹ thuật',
    'footer.businessDev': 'Phát triển kinh doanh',
    'footer.operationsManagement': 'Quản lý vận hành',
    'footer.strategicAdvisory': 'Tư vấn chiến lược',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
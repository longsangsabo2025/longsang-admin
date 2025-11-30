# 📱 PROMPT TẠO TRANG CHI TIẾT SẢN PHẨM APP - LOVABLE AI

---

## 🎯 PROMPT CHÍNH

```
TẠO TRANG CHI TIẾT SẢN PHẨM APP - MOBILE-FIRST TRAVEL/BOOKING APP

===================================
🎯 MỤC TIÊU DỰ ÁN
===================================

Tạo một trang landing page/product showcase cho ứng dụng di động (Travel/Booking App) với thiết kế HIỆN ĐẠI, MOBILE-FIRST, sử dụng iPhone mockups, blue gradient theme, glass morphism effects, và floating card layout.

MỤC TIÊU:
- Showcase ứng dụng mobile với nhiều màn hình khác nhau
- Tạo cảm giác premium, hiện đại, professional
- Responsive hoàn toàn (desktop → mobile)
- Smooth animations và interactions
- Có thể dễ dàng thay đổi nội dung/hình ảnh sau

===================================
🎨 DESIGN SYSTEM
===================================

COLOR PALETTE:
┌─────────────────────────────────────────┐
│ Primary Gradient: #0f172a → #1e3a8a     │
│ Accent Blue: #3b82f6 → #60a5fa          │
│ Dark Navy: #0a0f1e                      │
│ Light Blue: #60a5fa                     │
│ White: #ffffff                          │
│ Glass BG: rgba(255, 255, 255, 0.1)      │
│ Shadow: rgba(0, 0, 0, 0.25)             │
└─────────────────────────────────────────┘

TYPOGRAPHY:
- Font Family: 'Inter', 'SF Pro Display', system-ui
- Heading Size: 48px - 72px (bold, 700-900)
- Subheading: 24px - 32px (medium, 500-600)
- Body: 16px - 18px (regular, 400)
- Small: 14px (400)
- Letter Spacing: -0.02em (tight) cho headings

SPACING:
- Container: max-width 1400px
- Section padding: 80px vertical
- Card gap: 32px
- Inner padding: 24px
- Border radius cards: 24px
- Border radius buttons: 9999px (full rounded)

===================================
🏗️ PAGE STRUCTURE
===================================

LAYOUT: Single page với multiple sections

┌─────────────────────────────────────────────┐
│  1. HERO SECTION (Fullscreen + Headline)    │
├─────────────────────────────────────────────┤
│  2. FEATURE SHOWCASE (Grid of Phone Mocks)  │
├─────────────────────────────────────────────┤
│  3. HOW IT WORKS (Optional)                 │
├─────────────────────────────────────────────┤
│  4. CTA SECTION                             │
├─────────────────────────────────────────────┤
│  5. FOOTER                                  │
└─────────────────────────────────────────────┘

===================================
📱 CHI TIẾT SECTIONS
===================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ HERO SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HEIGHT: 100vh
BACKGROUND: 
- Dark navy gradient (#0a0f1e → #1e3a8a)
- Animated star particles
- Subtle grid pattern overlay
- Glow effects around phones

LAYOUT: Centered content

┌──────────────────────────────────────┐
│                                      │
│  [Badge] New App Launch 🚀           │
│                                      │
│  Mobile-first approach               │
│  to ensure flawless                  │
│  usability                           │
│  [Huge heading, gradient text]       │
│                                      │
│  Optimized mobile experience         │
│  for all devices                     │
│  [Subtitle, lighter color]           │
│                                      │
│  [CTA Buttons]                       │
│  [Download App] [Learn More]         │
│                                      │
│  [Scroll indicator]                  │
│                                      │
└──────────────────────────────────────┘

TEXT STYLING:
- Main heading: 
  - Size: 64px - 80px
  - Weight: 800
  - Line height: 1.1
  - Gradient: white → light blue
  - Text align: center
  
- Subtitle:
  - Size: 18px - 20px
  - Color: rgba(255, 255, 255, 0.7)
  - Max width: 600px
  - Center aligned

ANIMATIONS:
- Heading: Fade in + slide up
- Buttons: Stagger animation
- Particles: Continuous float
- Background: Slow gradient shift

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ FEATURE SHOWCASE SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKGROUND: Dark navy với subtle pattern

LAYOUT: Bento Box / Masonry Grid

┌─────────────────────────────────────────────────┐
│  KEY FEATURES                                   │
│  [Section heading - centered]                   │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Phone   │ │  Phone   │ │  Phone   │       │
│  │  Mock 1  │ │  Mock 2  │ │  Mock 3  │       │
│  │  Large   │ │  Large   │ │  Small   │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Phone   │ │  Phone   │ │  Phone   │       │
│  │  Mock 4  │ │  Mock 5  │ │  Mock 6  │       │
│  │  Small   │ │  Large   │ │  Small   │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  [Grid với varying sizes]                      │
└─────────────────────────────────────────────────┘

PHONE MOCKUP COMPONENT TEMPLATE:

┌────────────────────────────────────┐
│  [iPhone Frame - Dark]             │
│  ┌──────────────────────────────┐  │
│  │ [Notch at top]               │  │
│  │                              │  │
│  │  [Screen Content Area]       │  │
│  │                              │  │
│  │  • Background: Blue gradient │  │
│  │  • Placeholder content       │  │
│  │  • Cards/buttons/text        │  │
│  │                              │  │
│  │  [Home indicator bar]        │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘

SCREEN CONTENT ELEMENTS (Reusable Components):

A. SEARCH SCREEN:
┌──────────────────────────────┐
│  [Icon row - 5 icons]        │
│  [Search bar + button]       │
│  [Info pills: city, price]   │
│  [CTA button]                │
│  [Background: gradient]      │
└──────────────────────────────┘

B. CARD LIST SCREEN:
┌──────────────────────────────┐
│  [Heading + filter button]   │
│  [Card with image]           │
│    - Location badge          │
│    - Title                   │
│    - Price                   │
│    - CTA button              │
│  [Repeat cards]              │
└──────────────────────────────┘

C. DETAIL SCREEN:
┌──────────────────────────────┐
│  [Toggle/menu icon]          │
│  [Large heading]             │
│  [Hero image card]           │
│  [Info section]              │
│  [CTA button]                │
└──────────────────────────────┘

D. BOOKING FORM SCREEN:
┌──────────────────────────────┐
│  [Transport icons row]       │
│  [Heading]                   │
│  [Toggle: one-way/round]     │
│  [Input fields stack]        │
│  [Search button]             │
└──────────────────────────────┘

GRID SYSTEM:
- Desktop: 3-4 columns
- Tablet: 2 columns
- Mobile: 1 column
- Gap: 40px
- Varying heights (masonry)

PHONE SIZES:
- Large: 400px height
- Medium: 350px height
- Small: 300px height

HOVER EFFECTS:
- Phone lift (translateY -10px)
- Glow border blue
- Shadow increase
- Scale 1.02
- Screen content parallax scroll

ANIMATIONS:
- Phones: Scroll-triggered fade + slide in
- Stagger delay: 0.1s between each
- Hover: Smooth transitions 0.3s
- Screen content: Subtle float animation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣ REUSABLE UI COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📌 PHONE MOCKUP FRAME:

Component: PhoneMockup
Props: 
  - size: 'small' | 'medium' | 'large'
  - children: React.ReactNode (screen content)
  - className?: string

Structure:
- Outer div: Phone bezel (dark, rounded)
- Notch: Top center cutout
- Screen area: Blue gradient background
- Bottom indicator: Home bar
- Shadow: Multiple layers for depth

📌 SCREEN CARD:

Component: ScreenCard
Props:
  - title?: string
  - image?: string
  - badges?: string[]
  - buttons?: ButtonProps[]
  - layout: 'search' | 'list' | 'detail' | 'form'

Features:
- Glass morphism background
- Rounded corners 20px
- Padding 20px
- Backdrop blur
- Border subtle white

📌 ICON ROW:

Component: IconRow
Props:
  - icons: Icon[] (from lucide-react)
  - size: number
  - spacing: string

Style:
- Flex row with gap
- Icon size: 24px
- Color: white with opacity
- Hover: scale + opacity change

📌 SEARCH BAR:

Component: SearchBar
Props:
  - placeholder: string
  - buttonIcon: Icon
  - onSearch: () => void

Style:
- Background: white
- Height: 56px
- Border radius: 9999px
- Padding: 4px
- Right button: blue circle
- Shadow: soft

📌 PILL BADGE:

Component: PillBadge
Props:
  - text: string
  - icon?: Icon
  - variant: 'default' | 'accent'

Style:
- Background: rgba(255,255,255,0.15)
- Padding: 8px 16px
- Border radius: 9999px
- Font size: 14px
- Backdrop blur

📌 ACTION BUTTON:

Component: ActionButton
Props:
  - label?: string
  - icon: Icon
  - variant: 'primary' | 'secondary'
  - size: 'small' | 'large'

Style:
- Primary: Blue gradient + white icon
- Secondary: White + blue icon
- Size small: 48x48px
- Size large: 56x56px + text
- Border radius: 9999px
- Shadow: glow effect

📌 IMAGE CARD:

Component: ImageCard
Props:
  - image: string
  - alt: string
  - badges?: Badge[]
  - overlay?: boolean

Style:
- Border radius: 16px
- Aspect ratio: 4:3
- Overlay gradient: bottom to top
- Object fit: cover
- Position badges: absolute

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣ CTA SECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BACKGROUND: Gradient overlay

┌──────────────────────────────────────┐
│                                      │
│  Ready to get started?               │
│  [Large heading]                     │
│                                      │
│  Download the app and start          │
│  your journey today                  │
│  [Subtitle]                          │
│                                      │
│  [Download on App Store]             │
│  [Get it on Google Play]             │
│                                      │
└──────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣ FOOTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Simple dark footer với:
- Logo + description
- Links (Privacy, Terms, Contact)
- Social icons
- Copyright

===================================
🎬 ANIMATIONS & INTERACTIONS
===================================

SCROLL ANIMATIONS:
- Elements fade + slide in when entering viewport
- Use Intersection Observer
- Stagger delay for multiple elements
- Progress indicator (optional)

HOVER STATES:
- Buttons: Scale 1.05 + glow
- Cards: Lift + shadow increase
- Links: Underline slide
- Icons: Rotate + color change

MICRO-INTERACTIONS:
- Button ripple on click
- Smooth scroll to sections
- Phone screen content scrolls on hover
- Particle background continuous movement
- Gradient background slow animation

LOADING STATES:
- Skeleton screens
- Lazy load images
- Progressive image loading

===================================
📱 RESPONSIVE DESIGN
===================================

DESKTOP (>1200px):
- Grid: 3-4 columns
- Phone mockups: Large sizes
- Full feature showcase
- Side-by-side layouts

TABLET (768px - 1199px):
- Grid: 2 columns
- Phone mockups: Medium sizes
- Stacked some sections
- Reduce spacing 20%

MOBILE (<767px):
- Grid: 1 column
- Phone mockups: Smaller (280px)
- All content stacked
- Larger touch targets
- Simplified animations

===================================
🛠️ TECHNICAL REQUIREMENTS
===================================

TECH STACK:
- React 18+ with TypeScript
- Tailwind CSS 3+ (custom config)
- Framer Motion (animations)
- Lucide React (icons)
- React Intersection Observer (scroll animations)

PROJECT STRUCTURE:
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Section.tsx
│   ├── phones/
│   │   ├── PhoneMockup.tsx
│   │   ├── ScreenCard.tsx
│   │   └── PhoneGrid.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── SearchBar.tsx
│   │   ├── Badge.tsx
│   │   ├── IconRow.tsx
│   │   └── ImageCard.tsx
│   └── sections/
│       ├── HeroSection.tsx
│       ├── FeaturesSection.tsx
│       ├── CTASection.tsx
│       └── FooterSection.tsx
├── data/
│   └── mock-screens.ts
├── styles/
│   └── globals.css
└── App.tsx

CUSTOM TAILWIND CONFIG:
theme: {
  extend: {
    colors: {
      'app-dark': '#0a0f1e',
      'app-navy': '#1e3a8a',
      'app-blue': '#3b82f6',
      'app-light-blue': '#60a5fa',
    },
    backgroundImage: {
      'blue-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
      'glass': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    },
    backdropBlur: {
      'glass': '20px',
    },
    boxShadow: {
      'phone': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      'glow': '0 0 30px rgba(59, 130, 246, 0.3)',
    },
  }
}

PLACEHOLDER CONTENT:
- Use placeholder images (Unsplash API hoặc static)
- Lorem ipsum cho text
- Generic icons từ Lucide
- Sample data cho cards

FEATURES:
✅ Fully responsive
✅ Smooth animations
✅ Dark theme
✅ Glass morphism effects
✅ iPhone mockups với notch
✅ Bento box layout
✅ Hover effects
✅ Scroll animations
✅ Reusable components
✅ Easy to update content
✅ Fast loading
✅ Optimized images
✅ Accessibility (WCAG AA)

===================================
🎯 DELIVERABLES
===================================

1. Landing page với hero section
2. Feature showcase với phone mockups (6-8 phones)
3. Reusable PhoneMockup component
4. Reusable UI components (buttons, cards, badges)
5. Mock screen content layouts (4-5 variations)
6. CTA section
7. Footer
8. Fully responsive
9. Smooth animations
10. Clean, maintainable code
11. TypeScript types
12. Component documentation

===================================
💡 IMPORTANT NOTES
===================================

- Focus on STRUCTURE and LAYOUT, not actual content
- Use placeholder images và text
- Make components HIGHLY REUSABLE
- Content should be easy to swap out later
- Optimize for visual impact
- Ensure smooth 60fps animations
- Mobile-first approach
- Clean code với TypeScript
- Component-based architecture

MOCKUP CONTENT IDEAS (Placeholders):
- Search screens với city names
- Card lists với destinations
- Booking forms
- Event detail screens
- Hotel listings
- Flight search results

Tạo một landing page CỰC KỲ ẤN TƯỢNG với foundation vững chắc, dễ dàng customize nội dung sau này!
```

---

## 📋 HƯỚNG DẪN SỬ DỤNG

1. **Copy toàn bộ nội dung** trong phần "PROMPT CHÍNH" ở trên
2. **Paste vào Lovable AI** (lovable.dev)
3. **Chờ AI generate** - Thường mất 2-5 phút
4. **Review và adjust** nếu cần
5. **Thay thế content** sau khi foundation đã xong

---

## 🎯 KẾT QUẢ MONG ĐỢI

✅ **Foundation hoàn chỉnh**: Layout + structure professional
✅ **Phone mockups**: Component tái sử dụng cao
✅ **UI Components**: Buttons, cards, badges reusable
✅ **Animations mượt**: Framer Motion integration
✅ **Responsive perfect**: Desktop → Tablet → Mobile
✅ **Easy customization**: Chỉ cần swap content/images

---

## 🚀 BƯỚC TIẾP THEO

1. Generate trang với Lovable AI
2. Test responsive trên các devices
3. Screenshot các màn hình app thực tế của bạn
4. Thay thế placeholder content bằng content thật
5. Fine-tune colors/spacing theo brand
6. Deploy lên Vercel/Netlify

---

## 💡 TIPS

- Nếu muốn thay đổi màu sắc, chỉnh phần COLOR PALETTE
- Nếu muốn thêm/bớt sections, chỉnh PAGE STRUCTURE
- Nếu cần thêm components, mô tả trong REUSABLE UI COMPONENTS
- Lovable AI có thể regenerate từng component riêng nếu cần

---

## 📞 SUPPORT

Nếu cần điều chỉnh prompt hoặc có vấn đề gì, hãy cho tôi biết!

Good luck! 🎉

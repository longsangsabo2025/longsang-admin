# 📧 Email Templates Documentation

## 📋 Available Templates

### 1. **Welcome Email** (`welcome-email.html`)
**Use Case:** New user registration, onboarding

**Variables:**
```javascript
{
  user_name: "Nguyễn Văn A",
  company_name: "Long Sang Portfolio",
  activation_link: "https://domain.com/activate?token=xxx",
  feature_1: "Truy cập dashboard cá nhân",
  feature_2: "Kết nối với cộng đồng",
  feature_3: "Nhận ưu đãi độc quyền",
  support_email: "support@longsang.org",
  company_address: "Ho Chi Minh City, Vietnam",
  website_url: "https://longsang.org",
  unsubscribe_link: "https://domain.com/unsubscribe"
}
```

---

### 2. **Order Confirmation** (`order-confirmation.html`)
**Use Case:** E-commerce order confirmation

**Variables:**
```javascript
{
  customer_name: "Nguyễn Văn A",
  order_id: "ORD-2025-001",
  order_date: "23/11/2025",
  order_status: "Đang xử lý",
  products: [
    {
      product_name: "Sản phẩm A",
      quantity: 2,
      price: "500,000đ"
    }
  ],
  total_amount: "1,000,000đ",
  shipping_name: "Nguyễn Văn A",
  shipping_phone: "0909123456",
  shipping_address: "123 Đường ABC, Quận 1, TP.HCM",
  tracking_link: "https://domain.com/track/ORD-2025-001",
  support_email: "support@longsang.org",
  company_name: "Long Sang Shop"
}
```

---

### 3. **Password Reset** (`password-reset.html`)
**Use Case:** User requests password reset

**Variables:**
```javascript
{
  user_name: "Nguyễn Văn A",
  reset_link: "https://domain.com/reset-password?token=xxx",
  expiry_time: "30 phút",
  support_email: "support@longsang.org",
  company_name: "Long Sang Portfolio"
}
```

---

### 4. **Newsletter** (`newsletter.html`)
**Use Case:** Marketing campaigns, newsletters

**Variables:**
```javascript
{
  company_name: "Long Sang Media",
  logo_url: "https://domain.com/logo.png",
  hero_image_url: "https://domain.com/hero.jpg",
  newsletter_title: "Tin tức tháng 11/2025",
  newsletter_intro: "Những cập nhật mới nhất từ chúng tôi...",
  
  article_1_image: "https://domain.com/article1.jpg",
  article_1_title: "Tiêu đề bài viết 1",
  article_1_excerpt: "Mô tả ngắn...",
  article_1_link: "https://domain.com/article/1",
  
  article_2_image: "https://domain.com/article2.jpg",
  article_2_title: "Tiêu đề bài viết 2",
  article_2_excerpt: "Mô tả ngắn...",
  article_2_link: "https://domain.com/article/2",
  
  cta_title: "Khám phá ngay!",
  cta_description: "Trải nghiệm tính năng mới...",
  cta_button_text: "Xem ngay",
  cta_link: "https://domain.com/promo",
  
  facebook_url: "https://facebook.com/longsang",
  instagram_url: "https://instagram.com/longsang",
  linkedin_url: "https://linkedin.com/in/longsang",
  youtube_url: "https://youtube.com/@longsang",
  
  company_address: "Ho Chi Minh City, Vietnam",
  unsubscribe_link: "https://domain.com/unsubscribe"
}
```

---

## 🚀 How to Use in n8n

### Method 1: HTML Template Node
```javascript
// In n8n workflow
const template = await $('Email Template').html;
const variables = {
  user_name: $json.name,
  company_name: "Long Sang"
};

// Replace variables
let html = template;
Object.keys(variables).forEach(key => {
  html = html.replace(new RegExp(`{{${key}}}`, 'g'), variables[key]);
});

return { html };
```

### Method 2: Function Node
```javascript
const fs = require('fs');
const path = require('path');

// Read template
const templatePath = 'D:/0.PROJECTS/00-MASTER-ADMIN/longsang-admin/templates/emails/welcome-email.html';
let template = fs.readFileSync(templatePath, 'utf8');

// Replace variables
const vars = {
  user_name: $json.name,
  company_name: "Long Sang Portfolio",
  activation_link: `https://longsang.org/activate?token=${$json.token}`
};

Object.keys(vars).forEach(key => {
  template = template.replace(new RegExp(`{{${key}}}`, 'g'), vars[key]);
});

return [{ json: { html: template } }];
```

### Method 3: Send Email Node (Gmail)
```yaml
To: {{ $json.email }}
Subject: Chào mừng đến với Long Sang!
Email Type: HTML
HTML: {{ $node["Function"].json.html }}
```

---

## 📊 Template Best Practices

### 1. Responsive Design
✅ Tất cả templates đều responsive  
✅ Test trên: Gmail, Outlook, Apple Mail  
✅ Mobile-friendly (width: 600px max)  

### 2. Email Deliverability
✅ Inline CSS (không dùng external stylesheets)  
✅ Avoid spam trigger words  
✅ Include unsubscribe link  
✅ Plain text alternative (recommended)  

### 3. Security
✅ Validate all input variables  
✅ Sanitize user-generated content  
✅ Use HTTPS for all links  
✅ Token expiration for sensitive actions  

---

## 🧪 Testing

### Test Template Rendering
```powershell
# Test script
cd D:\0.PROJECTS\00-MASTER-ADMIN\longsang-admin\templates\emails

# Open in browser
Start-Process "welcome-email.html"
```

### Test Email Sending
```javascript
// n8n Function Node
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'longsangsabo@gmail.com',
    pass: 'your-app-password'
  }
});

await transporter.sendMail({
  from: 'admin@longsang.org',
  to: 'test@example.com',
  subject: 'Test Email',
  html: $json.html
});

return { success: true };
```

---

## 🎨 Customization Guide

### Change Colors
```html
<!-- Primary Color -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Success Color -->
background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);

<!-- Warning Color -->
background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);

<!-- Danger Color -->
background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
```

### Add New Section
```html
<tr>
    <td style="padding: 20px 30px;">
        <h2 style="color: #333333; font-size: 20px;">New Section</h2>
        <p style="color: #666666; font-size: 15px;">Content here...</p>
    </td>
</tr>
```

---

## 📂 File Structure

```
templates/
├── emails/
│   ├── welcome-email.html          # Onboarding
│   ├── order-confirmation.html     # E-commerce
│   ├── password-reset.html         # Security
│   ├── newsletter.html             # Marketing
│   └── README.md                   # This file
└── n8n-integration/
    └── email-templates-workflow.json
```

---

## 🔗 Integration Examples

### Example 1: Welcome Email on Registration
```javascript
// Trigger: Webhook (user registration)
// Variables from form:
const user = {
  name: $json.fullName,
  email: $json.email,
  token: generateToken()
};

// Load & populate template
const html = loadTemplate('welcome-email', {
  user_name: user.name,
  activation_link: `https://longsang.org/activate?token=${user.token}`,
  company_name: "Long Sang Portfolio"
});

// Send via Gmail
sendEmail(user.email, "Chào mừng!", html);
```

### Example 2: Order Confirmation
```javascript
// Trigger: Order completed
const order = $json.order;

const html = loadTemplate('order-confirmation', {
  customer_name: order.customer.name,
  order_id: order.id,
  order_date: new Date().toLocaleDateString('vi-VN'),
  products: order.items,
  total_amount: formatCurrency(order.total)
});

sendEmail(order.customer.email, `Đơn hàng #${order.id}`, html);
```

---

## 💡 Pro Tips

1. **Preheader Text:** Add invisible text for email preview
```html
<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
  Preview text here (50-100 characters)
</span>
```

2. **Track Opens:** Add tracking pixel
```html
<img src="https://domain.com/track/email-open?id={{email_id}}" width="1" height="1" alt="">
```

3. **Dark Mode Support:**
```html
@media (prefers-color-scheme: dark) {
  .dark-mode { background-color: #1a1a1a !important; }
}
```

---

**Last Updated:** 2025-11-23  
**Maintained By:** Long Sang  
**Version:** 1.0

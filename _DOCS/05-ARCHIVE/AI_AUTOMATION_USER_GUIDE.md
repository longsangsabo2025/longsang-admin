# 🤖 Hướng Dẫn Sử Dụng Hệ Thống AI & Automation

## 📋 Tổng Quan 3 Tab Chính

Hệ thống có 3 giao diện riêng biệt, mỗi cái phục vụ một mục đích và đối tượng người dùng khác nhau:

### 1. 🔧 **Quy Trình AI** (Developer Testing)

- **URL**: `/admin/workflows`
- **Đối tượng**: Developers, Technical Admins
- **Mục đích**: Test và debug workflows trong môi trường development

#### Chức Năng

- ✅ **Workflow Tester**: Test workflows trực tiếp trên giao diện
- ✅ **Debug Tools**: Xem logs, errors, execution traces
- ✅ **Manual Execution**: Chạy workflows với custom input data
- ✅ **Validation**: Kiểm tra logic workflows trước khi deploy

#### Khi Nào Sử Dụng

- 🛠️ Khi đang phát triển workflows mới
- 🐛 Khi cần debug lỗi trong workflows
- 🧪 Khi muốn test workflows với data khác nhau
- 📊 Khi cần xem chi tiết execution flow

#### Ví Dụ Use Cases

```
✓ Test workflow "Generate Blog Post" với topic khác nhau
✓ Debug lỗi "Email not sent" trong Lead Nurture workflow  
✓ Validate logic của Social Media post generator
✓ Kiểm tra performance của Analytics workflow
```

---

### 2. 👤 **Trung Tâm Tự Động** (User Dashboard)

- **URL**: `/automation`
- **Đối tượng**: End Users, Business Users, Marketers
- **Mục đích**: Xem và chạy automation agents, theo dõi hoạt động

#### Chức Năng

- ✅ **Agent Overview**: Xem tất cả AI agents đang chạy
- ✅ **Quick Actions**: Bật/tắt agents, chạy manual
- ✅ **Activity Monitor**: Theo dõi hoạt động real-time
- ✅ **Content Queue**: Xem nội dung đang chờ publish
- ✅ **Stats Dashboard**: Metrics tổng quan (runs, success rate, etc.)

#### Khi Nào Sử Dụng

- 📊 Xem tổng quan hệ thống automation
- ▶️ Chạy agents manually khi cần
- 👀 Theo dõi content queue và activity logs
- 📈 Xem metrics và performance

#### Ví Dụ Use Cases

```
✓ Marketer muốn xem Content Writer Agent đã tạo bao nhiêu bài
✓ Sales muốn chạy Lead Nurture Agent cho contacts mới
✓ Manager muốn xem tổng quan automation performance
✓ User muốn pause Social Media Agent tạm thời
```

#### Các Tab Con

1. **🌐 Website Agents**: Agents liên quan đến website
2. **💼 Business Agents**: CRM, Marketing, Operations agents
3. **📊 Analytics**: Xem tất cả agents và metrics chi tiết

---

### 3. ⚙️ **Trung Tâm Agent** (Admin Management)

- **URL**: `/agent-center`
- **Đối tượng**: System Admins, Developers
- **Mục đích**: Full CRUD cho agents, workflows, tools, và analytics

#### Chức Năng (6 Tabs)

##### 📌 **Agents Tab**

- ✅ CRUD operations: Create, Read, Update, Delete agents
- ✅ Agent configuration: Config AI models, prompts, capabilities
- ✅ Status management: Activate, deactivate, pause agents
- ✅ Stats tracking: Executions, success rate, costs

##### 📌 **Marketplace Tab**

- ✅ Browse agent templates
- ✅ Import pre-built agents
- ✅ Share custom agents
- ✅ Community marketplace

##### 📌 **Workflows Tab**

- ✅ Create complex multi-agent workflows
- ✅ Sequential, parallel, conditional flows
- ✅ Workflow templates
- ✅ Execution history

##### 📌 **Tools Tab**

- ✅ Browse all available tools
- ✅ Tool categories (Search, Communication, etc.)
- ✅ Usage statistics
- ✅ Tool configuration

##### 📌 **Executions Tab**

- ✅ Complete execution history
- ✅ Real-time status tracking
- ✅ Error logs and debugging
- ✅ Cost tracking per execution

##### 📌 **Analytics Tab**

- ✅ Deep dive analytics
- ✅ Charts: Execution trends, cost analysis
- ✅ Agent performance comparison
- ✅ Tool usage patterns

#### Khi Nào Sử Dụng

- 🔨 Tạo agents mới từ scratch
- ⚙️ Cấu hình chi tiết agents (prompts, models, etc.)
- 🔧 Build workflows phức tạp với nhiều steps
- 📊 Xem deep analytics và insights
- 🛠️ Quản lý toàn bộ hệ thống automation

#### Ví Dụ Use Cases

```
✓ Admin tạo agent mới "Invoice Processor"
✓ Developer build workflow "Content Pipeline" (Research → Write → Publish)
✓ Tech lead xem execution logs để debug issues
✓ Manager analyze cost trends và optimize spending
✓ Admin configure tools và permissions
```

---

## 🎯 So Sánh 3 Tabs

| Tính Năng | Developer Testing 🔧 | User Dashboard 👤 | Admin Management ⚙️ |
|-----------|---------------------|-------------------|-------------------|
| **View Agents** | ❌ | ✅ View only | ✅ Full CRUD |
| **Run Agents** | ❌ | ✅ Quick run | ✅ Advanced run |
| **Test Workflows** | ✅ Advanced testing | ❌ | ✅ Create & test |
| **Debug Tools** | ✅ Full debug | ❌ | ✅ Execution logs |
| **Activity Logs** | ✅ Detailed traces | ✅ Recent logs | ✅ Complete history |
| **Analytics** | ❌ | ✅ Basic stats | ✅ Deep analytics |
| **Configuration** | ❌ | ❌ | ✅ Full config |
| **Target User** | Developers | End Users | Admins |

---

## 🚀 Workflow Thực Tế

### Scenario 1: Tạo Agent Mới

```
1. Admin Management (⚙️) → Agents Tab → Create Agent
2. Configure: Name, Type, AI Model, Prompts, Capabilities
3. Developer Testing (🔧) → Test agent với sample data
4. Fix any issues, refine prompts
5. User Dashboard (👤) → Agent xuất hiện, users có thể dùng
```

### Scenario 2: Debug Agent Lỗi

```
1. User Dashboard (👤) → Thấy agent failed
2. Admin Management (⚙️) → Executions Tab → Xem error logs
3. Developer Testing (🔧) → Test lại với same input
4. Admin Management (⚙️) → Fix config → Update agent
5. Developer Testing (🔧) → Verify fix works
```

### Scenario 3: Daily Operations

```
1. User Dashboard (👤) → Xem tổng quan hàng ngày
2. Check activity logs, content queue
3. Run agents manually nếu cần
4. Admin Management (⚙️) → Xem analytics tuần/tháng (cuối tuần)
5. Developer Testing (🔧) → Chỉ dùng khi có issues
```

---

## 📱 Truy Cập Nhanh

### URL Shortcuts

```bash
# User Dashboard (Daily use)
http://localhost:8080/automation

# Admin Management (Configuration)
http://localhost:8080/agent-center

# Developer Testing (Debug only)
http://localhost:8080/admin/workflows
```

### Navigation trong Admin Panel

```
Admin Panel → AI & Automation
├── 🔧 Developer Testing    → Quy Trình AI
├── 👤 User Dashboard       → Trung Tâm Tự Động  
└── ⚙️ Admin Management     → Trung Tâm Agent
```

---

## 💡 Best Practices

### Developers

1. ✅ Test agents kỹ trong Developer Testing trước khi enable cho users
2. ✅ Dùng Admin Management để tạo và config agents
3. ✅ Monitor execution logs thường xuyên
4. ✅ Optimize prompts dựa trên analytics

### Users

1. ✅ Chỉ cần dùng User Dashboard cho daily operations
2. ✅ Chạy agents manually khi cần instant results
3. ✅ Check activity logs để hiểu agents đang làm gì
4. ✅ Report issues cho admins qua User Dashboard

### Admins

1. ✅ Dùng Admin Management để quản lý toàn bộ system
2. ✅ Review analytics weekly để optimize
3. ✅ Monitor costs và set budgets
4. ✅ Create workflows để automate complex tasks

---

## 🆘 Troubleshooting

### Agent Không Chạy

```
1. User Dashboard → Check agent status (active/paused)
2. Admin Management → Executions → Check error logs
3. Developer Testing → Test manually với debug logs
4. Admin Management → Agents → Check configuration
```

### Performance Issues

```
1. Admin Management → Analytics → Check execution trends
2. Admin Management → Executions → Identify slow agents
3. Developer Testing → Test và optimize
4. Admin Management → Update agent config (reduce tokens, etc.)
```

### High Costs

```
1. Admin Management → Analytics → Cost analysis chart
2. Admin Management → Executions → Filter by cost
3. Admin Management → Agents → Optimize high-cost agents
4. User Dashboard → Pause unnecessary agents
```

---

## 🎓 Training Path

### Level 1: User (Tuần 1)

- ✅ Learn User Dashboard interface
- ✅ Run agents manually
- ✅ Understand activity logs
- ✅ Monitor content queue

### Level 2: Admin (Tuần 2-3)

- ✅ Create simple agents
- ✅ Configure agent settings
- ✅ Understand analytics
- ✅ Build basic workflows

### Level 3: Developer (Tuần 4+)

- ✅ Build complex workflows
- ✅ Debug execution issues
- ✅ Optimize agent performance
- ✅ Create custom tools

---

## 📞 Support

- **User Questions**: Check User Dashboard first
- **Configuration Issues**: Admin Management → Documentation
- **Technical Problems**: Developer Testing → Debug logs
- **Feature Requests**: Submit via Admin Management → Feedback

---

**Tóm lại**:

- 🔧 **Developer Testing**: Test & debug
- 👤 **User Dashboard**: Daily operations
- ⚙️ **Admin Management**: Full control

Mỗi tab có vai trò riêng, phân quyền rõ ràng, và phục vụ đúng nhu cầu của từng user group!

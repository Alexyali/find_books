# 智能书籍推荐系统

基于用户心情的智能书籍推荐网页应用。用户可以输入或选择当前的心情状态，系统将通过火山引擎豆包大模型分析用户心情并推荐适合的书籍。支持按类别浏览和收藏管理功能。

## 功能特点

- 📝 自定义心情输入或快速选择预设心情
- 🤖 基于火山引擎豆包大模型的智能推荐
- 📚 每次推荐 3-5 本书籍，包含书名、作者和推荐理由
- 🏷️ 支持 12 大类别书籍分类，可按类别筛选推荐
- ⭐ 收藏夹功能：一键收藏喜欢的书籍
- 📂 按类别分组管理收藏的书籍
- 💾 本地存储：收藏数据持久化保存
- 💫 简洁美观的响应式界面设计
- ⚡ 实时加载状态和友好的错误提示

## 技术栈

**前端:**
- HTML5
- CSS3
- Vanilla JavaScript

**后端:**
- Python 3.8+
- Flask
- 火山引擎 ARK SDK (volcenginesdkarkruntime)
- python-dotenv

## 安装步骤

### 1. 克隆或下载项目

```bash
git clone git@github.com:Alexyali/find_books.git
cd find_books
```

### 2. 安装 Python 依赖

确保你已经安装了 Python 3.8 或更高版本。

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`：

```bash
copy .env.example .env
```

编辑 `.env` 文件，填入你的火山引擎 ARK API 密钥：

```
ARK_API_KEY=your_actual_api_key_here
FLASK_ENV=development
PORT=5000
```

**获取火山引擎 ARK API 密钥:**
1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 登录或注册账号
3. 在「API 访问」页面创建新的 API Key
4. 复制 API Key 并粘贴到 `.env` 文件中

**参考文档:**
- [火山引擎 ARK 快速开始](https://www.volcengine.com/docs/82379/1099455)
- [API Key 管理](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)

## 运行方法

### 启动开发服务器

```bash
python app.py
```

服务器将在 `http://localhost:5000` 启动。

### 使用应用

1. 在浏览器中打开 `http://localhost:5000`
2. 输入你当前的心情，或点击预设的心情选项
3. （可选）选择感兴趣的书籍类别，支持多选
4. 点击"获取推荐"按钮
5. 等待几秒钟，系统将显示推荐的书籍列表
6. 点击书籍卡片上的星星图标收藏喜欢的书籍
7. 切换到"收藏夹"标签查看和管理你的收藏

## 项目结构

```
find_books/
├── app.py                  # Flask 后端应用主文件
├── requirements.txt        # Python 依赖列表
├── .env.example           # 环境变量配置模板
├── .gitignore             # Git 忽略文件配置
├── README.md              # 项目说明文档
├── LICENSE                # 许可证文件
├── test_api.py            # API 连接测试脚本
├── test_single_mood.py    # 单一心情测试
├── static/                # 静态资源目录
│   ├── style.css         # 样式表（包含收藏夹样式）
│   └── script.js         # 客户端 JavaScript（包含收藏夹逻辑）
└── templates/             # HTML 模板目录
    └── index.html        # 主页面模板（包含收藏夹视图）
```

## API 接口说明

### GET /

返回主页面 HTML。

### GET /api/categories

获取所有可用的书籍类别列表。

**成功响应 (200):**
```json
{
  "categories": [
    {
      "id": "literature",
      "name": "文学类",
      "subcategories": ["小说", "散文", "诗歌", "经典名著", "当代文学", "外国文学"]
    }
  ]
}
```

**命令行测试示例:**

使用 curl (Git Bash / Linux / macOS):
```bash
curl http://localhost:5000/api/categories
```

使用 PowerShell (Windows):
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/categories" -Method Get | ConvertTo-Json -Depth 10
```

### POST /api/recommend

接收用户心情和可选的类别偏好，返回书籍推荐。

**请求体:**
```json
{
  "mood": "用户心情描述",
  "categories": ["literature", "technology"]  // 可选
}
```

**成功响应 (200):**
```json
{
  "recommendations": [
    {
      "title": "书名",
      "author": "作者",
      "reason": "推荐理由",
      "category": "文学类",
      "subcategory": "小说"
    }
  ]
}
```

**错误响应 (4xx/5xx):**
```json
{
  "error": "错误信息描述"
}
```

**命令行测试示例:**

使用 curl (Git Bash / Linux / macOS):
```bash
# 基本请求（仅心情）
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d "{\"mood\":\"今天心情很好，想读一些轻松愉快的书\"}"

# 带类别偏好的请求
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -d "{\"mood\":\"感到有些焦虑，需要放松\",\"categories\":[\"literature\",\"lifestyle\"]}"
```

使用 PowerShell (Windows):
```powershell
# 基本请求（仅心情）
$body = @{
    mood = "今天心情很好，想读一些轻松愉快的书"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/recommend" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body | ConvertTo-Json -Depth 10

# 带类别偏好的请求
$body = @{
    mood = "感到有些焦虑，需要放松"
    categories = @("literature", "lifestyle")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/recommend" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body | ConvertTo-Json -Depth 10
```


## 书籍类别

系统支持以下 12 个主要类别：

- **文学类**: 小说、散文、诗歌、经典名著、当代文学、外国文学
- **社科类**: 历史、哲学、心理学、社会学、政治、经济学
- **科技类**: 科普、互联网、人工智能、编程技术、科学史
- **商业类**: 管理、创业、营销、投资理财、职场
- **生活类**: 健康养生、美食、旅行、家居、时尚
- **成长类**: 自我提升、励志、学习方法、时间管理、沟通技巧
- **艺术类**: 绘画、音乐、摄影、设计、电影
- **儿童类**: 绘本、儿童文学、科普读物、教育
- **漫画类**: 国漫、日漫、欧美漫画
- **悬疑推理**: 推理小说、悬疑小说、犯罪小说
- **科幻奇幻**: 科幻小说、奇幻小说、玄幻小说
- **言情类**: 现代言情、古代言情、都市情感

## 收藏夹功能

### 如何使用收藏夹

1. **收藏书籍**: 在推荐结果中，点击书籍卡片右上角的星星图标（☆）即可收藏
2. **查看收藏**: 点击页面顶部的"收藏夹"标签，查看所有收藏的书籍
3. **按类别浏览**: 收藏夹中的书籍会自动按类别分组显示
4. **删除收藏**: 在收藏夹中点击书籍卡片上的"×"按钮即可移除收藏

### 数据存储

- 收藏数据保存在浏览器的 localStorage 中
- 数据在页面刷新后依然保留
- 清除浏览器数据会删除收藏记录
- 不同浏览器的收藏数据独立存储

## 常见问题

### Q: 提示 "API 密钥无效"

A: 请检查 `.env` 文件中的 `ARK_API_KEY` 是否正确配置。确保密钥没有多余的空格或引号。

### Q: 提示 "API 配额不足"

A: 你的火山引擎账户可能已达到使用限额。请访问 [火山引擎控制台](https://console.volcengine.com/ark) 查看使用情况和账户余额。

### Q: 请求超时

A: API 响应时间可能较长。如果超时请稍后重试，或检查网络连接。

### Q: 网络连接失败

A: 请检查你的网络连接，确保可以访问火山引擎 ARK API 服务。

### Q: 如何测试 API 连接？

A: 运行测试脚本验证配置：
```bash
python test_api.py
```

### Q: 收藏的书籍丢失了？

A: 收藏数据存储在浏览器的 localStorage 中。如果清除了浏览器数据或使用了隐私模式，收藏会被清除。建议定期导出重要的收藏记录。

### Q: 可以在不同设备间同步收藏吗？

A: 当前版本使用本地存储，不支持跨设备同步。未来版本可能会添加账户系统和云同步功能。

## 安全注意事项

- ⚠️ **不要将 `.env` 文件提交到版本控制系统**
- ⚠️ **不要在前端代码中暴露 API 密钥**
- ⚠️ **定期检查 API 使用情况，避免意外费用**
- ⚠️ **妥善保管 ARK_API_KEY，避免泄露**

## 部署建议

### Heroku 部署

1. 创建 `Procfile` 文件：
```
web: python app.py
```

2. 在 Heroku 控制台设置环境变量 `ARK_API_KEY`

3. 部署应用：
```bash
git push heroku main
```

### Railway 部署

1. 连接 GitHub 仓库
2. 在 Railway 控制台设置环境变量 `ARK_API_KEY`
3. Railway 会自动检测并部署 Flask 应用

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [火山引擎 ARK 文档](https://www.volcengine.com/docs/82379/1099455)
- [豆包大模型](https://www.volcengine.com/product/doubao)
- [API Key 管理](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)

## 联系方式

如有问题或建议，请通过 Issue 联系。

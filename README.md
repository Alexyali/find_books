# 智能书籍推荐系统

基于用户心情的智能书籍推荐网页应用。用户可以输入或选择当前的心情状态，系统将通过火山引擎豆包大模型分析用户心情并推荐适合的书籍。

## 功能特点

- 📝 自定义心情输入或快速选择预设心情
- 🤖 基于火山引擎豆包大模型的智能推荐
- 📚 每次推荐 3-5 本书籍，包含书名、作者和推荐理由
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
git clone <repository-url>
cd mood-based-book-recommendation
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
3. 点击"获取推荐"按钮
4. 等待几秒钟，系统将显示推荐的书籍列表

## 项目结构

```
mood-based-book-recommendation/
├── app.py                  # Flask 后端应用主文件
├── requirements.txt        # Python 依赖列表
├── .env.example           # 环境变量配置模板
├── .gitignore             # Git 忽略文件配置
├── README.md              # 项目说明文档
├── static/                # 静态资源目录
│   ├── style.css         # 样式表
│   └── script.js         # 客户端 JavaScript
└── templates/             # HTML 模板目录
    └── index.html        # 主页面模板
```

## API 接口说明

### GET /

返回主页面 HTML。

### POST /api/recommend

接收用户心情并返回书籍推荐。

**请求体:**
```json
{
  "mood": "用户心情描述"
}
```

**成功响应 (200):**
```json
{
  "recommendations": [
    {
      "title": "书名",
      "author": "作者",
      "reason": "推荐理由"
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

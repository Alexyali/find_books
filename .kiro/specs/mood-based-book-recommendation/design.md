# 设计文档

## 概述

智能书籍推荐系统是一个轻量级的 Web 应用，采用前后端分离架构。前端使用纯 HTML/CSS/JavaScript 构建用户界面，后端使用 Python Flask 框架提供 RESTful API 服务。系统通过 OpenAI API 的 GPT 模型分析用户心情并生成个性化的书籍推荐。

## 架构

### 系统架构图

```mermaid
graph TB
    A[用户浏览器] -->|HTTP 请求| B[Flask 后端服务器]
    B -->|API 调用| C[OpenAI API]
    C -->|推荐结果| B
    B -->|JSON 响应| A
    D[环境变量] -.->|API 密钥| B
```

### 技术栈

**前端:**
- HTML5 - 页面结构
- CSS3 - 样式设计
- Vanilla JavaScript - 交互逻辑

**后端:**
- Python 3.8+
- Flask - Web 框架
- OpenAI Python SDK - API 集成
- python-dotenv - 环境变量管理

### 部署架构

- 开发环境：本地运行 Flask 开发服务器
- 生产环境：可部署到 Heroku、Railway 或其他 Python 托管平台

## 组件和接口

### 前端组件

#### 1. 主页面 (index.html)

**职责:**
- 展示心情输入界面
- 显示书籍推荐结果
- 处理用户交互和状态管理

**关键元素:**
- 心情输入表单（文本框 + 预设选项）
- 提交按钮
- 加载状态指示器
- 推荐结果展示区域
- 错误提示区域

#### 2. 样式表 (style.css)

**职责:**
- 提供响应式布局
- 定义视觉样式和动画效果
- 确保跨设备兼容性

#### 3. 客户端脚本 (script.js)

**职责:**
- 处理表单提交
- 发送 AJAX 请求到后端
- 动态更新 DOM 显示推荐结果
- 管理加载和错误状态

**关键函数:**
```javascript
- submitMood() - 提交心情数据
- displayRecommendations(data) - 渲染推荐结果
- showLoading() - 显示加载状态
- showError(message) - 显示错误信息
```

### 后端组件

#### 1. Flask 应用 (app.py)

**职责:**
- 提供 HTTP 服务器
- 定义 API 路由
- 处理请求和响应
- 集成 OpenAI API

**API 端点:**

**GET /**
- 描述：返回主页面
- 响应：HTML 页面

**POST /api/recommend**
- 描述：接收心情输入，返回书籍推荐
- 请求体：
```json
{
  "mood": "string"
}
```
- 响应体（成功）：
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
- 响应体（失败）：
```json
{
  "error": "错误信息"
}
```

#### 2. OpenAI 集成模块

**职责:**
- 封装 OpenAI API 调用逻辑
- 构建提示词（prompt）
- 解析 API 响应
- 处理 API 错误

**关键函数:**
```python
- get_book_recommendations(mood: str) -> list
- build_prompt(mood: str) -> str
- parse_response(response: str) -> list
```

#### 3. 配置管理

**职责:**
- 加载环境变量
- 管理 API 密钥
- 配置应用参数

**环境变量:**
- `OPENAI_API_KEY` - OpenAI API 密钥
- `FLASK_ENV` - 运行环境（development/production）
- `PORT` - 服务器端口（可选，默认 5000）

## 数据模型

### 请求模型

```python
class MoodRequest:
    mood: str  # 用户心情描述，1-500 字符
```

### 推荐模型

```python
class BookRecommendation:
    title: str      # 书名
    author: str     # 作者
    reason: str     # 推荐理由
```

### 响应模型

```python
class RecommendationResponse:
    recommendations: List[BookRecommendation]  # 推荐列表，3-5 本书
```

## 错误处理

### 错误类型和处理策略

1. **客户端验证错误**
   - 场景：用户未输入心情
   - 处理：前端显示提示，不发送请求

2. **网络错误**
   - 场景：无法连接到后端服务器
   - 处理：显示"网络连接失败，请检查网络"

3. **OpenAI API 错误**
   - 场景：API 密钥无效、配额不足、服务不可用
   - 处理：记录错误日志，返回友好错误信息给前端

4. **超时错误**
   - 场景：OpenAI API 响应超时
   - 处理：设置 30 秒超时，超时后返回错误

5. **服务器内部错误**
   - 场景：代码异常、解析失败
   - 处理：捕获异常，返回通用错误信息，记录详细日志

### 错误响应格式

所有错误响应使用统一格式：
```json
{
  "error": "用户友好的错误描述",
  "code": "ERROR_CODE"
}
```

## 测试策略

### 单元测试

**后端测试:**
- 测试 OpenAI API 集成函数
- 测试提示词构建逻辑
- 测试响应解析功能
- 使用 mock 模拟 OpenAI API 响应

**工具:** pytest

### 集成测试

- 测试完整的 API 端点
- 测试请求验证逻辑
- 测试错误处理流程

### 手动测试

**前端测试:**
- 测试不同心情输入的推荐结果
- 测试响应式布局在不同设备上的表现
- 测试加载状态和错误提示显示
- 测试用户交互流程

**测试场景:**
1. 正常流程：输入心情 → 获得推荐
2. 空输入：验证错误提示
3. 网络断开：验证错误处理
4. API 错误：验证错误提示
5. 不同心情类型：开心、悲伤、焦虑、平静等

## 安全考虑

1. **API 密钥保护**
   - 密钥存储在 `.env` 文件中
   - `.env` 文件添加到 `.gitignore`
   - 不在前端代码中暴露密钥

2. **输入验证**
   - 限制心情输入长度（最大 500 字符）
   - 防止 SQL 注入（虽然本系统不使用数据库）
   - 清理用户输入

3. **CORS 配置**
   - 开发环境允许跨域
   - 生产环境配置适当的 CORS 策略

4. **速率限制**
   - 考虑添加请求频率限制防止滥用
   - 可使用 Flask-Limiter 扩展

## 性能优化

1. **响应时间优化**
   - 使用流式响应（如果 OpenAI API 支持）
   - 设置合理的超时时间

2. **缓存策略**
   - 静态资源（CSS/JS）使用浏览器缓存
   - 考虑缓存常见心情的推荐结果（可选）

3. **前端优化**
   - 最小化 HTTP 请求
   - 使用 CSS 动画而非 JavaScript 动画
   - 延迟加载非关键资源

## 扩展性考虑

未来可能的扩展方向：

1. **用户系统**
   - 用户注册和登录
   - 保存推荐历史
   - 个性化推荐

2. **数据持久化**
   - 添加数据库存储推荐记录
   - 分析用户偏好

3. **更多推荐维度**
   - 根据阅读历史推荐
   - 结合时间、天气等因素
   - 多语言支持

4. **社交功能**
   - 分享推荐结果
   - 用户评价和反馈

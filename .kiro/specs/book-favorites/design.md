# Design Document - Book Favorites Feature

## Overview

收藏夹功能为智能书籍推荐系统添加了书籍收藏和管理能力。用户可以收藏感兴趣的书籍，在专门的收藏夹页面按类别浏览，并管理收藏列表。该功能完全基于前端实现，使用浏览器本地存储（localStorage）持久化数据，无需后端支持。

### Design Goals

1. **简单易用** - 一键收藏/取消收藏，直观的用户界面
2. **数据持久化** - 使用 localStorage 保存收藏数据，页面刷新后保持
3. **良好的组织** - 按书籍类别分组显示，便于查找
4. **无缝集成** - 与现有推荐系统界面风格保持一致
5. **性能优化** - 高效的数据存储和检索机制

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Recommendation│  │  Favorites   │  │  Navigation  │  │
│  │     View     │  │     View     │  │     Bar      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Favorites Manager (JavaScript)              │
├─────────────────────────────────────────────────────────┤
│  • addFavorite(book)                                     │
│  • removeFavorite(bookId)                                │
│  • isFavorite(bookId)                                    │
│  • getAllFavorites()                                     │
│  • getFavoritesByCategory()                              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Storage Layer (localStorage)                │
├─────────────────────────────────────────────────────────┤
│  Key: "bookFavorites"                                    │
│  Value: JSON Array of Book Objects                      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

**收藏书籍流程:**
```
User clicks favorite button
    → FavoritesManager.addFavorite(book)
    → Save to localStorage
    → Update UI (button state)
    → Show success feedback
```

**查看收藏夹流程:**
```
User navigates to Favorites View
    → FavoritesManager.getAllFavorites()
    → Load from localStorage
    → Group by category
    → Render categorized list
```

**删除收藏流程:**
```
User clicks remove button
    → FavoritesManager.removeFavorite(bookId)
    → Update localStorage
    → Remove from UI
    → Update category groups
```

## Components and Interfaces

### 1. FavoritesManager Module

核心 JavaScript 模块，负责收藏数据的管理和持久化。

```javascript
const FavoritesManager = {
    STORAGE_KEY: 'bookFavorites',

    // 添加收藏
    addFavorite(book) {
        // 生成唯一 ID
        // 保存到 localStorage
        // 返回操作结果
    },

    // 移除收藏
    removeFavorite(bookId) {
        // 从 localStorage 删除
        // 返回操作结果
    },

    // 检查是否已收藏
    isFavorite(bookId) {
        // 查询 localStorage
        // 返回 boolean
    },

    // 获取所有收藏
    getAllFavorites() {
        // 从 localStorage 读取
        // 返回书籍数组
    },

    // 按类别获取收藏
    getFavoritesByCategory() {
        // 读取并分组
        // 返回分类对象
    }
};
```

### 2. UI Components

#### 2.1 Favorite Button Component

在推荐结果中每本书籍卡片上显示的收藏按钮。

**位置:** 书籍卡片右上角
**状态:**
- 未收藏: 空心星星图标 ☆
- 已收藏: 实心星星图标 ★（高亮颜色）

**HTML 结构:**
```html
<button class="favorite-btn" data-book-id="unique-id" aria-label="收藏此书">
    <span class="favorite-icon">☆</span>
</button>
```

**CSS 类:**
- `.favorite-btn` - 基础按钮样式
- `.favorite-btn.favorited` - 已收藏状态样式

#### 2.2 Navigation Component

导航栏，允许用户在推荐页面和收藏夹页面之间切换。

**位置:** 页面顶部 header 区域
**元素:**
- "推荐" 标签页
- "收藏夹" 标签页（显示收藏数量徽章）

**HTML 结构:**
```html
<nav class="main-nav">
    <button class="nav-tab active" data-view="recommendations">
        推荐
    </button>
    <button c="nav-tab" data-view="favorites">
        收藏夹
        <span class="badge" id="favoritesCount">0</span>
    </button>
</nav>
```

#### 2.3 Favorites View Component

收藏夹页面，显示所有收藏的书籍，按类别分组。

**布局结构:**
```html
<section class="favorites-view" id="favoritesView" style="display: none;">
    <h2>我的收藏夹</h2>

    <!-- 空状态 -->
    <div class="empty-state" id="emptyState">
        <span class="empty-icon">📚</span>
        <p>还没有收藏任何书籍</p>
        <p class="empty-hint">在推荐结果中点击星星图标收藏书籍</p>
    </div>

    <!-- 收藏列表 -->
    <div class="favorites-list" id="favoritesList">
        <!-- 按类别分组的书籍卡片 -->
    </div>
</section>
```

**类别分组显示:**
```html
<div class="favorites-category-group">
    <h3 class="favorites-category-title">
        文学类
        <span class="category-count">(3)</span>
    </h3>
    <div class="favorites-books">
        <!-- 书籍卡片 -->
    </div>
</div>
```

#### 2.4 Favorite Book Card Component

收藏夹中的书籍卡片，与推荐结果中的卡片类似，但包含删除按钮。

**HTML 结构:**
```html
<div class="book-card favorite-book-card" data-book-id="unique-id">
    <div class="book-header">
        <h3>书名</h3>
        <button class="remove-favorite-btn" aria-label="移除收藏">
            <span class="remove-icon">×</span>
        </button>
    </div>
    <div class="book-badges">
        <span class="category-badge">文学类</span>
        <span class="subcategory-badge">小说</span>
    </div>
    <p class="book-author">作者：作者名</p>
    <p class="book-reason">推荐理由...</p>
</div>
```

## Data Models

### Book Object

收藏的书籍对象结构：

```javascript
{
    id: String,           // 唯一标识符（自动生成）
    title: String,        // 书名
    author: String,       // 作者
    reason: String,       // 推荐理由
    category: String,     // 类别（如：文学类）
    subcategory: String,  // 子类别（如：小说）
    timestamp: Number     // 收藏时间戳（用于排序）
}
```

### ID Generation Strategy

为每本书生成唯一 ID，基于书名和作者的组合：

```javascript
function generateBookId(book) {
    const str = `${book.title}-${book.author}`;
    return btoa(encodeURIComponent(str))
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 32);
}
```

这种方式确保：
- 同一本书（相同书名和作者）始终生成相同 ID
- 避免重复收藏
- ID 简洁且 URL 安全

### localStorage Data Structure

存储在 localStorage 中的数据格式：

```javascript
// Key: "bookFavorites"
// Value: JSON string
[
    {
        "id": "abc123...",
        "title": "活着",
        "author": "余华",
        "reason": "这本书...",
        "category": "文学类",
        "subcategory": "小说",
        "timestamp": 1699876543210
    },
    // ... more books
]
```

## Error Handling

### localStorage Availability Check

```javascript
function isLocalStorageAvailable() {
    try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}
```

### Error Scenarios and Handling

| 错误场景 | 处理策略 |
|---------|---------|
| localStorage 不可用 | 显示警告消息，功能降级为会话级存储 |
| localStorage 配额已满 | 提示用户清理收藏，或删除最旧的收藏 |
| JSON 解析失败 | 重置收藏数据，记录错误日志 |
| 数据损坏 | 尝试恢复，失败则清空并通知用户 |

### User Feedback

所有操作都应提供即时反馈：

- **收藏成功:** 按钮状态变化 + 短暂的成功提示
- **取消收藏:** 按钮状态变化
- **删除收藏:** 卡片淡出动画 + 列表更新
- **错误情况:** 友好的错误提示消息

## Testing Strategy

### Unit Tests

测试 FavoritesManager 模块的核心功能：

1. **addFavorite() 测试**
   - 添加新书籍到空收藏夹
   - 添加书籍到已有收藏
   - 尝试添加重复书籍（应忽略）
   - localStorage 不可用时的降级处理

2. **removeFavorite() 测试**
   - 删除存在的收藏
   - 删除不存在的收藏（应优雅处理）
   - 删除后 localStorage 正确更新

3. **isFavorite() 测试**
   - 检查已收藏的书籍
   - 检查未收藏的书籍
   - 空收藏夹情况

4. **getAllFavorites() 测试**
   - 返回所有收藏
   - 空收藏夹返回空数组
   - 数据按时间戳排序

5. **getFavoritesByCategory() 测试**
   - 正确分组
   - 类别排序
   - 空收藏夹处理

### Integration Tests

测试 UI 组件与 FavoritesManager 的集成：

1. **收藏按钮交互**
   - 点击未收藏书籍的按钮
   - 点击已收藏书籍的按钮
   - 按钮状态正确更新

2. **导航切换**
   - 切换到收藏夹视图
   - 切换回推荐视图
   - 收藏数量徽章正确显示

3. **收藏夹视图渲染**
   - 空状态正确显示
   - 书籍按类别分组
   - 类别计数正确

4. **删除收藏**
   - 点击删除按钮
   - 卡片从 UI 移除
   - localStorage 更新
   - 空类别组被移除

### Manual Testing Checklist

- [ ] 在推荐结果中收藏书籍
- [ ] 收藏按钮状态正确切换
- [ ] 导航到收藏夹页面
- [ ] 收藏夹正确显示所有收藏
- [ ] 书籍按类别分组
- [ ] 类别按字母顺序排列
- [ ] 删除收藏功能正常
- [ ] 刷新页面后收藏保持
- [ ] 清空浏览器数据后收藏清除
- [ ] 移动端响应式布局正常
- [ ] 无障碍功能（键盘导航、屏幕阅读器）

## UI/UX Considerations

### Visual Design

1. **收藏按钮**
   - 使用星星图标（☆/★）
   - 未收藏：灰色边框，透明背景
   - 已收藏：金色填充，轻微阴影
   - 悬停：放大动画

2. **导航标签**
   - 活动标签：底部边框高亮
   - 收藏数量徽章：圆形，主题色背景

3. **收藏夹视图**
   - 类别标题：使用主题色
   - 类别计数：灰色小字
   - 空状态：居中显示，友好的图标和文案

4. **动画效果**
   - 收藏按钮：点击时缩放动画
   - 卡片删除：淡出 + 向上滑动
   - 视图切换：淡入淡出过渡

### Accessibility

1. **语义化 HTML**
   - 使用 `<nav>` 标签
   - 使用 `<button>` 而非 `<div>`
   - 适当的标题层级

2. **ARIA 属性**
   - `aria-label` 描述按钮功能
   - `aria-pressed` 表示收藏状态
   - `role="tablist"` 用于导航

3. **键盘导航**
   - Tab 键可访问所有交互元素
   - Enter/Space 激活按钮
   - 焦点样式清晰可见

4. **屏幕阅读器**
   - 收藏状态变化时提供反馈
   - 删除操作确认提示

### Responsive Design

**桌面端 (> 768px):**
- 导航标签水平排列
- 收藏夹每行显示 1 张完整卡片
- 收藏按钮位于卡片右上角

**移动端 (≤ 768px):**
- 导航标签占满宽度
- 收藏夹卡片堆叠显示
- 收藏按钮适当增大触摸区域

## Implementation Notes

### Performance Optimization

1. **localStorage 访问优化**
   - 缓存读取的数据，避免频繁访问 localStorage
   - 批量更新而非每次操作都写入

2. **DOM 操作优化**
   - 使用 DocumentFragment 批量插入元素
   - 避免强制同步布局

3. **事件委托**
   - 在父容器上监听点击事件
   - 减少事件监听器数量

### Browser Compatibility

目标浏览器：
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

所有目标浏览器都支持 localStorage 和所需的 ES6 特性。

### Future Enhancements

可能的功能扩展（不在当前范围内）：

1. **搜索和过滤**
   - 在收藏夹中搜索书籍
   - 按子类别过滤

2. **排序选项**
   - 按收藏时间排序
   - 按书名字母排序

3. **导出功能**
   - 导出收藏列表为 JSON
   - 分享收藏列表

4. **云同步**
   - 用户账户系统
   - 跨设备同步收藏

5. **笔记功能**
   - 为收藏的书籍添加个人笔记
   - 标记阅读状态

## Security Considerations

1. **XSS 防护**
   - 所有用户数据（书名、作者等）在渲染前进行 HTML 转义
   - 使用 `textContent` 而非 `innerHTML` 设置文本

2. **数据验证**
   - 从 localStorage 读取数据后验证结构
   - 过滤无效或损坏的数据

3. **存储限制**
   - 监控 localStorage 使用量
   - 设置收藏数量上限（如 100 本）

## Dependencies

无需额外依赖，使用原生 JavaScript 和现有的项目结构：

- **HTML/CSS:** 扩展现有的 `index.html` 和 `style.css`
- **JavaScript:** 扩展现有的 `script.js`
- **Storage:** 浏览器原生 localStorage API
- **Icons:** 使用 Unicode 字符（☆/★）或现有图标库

## File Structure

```
project/
├── templates/
│   └── index.html          # 添加导航和收藏夹视图
├── static/
│   ├── style.css           # 添加收藏夹相关样式
│   └── script.js           # 添加 FavoritesManager 和 UI 逻辑
└── .kiro/
    └── specs/
        └── book-favorites/
            ├── requirements.md
            ├── design.md
            └── tasks.md
```

所有新功能都集成到现有文件中，保持项目结构简洁。

# Implementation Plan - Book Favorites Feature

- [x] 1. 实现 FavoritesManager 核心模块





  - 在 `static/script.js` 中创建 FavoritesManager 对象
  - 实现 localStorage 可用性检测函数 `isLocalStorageAvailable()`
  - 实现书籍 ID 生成函数 `generateBookId(book)`
  - 实现 `addFavorite(book)` 方法：添加书籍到收藏夹并保存到 localStorage
  - 实现 `removeFavorite(bookId)` 方法：从收藏夹删除书籍并更新 localStorage
  - 实现 `isFavorite(bookId)` 方法：检查书籍是否已收藏
  - 实现 `getAllFavorites()` 方法：从 localStorage 读取所有收藏
  - 实现 `getFavoritesByCategory()` 方法：返回按类别分组的收藏
  - 添加错误处理：localStorage 不可用、配额已满、JSON 解析失败等情况
  - _Requirements: 1.5, 5.1, 5.2, 5.4_

- [x] 2. 添加导航栏组件





  - 在 `templates/index.html` 的 header 中添加导航栏 HTML 结构
  - 创建"推荐"和"收藏夹"两个导航标签
  - 添加收藏数量徽章元素
  - 在 `static/style.css` 中添加导航栏样式（`.main-nav`, `.nav-tab`, `.badge`）
  - 实现响应式设计：移动端导航栏样式
  - 在 `static/script.js` 中实现导航标签切换逻辑
  - 实现视图切换功能：显示/隐藏推荐视图和收藏夹视图
  - 实现收藏数量徽章更新函数 `updateFavoritesCount()`
  - _Requirements: 2.1_

- [x] 3. 在推荐结果中添加收藏按钮



  - 修改 `static/script.js` 中的 `createBookCard()` 函数
  - 在书籍卡片的 header 中添加收藏按钮 HTML
  - 为每个书籍卡片设置 `data-book-id` 属性
  - 在 `static/style.css` 中添加收藏按钮样式（`.favorite-btn`）
  - 实现收藏按钮的两种状态样式：未收藏（☆）和已收藏（★）
  - 添加悬停和点击动画效果
  - 实现收藏按钮点击事件处理函数 `handleFavoriteClick()`
  - 根据收藏状态动态更新按钮外观
  - 在渲染推荐结果时检查并标记已收藏的书籍
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. 创建收藏夹视图





  - 在 `templates/index.html` 中添加收藏夹视图的 HTML 结构
  - 创建空状态提示元素（无收藏时显示）
  - 创建收藏列表容器元素
  - 在 `static/style.css` 中添加收藏夹视图样式（`.favorites-view`, `.empty-state`）
  - 实现 `renderFavoritesView()` 函数：渲染收藏夹页面
  - 实现空状态和有收藏两种显示逻辑
  - 从 FavoritesManager 获取收藏数据并渲染
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 5. 实现按类别分组显示




  - 在 `static/script.js` 中实现 `renderFavoritesByCategory()` 函数
  - 调用 `FavoritesManager.getFavoritesByCategory()` 获取分组数据
  - 为每个类别创建分组容器和标题
  - 在类别标题中显示该类别的书籍数量
  - 按字母顺序排列类别
  - 在每个类别组内按收藏时间排序显示书籍
  - 在 `static/style.css` 中添加类别分组样式（`.favorites-category-group`, `.favorites-category-title`）
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 6. 实现收藏夹中的书籍卡片





  - 在 `static/script.js` 中实现 `createFavoriteBookCard()` 函数
  - 创建包含删除按钮的书籍卡片 HTML
  - 显示书名、作者、推荐理由、类别和子类别
  - 在 `static/style.css` 中添加收藏书籍卡片样式（`.favorite-book-card`, `.remove-favorite-btn`）
  - 实现删除按钮样式和悬停效果
  - _Requirements: 2.4, 4.1_

- [x] 7. 实现删除收藏功能





  - 在 `static/script.js` 中实现 `handleRemoveFavorite()` 函数
  - 为删除按钮添加点击事件监听器（使用事件委托）
  - 调用 `FavoritesManager.removeFavorite()` 删除收藏
  - 实现卡片删除动画（淡出效果）
  - 从 DOM 中移除卡片元素
  - 更新类别分组：如果类别为空则移除整个分组
  - 更新收藏数量徽章
  - 如果收藏夹为空，显示空状态提示
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 8. 实现数据持久化和页面加载逻辑





  - 在 `static/script.js` 的页面加载事件中初始化收藏功能
  - 从 localStorage 加载收藏数据
  - 如果 localStorage 不可用，显示警告消息并降级处理
  - 实现收藏状态同步：在推荐视图和收藏夹视图之间保持一致
  - 在推荐结果渲染时标记已收藏的书籍
  - 确保收藏/取消收藏操作立即反映在两个视图中
  - _Requirements: 1.5, 5.2, 5.3, 5.5_

- [x] 9. 添加用户反馈和错误处理




  - 实现收藏成功的视觉反馈（按钮状态变化 + 短暂提示）
  - 实现取消收藏的视觉反馈
  - 实现删除收藏的动画效果
  - 添加 localStorage 不可用时的警告提示
  - 添加 localStorage 配额已满时的错误提示
  - 实现数据损坏时的恢复逻辑
  - 在 `static/style.css` 中添加反馈提示样式
  - _Requirements: 5.4, 5.5_

- [x] 10. 优化响应式设计和无障碍性




  - 在 `static/style.css` 中添加移动端适配样式
  - 优化收藏按钮在移动端的触摸区域
  - 优化导航栏在移动端的布局
  - 优化收藏夹视图在移动端的显示
  - 为收藏按钮添加 `aria-label` 属性
  - 为删除按钮添加 `aria-label` 属性
  - 为导航标签添加 `role` 和 `aria-pressed` 属性
  - 确保所有交互元素支持键盘导航
  - 测试屏幕阅读器兼容性
  - _Requirements: 1.1, 2.1, 4.1_

- [ ]* 11. 编写测试代码
  - 创建 `test_favorites.py` 测试文件
  - 编写 FavoritesManager 单元测试：测试 addFavorite、removeFavorite、isFavorite 等方法
  - 编写 localStorage 模拟测试：测试存储不可用情况
  - 编写 ID 生成函数测试：确保相同书籍生成相同 ID
  - 编写分组功能测试：测试 getFavoritesByCategory 正确分组
  - 编写集成测试：测试 UI 交互和数据同步
  - _Requirements: All_

- [ ]* 12. 性能优化
  - 实现 localStorage 数据缓存机制，减少读取次数
  - 使用 DocumentFragment 批量插入 DOM 元素
  - 实现事件委托，减少事件监听器数量
  - 优化收藏夹视图渲染性能（大量收藏时）
  - 添加防抖处理，避免频繁操作
  - _Requirements: 3.4, 4.3_

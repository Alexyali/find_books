/**
 * 智能书籍推荐系统 - 客户端脚本
 *
 * 此文件负责处理前端的所有交互逻辑，包括：
 * - 表单提交和验证
 * - AJAX 请求发送
 * - 推荐结果渲染
 * - 加载状态和错误处理
 *
 * 作者：[Your Name]
 * 日期：2024
 */

// ============================================
// DOM 元素引用
// ============================================
// 获取页面中的关键元素，用于后续操作

const moodForm = document.getElementById('moodForm');           // 心情输入表单
const moodInput = document.getElementById('moodInput');         // 心情输入框
const submitBtn = document.getElementById('submitBtn');         // 提交按钮
const loading = document.getElementById('loading');             // 加载状态指示器
const errorMessage = document.getElementById('errorMessage');   // 错误提示容器
const errorText = document.getElementById('errorText');         // 错误文本内容
const retryBtn = document.getElementById('retryBtn');           // 重试按钮
const recommendations = document.getElementById('recommendations'); // 推荐结果容器
const bookList = document.getElementById('bookList');           // 书籍列表容器
const moodButtons = document.querySelectorAll('.mood-btn');     // 预设心情按钮
const categoryToggle = document.getElementById('categoryToggle'); // 类别选择器切换按钮
const categoryOptions = document.getElementById('categoryOptions'); // 类别选项容器
const categoryGrid = document.getElementById('categoryGrid');     // 类别网格容器
const categoryFilter = document.getElementById('categoryFilter'); // 类别筛选器容器
const filterTags = document.getElementById('filterTags');         // 筛选标签容器

// 全局变量
let allCategories = [];           // 存储所有类别数据
let currentRecommendations = [];  // 存储当前推荐结果
let selectedFilter = 'all';       // 当前选中的筛选类别

// ============================================
// 页面初始化
// ============================================

/**
 * 页面加载完成后执行初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});

// ============================================
// 事件监听器设置
// ============================================

/**
 * 类别选择器切换事件
 *
 * 点击切换按钮展开或折叠类别选项
 */
categoryToggle.addEventListener('click', () => {
    const isVisible = categoryOptions.style.display !== 'none';
    categoryOptions.style.display = isVisible ? 'none' : 'block';

    // 更新切换图标
    const icon = categoryToggle.querySelector('.toggle-icon');
    icon.textContent = isVisible ? '▼' : '▲';
});

/**
 * 预设心情按钮点击事件
 *
 * 当用户点击预设心情按钮时，自动填充输入框
 * 这提供了快速选择常见心情的便捷方式
 */
moodButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 从按钮的 data-mood 属性获取心情值
        const mood = button.getAttribute('data-mood');
        // 将心情填入输入框
        moodInput.value = mood;
        // 聚焦输入框，方便用户修改或直接提交
        moodInput.focus();
    });
});

/**
 * 表单提交处理
 *
 * 拦截表单的默认提交行为，改为使用 AJAX 异步提交
 * 这样可以在不刷新页面的情况下获取推荐结果
 */
moodForm.addEventListener('submit', async (e) => {
    // 阻止表单默认提交行为（防止页面刷新）
    e.preventDefault();

    // 客户端输入验证
    // 在发送请求前验证输入，提供即时反馈
    const mood = moodInput.value.trim();
    if (!mood) {
        showError('请输入你的心情或选择预设心情');
        return;
    }

    // 发送推荐请求
    // 调用异步函数获取书籍推荐
    await getRecommendations(mood);
});

/**
 * 重试按钮点击事件
 *
 * 当出现错误时，用户可以点击重试按钮重新发送请求
 */
retryBtn.addEventListener('click', () => {
    // 隐藏错误提示
    hideError();
    // 获取当前输入的心情
    const mood = moodInput.value.trim();
    if (mood) {
        // 重新发送推荐请求
        getRecommendations(mood);
    }
});

// ============================================
// 核心业务逻辑函数
// ============================================

/**
 * 加载书籍类别数据
 *
 * 从后端 API 获取所有可用的书籍类别
 * 并动态渲染类别选择器
 */
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();

        if (response.ok && data.categories) {
            allCategories = data.categories;
            renderCategorySelector();
        }
    } catch (error) {
        console.error('加载类别失败:', error);
        // 类别加载失败不影响核心功能，静默处理
    }
}

/**
 * 渲染类别选择器
 *
 * 根据类别数据动态创建复选框
 */
function renderCategorySelector() {
    categoryGrid.innerHTML = '';

    allCategories.forEach(category => {
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `cat-${category.id}`;
        checkbox.value = category.id;
        checkbox.className = 'category-checkbox';

        const label = document.createElement('label');
        label.htmlFor = `cat-${category.id}`;
        label.textContent = category.name;

        categoryItem.appendChild(checkbox);
        categoryItem.appendChild(label);
        categoryGrid.appendChild(categoryItem);
    });
}

/**
 * 获取用户选择的类别
 *
 * @returns {Array} 选中的类别 ID 数组
 */
function getSelectedCategories() {
    const checkboxes = document.querySelectorAll('.category-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * 获取书籍推荐
 *
 * 向后端 API 发送心情数据和可选的类别偏好，获取书籍推荐结果
 * 这是应用的核心功能函数
 *
 * @param {string} mood - 用户输入的心情描述
 *
 * 流程：
 * 1. 显示加载状态
 * 2. 收集用户选择的类别
 * 3. 发送 POST 请求到 /api/recommend
 * 4. 处理响应数据
 * 5. 显示推荐结果或错误信息
 */
async function getRecommendations(mood) {
    // 显示加载状态，隐藏之前的结果和错误
    showLoading();
    hideError();
    hideRecommendations();

    try {
        // 收集用户选择的类别
        const selectedCategories = getSelectedCategories();

        // 构建请求体
        const requestBody = { mood: mood };
        if (selectedCategories.length > 0) {
            requestBody.categories = selectedCategories;
        }

        // 发送 AJAX 请求到后端 API
        // 使用 fetch API 进行异步 HTTP 请求
        const response = await fetch('/api/recommend', {
            method: 'POST',                              // 使用 POST 方法
            headers: {
                'Content-Type': 'application/json',      // 指定请求体格式为 JSON
            },
            body: JSON.stringify(requestBody),           // 将心情和类别数据转换为 JSON 字符串
        });

        // 解析响应 JSON 数据
        const data = await response.json();

        // 检查响应状态
        // 如果状态码不是 2xx，抛出错误
        if (!response.ok) {
            throw new Error(data.error || '获取推荐失败');
        }

        // 显示推荐结果
        // 将推荐数据渲染到页面上
        displayRecommendations(data.recommendations);

    } catch (error) {
        // 错误处理
        // 根据错误类型提供友好的错误提示
        let errorMsg = '获取推荐失败，请稍后重试';

        // 判断是否为网络连接错误
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg = '网络连接失败，请检查网络连接';
        } else if (error.message) {
            // 使用服务器返回的错误信息
            errorMsg = error.message;
        }

        // 显示错误提示
        showError(errorMsg);
    } finally {
        // 无论成功或失败，都隐藏加载状态
        // finally 块确保加载指示器总是会被隐藏
        hideLoading();
    }
}

/**
 * 显示推荐结果
 *
 * 将推荐的书籍数据渲染为 HTML 卡片并显示在页面上
 * 支持按类别分组显示或列表显示
 *
 * @param {Array} books - 推荐书籍数组，每个元素包含 title、author、reason、category、subcategory
 *
 * 数据格式示例：
 * [
 *   {
 *     title: "书名",
 *     author: "作者",
 *     reason: "推荐理由",
 *     category: "文学类",
 *     subcategory: "小说"
 *   }
 * ]
 */
function displayRecommendations(books) {
    // 验证数据有效性
    if (!books || books.length === 0) {
        showError('未能获取到推荐结果，请重试');
        return;
    }

    // 保存当前推荐结果
    currentRecommendations = books;
    selectedFilter = 'all';

    // 清空之前的结果
    bookList.innerHTML = '';

    // 统计不同类别的数量
    const categoryCount = new Set(books.map(book => book.category)).size;

    // 如果有 3 个或以上不同类别，使用分组展示
    if (categoryCount >= 3) {
        displayGroupedRecommendations(books);
    } else {
        displayListRecommendations(books);
    }

    // 渲染类别筛选器
    renderCategoryFilter(books);

    // 显示推荐区域
    showRecommendations();
}

/**
 * 按类别分组显示推荐结果
 *
 * @param {Array} books - 推荐书籍数组
 */
function displayGroupedRecommendations(books) {
    // 按类别分组
    const groupedBooks = {};
    books.forEach(book => {
        const category = book.category || '其他';
        if (!groupedBooks[category]) {
            groupedBooks[category] = [];
        }
        groupedBooks[category].push(book);
    });

    // 渲染每个分组
    let cardIndex = 0;
    Object.keys(groupedBooks).forEach(category => {
        // 创建分组容器
        const groupDiv = document.createElement('div');
        groupDiv.className = 'category-group';
        groupDiv.dataset.category = category;

        // 创建分组标题
        const groupTitle = document.createElement('h3');
        groupTitle.className = 'category-group-title';
        groupTitle.textContent = category;
        groupDiv.appendChild(groupTitle);

        // 创建该分组的书籍列表
        groupedBooks[category].forEach(book => {
            const bookCard = createBookCard(book, cardIndex++);
            groupDiv.appendChild(bookCard);
        });

        bookList.appendChild(groupDiv);
    });
}

/**
 * 列表形式显示推荐结果
 *
 * @param {Array} books - 推荐书籍数组
 */
function displayListRecommendations(books) {
    books.forEach((book, index) => {
        const bookCard = createBookCard(book, index);
        bookList.appendChild(bookCard);
    });
}

/**
 * 创建书籍卡片
 *
 * @param {Object} book - 书籍数据
 * @param {number} index - 卡片索引（用于动画延迟）
 * @returns {HTMLElement} 书籍卡片元素
 */
function createBookCard(book, index) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card';
    bookCard.dataset.category = book.category || '';
    bookCard.style.animationDelay = `${index * 0.1}s`;

    // 构建类别标签 HTML
    let categoryBadgeHtml = '';
    if (book.category) {
        const badgeClass = getCategoryBadgeClass(book.category);
        categoryBadgeHtml = `<span class="category-badge ${badgeClass}">${escapeHtml(book.category)}</span>`;
        if (book.subcategory) {
            categoryBadgeHtml += ` <span class="subcategory-badge">${escapeHtml(book.subcategory)}</span>`;
        }
    }

    bookCard.innerHTML = `
        <div class="book-header">
            <h3>${escapeHtml(book.title)}</h3>
            ${categoryBadgeHtml ? `<div class="book-badges">${categoryBadgeHtml}</div>` : ''}
        </div>
        <p class="book-author">作者：${escapeHtml(book.author)}</p>
        <p class="book-reason">${escapeHtml(book.reason)}</p>
    `;

    return bookCard;
}

/**
 * 根据类别名称获取对应的徽章样式类
 *
 * @param {string} category - 类别名称
 * @returns {string} CSS 类名
 */
function getCategoryBadgeClass(category) {
    const categoryMap = {
        '文学类': 'badge-literature',
        '社科类': 'badge-social',
        '科技类': 'badge-tech',
        '商业类': 'badge-business',
        '生活类': 'badge-lifestyle',
        '成长类': 'badge-growth',
        '艺术类': 'badge-arts',
        '儿童类': 'badge-children',
        '漫画类': 'badge-comics',
        '悬疑推理': 'badge-mystery',
        '科幻奇幻': 'badge-scifi',
        '言情类': 'badge-romance'
    };
    return categoryMap[category] || 'badge-default';
}

/**
 * 渲染类别筛选器
 *
 * 根据推荐结果中的类别生成筛选标签
 *
 * @param {Array} books - 推荐书籍数组
 */
function renderCategoryFilter(books) {
    // 提取所有唯一的类别
    const categories = [...new Set(books.map(book => book.category).filter(c => c))];

    // 如果只有一个类别或没有类别，不显示筛选器
    if (categories.length <= 1) {
        categoryFilter.style.display = 'none';
        return;
    }

    // 清空筛选标签容器
    filterTags.innerHTML = '';

    // 创建"全部"标签
    const allTag = document.createElement('button');
    allTag.className = 'filter-tag active';
    allTag.textContent = '全部';
    allTag.dataset.category = 'all';
    allTag.addEventListener('click', () => filterByCategory('all'));
    filterTags.appendChild(allTag);

    // 创建各类别标签
    categories.forEach(category => {
        const tag = document.createElement('button');
        tag.className = 'filter-tag';
        tag.textContent = category;
        tag.dataset.category = category;
        tag.addEventListener('click', () => filterByCategory(category));
        filterTags.appendChild(tag);
    });

    // 显示筛选器
    categoryFilter.style.display = 'block';
}

/**
 * 按类别筛选推荐结果
 *
 * @param {string} category - 要筛选的类别，'all' 表示显示全部
 */
function filterByCategory(category) {
    selectedFilter = category;

    // 更新筛选标签的激活状态
    const allTags = filterTags.querySelectorAll('.filter-tag');
    allTags.forEach(tag => {
        if (tag.dataset.category === category) {
            tag.classList.add('active');
        } else {
            tag.classList.remove('active');
        }
    });

    // 筛选显示书籍卡片
    const allCards = bookList.querySelectorAll('.book-card');
    const allGroups = bookList.querySelectorAll('.category-group');

    if (category === 'all') {
        // 显示所有卡片和分组
        allCards.forEach(card => card.style.display = 'block');
        allGroups.forEach(group => group.style.display = 'block');
    } else {
        // 只显示匹配类别的卡片
        allCards.forEach(card => {
            if (card.dataset.category === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // 只显示匹配类别的分组
        allGroups.forEach(group => {
            if (group.dataset.category === category) {
                group.style.display = 'block';
            } else {
                group.style.display = 'none';
            }
        });
    }
}

// ============================================
// UI 状态管理函数
// ============================================

/**
 * 显示加载状态
 *
 * 在等待 API 响应时显示加载指示器
 * 同时禁用提交按钮，防止重复提交
 */
function showLoading() {
    loading.style.display = 'block';    // 显示加载动画
    submitBtn.disabled = true;          // 禁用提交按钮
}

/**
 * 隐藏加载状态
 *
 * 在收到 API 响应后隐藏加载指示器
 * 重新启用提交按钮
 */
function hideLoading() {
    loading.style.display = 'none';     // 隐藏加载动画
    submitBtn.disabled = false;         // 启用提交按钮
}

/**
 * 显示错误信息
 *
 * 在页面上显示友好的错误提示
 *
 * @param {string} message - 要显示的错误信息
 */
function showError(message) {
    errorText.textContent = message;        // 设置错误文本内容
    errorMessage.style.display = 'block';   // 显示错误提示容器
}

/**
 * 隐藏错误信息
 *
 * 清除页面上的错误提示
 */
function hideError() {
    errorMessage.style.display = 'none';    // 隐藏错误提示容器
}

/**
 * 显示推荐结果
 *
 * 显示包含推荐书籍的区域
 */
function showRecommendations() {
    recommendations.style.display = 'block';    // 显示推荐结果容器
}

/**
 * 隐藏推荐结果
 *
 * 隐藏推荐书籍区域
 * 通常在发送新请求前调用，清除旧结果
 */
function hideRecommendations() {
    recommendations.style.display = 'none';     // 隐藏推荐结果容器
}

// ============================================
// 安全工具函数
// ============================================

/**
 * HTML 转义函数
 *
 * 将用户输入或 API 返回的文本转义为安全的 HTML
 * 防止 XSS（跨站脚本攻击）
 *
 * @param {string} text - 需要转义的文本
 * @returns {string} 转义后的安全 HTML 文本
 *
 * 工作原理：
 * 1. 创建一个临时 div 元素
 * 2. 将文本设置为 textContent（自动转义）
 * 3. 读取 innerHTML 获取转义后的结果
 *
 * 示例：
 * escapeHtml('<script>alert("XSS")</script>')
 * // 返回: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

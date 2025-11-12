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

// 导航和收藏夹相关元素
const navTabs = document.querySelectorAll('.nav-tab');          // 导航标签
const favoritesView = document.getElementById('favoritesView'); // 收藏夹视图
const favoritesCount = document.getElementById('favoritesCount'); // 收藏数量徽章
const emptyState = document.getElementById('emptyState');       // 空状态提示
const favoritesList = document.getElementById('favoritesList'); // 收藏列表容器

// 全局变量
let allCategories = [];           // 存储所有类别数据
let currentRecommendations = [];  // 存储当前推荐结果
let selectedFilter = 'all';       // 当前选中的筛选类别
let currentView = 'recommendations'; // 当前视图：'recommendations' 或 'favorites'

// ============================================
// FavoritesManager 核心模块
// ============================================

/**
 * 检查 localStorage 是否可用
 *
 * 通过尝试写入和删除测试数据来验证 localStorage 的可用性
 * 某些情况下 localStorage 可能不可用：
 * - 浏览器隐私模式
 * - 用户禁用了存储
 * - 存储配额已满
 *
 * @returns {boolean} localStorage 是否可用
 */
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

/**
 * 为书籍生成唯一 ID
 *
 * 基于书名和作者的组合生成唯一标识符
 * 确保同一本书（相同书名和作者）始终生成相同 ID
 *
 * @param {Object} book - 书籍对象，包含 title 和 author 属性
 * @returns {string} 书籍的唯一 ID
 */
function generateBookId(book) {
    const str = `${book.title}-${book.author}`;
    // 使用 base64 编码并清理特殊字符，确保 ID 简洁且 URL 安全
    return btoa(encodeURIComponent(str))
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 32);
}

/**
 * FavoritesManager - 收藏夹管理器
 *
 * 负责管理用户的书籍收藏，包括：
 * - 添加和删除收藏
 * - 检查收藏状态
 * - 数据持久化到 localStorage
 * - 按类别分组
 */
const FavoritesManager = {
    // localStorage 存储键名
    STORAGE_KEY: 'bookFavorites',

    // 内存缓存，减少 localStorage 访问次数
    _cache: null,

    /**
     * 从 localStorage 加载收藏数据
     *
     * @returns {Array} 收藏书籍数组
     * @private
     */
    _loadFromStorage() {
        // 如果缓存存在，直接返回缓存
        if (this._cache !== null) {
            return this._cache;
        }

        // 检查 localStorage 是否可用
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage 不可用，收藏功能将无法持久化');
            this._cache = [];
            return this._cache;
        }

        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                this._cache = [];
                return this._cache;
            }

            // 解析 JSON 数据
            const favorites = JSON.parse(data);

            // 验证数据格式
            if (!Array.isArray(favorites)) {
                console.error('收藏数据格式错误，已重置');
                showToast('收藏数据已损坏，已自动恢复', 'warning');
                // 尝试备份损坏的数据
                this._backupCorruptedData(data);
                // 重置为空数组
                this._cache = [];
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
                return this._cache;
            }

            // 验证每个收藏项的数据完整性
            const validFavorites = favorites.filter(fav => {
                return fav &&
                       typeof fav.id === 'string' &&
                       typeof fav.title === 'string' &&
                       typeof fav.author === 'string';
            });

            // 如果有无效数据被过滤掉，保存清理后的数据
            if (validFavorites.length !== favorites.length) {
                console.warn(`过滤了 ${favorites.length - validFavorites.length} 个无效收藏项`);
                showToast('部分收藏数据已损坏，已自动清理', 'warning');
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validFavorites));
            }

            this._cache = validFavorites;
            return this._cache;

        } catch (error) {
            console.error('加载收藏数据失败:', error);
            showToast('加载收藏数据失败，已重置收藏夹', 'error');
            // JSON 解析失败，尝试备份并重置数据
            try {
                const corruptedData = localStorage.getItem(this.STORAGE_KEY);
                this._backupCorruptedData(corruptedData);
            } catch (e) {
                console.error('备份损坏数据失败:', e);
            }
            // 重置数据
            this._cache = [];
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            } catch (e) {
                console.error('重置数据失败:', e);
            }
            return this._cache;
        }
    },

    /**
     * 备份损坏的数据
     *
     * @param {string} corruptedData - 损坏的数据
     * @private
     */
    _backupCorruptedData(corruptedData) {
        try {
            const backupKey = `${this.STORAGE_KEY}_backup_${Date.now()}`;
            localStorage.setItem(backupKey, corruptedData);
            console.log(`损坏的数据已备份到: ${backupKey}`);
        } catch (error) {
            console.error('备份损坏数据失败:', error);
        }
    },

    /**
     * 保存收藏数据到 localStorage
     *
     * @param {Array} favorites - 收藏书籍数组
     * @returns {boolean} 保存是否成功
     * @private
     */
    _saveToStorage(favorites) {
        // 检查 localStorage 是否可用
        if (!isLocalStorageAvailable()) {
            console.warn('localStorage 不可用，无法保存收藏');
            showToast('浏览器存储不可用，收藏无法保存', 'error');
            return false;
        }

        try {
            const jsonData = JSON.stringify(favorites);
            localStorage.setItem(this.STORAGE_KEY, jsonData);
            // 更新缓存
            this._cache = favorites;
            return true;

        } catch (error) {
            // 处理配额已满等错误
            if (error.name === 'QuotaExceededError') {
                console.error('localStorage 配额已满，无法保存收藏');
                showToast('存储空间已满，无法保存更多收藏。请删除一些收藏后重试。', 'error');
            } else {
                console.error('保存收藏数据失败:', error);
                showToast('保存收藏失败，请重试', 'error');
            }
            return false;
        }
    },

    /**
     * 添加书籍到收藏夹
     *
     * @param {Object} book - 书籍对象，包含 title、author、reason、category、subcategory
     * @returns {boolean} 添加是否成功
     */
    addFavorite(book) {
        // 验证书籍数据
        if (!book || !book.title || !book.author) {
            console.error('无效的书籍数据');
            return false;
        }

        // 生成书籍 ID
        const bookId = generateBookId(book);

        // 加载当前收藏
        const favorites = this._loadFromStorage();

        // 检查是否已收藏（避免重复）
        if (favorites.some(fav => fav.id === bookId)) {
            console.log('书籍已在收藏夹中');
            return false;
        }

        // 创建收藏对象
        const favoriteBook = {
            id: bookId,
            title: book.title,
            author: book.author,
            reason: book.reason || '',
            category: book.category || '',
            subcategory: book.subcategory || '',
            timestamp: Date.now() // 记录收藏时间
        };

        // 添加到收藏列表
        favorites.push(favoriteBook);

        // 保存到 localStorage
        return this._saveToStorage(favorites);
    },

    /**
     * 从收藏夹删除书籍
     *
     * @param {string} bookId - 书籍 ID
     * @returns {boolean} 删除是否成功
     */
    removeFavorite(bookId) {
        if (!bookId) {
            console.error('无效的书籍 ID');
            return false;
        }

        // 加载当前收藏
        const favorites = this._loadFromStorage();

        // 查找并删除
        const index = favorites.findIndex(fav => fav.id === bookId);
        if (index === -1) {
            console.log('书籍不在收藏夹中');
            return false;
        }

        // 从数组中移除
        favorites.splice(index, 1);

        // 保存到 localStorage
        return this._saveToStorage(favorites);
    },

    /**
     * 检查书籍是否已收藏
     *
     * @param {string} bookId - 书籍 ID
     * @returns {boolean} 是否已收藏
     */
    isFavorite(bookId) {
        if (!bookId) {
            return false;
        }

        const favorites = this._loadFromStorage();
        return favorites.some(fav => fav.id === bookId);
    },

    /**
     * 获取所有收藏的书籍
     *
     * @returns {Array} 收藏书籍数组，按收藏时间倒序排列
     */
    getAllFavorites() {
        const favorites = this._loadFromStorage();
        // 按时间戳倒序排列（最新收藏的在前）
        return [...favorites].sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * 获取按类别分组的收藏
     *
     * @returns {Object} 按类别分组的对象，格式：{ 类别名: [书籍数组] }
     */
    getFavoritesByCategory() {
        const favorites = this.getAllFavorites();
        const grouped = {};

        favorites.forEach(book => {
            const category = book.category || '其他';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(book);
        });

        // 按类别名称字母顺序排序
        const sortedGrouped = {};
        Object.keys(grouped)
            .sort()
            .forEach(category => {
                sortedGrouped[category] = grouped[category];
            });

        return sortedGrouped;
    },

    /**
     * 清空缓存
     * 用于强制重新从 localStorage 加载数据
     */
    clearCache() {
        this._cache = null;
    }
};

// ============================================
// 页面初始化
// ============================================

/**
 * 页面加载完成后执行初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    // 初始化收藏功能
    initializeFavorites();

    // 加载类别数据
    loadCategories();

    // 更新收藏数量徽章
    updateFavoritesCount();

    // 初始化导航功能
    initializeNavigation();

    // 初始化收藏夹事件监听器
    initializeFavoritesEventListeners();
});

/**
 * 初始化收藏功能
 *
 * 在页面加载时执行以下操作：
 * 1. 检查 localStorage 是否可用
 * 2. 如果不可用，显示警告消息并降级处理
 * 3. 从 localStorage 加载收藏数据（通过 FavoritesManager）
 * 4. 初始化收藏状态缓存
 */
function initializeFavorites() {
    // 检查 localStorage 是否可用
    if (!isLocalStorageAvailable()) {
        // 显示警告消息
        showLocalStorageWarning();
        console.warn('localStorage 不可用，收藏功能将无法持久化数据');

        // 降级处理：使用内存存储（页面刷新后数据会丢失）
        // FavoritesManager 已经在 _loadFromStorage 中处理了这种情况
    }

    // 从 localStorage 加载收藏数据
    // 这会初始化 FavoritesManager 的缓存
    const favorites = FavoritesManager.getAllFavorites();

    console.log(`已加载 ${favorites.length} 个收藏`);
}

/**
 * 显示 localStorage 不可用警告
 *
 * 在页面顶部显示一个友好的警告消息，告知用户收藏功能受限
 */
function showLocalStorageWarning() {
    // 创建警告消息元素
    const warning = document.createElement('div');
    warning.className = 'storage-warning';
    warning.innerHTML = `
        <div class="warning-content">
            <span class="warning-icon">⚠️</span>
            <span class="warning-text">浏览器存储不可用，收藏功能将无法保存数据。请检查浏览器设置或退出隐私模式。</span>
            <button class="warning-close" aria-label="关闭警告">×</button>
        </div>
    `;

    // 插入到页面顶部
    document.body.insertBefore(warning, document.body.firstChild);

    // 添加关闭按钮事件
    const closeBtn = warning.querySelector('.warning-close');
    closeBtn.addEventListener('click', () => {
        warning.remove();
    });

    // 5秒后自动淡出（可选）
    setTimeout(() => {
        warning.style.opacity = '0';
        warning.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 500);
    }, 5000);
}

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

    // 生成书籍 ID 并设置到卡片上
    const bookId = generateBookId(book);
    bookCard.dataset.bookId = bookId;

    // 检查是否已收藏
    const isFavorited = FavoritesManager.isFavorite(bookId);

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
            <div class="book-title-wrapper">
                <h3>${escapeHtml(book.title)}</h3>
                ${categoryBadgeHtml ? `<div class="book-badges">${categoryBadgeHtml}</div>` : ''}
            </div>
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}"
                    data-book-id="${bookId}"
                    aria-label="${isFavorited ? '取消收藏' : '收藏'} ${escapeHtml(book.title)}"
                    aria-pressed="${isFavorited}">
                <span class="favorite-icon" aria-hidden="true">${isFavorited ? '★' : '☆'}</span>
            </button>
        </div>
        <p class="book-author">作者：${escapeHtml(book.author)}</p>
        <p class="book-reason">${escapeHtml(book.reason)}</p>
    `;

    // 添加收藏按钮点击事件
    const favoriteBtn = bookCard.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => handleFavoriteClick(e, book));

    return bookCard;
}

/**
 * 处理收藏按钮点击事件
 *
 * @param {Event} e - 点击事件对象
 * @param {Object} book - 书籍数据
 */
function handleFavoriteClick(e, book) {
    e.stopPropagation(); // 防止事件冒泡

    const button = e.currentTarget;
    const bookId = button.dataset.bookId;
    const icon = button.querySelector('.favorite-icon');

    // 检查当前收藏状态
    const isFavorited = FavoritesManager.isFavorite(bookId);

    if (isFavorited) {
        // 取消收藏
        const success = FavoritesManager.removeFavorite(bookId);
        if (success) {
            button.classList.remove('favorited');
            icon.textContent = '☆';
            button.setAttribute('aria-label', `收藏 ${book.title}`);
            button.setAttribute('aria-pressed', 'false');

            // 添加取消收藏动画
            button.classList.add('unfavorite-animation');
            setTimeout(() => button.classList.remove('unfavorite-animation'), 300);

            // 显示取消收藏反馈
            showToast('已取消收藏', 'info');
            announceToScreenReader(`已取消收藏 ${book.title}`);

            // 更新收藏数量徽章
            updateFavoritesCount();

            // 同步更新收藏夹视图（如果当前在收藏夹视图）
            if (currentView === 'favorites') {
                syncFavoritesView();
            }
        } else {
            // 取消收藏失败
            showToast('取消收藏失败，请重试', 'error');
        }
    } else {
        // 添加收藏
        const success = FavoritesManager.addFavorite(book);
        if (success) {
            button.classList.add('favorited');
            icon.textContent = '★';
            button.setAttribute('aria-label', `取消收藏 ${book.title}`);
            button.setAttribute('aria-pressed', 'true');

            // 添加收藏成功动画
            button.classList.add('favorite-animation');
            setTimeout(() => button.classList.remove('favorite-animation'), 600);

            // 显示收藏成功反馈
            showToast('已添加到收藏夹', 'success');
            announceToScreenReader(`已将 ${book.title} 添加到收藏夹`);

            // 更新收藏数量徽章
            updateFavoritesCount();

            // 同步更新收藏夹视图（如果当前在收藏夹视图）
            if (currentView === 'favorites') {
                syncFavoritesView();
            }
        } else {
            // 添加收藏失败（可能是 localStorage 配额已满）
            showToast('添加收藏失败，存储空间可能已满', 'error');
        }
    }
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
// 导航和视图切换功能
// ============================================

/**
 * 初始化导航功能
 *
 * 为导航标签添加点击事件监听器和键盘导航支持
 */
function initializeNavigation() {
    navTabs.forEach(tab => {
        // 点击事件
        tab.addEventListener('click', () => {
            const view = tab.dataset.view;
            switchView(view);
        });

        // 键盘导航支持
        tab.addEventListener('keydown', (e) => {
            // Enter 或 Space 键激活
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const view = tab.dataset.view;
                switchView(view);
            }
        });
    });
}

/**
 * 初始化收藏夹事件监听器
 *
 * 使用事件委托在收藏列表容器上监听删除按钮点击事件
 * 这样可以减少事件监听器数量，提高性能
 */
function initializeFavoritesEventListeners() {
    // 使用事件委托监听删除按钮点击
    favoritesList.addEventListener('click', handleRemoveFavorite);
}

/**
 * 切换视图
 *
 * 在推荐视图和收藏夹视图之间切换
 *
 * @param {string} view - 要切换到的视图：'recommendations' 或 'favorites'
 */
function switchView(view) {
    // 更新当前视图
    currentView = view;

    // 更新导航标签的激活状态
    navTabs.forEach(tab => {
        if (tab.dataset.view === view) {
            tab.classList.add('active');
            tab.setAttribute('aria-pressed', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-pressed', 'false');
        }
    });

    // 显示/隐藏对应的视图
    if (view === 'recommendations') {
        // 显示推荐视图，隐藏收藏夹视图
        recommendations.style.display = recommendations.innerHTML.trim() ? 'block' : 'none';
        favoritesView.style.display = 'none';

        // 显示输入表单
        document.querySelector('.input-section').style.display = 'block';

        // 向屏幕阅读器宣布视图切换
        announceToScreenReader('已切换到推荐视图');
    } else if (view === 'favorites') {
        // 隐藏推荐视图，显示收藏夹视图
        recommendations.style.display = 'none';
        favoritesView.style.display = 'block';

        // 隐藏输入表单
        document.querySelector('.input-section').style.display = 'none';

        // 渲染收藏夹内容
        renderFavoritesView();

        // 向屏幕阅读器宣布视图切换
        const favCount = FavoritesManager.getAllFavorites().length;
        announceToScreenReader(`已切换到收藏夹视图，共有 ${favCount} 本收藏的书籍`);
    }
}

/**
 * 渲染收藏夹视图
 *
 * 从 FavoritesManager 获取收藏数据并渲染到页面
 * 实现空状态和有收藏两种显示逻辑
 */
function renderFavoritesView() {
    // 从 FavoritesManager 获取所有收藏
    const favorites = FavoritesManager.getAllFavorites();

    if (favorites.length === 0) {
        // 显示空状态提示
        emptyState.style.display = 'block';
        favoritesList.style.display = 'none';
    } else {
        // 隐藏空状态，显示收藏列表
        emptyState.style.display = 'none';
        favoritesList.style.display = 'block';

        // 清空收藏列表容器
        favoritesList.innerHTML = '';

        // 按类别分组显示收藏
        renderFavoritesByCategory();
    }
}

/**
 * 按类别分组显示收藏
 *
 * 调用 FavoritesManager.getFavoritesByCategory() 获取分组数据
 * 为每个类别创建分组容器和标题
 * 在类别标题中显示该类别的书籍数量
 * 按字母顺序排列类别
 * 在每个类别组内按收藏时间排序显示书籍
 */
function renderFavoritesByCategory() {
    // 从 FavoritesManager 获取按类别分组的收藏
    const groupedFavorites = FavoritesManager.getFavoritesByCategory();

    // 获取所有类别并按字母顺序排序（getFavoritesByCategory 已经排序）
    const categories = Object.keys(groupedFavorites);

    // 为每个类别创建分组
    categories.forEach(category => {
        const books = groupedFavorites[category];

        // 创建类别分组容器
        const categoryGroup = document.createElement('div');
        categoryGroup.className = 'favorites-category-group';
        categoryGroup.dataset.category = category;

        // 创建类别标题
        const categoryTitle = document.createElement('h3');
        categoryTitle.className = 'favorites-category-title';
        categoryTitle.innerHTML = `
            ${escapeHtml(category)}
            <span class="category-count">(${books.length})</span>
        `;
        categoryGroup.appendChild(categoryTitle);

        // 创建该类别的书籍容器
        const booksContainer = document.createElement('div');
        booksContainer.className = 'favorites-books';

        // 渲染该类别的所有书籍
        // 书籍已经按收藏时间排序（getFavoritesByCategory 使用 getAllFavorites，已按时间倒序）
        books.forEach((book, index) => {
            const bookCard = createFavoriteBookCard(book, index);
            booksContainer.appendChild(bookCard);
        });

        categoryGroup.appendChild(booksContainer);
        favoritesList.appendChild(categoryGroup);
    });
}

/**
 * 创建收藏书籍卡片
 *
 * 为收藏夹视图创建书籍卡片，包含删除按钮
 * 显示书名、作者、推荐理由、类别和子类别
 *
 * @param {Object} book - 书籍数据
 * @param {number} index - 卡片索引
 * @returns {HTMLElement} 书籍卡片元素
 */
function createFavoriteBookCard(book, index) {
    const bookCard = document.createElement('div');
    bookCard.className = 'book-card favorite-book-card';
    bookCard.dataset.bookId = book.id;
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
            <div class="book-title-wrapper">
                <h3>${escapeHtml(book.title)}</h3>
                ${categoryBadgeHtml ? `<div class="book-badges">${categoryBadgeHtml}</div>` : ''}
            </div>
            <button class="remove-favorite-btn"
                    data-book-id="${book.id}"
                    aria-label="从收藏夹移除 ${escapeHtml(book.title)}">
                <span class="remove-icon" aria-hidden="true">×</span>
            </button>
        </div>
        <p class="book-author">作者：${escapeHtml(book.author)}</p>
        <p class="book-reason">${escapeHtml(book.reason)}</p>
    `;

    return bookCard;
}

/**
 * 更新收藏数量徽章
 *
 * 从 FavoritesManager 获取收藏数量并更新徽章显示
 */
function updateFavoritesCount() {
    const favorites = FavoritesManager.getAllFavorites();
    const count = favorites.length;

    // 更新徽章文本
    favoritesCount.textContent = count;

    // 如果数量为 0，可以选择隐藏徽章或保持显示
    // 这里选择始终显示，以保持 UI 一致性
}

/**
 * 处理删除收藏按钮点击事件
 *
 * 从收藏夹中删除书籍，并更新 UI
 * 包含淡出动画效果
 *
 * @param {Event} e - 点击事件对象
 */
function handleRemoveFavorite(e) {
    // 查找删除按钮
    const removeBtn = e.target.closest('.remove-favorite-btn');
    if (!removeBtn) return;

    e.stopPropagation(); // 防止事件冒泡

    const bookId = removeBtn.dataset.bookId;
    const bookCard = removeBtn.closest('.book-card');
    const categoryGroup = removeBtn.closest('.favorites-category-group');

    if (!bookId || !bookCard) return;

    // 添加删除动画类
    bookCard.classList.add('removing');

    // 等待动画完成后删除
    setTimeout(() => {
        // 从 FavoritesManager 删除收藏
        const success = FavoritesManager.removeFavorite(bookId);

        if (success) {
            // 从 DOM 中移除卡片元素
            bookCard.remove();

            // 显示删除成功反馈
            const bookTitle = bookCard.querySelector('h3')?.textContent || '书籍';
            showToast('已从收藏夹移除', 'info');
            announceToScreenReader(`已从收藏夹移除 ${bookTitle}`);

            // 更新收藏数量徽章
            updateFavoritesCount();

            // 检查该类别组是否还有书籍
            if (categoryGroup) {
                const remainingBooks = categoryGroup.querySelectorAll('.book-card');
                if (remainingBooks.length === 0) {
                    // 如果类别为空，添加淡出动画后移除整个分组
                    categoryGroup.style.opacity = '0';
                    categoryGroup.style.transform = 'translateY(-10px)';
                    categoryGroup.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    setTimeout(() => categoryGroup.remove(), 300);
                } else {
                    // 更新类别计数
                    const countSpan = categoryGroup.querySelector('.category-count');
                    if (countSpan) {
                        countSpan.textContent = `(${remainingBooks.length})`;
                    }
                }
            }

            // 检查收藏夹是否为空
            const allFavorites = FavoritesManager.getAllFavorites();
            if (allFavorites.length === 0) {
                // 显示空状态提示
                emptyState.style.display = 'block';
                favoritesList.style.display = 'none';
            }

            // 同步更新推荐视图中的收藏按钮状态
            syncRecommendationFavoriteButton(bookId, false);
        } else {
            // 删除失败，移除动画类
            bookCard.classList.remove('removing');
            showToast('删除收藏失败，请重试', 'error');
        }
    }, 400); // 与动画时间匹配
}

/**
 * 同步推荐视图中的收藏按钮状态
 *
 * 当收藏状态改变时，同步更新推荐视图中对应书籍的收藏按钮
 * 确保推荐视图和收藏夹视图之间的状态一致
 *
 * @param {string} bookId - 书籍 ID
 * @param {boolean} isFavorited - 是否已收藏
 */
function syncRecommendationFavoriteButton(bookId, isFavorited) {
    // 查找推荐视图中对应的收藏按钮
    const recommendationCard = document.querySelector(
        `#recommendations .book-card[data-book-id="${bookId}"]`
    );

    if (recommendationCard) {
        const favoriteBtn = recommendationCard.querySelector('.favorite-btn');
        const icon = favoriteBtn.querySelector('.favorite-icon');

        if (favoriteBtn && icon) {
            // 获取书名用于 aria-label
            const bookTitle = recommendationCard.querySelector('h3')?.textContent || '此书';

            if (isFavorited) {
                favoriteBtn.classList.add('favorited');
                icon.textContent = '★';
                favoriteBtn.setAttribute('aria-label', `取消收藏 ${bookTitle}`);
                favoriteBtn.setAttribute('aria-pressed', 'true');
            } else {
                favoriteBtn.classList.remove('favorited');
                icon.textContent = '☆';
                favoriteBtn.setAttribute('aria-label', `收藏 ${bookTitle}`);
                favoriteBtn.setAttribute('aria-pressed', 'false');
            }
        }
    }
}

/**
 * 同步收藏夹视图
 *
 * 当收藏状态改变时，重新渲染收藏夹视图
 * 确保收藏夹视图显示最新的收藏数据
 */
function syncFavoritesView() {
    // 只在收藏夹视图激活时才重新渲染
    if (currentView === 'favorites' && favoritesView.style.display !== 'none') {
        renderFavoritesView();
    }
}

// ============================================
// 用户反馈和通知系统
// ============================================

/**
 * 显示 Toast 通知
 *
 * 在页面右上角显示一个短暂的通知消息
 * 支持不同类型的通知：成功、错误、警告、信息
 *
 * @param {string} message - 通知消息内容
 * @param {string} type - 通知类型：'success', 'error', 'warning', 'info'
 * @param {number} duration - 显示时长（毫秒），默认 3000ms
 */
function showToast(message, type = 'info', duration = 3000) {
    // 创建或获取 toast 容器
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    // 创建 toast 元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // 根据类型选择图标
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    const icon = icons[type] || icons.info;

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    // 添加到容器
    toastContainer.appendChild(toast);

    // 触发进入动画
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);

    // 自动移除
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');

        // 动画结束后从 DOM 移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
            // 如果容器为空，也移除容器
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 300);
    }, duration);
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

// ============================================
// 无障碍功能 - 屏幕阅读器支持
// ============================================

/**
 * 向屏幕阅读器宣布消息
 *
 * 使用 ARIA live region 向屏幕阅读器用户宣布重要的状态变化
 * 这对于动态内容更新和用户操作反馈非常重要
 *
 * @param {string} message - 要宣布的消息
 * @param {string} priority - 优先级：'polite'（默认）或 'assertive'
 */
function announceToScreenReader(message, priority = 'polite') {
    const announcer = document.getElementById('srAnnouncer');
    if (!announcer) return;

    // 设置优先级
    announcer.setAttribute('aria-live', priority);

    // 清空内容，然后设置新消息
    // 这确保屏幕阅读器会读取新消息
    announcer.textContent = '';
    setTimeout(() => {
        announcer.textContent = message;
    }, 100);

    // 3秒后清空消息
    setTimeout(() => {
        announcer.textContent = '';
    }, 3000);
}

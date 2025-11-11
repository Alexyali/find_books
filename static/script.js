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

// ============================================
// 事件监听器设置
// ============================================

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
 * 获取书籍推荐
 *
 * 向后端 API 发送心情数据，获取书籍推荐结果
 * 这是应用的核心功能函数
 *
 * @param {string} mood - 用户输入的心情描述
 *
 * 流程：
 * 1. 显示加载状态
 * 2. 发送 POST 请求到 /api/recommend
 * 3. 处理响应数据
 * 4. 显示推荐结果或错误信息
 */
async function getRecommendations(mood) {
    // 显示加载状态，隐藏之前的结果和错误
    showLoading();
    hideError();
    hideRecommendations();

    try {
        // 发送 AJAX 请求到后端 API
        // 使用 fetch API 进行异步 HTTP 请求
        const response = await fetch('/api/recommend', {
            method: 'POST',                              // 使用 POST 方法
            headers: {
                'Content-Type': 'application/json',      // 指定请求体格式为 JSON
            },
            body: JSON.stringify({ mood: mood }),        // 将心情数据转换为 JSON 字符串
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
 * 使用动画效果使卡片依次出现，提升用户体验
 *
 * @param {Array} books - 推荐书籍数组，每个元素包含 title、author、reason
 *
 * 数据格式示例：
 * [
 *   {
 *     title: "书名",
 *     author: "作者",
 *     reason: "推荐理由"
 *   }
 * ]
 */
function displayRecommendations(books) {
    // 验证数据有效性
    if (!books || books.length === 0) {
        showError('未能获取到推荐结果，请重试');
        return;
    }

    // 清空之前的结果
    // 确保每次显示的都是最新的推荐
    bookList.innerHTML = '';

    // 动态创建推荐卡片
    // 遍历每本书，创建对应的 HTML 元素
    books.forEach((book, index) => {
        // 创建卡片容器
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        // 设置动画延迟，使卡片依次出现
        // 每张卡片延迟 0.1 秒，创造流畅的动画效果
        bookCard.style.animationDelay = `${index * 0.1}s`;

        // 填充卡片内容
        // 使用 escapeHtml 防止 XSS 攻击
        bookCard.innerHTML = `
            <h3>${escapeHtml(book.title)}</h3>
            <p class="book-author">作者：${escapeHtml(book.author)}</p>
            <p class="book-reason">${escapeHtml(book.reason)}</p>
        `;

        // 将卡片添加到列表中
        bookList.appendChild(bookCard);
    });

    // 显示推荐区域
    showRecommendations();
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

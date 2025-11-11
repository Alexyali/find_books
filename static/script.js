// DOM 元素
const moodForm = document.getElementById('moodForm');
const moodInput = document.getElementById('moodInput');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const retryBtn = document.getElementById('retryBtn');
const recommendations = document.getElementById('recommendations');
const bookList = document.getElementById('bookList');
const moodButtons = document.querySelectorAll('.mood-btn');

// 预设心情按钮点击事件
moodButtons.forEach(button => {
    button.addEventListener('click', () => {
        const mood = button.getAttribute('data-mood');
        moodInput.value = mood;
        moodInput.focus();
    });
});

// 表单提交处理
moodForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 客户端输入验证
    const mood = moodInput.value.trim();
    if (!mood) {
        showError('请输入你的心情或选择预设心情');
        return;
    }

    // 发送推荐请求
    await getRecommendations(mood);
});

// 重试按钮点击事件
retryBtn.addEventListener('click', () => {
    hideError();
    const mood = moodInput.value.trim();
    if (mood) {
        getRecommendations(mood);
    }
});

// 获取书籍推荐
async function getRecommendations(mood) {
    // 显示加载状态
    showLoading();
    hideError();
    hideRecommendations();

    try {
        // 发送 AJAX 请求
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mood: mood }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '获取推荐失败');
        }

        // 显示推荐结果
        displayRecommendations(data.recommendations);

    } catch (error) {
        // 错误处理
        let errorMsg = '获取推荐失败，请稍后重试';

        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMsg = '网络连接失败，请检查网络连接';
        } else if (error.message) {
            errorMsg = error.message;
        }

        showError(errorMsg);
    } finally {
        hideLoading();
    }
}

// 显示推荐结果
function displayRecommendations(books) {
    if (!books || books.length === 0) {
        showError('未能获取到推荐结果，请重试');
        return;
    }

    // 清空之前的结果
    bookList.innerHTML = '';

    // 动态创建推荐卡片
    books.forEach((book, index) => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';
        bookCard.style.animationDelay = `${index * 0.1}s`;

        bookCard.innerHTML = `
            <h3>${escapeHtml(book.title)}</h3>
            <p class="book-author">作者：${escapeHtml(book.author)}</p>
            <p class="book-reason">${escapeHtml(book.reason)}</p>
        `;

        bookList.appendChild(bookCard);
    });

    // 显示推荐区域
    showRecommendations();
}

// 显示加载状态
function showLoading() {
    loading.style.display = 'block';
    submitBtn.disabled = true;
}

// 隐藏加载状态
function hideLoading() {
    loading.style.display = 'none';
    submitBtn.disabled = false;
}

// 显示错误信息
function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

// 隐藏错误信息
function hideError() {
    errorMessage.style.display = 'none';
}

// 显示推荐结果
function showRecommendations() {
    recommendations.style.display = 'block';
}

// 隐藏推荐结果
function hideRecommendations() {
    recommendations.style.display = 'none';
}

// HTML 转义函数，防止 XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

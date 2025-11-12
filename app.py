"""
智能书籍推荐系统 - Flask 后端应用

这是一个基于用户心情的智能书籍推荐系统的后端服务。
系统通过 OpenAI GPT 模型分析用户心情并推荐适合的书籍。

主要功能：
- 提供 Web 界面服务
- 接收用户心情输入
- 调用 OpenAI API 获取书籍推荐
- 返回格式化的推荐结果

 * 作者：[huangweijia]
 * 日期：2025.11.12
"""

import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from volcenginesdkarkruntime import Ark

# 加载环境变量
# 从 .env 文件中读取配置信息（如 API 密钥）
load_dotenv()

# 初始化 Flask 应用
app = Flask(__name__)

# 配置应用
# 从环境变量中获取 API 密钥
app.config['ARK_API_KEY'] = os.getenv('ARK_API_KEY')

# 初始化 Ark 客户端（使用火山引擎 ARK API）
# 用于后续调用 API 服务
client = Ark(api_key=os.environ.get("ARK_API_KEY"))

# 书籍类别数据结构
# 定义系统支持的所有书籍类别及其子类别
BOOK_CATEGORIES = {
    "literature": {
        "id": "literature",
        "name": "文学类",
        "subcategories": ["小说", "散文", "诗歌", "经典名著", "当代文学", "外国文学"]
    },
    "social_science": {
        "id": "social_science",
        "name": "社科类",
        "subcategories": ["历史", "哲学", "心理学", "社会学", "政治", "经济学"]
    },
    "technology": {
        "id": "technology",
        "name": "科技类",
        "subcategories": ["科普", "互联网", "人工智能", "编程技术", "科学史"]
    },
    "business": {
        "id": "business",
        "name": "商业类",
        "subcategories": ["管理", "创业", "营销", "投资理财", "职场"]
    },
    "lifestyle": {
        "id": "lifestyle",
        "name": "生活类",
        "subcategories": ["健康养生", "美食", "旅行", "家居", "时尚"]
    },
    "personal_growth": {
        "id": "personal_growth",
        "name": "成长类",
        "subcategories": ["自我提升", "励志", "学习方法", "时间管理", "沟通技巧"]
    },
    "arts": {
        "id": "arts",
        "name": "艺术类",
        "subcategories": ["绘画", "音乐", "摄影", "设计", "电影"]
    },
    "children": {
        "id": "children",
        "name": "儿童类",
        "subcategories": ["绘本", "儿童文学", "科普读物", "教育"]
    },
    "comics": {
        "id": "comics",
        "name": "漫画类",
        "subcategories": ["国漫", "日漫", "欧美漫画"]
    },
    "mystery": {
        "id": "mystery",
        "name": "悬疑推理",
        "subcategories": ["推理小说", "悬疑小说", "犯罪小说"]
    },
    "scifi_fantasy": {
        "id": "scifi_fantasy",
        "name": "科幻奇幻",
        "subcategories": ["科幻小说", "奇幻小说", "玄幻小说"]
    },
    "romance": {
        "id": "romance",
        "name": "言情类",
        "subcategories": ["现代言情", "古代言情", "都市情感"]
    }
}


def build_prompt(mood, categories=None):
    """
    构建推荐提示词，根据用户心情和类别偏好生成合适的 prompt

    此函数将用户的心情描述和可选的类别偏好转换为结构化的提示词，
    指导 GPT 模型生成符合要求的书籍推荐结果。

    参数：
        mood (str): 用户输入的心情描述
        categories (list, optional): 用户选择的类别 ID 列表

    返回：
        str: 格式化的提示词，包含推荐要求和输出格式说明

    示例：
        >>> build_prompt("开心", ["literature", "arts"])
        "你是一位专业的图书推荐专家。用户当前的心情是：开心..."
    """
    # 基础提示词
    prompt = f"""你是一位专业的图书推荐专家。用户当前的心情是：{mood}"""

    # 如果用户指定了类别偏好，添加到提示词中
    if categories:
        category_names = [BOOK_CATEGORIES[cat]["name"] for cat in categories]
        prompt += f"\n\n用户偏好的书籍类别：{', '.join(category_names)}"
        prompt += "\n请优先推荐这些类别的书籍。"

    # 添加推荐要求和格式说明
    prompt += """

请根据用户的心情推荐 3-5 本适合的书籍。对于每本书，请提供：
1. 书名
2. 作者
3. 推荐理由（说明为什么这本书适合用户当前的心情）
4. 书籍类别（从以下类别中选择）
5. 书籍子类别（可选）

可用的书籍类别：
- 文学类：小说、散文、诗歌、经典名著、当代文学、外国文学
- 社科类：历史、哲学、心理学、社会学、政治、经济学
- 科技类：科普、互联网、人工智能、编程技术、科学史
- 商业类：管理、创业、营销、投资理财、职场
- 生活类：健康养生、美食、旅行、家居、时尚
- 成长类：自我提升、励志、学习方法、时间管理、沟通技巧
- 艺术类：绘画、音乐、摄影、设计、电影
- 儿童类：绘本、儿童文学、科普读物、教育
- 漫画类：国漫、日漫、欧美漫画
- 悬疑推理：推理小说、悬疑小说、犯罪小说
- 科幻奇幻：科幻小说、奇幻小说、玄幻小说
- 言情类：现代言情、古代言情、都市情感

请以 JSON 格式返回推荐结果，格式如下：
[
  {
    "title": "书名",
    "author": "作者",
    "reason": "推荐理由",
    "category": "类别名称（如：文学类）",
    "subcategory": "子类别（如：小说）"
  }
]

只返回 JSON 数组，不要包含其他文字说明。"""
    return prompt


def parse_response(response_text):
    """
    解析 API 响应，提取书名、作者、推荐理由和类别信息

    此函数负责将 OpenAI API 返回的文本响应解析为结构化的数据。
    支持直接 JSON 解析和从文本中提取 JSON 的容错处理。

    参数：
        response_text (str): OpenAI API 返回的原始文本响应

    返回：
        list: 包含推荐书籍的列表，每个元素是一个字典，包含：
            - title (str): 书名
            - author (str): 作者
            - reason (str): 推荐理由
            - category (str): 书籍类别
            - subcategory (str, optional): 书籍子类别

    异常：
        ValueError: 当响应格式不正确或缺少必需字段时抛出

    示例：
        >>> parse_response('[{"title":"书名","author":"作者","reason":"理由","category":"文学类","subcategory":"小说"}]')
        [{'title': '书名', 'author': '作者', 'reason': '理由', 'category': '文学类', 'subcategory': '小说'}]
    """
    import json
    try:
        # 尝试直接解析 JSON
        # 大多数情况下，GPT 会直接返回有效的 JSON 格式
        recommendations = json.loads(response_text)

        # 验证数据结构
        # 确保返回的是列表类型
        if not isinstance(recommendations, list):
            raise ValueError("响应格式不正确")

        # 确保每个推荐都有必需的字段
        # 验证数据完整性，防止缺少关键信息
        for rec in recommendations:
            # 检查基本必需字段
            if not all(key in rec for key in ['title', 'author', 'reason']):
                raise ValueError("推荐数据缺少必需字段")

            # 检查类别字段，如果缺少则设置默认值
            if 'category' not in rec:
                rec['category'] = '其他'

            # subcategory 是可选字段，如果不存在则设置为空字符串
            if 'subcategory' not in rec:
                rec['subcategory'] = ''

        return recommendations
    except json.JSONDecodeError:
        # 如果直接解析失败，尝试从文本中提取 JSON 部分
        # 这是一个容错机制，处理 GPT 可能在 JSON 前后添加说明文字的情况
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                # 对提取的 JSON 也进行字段验证和补充
                for rec in recommendations:
                    if not all(key in rec for key in ['title', 'author', 'reason']):
                        raise ValueError("推荐数据缺少必需字段")
                    if 'category' not in rec:
                        rec['category'] = '其他'
                    if 'subcategory' not in rec:
                        rec['subcategory'] = ''
                return recommendations
            except:
                pass
        raise ValueError("无法解析 API 响应")


def get_book_recommendations(mood, categories=None):
    """
    调用 OpenAI API，传递心情描述和类别偏好并获取推荐

    这是核心推荐函数，负责整合提示词构建、API 调用和响应解析。

    参数：
        mood (str): 用户输入的心情描述
        categories (list, optional): 用户选择的类别 ID 列表

    返回：
        list: 推荐书籍列表，每个元素包含 title、author、reason、category、subcategory

    异常：
        Exception: 当 API 调用失败时抛出，包含详细错误信息

    注意：
        - 设置了 30 秒超时限制
        - 使用 gpt-3.5-turbo 模型
        - temperature 设置为 0.7，平衡创造性和准确性
    """
    try:
        # 构建提示词
        # 将用户心情和类别偏好转换为 GPT 可理解的推荐请求
        prompt = build_prompt(mood, categories)

        # 调用 Ark API
        # 使用 chat completions API 进行对话式交互
        response = client.chat.completions.create(
            model="doubao-seed-1-6-251015",
            messages=[
                # system 消息：定义 AI 助手的角色和行为
                {"role": "system", "content": "你是一位专业的图书推荐专家，擅长根据用户心情推荐合适的书籍。"},
                # user 消息：包含用户的实际请求
                {"role": "user", "content": prompt}
            ],
            reasoning_effort = "minimal",  # 控制推理时长，最快推理
            temperature=0.7,  # 控制输出的随机性，0.7 提供适度的创造性
            max_tokens=1500,  # 增加限制以容纳类别信息
            timeout=60  # 60 秒超时，符合需求规范
        )

        # 提取响应内容
        # 从 API 响应对象中获取实际的文本内容
        response_text = response.choices[0].message.content.strip()

        # 解析响应
        # 将文本格式的响应转换为结构化的推荐列表
        recommendations = parse_response(response_text)

        return recommendations

    except Exception as e:
        # 捕获 API 调用异常
        # 记录错误日志，便于调试和监控
        app.logger.error(f"OpenAI API 调用失败: {str(e)}")
        raise


@app.route('/')
def index():
    """
    主页路由，返回 HTML 页面

    处理 GET / 请求，渲染并返回应用的主页面。

    返回：
        str: 渲染后的 HTML 页面内容
    """
    return render_template('index.html')


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """
    类别 API 端点，返回所有可用的书籍类别列表

    处理 GET /api/categories 请求，返回系统支持的所有书籍类别。

    成功响应 (200)：
        {
            "categories": [
                {
                    "id": "literature",
                    "name": "文学类",
                    "subcategories": ["小说", "散文", "诗歌", ...]
                },
                ...
            ]
        }
    """
    # 将 BOOK_CATEGORIES 字典转换为列表格式
    categories_list = list(BOOK_CATEGORIES.values())
    return jsonify({'categories': categories_list}), 200


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    推荐 API 端点，接收心情输入并返回书籍推荐

    处理 POST /api/recommend 请求，这是系统的核心 API 端点。

    请求格式：
        {
            "mood": "用户心情描述",
            "categories": ["literature", "technology"]  // 可选
        }

    成功响应 (200)：
        {
            "recommendations": [
                {
                    "title": "书名",
                    "author": "作者",
                    "reason": "推荐理由",
                    "category": "类别",
                    "subcategory": "子类别"
                }
            ]
        }

    错误响应：
        - 400: 请求参数错误
        - 429: API 配额不足或请求过于频繁
        - 500: 服务器内部错误
        - 504: 请求超时
    """
    try:
        # 获取请求数据
        # 从 POST 请求体中解析 JSON 数据
        data = request.get_json()

        # 验证请求数据
        # 确保请求包含必需的 mood 字段
        if not data or 'mood' not in data:
            return jsonify({'error': '请提供心情描述'}), 400

        mood = data['mood'].strip()

        # 检查心情输入不为空
        # 客户端验证的服务器端二次确认
        if not mood:
            return jsonify({'error': '心情描述不能为空'}), 400

        # 限制输入长度
        # 防止过长的输入导致 API 调用失败或费用过高
        if len(mood) > 500:
            return jsonify({'error': '心情描述不能超过 500 字符'}), 400

        # 获取可选的类别参数
        categories = data.get('categories', [])

        # 验证 categories 参数格式
        if categories is not None:
            # 确保 categories 是列表类型
            if not isinstance(categories, list):
                return jsonify({'error': 'categories 参数必须是数组'}), 400

            # 验证每个类别 ID 是否有效
            for category_id in categories:
                if category_id not in BOOK_CATEGORIES:
                    return jsonify({'error': f'无效的类别 ID: {category_id}'}), 400

        # 调用 OpenAI 集成函数获取推荐结果
        # 这是核心业务逻辑，调用 GPT 模型生成推荐
        recommendations = get_book_recommendations(mood, categories if categories else None)

        # 返回 JSON 格式的推荐数据
        # 成功响应，返回 200 状态码
        return jsonify({'recommendations': recommendations}), 200

    except ValueError as e:
        # 处理解析错误
        # 当 API 响应格式不符合预期时触发
        return jsonify({'error': f'处理推荐结果时出错: {str(e)}'}), 500

    except Exception as e:
        # 处理其他错误
        # 统一的错误处理机制，提供友好的用户提示
        error_message = str(e)

        # 根据错误类型返回友好的错误信息
        # 通过错误消息关键词判断错误类型，返回相应的 HTTP 状态码
        if 'api_key' in error_message.lower() or 'authentication' in error_message.lower():
            # API 密钥相关错误
            return jsonify({'error': 'API 密钥无效，请检查配置'}), 500
        elif 'quota' in error_message.lower() or 'rate_limit' in error_message.lower():
            # 配额或频率限制错误
            return jsonify({'error': 'API 配额不足或请求过于频繁，请稍后再试'}), 429
        elif 'timeout' in error_message.lower():
            # 超时错误
            return jsonify({'error': '请求超时，请稍后再试'}), 504
        else:
            # 其他未知错误
            return jsonify({'error': '获取推荐时出错，请稍后再试'}), 500


if __name__ == '__main__':
    # 应用启动入口
    # 从环境变量读取端口号，默认为 5000
    port = int(os.getenv('PORT', 5000))

    # 启动 Flask 开发服务器
    # host='0.0.0.0' 允许局域网内的其他设备访问
    # debug 模式根据 FLASK_ENV 环境变量决定
    # - development: 启用调试模式，支持热重载和详细错误信息
    # - production: 禁用调试模式，提高安全性和性能
    app.run(host='0.0.0.0', debug=os.getenv('FLASK_ENV') == 'development', port=port)

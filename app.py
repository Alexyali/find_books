"""
智能书籍推荐系统 - Flask 后端应用

这是一个基于用户心情的智能书籍推荐系统的后端服务。
系统通过 OpenAI GPT 模型分析用户心情并推荐适合的书籍。

主要功能：
- 提供 Web 界面服务
- 接收用户心情输入
- 调用 OpenAI API 获取书籍推荐
- 返回格式化的推荐结果

作者：[Your Name]
日期：2024
"""

import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI

# 加载环境变量
# 从 .env 文件中读取配置信息（如 API 密钥）
load_dotenv()

# 初始化 Flask 应用
app = Flask(__name__)

# 配置应用
# 从环境变量中获取 API 密钥
app.config['ARK_API_KEY'] = os.getenv('ARK_API_KEY')

# 初始化 OpenAI 客户端（使用火山引擎 ARK API）
# 用于后续调用 API 服务
client = OpenAI(
    api_key=os.environ.get("ARK_API_KEY"),
    base_url="https://ark.cn-beijing.volces.com/api/v3",
)


def build_prompt(mood):
    """
    构建推荐提示词，根据用户心情生成合适的 prompt

    此函数将用户的心情描述转换为结构化的提示词，
    指导 GPT 模型生成符合要求的书籍推荐结果。

    参数：
        mood (str): 用户输入的心情描述

    返回：
        str: 格式化的提示词，包含推荐要求和输出格式说明

    示例：
        >>> build_prompt("开心")
        "你是一位专业的图书推荐专家。用户当前的心情是：开心..."
    """
    prompt = f"""你是一位专业的图书推荐专家。用户当前的心情是：{mood}

请根据用户的心情推荐 3-5 本适合的书籍。对于每本书，请提供：
1. 书名
2. 作者
3. 推荐理由（说明为什么这本书适合用户当前的心情）

请以 JSON 格式返回推荐结果，格式如下：
[
  {{
    "title": "书名",
    "author": "作者",
    "reason": "推荐理由"
  }}
]

只返回 JSON 数组，不要包含其他文字说明。"""
    return prompt


def parse_response(response_text):
    """
    解析 API 响应，提取书名、作者和推荐理由

    此函数负责将 OpenAI API 返回的文本响应解析为结构化的数据。
    支持直接 JSON 解析和从文本中提取 JSON 的容错处理。

    参数：
        response_text (str): OpenAI API 返回的原始文本响应

    返回：
        list: 包含推荐书籍的列表，每个元素是一个字典，包含：
            - title (str): 书名
            - author (str): 作者
            - reason (str): 推荐理由

    异常：
        ValueError: 当响应格式不正确或缺少必需字段时抛出

    示例：
        >>> parse_response('[{"title":"书名","author":"作者","reason":"理由"}]')
        [{'title': '书名', 'author': '作者', 'reason': '理由'}]
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
            if not all(key in rec for key in ['title', 'author', 'reason']):
                raise ValueError("推荐数据缺少必需字段")

        return recommendations
    except json.JSONDecodeError:
        # 如果直接解析失败，尝试从文本中提取 JSON 部分
        # 这是一个容错机制，处理 GPT 可能在 JSON 前后添加说明文字的情况
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                return recommendations
            except:
                pass
        raise ValueError("无法解析 API 响应")


def get_book_recommendations(mood):
    """
    调用 OpenAI API，传递心情描述并获取推荐

    这是核心推荐函数，负责整合提示词构建、API 调用和响应解析。

    参数：
        mood (str): 用户输入的心情描述

    返回：
        list: 推荐书籍列表，每个元素包含 title、author、reason

    异常：
        Exception: 当 API 调用失败时抛出，包含详细错误信息

    注意：
        - 设置了 30 秒超时限制
        - 使用 gpt-3.5-turbo 模型
        - temperature 设置为 0.7，平衡创造性和准确性
    """
    try:
        # 构建提示词
        # 将用户心情转换为 GPT 可理解的推荐请求
        prompt = build_prompt(mood)

        # 调用 OpenAI API，设置 30 秒超时
        # 使用 chat completions API 进行对话式交互
        response = client.chat.completions.create(
            model="doubao-seed-1-6-251015",  # 使用 GPT-3.5 Turbo 模型，性价比高
            messages=[
                # system 消息：定义 AI 助手的角色和行为
                {"role": "system", "content": "你是一位专业的图书推荐专家，擅长根据用户心情推荐合适的书籍。"},
                # user 消息：包含用户的实际请求
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,  # 控制输出的随机性，0.7 提供适度的创造性
            max_tokens=1000,  # 限制响应长度，避免过长的输出
            timeout=30  # 30 秒超时，符合需求规范
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


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """
    推荐 API 端点，接收心情输入并返回书籍推荐

    处理 POST /api/recommend 请求，这是系统的核心 API 端点。

    请求格式：
        {
            "mood": "用户心情描述"
        }

    成功响应 (200)：
        {
            "recommendations": [
                {
                    "title": "书名",
                    "author": "作者",
                    "reason": "推荐理由"
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

        # 调用 OpenAI 集成函数获取推荐结果
        # 这是核心业务逻辑，调用 GPT 模型生成推荐
        recommendations = get_book_recommendations(mood)

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
    # debug 模式根据 FLASK_ENV 环境变量决定
    # - development: 启用调试模式，支持热重载和详细错误信息
    # - production: 禁用调试模式，提高安全性和性能
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=port)

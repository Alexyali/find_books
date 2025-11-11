import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI

# 加载环境变量
load_dotenv()

# 初始化 Flask 应用
app = Flask(__name__)

# 配置
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY')

# 初始化 OpenAI 客户端
client = OpenAI(api_key=app.config['OPENAI_API_KEY'])


def build_prompt(mood):
    """构建推荐提示词，根据用户心情生成合适的 prompt"""
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
    """解析 API 响应，提取书名、作者和推荐理由"""
    import json
    try:
        # 尝试直接解析 JSON
        recommendations = json.loads(response_text)

        # 验证数据结构
        if not isinstance(recommendations, list):
            raise ValueError("响应格式不正确")

        # 确保每个推荐都有必需的字段
        for rec in recommendations:
            if not all(key in rec for key in ['title', 'author', 'reason']):
                raise ValueError("推荐数据缺少必需字段")

        return recommendations
    except json.JSONDecodeError:
        # 如果解析失败，尝试提取 JSON 部分
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
    """调用 OpenAI API，传递心情描述并获取推荐"""
    try:
        # 构建提示词
        prompt = build_prompt(mood)

        # 调用 OpenAI API，设置 30 秒超时
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "你是一位专业的图书推荐专家，擅长根据用户心情推荐合适的书籍。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000,
            timeout=30
        )

        # 提取响应内容
        response_text = response.choices[0].message.content.strip()

        # 解析响应
        recommendations = parse_response(response_text)

        return recommendations

    except Exception as e:
        # 捕获 API 调用异常
        app.logger.error(f"OpenAI API 调用失败: {str(e)}")
        raise


@app.route('/')
def index():
    """主页路由，返回 HTML 页面"""
    return render_template('index.html')


@app.route('/api/recommend', methods=['POST'])
def recommend():
    """推荐 API 端点，接收心情输入并返回书籍推荐"""
    try:
        # 获取请求数据
        data = request.get_json()

        # 验证请求数据
        if not data or 'mood' not in data:
            return jsonify({'error': '请提供心情描述'}), 400

        mood = data['mood'].strip()

        # 检查心情输入不为空
        if not mood:
            return jsonify({'error': '心情描述不能为空'}), 400

        # 限制输入长度
        if len(mood) > 500:
            return jsonify({'error': '心情描述不能超过 500 字符'}), 400

        # 调用 OpenAI 集成函数获取推荐结果
        recommendations = get_book_recommendations(mood)

        # 返回 JSON 格式的推荐数据
        return jsonify({'recommendations': recommendations}), 200

    except ValueError as e:
        # 处理解析错误
        return jsonify({'error': f'处理推荐结果时出错: {str(e)}'}), 500

    except Exception as e:
        # 处理其他错误
        error_message = str(e)

        # 根据错误类型返回友好的错误信息
        if 'api_key' in error_message.lower() or 'authentication' in error_message.lower():
            return jsonify({'error': 'API 密钥无效，请检查配置'}), 500
        elif 'quota' in error_message.lower() or 'rate_limit' in error_message.lower():
            return jsonify({'error': 'API 配额不足或请求过于频繁，请稍后再试'}), 429
        elif 'timeout' in error_message.lower():
            return jsonify({'error': '请求超时，请稍后再试'}), 504
        else:
            return jsonify({'error': '获取推荐时出错，请稍后再试'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=port)

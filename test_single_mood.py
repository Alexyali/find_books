"""
单个心情测试脚本

快速测试单个心情的书籍推荐功能
"""

import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# 加载环境变量
load_dotenv()


def test_single_mood():
    """测试单个心情的推荐"""

    # 测试心情
    mood = "开心快乐"

    print("=" * 60)
    print(f"测试心情: {mood}")
    print("=" * 60)
    print()

    # 检查 API 密钥
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 ARK_API_KEY")
        return False

    try:
        # 初始化客户端
        client = OpenAI(
            api_key=api_key,
            base_url="https://ark.cn-beijing.volces.com/api/v3",
        )

        # 构建提示词（与 app.py 完全相同）
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

        print("正在调用 API...")

        # 调用 API（与 app.py 完全相同）
        response = client.chat.completions.create(
            model="doubao-seed-1-6-251015",
            messages=[
                {"role": "system", "content": "你是一位专业的图书推荐专家，擅长根据用户心情推荐合适的书籍。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )

        # 提取响应
        response_text = response.choices[0].message.content.strip()

        print("✓ API 调用成功!")
        print()
        print("原始响应:")
        print("-" * 60)
        print(response_text)
        print("-" * 60)
        print()

        # 解析 JSON
        try:
            recommendations = json.loads(response_text)

            print(f"✓ 成功解析 {len(recommendations)} 本书籍推荐")
            print()

            # 显示推荐
            for i, book in enumerate(recommendations, 1):
                print(f"📚 推荐 {i}:")
                print(f"   书名: {book.get('title', 'N/A')}")
                print(f"   作者: {book.get('author', 'N/A')}")
                print(f"   理由: {book.get('reason', 'N/A')}")
                print()

            print("=" * 60)
            print("✅ 测试成功!")
            print("=" * 60)
            return True

        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析失败: {e}")

            # 尝试提取 JSON
            import re
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                print()
                print("尝试提取 JSON 部分...")
                try:
                    recommendations = json.loads(json_match.group())
                    print(f"✓ 成功提取并解析 {len(recommendations)} 本书籍")
                    return True
                except:
                    print("❌ 提取失败")

            return False

    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False


if __name__ == '__main__':
    success = test_single_mood()
    exit(0 if success else 1)

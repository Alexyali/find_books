"""
书籍推荐功能测试脚本

模拟 app.py 的实际提示词，测试书籍推荐功能
"""

import os
import json
from dotenv import load_dotenv
from volcenginesdkarkruntime import Ark

# 加载环境变量
load_dotenv()


def build_prompt(mood):
    """
    构建推荐提示词（与 app.py 中的函数相同）
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
    解析 API 响应（与 app.py 中的函数相同）
    """
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
        # 如果直接解析失败，尝试从文本中提取 JSON 部分
        import re
        json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
        if json_match:
            try:
                recommendations = json.loads(json_match.group())
                return recommendations
            except:
                pass
        raise ValueError("无法解析 API 响应")


def test_book_recommendation(mood):
    """
    测试书籍推荐功能
    """
    print("=" * 70)
    print("书籍推荐功能测试")
    print("=" * 70)
    print()

    # 检查 API 密钥
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 ARK_API_KEY 环境变量")
        print("请在 .env 文件中设置 ARK_API_KEY")
        return False

    print(f"✓ API 密钥已加载")
    print(f"✓ 测试心情: {mood}")
    print()

    try:
        # 初始化客户端
        print("正在初始化 Ark 客户端...")
        client = Ark(api_key=api_key)
        print("✓ 客户端初始化成功")
        print()

        # 构建提示词
        print("正在构建提示词...")
        prompt = build_prompt(mood)
        print("✓ 提示词构建完成")
        print()
        print("-" * 70)
        print("提示词内容:")
        print(prompt)
        print("-" * 70)
        print()

        # 发送 API 请求
        print("正在调用 API 获取推荐...")
        response = client.chat.completions.create(
            model="doubao-seed-1-6-251015",
            messages=[
                {"role": "system", "content": "你是一位专业的图书推荐专家，擅长根据用户心情推荐合适的书籍。"},
                {"role": "user", "content": prompt}
            ],
            reasoning_effort = "minimal",
            temperature=0.7,
            max_tokens=1000
        )

        # 提取响应内容
        response_text = response.choices[0].message.content.strip()
        print("✓ API 调用成功!")
        print()
        print("-" * 70)
        print("原始 API 响应:")
        print(response_text)
        print("-" * 70)
        print()

        # 解析响应
        print("正在解析响应...")
        recommendations = parse_response(response_text)
        print(f"✓ 响应解析成功! 获得 {len(recommendations)} 本书籍推荐")
        print()

        # 显示推荐结果
        print("=" * 70)
        print("推荐结果")
        print("=" * 70)
        print()

        for i, book in enumerate(recommendations, 1):
            print(f"📚 推荐 {i}:")
            print(f"   书名: {book['title']}")
            print(f"   作者: {book['author']}")
            print(f"   推荐理由: {book['reason']}")
            print()

        print("=" * 70)
        print("✅ 测试通过! 书籍推荐功能正常")
        print("=" * 70)
        return True

    except ValueError as e:
        print()
        print("=" * 70)
        print("❌ 响应解析失败!")
        print("=" * 70)
        print(f"错误信息: {str(e)}")
        print()
        return False

    except Exception as e:
        print()
        print("=" * 70)
        print("❌ 测试失败!")
        print("=" * 70)
        print(f"错误信息: {str(e)}")
        print()
        print("可能的原因:")
        print("1. API 密钥无效或已过期")
        print("2. 网络连接问题")
        print("3. API 服务暂时不可用")
        print("4. 模型返回的格式不符合预期")
        print()
        return False


def run_multiple_tests():
    """
    运行多个心情的测试
    """
    test_moods = [
        "开心快乐",
        "有点悲伤",
        "焦虑不安",
        "平静放松"
    ]

    print("\n")
    print("*" * 70)
    print("开始批量测试多个心情")
    print("*" * 70)
    print()

    results = []
    for mood in test_moods:
        success = test_book_recommendation(mood)
        results.append((mood, success))
        print("\n" + "=" * 70 + "\n")

        # 在测试之间稍作停顿
        import time
        time.sleep(2)

    # 显示总结
    print("\n")
    print("*" * 70)
    print("测试总结")
    print("*" * 70)
    print()

    for mood, success in results:
        status = "✅ 通过" if success else "❌ 失败"
        print(f"{status} - {mood}")

    print()
    total = len(results)
    passed = sum(1 for _, success in results if success)
    print(f"总计: {passed}/{total} 个测试通过")
    print("*" * 70)

    return all(success for _, success in results)


if __name__ == '__main__':
    import sys

    # 如果提供了命令行参数，使用该参数作为心情
    if len(sys.argv) > 1:
        mood = " ".join(sys.argv[1:])
        success = test_book_recommendation(mood)
    else:
        # 否则运行批量测试
        print("提示: 你可以通过命令行参数指定心情，例如:")
        print("  python test_book_recommendation.py 开心快乐")
        print()
        print("现在将运行批量测试...")
        print()
        success = run_multiple_tests()

    exit(0 if success else 1)

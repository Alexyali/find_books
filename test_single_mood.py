"""
单个心情测试脚本

快速测试单个心情的书籍推荐功能（包含类别功能）
"""

import os
import json
from dotenv import load_dotenv
from volcenginesdkarkruntime import Ark

# 加载环境变量
load_dotenv()


def build_prompt(mood, categories=None):
    """
    构建推荐提示词（与 app.py 完全相同）
    """
    # 类别数据（与 app.py 保持一致）
    BOOK_CATEGORIES = {
        "literature": {"name": "文学类"},
        "social_science": {"name": "社科类"},
        "technology": {"name": "科技类"},
        "business": {"name": "商业类"},
        "lifestyle": {"name": "生活类"},
        "personal_growth": {"name": "成长类"},
        "arts": {"name": "艺术类"},
        "children": {"name": "儿童类"},
        "comics": {"name": "漫画类"},
        "mystery": {"name": "悬疑推理"},
        "scifi_fantasy": {"name": "科幻奇幻"},
        "romance": {"name": "言情类"}
    }

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


def test_single_mood():
    """测试单个心情的推荐"""

    # 测试心情
    mood = "开心快乐"

    # 测试类别（可选）- 设置为 None 表示不指定类别，或者指定类别列表
    test_categories = ["literature"]  # 或者 ["literature", "arts"] 来测试类别功能

    print("=" * 60)
    print(f"测试心情: {mood}")
    if test_categories:
        print(f"指定类别: {test_categories}")
    print("=" * 60)
    print()

    # 检查 API 密钥
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 ARK_API_KEY")
        return False

    try:
        # 初始化客户端
        client = Ark(api_key=api_key)

        # 构建提示词（与 app.py 完全相同）
        prompt = build_prompt(mood, test_categories)

        print("正在调用 API...")
        print("(如果超时，请检查网络连接或稍后重试)")
        print()

        # 调用 API（与 app.py 完全相同）
        response = client.chat.completions.create(
            model="doubao-seed-1-6-251015",
            messages=[
                {"role": "system", "content": "你是一位专业的图书推荐专家，擅长根据用户心情推荐合适的书籍。"},
                {"role": "user", "content": prompt}
            ],
            reasoning_effort = "minimal",
            temperature=0.7,
            max_tokens=1500,  # 增加以容纳类别信息
            timeout=60  # 增加到 60 秒以应对网络延迟
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
                print(f"   类别: {book.get('category', 'N/A')}")
                if book.get('subcategory'):
                    print(f"   子类别: {book.get('subcategory')}")
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

                    # 显示提取的推荐
                    for i, book in enumerate(recommendations, 1):
                        print(f"📚 推荐 {i}:")
                        print(f"   书名: {book.get('title', 'N/A')}")
                        print(f"   作者: {book.get('author', 'N/A')}")
                        print(f"   类别: {book.get('category', 'N/A')}")
                        if book.get('subcategory'):
                            print(f"   子类别: {book.get('subcategory')}")
                        print(f"   理由: {book.get('reason', 'N/A')}")
                        print()

                    return True
                except Exception as extract_error:
                    print(f"❌ 提取失败: {extract_error}")

            return False

    except Exception as e:
        error_msg = str(e)
        print(f"❌ 测试失败: {error_msg}")

        # 提供更详细的错误信息
        if "timed out" in error_msg.lower() or "timeout" in error_msg.lower():
            print()
            print("💡 建议:")
            print("   1. 检查网络连接是否正常")
            print("   2. 确认 API 服务是否可用")
            print("   3. 尝试增加 timeout 值")
            print("   4. 稍后重试")
        elif "api_key" in error_msg.lower() or "authentication" in error_msg.lower():
            print()
            print("💡 建议:")
            print("   1. 检查 .env 文件中的 ARK_API_KEY 是否正确")
            print("   2. 确认 API 密钥是否有效")

        return False


if __name__ == '__main__':
    success = test_single_mood()
    exit(0 if success else 1)

"""
简单的 OpenAI API 验证脚本

用于测试火山引擎 ARK API 连接是否正常
"""

import os
from dotenv import load_dotenv
from volcenginesdkarkruntime import Ark

# 加载环境变量
load_dotenv()

def test_api_connection():
    """测试 API 连接"""
    print("=" * 60)
    print("火山引擎 ARK API 连接测试")
    print("=" * 60)
    print()

    # 检查 API 密钥
    api_key = os.environ.get("ARK_API_KEY")
    if not api_key:
        print("❌ 错误: 未找到 ARK_API_KEY 环境变量")
        print("请在 .env 文件中设置 ARK_API_KEY")
        return False

    print(f"✓ API 密钥已加载 (长度: {len(api_key)})")
    print()

    try:
        # 初始化客户端
        print("正在初始化 Ark 客户端...")
        client = Ark(api_key=api_key)
        print("✓ 客户端初始化成功")
        print()

        # 发送测试请求
        print("正在发送测试请求...")
        response = client.chat.completions.create(
            model="doubao-seed-1-6-251015",
            messages=[
                {"role": "system", "content": "你是一个有帮助的助手。"},
                {"role": "user", "content": "请用一句话介绍你自己。"}
            ],
            reasoning_effort = "minimal",
            temperature=0.7,
            max_tokens=100
        )

        # 提取响应
        ai_response = response.choices[0].message.content
        print("✓ API 调用成功!")
        print()
        print("-" * 60)
        print("AI 响应:")
        print(ai_response)
        print("-" * 60)
        print()

        print("=" * 60)
        print("✅ 测试通过! API 连接正常")
        print("=" * 60)
        return True

    except Exception as e:
        print()
        print("=" * 60)
        print("❌ 测试失败!")
        print("=" * 60)
        print(f"错误信息: {str(e)}")
        print()
        print("可能的原因:")
        print("1. API 密钥无效或已过期")
        print("2. 网络连接问题")
        print("3. API 服务暂时不可用")
        print("4. 模型名称不正确")
        print()
        return False


if __name__ == '__main__':
    success = test_api_connection()
    exit(0 if success else 1)

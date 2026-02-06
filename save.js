// Vercel Serverless Function (Node.js)
export default async function handler(request, response) {
  // 1. 获取 URL 参数中的内容
  const { content } = request.query;

  if (!content) {
    return response.status(400).send("❌ 错误：链接中没有检测到内容 (content 参数为空)。");
  }

  // 2. 配置你的目标仓库信息
  // 建议将 Token 放在 Vercel 环境变量中，不要硬编码
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
  const REPO_OWNER = process.env.REPO_OWNER; // 你的 GitHub 用户名
  const REPO_NAME = process.env.REPO_NAME;   // 你想存代码的仓库名
  const BRANCH = "main";                     // 分支名
  
  // 生成文件名：YYYY-MM-DD_Timestamp.md
  const date = new Date();
  const filename = `chat_${date.toISOString().split('T')[0]}_${Date.now()}.md`;
  
  // 3. 准备 GitHub API 数据
  // GitHub API 要求内容必须是 Base64 编码
  const fileContentBase64 = Buffer.from(content, 'utf-8').toString('base64');
  
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "Vercel-Chatbot-Saver"
      },
      body: JSON.stringify({
        message: "Chatbot Auto-save", // Commit message
        content: fileContentBase64,
        branch: BRANCH
      })
    });

    if (res.ok) {
      // 4. 返回一个好看的 HTML 页面，而不是冷冰冰的 JSON
      const data = await res.json();
      return response.status(200).send(`
        <html>
          <head><title>保存成功</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: green;">✅ 保存成功！</h1>
            <p>内容已推送到 GitHub。</p>
            <a href="${data.html_url}" target="_blank" style="font-size: 18px;">👉 点击查看文件</a>
            <br><br>
            <button onclick="window.close()">关闭窗口</button>
          </body>
        </html>
      `);
    } else {
      const errorData = await res.json();
      return response.status(500).json({ error: "GitHub API Error", details: errorData });
    }

  } catch (error) {
    return response.status(500).json({ error: "Server Error", details: error.message });
  }
}
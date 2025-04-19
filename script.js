document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('content-container');
    const loadingMessage = document.getElementById('loading-message');

    // 检查 marked 库是否加载
    if (typeof marked === 'undefined') {
        console.error('Marked.js library is not loaded!');
        contentContainer.innerHTML = '<p style="color: red;">错误：Markdown 解析库加载失败。</p>';
        loadingMessage.style.display = 'none'; // 隐藏加载信息
        return;
    }

    // 使用 fetch API 读取本地的 content.md 文件
    fetch('content.md')
        .then(response => {
            if (!response.ok) {
                // 如果文件获取失败 (例如 404 Not Found)
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // 获取文件内容文本
        })
        .then(markdownContent => {
            // 使用 marked.parse() 将 Markdown 转换为 HTML
            // 注意：Marked v5+ 使用 marked.parse()
            // 如果你使用的旧版本可能是 marked(markdownContent)
            const htmlContent = marked.parse(markdownContent);

            // 将转换后的 HTML 插入到容器中
            contentContainer.innerHTML = htmlContent;
            loadingMessage.style.display = 'none'; // 隐藏加载信息
            contentContainer.style.opacity = 0; // 准备淡入
            // 添加一个简单的处理，让 Markdown 列表项更结构化一点
            // （查找 li > a + text node 并将其包裹在 span 中以便样式化）
             contentContainer.querySelectorAll('li').forEach(li => {
                let link = li.querySelector('a');
                if (link) {
                    let nextNode = link.nextSibling;
                    // 检查链接后面的直接文本节点 (可能是 ' - Description')
                    if (nextNode && nextNode.nodeType === Node.TEXT_NODE && nextNode.textContent.trim()) {
                        let descriptionText = nextNode.textContent.trim();
                        // 移除 ' - ' (如果存在)
                        if (descriptionText.startsWith('- ')) {
                            descriptionText = descriptionText.substring(2).trim();
                        }
                         // 创建 span 并移除原始文本节点
                        if(descriptionText){
                            let span = document.createElement('span');
                            span.textContent = descriptionText;
                            li.appendChild(span);
                            li.removeChild(nextNode);
                        }
                    }
                }
            });
            // 触发淡入效果
            requestAnimationFrame(() => {
                contentContainer.style.opacity = 1;
            });

        })
        .catch(error => {
            console.error('加载或解析 Markdown 文件时出错:', error);
            contentContainer.innerHTML = `<p style="color: red;">加载内容失败。请确保 'content.md' 文件存在于同一目录下，并且服务器配置正确。错误: ${error.message}</p>`;
            loadingMessage.style.display = 'none'; // 隐藏加载信息
        });
});

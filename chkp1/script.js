document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const nicknameInput = document.getElementById('nickname-input');
    const messageInput = document.getElementById('message-input');
    const avatarInput = document.getElementById('avatar-input');
    const colorSelect = document.getElementById('color-select');
    const textToParse = document.getElementById('text-to-parse');
    const exportBtn = document.getElementById('export-btn');
    const groupTitleInput = document.getElementById('group-title-input');
    const groupTitleColorSelect = document.getElementById('group-title-color-select');

    const previewNickname = document.getElementById('preview-nickname');
    const previewText = document.getElementById('preview-text');
    const previewAvatar = document.getElementById('preview-avatar');
    const previewBubble = document.querySelector('.message-bubble');
    const avatarPathSpan = document.getElementById('avatar-path');
    const previewElement = document.getElementById('preview');
    const previewGroupTitle = document.getElementById('preview-group-title');
    const avatarHistoryContainer = document.getElementById('avatar-history-container');

    // 更新预览函数
    function updatePreview() {
        previewNickname.textContent = nicknameInput.value || '昵称';
        previewText.textContent = messageInput.value || '消息内容';

        const groupTitle = groupTitleInput.value;
        if (groupTitle && groupTitleColorSelect.value) {
            previewGroupTitle.textContent = groupTitle;
            previewGroupTitle.style.backgroundColor = groupTitleColorSelect.value;
            previewGroupTitle.style.display = 'inline-block';
        } else {
            previewGroupTitle.textContent = '';
            previewGroupTitle.style.display = 'none';
        }
    }

    // 解析文本并填充
    function parseAndFill() {
        const text = textToParse.value.trim();
        if (!text) return;

        // 尝试解析JSON格式（带容错处理）
        try {
            let data;
            let cleanedText = text.trim();
            // 移除整个JSON字符串末尾可能存在的逗号
            if (cleanedText.endsWith(',')) {
                cleanedText = cleanedText.slice(0, -1);
            }

            try {
                data = JSON.parse(cleanedText);
            } catch (e) {
                // 如果直接解析失败，尝试修复JSON内部的末尾逗号（如数组或对象内部的trailing comma）
                // 以及其他不规范的逗号用法
                const fixedInternalText = cleanedText
                    .replace(/,\s*([}\]])/g, '$1') // 修复对象或数组末尾的逗号
                    .replace(/([{\[])\s*,/g, '$1'); // 修复开头逗号(虽然不常见)
                data = JSON.parse(fixedInternalText);
            }
            
            // 如果是新的JSON格式，调用parseJsonAndFill
            if (data.data && data.data.msg_list) {
                parseJsonAndFill(data);
                return;
            }
        } catch (e) {
            // JSON解析失败，继续使用旧格式处理
        }

        // 旧格式处理
        const lines = text.split('\n');
        if (lines.length > 0) {
            let rawNickname = lines[0].trim();
            rawNickname = rawNickname.replace(/\s+\d{2}-\d{2}\s+发送$/, '').replace(/\s*\(\d{2}:\d{2}\)$/, '');
            nicknameInput.value = rawNickname;
            // 对于旧格式，仍然使用messageInput.value
            messageInput.value = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
        }
        updatePreview();
    }

    // 新增函数：解析JSON并填充
    function parseJsonAndFill(jsonData) {
        const msgList = jsonData.data.msg_list;
        if (!msgList || msgList.length === 0) {
            console.warn("JSON数据中没有msg_list或msg_list为空。");
            return;
        }

        // 假设我们只处理第一条消息
        const firstMessage = msgList[0];

        if (firstMessage.sender_nick) {
            nicknameInput.value = firstMessage.sender_nick;
        } else {
            nicknameInput.value = '';
        }

        // 清空旧内容
        messageInput.innerHTML = '';

        if (firstMessage.msg_content && Array.isArray(firstMessage.msg_content)) {
            firstMessage.msg_content.forEach(item => {
                if (item.msg_type === 1 && item.text) {
                    const p = document.createElement('p');
                    p.textContent = item.text;
                    messageInput.appendChild(p);
                } else if (item.msg_type === 3 && item.image_url) {
                    const img = document.createElement('img');
                    img.src = item.image_url;
                    img.classList.add('message-image'); // 添加一个CSS类以便样式化
                    messageInput.appendChild(img);
                }
            });
        }
        updatePreview();
    }

    // 获取新的DOM元素
    const jsonInput = document.getElementById('json-input');

    // 事件监听
    nicknameInput.addEventListener('input', updatePreview);
    // messageInput.addEventListener('input', updatePreview); // messageInput现在是div，不再监听input事件
    
    // textToParse只处理旧格式文本
    textToParse.addEventListener('input', () => {
        const text = textToParse.value.trim();
        if (!text) return;

        // 旧格式处理
        const lines = text.split('\n');
        if (lines.length > 0) {
            let rawNickname = lines[0].trim();
            rawNickname = rawNickname.replace(/\s+\d{2}-\d{2}\s+发送$/, '').replace(/\s*\(\d{2}:\d{2}\)$/, '');
            nicknameInput.value = rawNickname;
            messageInput.value = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
        }
        updatePreview();
    });

    // jsonInput处理新格式JSON
    jsonInput.addEventListener('input', () => {
        const text = jsonInput.value.trim();
        if (!text) return;

        try {
            let data;
            let cleanedText = text.trim();
            if (cleanedText.endsWith(',')) {
                cleanedText = cleanedText.slice(0, -1);
            }

            try {
                data = JSON.parse(cleanedText);
            } catch (e) {
                const fixedInternalText = cleanedText
                    .replace(/,\s*([}\]])/g, '$1')
                    .replace(/([{\[])\s*,/g, '$1');
                data = JSON.parse(fixedInternalText);
            }
            
            if (data.data && data.data.msg_list) {
                parseJsonAndFill(data);
            }
        } catch (e) {
            console.error("JSON解析错误:", e);
            // 如果JSON解析失败，可以清空输入或给出提示
            // messageInput.innerHTML = '';
            // nicknameInput.value = '';
            // updatePreview();
        }
    });

    groupTitleInput.addEventListener('input', updatePreview);
    groupTitleColorSelect.addEventListener('change', updatePreview);

    // --- Avatar History Logic ---
    const MAX_HISTORY_LENGTH = 12; // 定义历史记录的最大长度
    let avatarHistory = JSON.parse(localStorage.getItem('avatarHistory')) || [];

    function renderAvatarHistory() {
        avatarHistoryContainer.innerHTML = '';
        avatarHistory.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.classList.add('history-avatar');
            img.addEventListener('click', () => {
                previewAvatar.src = src;
                // Optional: update a hidden input or some state if you need to "select" it for form submission
            });
            avatarHistoryContainer.appendChild(img);
        });
    }

    function addAvatarToHistory(src) {
        // Remove if already exists to move it to the front
        const existingIndex = avatarHistory.indexOf(src);
        if (existingIndex > -1) {
            avatarHistory.splice(existingIndex, 1);
        }

        // Add to the beginning of the array
        avatarHistory.unshift(src);

        // Trim the array to the max length
        if (avatarHistory.length > MAX_HISTORY_LENGTH) {
            avatarHistory = avatarHistory.slice(0, MAX_HISTORY_LENGTH);
        }

        // Save to localStorage
        localStorage.setItem('avatarHistory', JSON.stringify(avatarHistory));

        // Re-render the history display
        renderAvatarHistory();
    }

    avatarInput.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newAvatarSrc = e.target.result;
                previewAvatar.src = newAvatarSrc;
                addAvatarToHistory(newAvatarSrc);
            };
            reader.readAsDataURL(file);
            avatarPathSpan.textContent = file.name;
        }
    });

    colorSelect.addEventListener('change', () => {
        const selectedColor = colorSelect.value;
        previewElement.style.setProperty('--bubble-color', selectedColor);

        if (selectedColor === '#1399FE') {
            previewText.style.color = '#FFFFFF';
        } else {
            previewText.style.color = '#000000';
        }
    });

    exportBtn.addEventListener('click', () => {
        // 导出高清图
        html2canvas(previewElement, {
            backgroundColor: null, // 使用元素的背景
            scale: 3, // 提高分辨率
            useCORS: true // 允许加载跨域图片
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `qq-message-snap-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // 初始化
    updatePreview();
    renderAvatarHistory(); // Initial render on page load
});
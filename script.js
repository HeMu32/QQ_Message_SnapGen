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
            // 先尝试直接解析
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                // 如果直接解析失败，尝试修复末尾逗号
                const fixedText = text.replace(/,\s*}$/, '}');
                data = JSON.parse(fixedText);
            }
            
            if (data.sender_nick && Array.isArray(data.msg_content)) {
                nicknameInput.value = data.sender_nick;
                messageInput.value = data.msg_content
                    .filter(item => item.msg_type === 1 && item.text)
                    .map(item => item.text)
                    .join('\n');
                updatePreview();
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
            messageInput.value = lines.length > 1 ? lines.slice(1).join('\n').trim() : '';
        }
        updatePreview();
    }

    // 事件监听
    nicknameInput.addEventListener('input', updatePreview);
    messageInput.addEventListener('input', updatePreview);
    textToParse.addEventListener('input', parseAndFill);
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

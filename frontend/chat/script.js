let currentView = 'server';
let currentDMUser = null;
let socket = null;
let reconnectAttempts = 0;
let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

const userId = localStorage.getItem('starfall_user_id');

if (!userId) {
    window.location.href = 'https://starfall-2r5isvsl9-st4r-s-projects.vercel.app/login';
}

// Intercept fetch to handle 401s (token expiration)
const originalFetch = window.fetch;
window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (response.status === 401) {
        localStorage.removeItem('starfall_user_id');
        alert('Session expired. Please log in again.');
        window.location.href = 'https://starfall-2r5isvsl9-st4r-s-projects.vercel.app/login';
    }
    return response;
};

function connectWebSocket() {
    socket = new WebSocket(`wss://starfall.loca.lt/ws/${userId}`);

    socket.onerror = (event) => {
        console.error("WebSocket error:", event);
        updateConnectionStatus('error');
    };

    socket.onclose = (event) => {
        console.log("WebSocket closed with code:", event.code);
        if (event.code === 4008 || event.code === 1008) {
            localStorage.removeItem('starfall_user_id');
            alert('Session expired. Please log in again.');
            window.location.href = "../login/index.html";
        } else {
            updateConnectionStatus('offline');
            if (!isReconnecting && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                scheduleReconnect();
            }
        }
    };

    socket.onopen = function(e) {
        console.log("Connected to Starfall Backend! :>");
        reconnectAttempts = 0;
        isReconnecting = false;
        updateConnectionStatus('online');
    };
}

function scheduleReconnect() {
    isReconnecting = true;
    const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
    reconnectAttempts++;

    console.log(`Attempting reconnection ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
    updateConnectionStatus(`reconnecting (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    setTimeout(() => {
        connectWebSocket();
    }, delay);
}

function updateConnectionStatus(status) {
    let statusEl = document.getElementById('connectionStatus');
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'connectionStatus';
        statusEl.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            font-weight: bold;
        `;
        document.body.appendChild(statusEl);
    }

    const statusColors = {
        online: '#4CAF50',
        offline: '#FF9800',
        error: '#F44336',
        reconnecting: '#2196F3'
    };

    statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    statusEl.style.backgroundColor = statusColors[status] || '#999';
    statusEl.style.color = 'white';
}

connectWebSocket();


//Incoming msg's
socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const messagesContainer = data.type === 'server' ? document.getElementById('serverMessages') : document.getElementById('dmMessages');
    const typingIndicator = data.type === 'server' ? document.getElementById('serverTyping') : document.getElementById('dmTyping');

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const isOwnMessage = data.sender_id === parseInt(userId);

    const messageHTML = `
        <div class="message ${isOwnMessage ? 'own' : ''}">
            <div class="avatar">${data.sender_name ? data.sender_name.charAt(0) : 'U'}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="username">${data.sender_name || 'User'}</span>
                    <span class="timestamp">${timeString}</span>
                </div>
                <div class="message-bubble">
                    ${escapeHtml(data.content)}
                </div>
            </div>
        </div>
    `;

    typingIndicator.insertAdjacentHTML('beforebegin', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
};

function loadDMMessages(username) {
    const dmMessages = document.getElementById('dmMessages');
    const typingIndicator = document.getElementById('dmTyping');
    
    // Clear old messages except the typing indicator
    Array.from(dmMessages.children).forEach(child => {
        if (child !== typingIndicator) child.remove();
    });

    const samples = {
        'Utku': [
            { name: 'Utku', msg: "Hey! How's the project going?", own: false },
            { name: 'You', msg: "Pretty good! Implementing secure DMs.", own: true }
        ],
        'Shortie': [{ name: 'Shortie', msg: "Want to work on features together?", own: false }]
    };

    const conversation = samples[username] || [];
    conversation.forEach(item => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${item.own ? 'own' : ''}`;
        msgDiv.innerHTML = `
            <div class="avatar">${item.name[0]}</div>
            <div class="message-content">
                <div class="message-header"><span class="username">${item.name}</span></div>
                <div class="message-bubble">${escapeHtml(item.msg)}</div>
            </div>
        `;
        dmMessages.insertBefore(msgDiv, typingIndicator);
    });

    dmMessages.scrollTop = dmMessages.scrollHeight;
}


        // Create starfall background effect
        function createStarfall() {
            const starfallBg = document.getElementById('starfallBg');
            const numberOfStars = 30;

            for (let i = 0; i < numberOfStars; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.animationDuration = (Math.random() * 3 + 2) + 's';
                star.style.animationDelay = Math.random() * 5 + 's';
                starfallBg.appendChild(star);
            }
        }

        // Toggle between server and DM view
        function toggleView() {
            if (currentView === 'server') {
                // Switch to DM view
                currentView = 'dm';
                document.getElementById('channelsView').style.display = 'none';
                document.getElementById('dmsView').style.display = 'block';
                document.getElementById('serverView').classList.add('hidden');
                document.getElementById('dmHomeView').classList.remove('hidden');
                document.getElementById('dmChatView').classList.add('hidden');
            } else {
                // Switch to server view
                currentView = 'server';
                document.getElementById('channelsView').style.display = 'block';
                document.getElementById('dmsView').style.display = 'none';
                document.getElementById('serverView').classList.remove('hidden');
                document.getElementById('dmHomeView').classList.add('hidden');
                document.getElementById('dmChatView').classList.add('hidden');
            }
        }

        // Switch channel
        function switchChannel(element, channelName) {
            document.querySelectorAll('.channel-item').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');
            document.getElementById('channelTitle').textContent = channelName;
            document.querySelector('#serverInput').placeholder = `Message #${channelName}`;
        }

        // Open DM
        function openDM(element, username, status) {
                const dmMessages = document.getElementById('dmMessages');
            document.querySelectorAll('.dm-item').forEach(item => {
                item.classList.remove('active');
            });
            element.classList.add('active');
            
            currentDMUser = username;
            document.getElementById('dmHomeView').classList.add('hidden');
            document.getElementById('dmChatView').classList.remove('hidden');
            document.getElementById('dmHeaderName').textContent = username;
            document.getElementById('dmHeaderAvatar').textContent = username[0];
            document.getElementById('dmHeaderAvatar').className = `dm-avatar ${status}`;
            document.getElementById('dmInput').placeholder = `Message ${username}`;
            
            // Load DM messages (sample)
            loadDMMessages(username);
        }

    
        // Toggle star/favorite
        function toggleStar(element) {
            if (element.textContent === '☆') {
                element.textContent = '★';
                element.classList.add('starred');
            } else {
                element.textContent = '☆';
                element.classList.remove('starred');
            }
        }

        // Send message function
        function sendMessage(type) {
            const input = type === 'server' ? document.getElementById('serverInput') : document.getElementById('dmInput');
            const message = input.value.trim();

            if (message === '') return;

            const messagesContainer = type === 'server' ? document.getElementById('serverMessages') : document.getElementById('dmMessages');
            const typingIndicator = type === 'server' ? document.getElementById('serverTyping') : document.getElementById('dmTyping');

            const payload = {
                type: type,
                content: message,
                sender_id: parseInt(userId),
                sender_name: "You"
            };

            if (type === 'server') {
                payload.server_id = 1;
            } else {
                payload.recipient_id = currentDMUser ? parseInt(localStorage.getItem(`starfall_user_id_${currentDMUser}`)) : 2;
            }

            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(payload));
            } else {
                console.warn('WebSocket not connected, message will be sent when connection restored');
                updateConnectionStatus('offline');
            }

            input.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Simulate typing indicator
            setTimeout(() => {
                typingIndicator.classList.add('active');
                setTimeout(() => {
                    typingIndicator.classList.remove('active');
                }, 2000);
            }, 500);
        }

        // Handle Enter key
        function handleKeyPress(event, type) {
            if (event.key === 'Enter') {
                sendMessage(type);
            }
        }

        // Handle attachment (placeholder)
        function handleAttachment() {
            alert('Attachment feature coming soon!');
        }

        // Modal functions
        function openAddFriendModal() {
            document.getElementById('addFriendModal').classList.add('active');
        }

        function openProfileModal() {
            document.getElementById('profileModal').classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function sendFriendRequest() {
            const username = document.getElementById('friendUsername').value.trim();
            const message = document.getElementById('friendMessage').value.trim();
            
            if (username === '') {
                alert('Please enter a username');
                return;
            }
            
            alert(`Friend request sent to ${username}!`);
            closeModal('addFriendModal');
            document.getElementById('friendUsername').value = '';
            document.getElementById('friendMessage').value = '';
        }

        function saveProfile() {
            const name = document.getElementById('profileName').value;
            const username = document.getElementById('profileUsername').value;
            const bio = document.getElementById('profileBio').value;
            const status = document.getElementById('profileStatus').value;
            
            alert('Profile updated successfully!');
            closeModal('profileModal');
        }

        // Escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });

        // Initialize
        createStarfall();
        window.addEventListener('load', () => {
            const messagesContainer = document.getElementById('serverMessages');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
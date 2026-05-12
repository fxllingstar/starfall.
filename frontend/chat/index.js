let currentView = 'server'; 
let currentDMUser = null;


 const socket = new WebSocket('ws://localhost:8080/ws/1'); //testing

 socket.onopen = function(e){
    console.log("Connected to Starfall Backend! :>");
 };


//Incoming msg's
socket.onmessage = function(event){
    const data = JSON.parse(event.data);
    const messagesContainer = data.type === 'server' ? document.getElementById('serverMessages') : document.getElementById('dmMessages');
    const typingIndicator = data.type === 'server' ? document.getElementById('serverTyping') : document.getElementById('dmTyping');

    const now = new Date();

    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

   
    const isOwnMessage = false; 

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

        function loadDMMessages(username) {
            const dmMessages = document.getElementById('dmMessages');
            const typingIndicator = document.getElementById('dmTyping');
            dmMessages.innerHTML = '';
            
            // Sample DM conversation
            const conversations = {
                'Utku': `
                    <div class="message">
                        <div class="avatar">A</div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="username">Utku</span>
                                <span class="timestamp">9:15 AM</span>
                            </div>
                            <div class="message-bubble">
                                Hey! How's the project going?
                            </div>
                        </div>
                    </div>
                    <div class="message own">
                        <div class="avatar">S</div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="username">You</span>
                                <span class="timestamp">9:18 AM</span>
                            </div>
                            <div class="message-bubble">
                                Pretty good! Just implemented the DM feature
                            </div>
                        </div>
                    </div>
                `,
                'Shortie': `
                    <div class="message">
                        <div class="avatar">J</div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="username">Shortie</span>
                                <span class="timestamp">2:30 PM</span>
                            </div>
                            <div class="message-bubble">
                                Want to work on that feature together?
                            </div>
                        </div>
                    </div>
                `,
                'Merc': `
                    <div class="message">
                        <div class="avatar">T</div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="username">Merc</span>
                                <span class="timestamp">Yesterday</span>
                            </div>
                            <div class="message-bubble">
                                Let's catch up soon!
                            </div>
                        </div>
                    </div>
                `
            };
            
            dmMessages.innerHTML = conversations[username] || '';
            dmMessages.appendChild(typingIndicator);
            dmMessages.scrollTop = dmMessages.scrollHeight;
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


            const payload = {
        type: type,
        content: messageContent,
        sender_name: "You" // Temporary until I wire up real auth
    };

    if (type === 'server') {
        payload.server_id = 1; 
    } else {
        payload.recipient_id = 2;
    }

    socket.send(JSON.stringify(payload));

         



            typingIndicator.insertAdjacentHTML('beforebegin', messageHTML);
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
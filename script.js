document.addEventListener('DOMContentLoaded', function() {
    loadConversations();
});

document.getElementById('chat-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const userInput = document.getElementById('user-input').value;
    const messages = document.getElementById('messages');

    // Adiciona a mensagem do usuário ao chat
    const userMessage = document.createElement('div');
    userMessage.className = 'message user';
    userMessage.textContent = userInput;
    messages.appendChild(userMessage);

    // Envia a mensagem para a ViBot API
    const viBotResponse = await getViBotResponse(userInput);
    if (viBotResponse) {
        // Adiciona a resposta do ViBot ao chat
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot';
        botMessage.textContent = viBotResponse;
        messages.appendChild(botMessage);

        // Salva a conversa no localStorage
        saveConversation(userInput, viBotResponse);
    } else {
        // Se a resposta do ViBot falhar, exibe uma mensagem de erro
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot';
        botMessage.textContent = "Desculpe, houve um erro ao processar sua solicitação.";
        messages.appendChild(botMessage);
    }

    // Limpa o campo de entrada
    document.getElementById('user-input').value = '';
});

document.getElementById('new-chat').addEventListener('click', function() {
    clearChat();
});

document.getElementById('saved-chats').addEventListener('click', function() {
    showSavedChats();
});

async function getViBotResponse(prompt, retries = 3) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyCUu44sgw3iE_o_8Q3WyILNhQk1trtQVKw`;
    const headers = {
        'Content-Type': 'application/json'
    };
    const data = {
        model: 'models/gemini-2.0-flash',
        contents: [
            {
                parts: [
                    {
                        text: prompt
                    }
                ]
            }
        ]
    };

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const jsonResponse = await response.json();
                const candidates = jsonResponse.candidates;
                if (candidates && candidates.length > 0) {
                    const content = candidates[0].content;
                    if (content && content.parts && content.parts.length > 0) {
                        return content.parts[0].text;
                    }
                }
                return "Desculpe, houve um erro ao processar a resposta da API do ViBot.";
            } else if (response.status === 503) {
                console.log(`Tentativa ${attempt + 1} falhou. A API do ViBot está sobrecarregada. Tentando novamente...`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Pequeno intervalo antes de tentar novamente
            } else {
                console.log(`Erro na solicitação à API do ViBot: ${response.status}, ${response.text}`);
                return null;
            }
        } catch (error) {
            console.error('Erro ao fazer requisição à API do ViBot:', error);
            return null;
        }
    }
    return null;
}

function saveConversation(userInput, viBotResponse) {
    const conversations = JSON.parse(localStorage.getItem('conversations')) || [];
    conversations.push({ user: userInput, bot: viBotResponse });
    localStorage.setItem('conversations', JSON.stringify(conversations));
}

function loadConversations() {
    const conversations = JSON.parse(localStorage.getItem('conversations')) || [];
    const messages = document.getElementById('messages');
    conversations.forEach(conv => {
        if (conv.user) {
            const userMessage = document.createElement('div');
            userMessage.className = 'message user';
            userMessage.textContent = conv.user;
            messages.appendChild(userMessage);
        }
        if (conv.bot) {
            const botMessage = document.createElement('div');
            botMessage.className = 'message bot';
            botMessage.textContent = conv.bot;
            messages.appendChild(botMessage);
        }
    });
}

function clearChat() {
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    localStorage.removeItem('conversations');
}

function showSavedChats() {
    const conversations = JSON.parse(localStorage.getItem('conversations')) || [];
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    conversations.forEach((conv, index) => {
        if (conv.user || conv.bot) {
            const chatDiv = document.createElement('div');
            chatDiv.className = 'saved-chat';
            if (conv.user) {
                const userMessage = document.createElement('div');
                userMessage.className = 'message user';
                userMessage.textContent = conv.user;
                chatDiv.appendChild(userMessage);
            }
            if (conv.bot) {
                const botMessage = document.createElement('div');
                botMessage.className = 'message bot';
                botMessage.textContent = conv.bot;
                chatDiv.appendChild(botMessage);
            }
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-chat';
            deleteButton.textContent = 'Excluir';
            deleteButton.dataset.index = index;
            chatDiv.appendChild(deleteButton);
            messages.appendChild(chatDiv);
        }
    });

    document.querySelectorAll('.delete-chat').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            conversations.splice(index, 1);
            localStorage.setItem('conversations', JSON.stringify(conversations));
            showSavedChats();
        });
    });
}

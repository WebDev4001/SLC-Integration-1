document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const querySuggestions = document.querySelectorAll('.query-suggestion');
    const pathCategories = document.querySelectorAll('[data-path-category]');

    const appendMessage = (sender, message) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('flex', 'items-start', 'mb-4', sender === 'user' ? 'justify-end' : '');

        if (sender === 'path') {
            messageDiv.innerHTML = `
                <img src="images/path-avatar.png" alt="PATH" class="w-10 h-10 rounded-full mr-3">
                <div class="bg-blue-100 p-3 rounded-lg max-w-xs md:max-w-md">
                    <p class="text-gray-800">${message}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="bg-blue-600 text-white p-3 rounded-lg max-w-xs md:max-w-md">
                    <p>${message}</p>
                </div>
            `;
        }
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
    };

    const handleUserInput = (message) => {
        const lowerCaseMessage = message.toLowerCase();
        let response = "I'm sorry, I don't understand that query yet. Could you please rephrase or try one of the suggested queries?";

        // Predefined responses
        if (lowerCaseMessage.includes('suggest a book')) {
            response = "To suggest a book, please visit the <a href='engage.html#suggest-book' class='text-blue-600 hover:underline'>Suggest a Book or Resource</a> section on our Events & Engage page. You can fill out a form there!";
        } else if (lowerCaseMessage.includes('civil engineering section')) {
            response = "The Civil Engineering section is located on the Ground Floor of the library, towards the west wing. You can refer to the <a href='library.html#floor-plan' class='text-blue-600 hover:underline'>Library Floor Plan</a> for a visual guide.";
        } else if (lowerCaseMessage.includes('president of slc')) {
            response = "The current President of the Student Library Council is Priya Singh. You can find more details about all current council members on the <a href='council.html#current-members' class='text-blue-600 hover:underline'>About & Council</a> page.";
        } else if (lowerCaseMessage.includes('library timings')) {
            response = "The MMMUT Library timings are: Monday - Saturday: 9:00 AM - 9:00 PM, and Sunday: 10:00 AM - 5:00 PM. Extended hours may apply during examination periods. Check the <a href='library.html#library-services' class='text-blue-600 hover:underline'>Library Resources</a> page for full details.";
        } else if (lowerCaseMessage.includes('join slc')) {
            response = "Interested in joining SLC? We'd love to have you! Please visit the <a href='engage.html#join-slc' class='text-blue-600 hover:underline'>Join SLC Application Form</a> on our Events & Engage page to apply.";
        } else if (lowerCaseMessage.includes('past slc events')) {
            response = "You can view a timeline and gallery of our past events, including workshops, book fairs, and competitions, on the <a href='engage.html#events' class='text-blue-600 hover:underline'>Events & Engage</a> page.";
        } else if (lowerCaseMessage.includes('digital resources')) {
            response = "Our digital resources include access to the National Digital Library of India (NDLI), IEEE Xplore, NPTEL, departmental PDFs, and competitive exam preparation materials. Find links and more information on the <a href='library.html#digital-resources' class='text-blue-600 hover:underline'>Library Resources</a> page.";
        } else if (lowerCaseMessage.includes('library rules')) {
            response = "Please refer to the <a href='library.html#library-services' class='text-blue-600 hover:underline'>Library Rules and Regulations</a> section on the Library Resources page for detailed information on library conduct.";
        } else if (lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hello')) {
            response = "Hello! How can I assist you with your library or SLC queries?";
        }

        setTimeout(() => appendMessage('path', response), 500); // Simulate response delay
    };

    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            appendMessage('user', message);
            handleUserInput(message);
            userInput.value = '';
        }
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    querySuggestions.forEach(button => {
        button.addEventListener('click', () => {
            const query = button.textContent;
            appendMessage('user', query);
            handleUserInput(query);
            userInput.value = query; // Populate input for user to edit/resend
        });
    });

    pathCategories.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.pathCategory;
            let introMessage = `Here are some common questions related to ${category}: `;
            if (category === "Resource Help") {
                introMessage += "How to suggest a book? What digital resources are available?";
            } else if (category === "Library Navigation") {
                introMessage += "Where is the Civil Engineering section located? What are the library timings? Where can I find journals?";
            } else if (category === "Council Info") {
                introMessage += "Who is the President of SLC this year? How can I join SLC?";
            } else if (category === "Event Participation") {
                introMessage += "Tell me about past SLC events. How can I volunteer for an event?";
            }
            appendMessage('path', introMessage);
        });
    });
});
document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'http://localhost:5000/api'; // Assuming backend runs on port 5000

    // --- Suggest a Book Form ---
    const suggestForm = document.querySelector('#suggest-book form');
    if (suggestForm) {
        suggestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(suggestForm);
            let messageDiv = suggestForm.querySelector('.form-message');
            if (!messageDiv) {
                messageDiv = document.createElement('div');
                messageDiv.className = 'form-message mt-4 text-center';
                suggestForm.appendChild(messageDiv);
            }
            messageDiv.textContent = 'Submitting...';
            messageDiv.className = 'form-message mt-4 text-center text-blue-500';

            try {
                const response = await fetch(`${backendUrl}/engage/suggest`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                if (response.ok) {
                    messageDiv.textContent = data.message || 'Suggestion submitted successfully!';
                    messageDiv.className = 'form-message mt-4 text-center text-green-500';
                    suggestForm.reset();
                } else {
                    messageDiv.textContent = data.message || 'Submission failed. Please try again.';
                    messageDiv.className = 'form-message mt-4 text-center text-red-500';
                }
            } catch (error) {
                console.error('Suggestion submission error:', error);
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message mt-4 text-center text-red-500';
            }
        });
    }

    // --- Join SLC Form ---
    const joinForm = document.querySelector('#join-slc form');
    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(joinForm);
            let messageDiv = joinForm.querySelector('.form-message');
            if (!messageDiv) {
                messageDiv = document.createElement('div');
                messageDiv.className = 'form-message mt-4 text-center';
                joinForm.appendChild(messageDiv);
            }
            messageDiv.textContent = 'Submitting...';
            messageDiv.className = 'form-message mt-4 text-center text-blue-500';

            try {
                const response = await fetch(`${backendUrl}/engage/apply`, {
                    method: 'POST',
                    body: formData,
                });
                const data = await response.json();
                if (response.ok) {
                    messageDiv.textContent = data.message || 'Application submitted successfully!';
                    messageDiv.className = 'form-message mt-4 text-center text-green-500';
                    joinForm.reset();
                } else {
                    messageDiv.textContent = data.message || 'Submission failed. Please try again.';
                    messageDiv.className = 'form-message mt-4 text-center text-red-500';
                }
            } catch (error) {
                console.error('Application submission error:', error);
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message mt-4 text-center text-red-500';
            }
        });
    }

    // --- Contact/Feedback Form ---
    const feedbackForm = document.querySelector('#contact-feedback form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(feedbackForm);
            const jsonData = Object.fromEntries(formData.entries());
            let messageDiv = feedbackForm.querySelector('.form-message');
            if (!messageDiv) {
                messageDiv = document.createElement('div');
                messageDiv.className = 'form-message mt-4 text-center';
                feedbackForm.appendChild(messageDiv);
            }
            messageDiv.textContent = 'Sending...';
            messageDiv.className = 'form-message mt-4 text-center text-blue-500';

            try {
                const response = await fetch(`${backendUrl}/engage/feedback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(jsonData),
                });
                const data = await response.json();
                if (response.ok) {
                    messageDiv.textContent = data.message || 'Feedback sent successfully!';
                    messageDiv.className = 'form-message mt-4 text-center text-green-500';
                    feedbackForm.reset();
                } else {
                    messageDiv.textContent = data.message || 'Failed to send feedback. Please try again.';
                    messageDiv.className = 'form-message mt-4 text-center text-red-500';
                }
            } catch (error) {
                console.error('Feedback submission error:', error);
                messageDiv.textContent = 'An error occurred. Please try again.';
                messageDiv.className = 'form-message mt-4 text-center text-red-500';
            }
        });
    }

    // Basic Event Filtering (client-side for demo)
    const events = [
        { title: 'Research Paper Writing Workshop', date: 'June 1, 2025', type: 'workshop', year: '2025', image: 'images/event1.jpg' },
        { title: 'Annual Book Fair 2024', date: 'November 15-17, 2024', type: 'fair', year: '2024', image: 'images/event2.jpg' },
        { title: 'Literary Quiz Competition', date: 'February 10, 2024', type: 'competition', year: '2024', image: 'images/event3.jpg' },
        { title: 'Guest Lecture: Future of Libraries', date: 'September 5, 2023', type: 'seminar', year: '2023', image: 'images/event4.jpg' },
        { title: 'Coding Book Marathon', date: 'April 20, 2024', type: 'competition', year: '2024', image: 'images/event5.jpg' },
        { title: 'Career Guidance Seminar', date: 'March 10, 2025', type: 'seminar', year: '2025', image: 'images/event6.jpg' },
    ];

    function renderEvents(filteredEvents) {
        const eventGallery = document.getElementById('event-gallery');
        if (!eventGallery) return;
        eventGallery.innerHTML = '';
        filteredEvents.forEach(event => {
            eventGallery.innerHTML += `
                <div class="bg-gray-50 rounded-lg shadow-sm overflow-hidden animate-fade-in-up">
                    <img src="${event.image}" alt="${event.title}" class="w-full h-48 object-cover">
                    <div class="p-4">
                        <h4 class="text-xl font-inter font-bold text-blue-900 mb-2">${event.title}</h4>
                        <p class="text-gray-700 text-sm mb-2">Date: ${event.date} | Type: ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
                        <p class="text-gray-600 text-sm">Description of the event goes here...</p>
                        <a href="#" class="text-blue-600 hover:underline mt-3 inline-block">View Details</a>
                    </div>
                </div>
            `;
        });
    }

    const yearFilter = document.getElementById('event-year-filter');
    const typeFilter = document.getElementById('event-type-filter');

    if (yearFilter && typeFilter) {
        yearFilter.addEventListener('change', filterEvents);
        typeFilter.addEventListener('change', filterEvents);
    }

    function filterEvents() {
        if (!yearFilter || !typeFilter) return;
        const selectedYear = yearFilter.value;
        const selectedType = typeFilter.value;

        const filtered = events.filter(event => {
            const matchesYear = selectedYear === 'all' || event.year === selectedYear;
            const matchesType = selectedType === 'all' || event.type === selectedType;
            return matchesYear && matchesType;
        });
        renderEvents(filtered);
    }

    if (document.getElementById('event-gallery')) {
         renderEvents(events);
    }
});

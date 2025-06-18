# SLC Website: Empowering Student Learning at MMMUT

This repository contains the codebase for the **Student Learning Centre (SLC)** website, a comprehensive digital platform designed to enhance the academic and extracurricular experience for students at Madan Mohan Malaviya University of Technology (MMMUT), Lucknow.

---

## About the SLC

The SLC aims to be a central hub for student development, offering a diverse range of resources and opportunities including:

* **Learning Resources:** A curated library of books, digital materials, and academic tools.
* **Event Information:** Details on upcoming workshops, seminars, and club activities.
* **Council Information:** Profiles of current and past student council members and faculty advisors.
* **Engagement Opportunities:** Ways for students to suggest resources, join the SLC, and provide feedback.
* **Interactive Chatbot (PATH):** A helpful AI assistant to guide students and answer queries.

---

## Technologies Used

This project is built using a modern frontend stack for a responsive and engaging user experience:

* **HTML5:** For the core structure and content of all web pages.
* **Tailwind CSS:** A utility-first CSS framework for rapid and consistent styling, ensuring a responsive design across devices.
* **JavaScript:** For interactive elements, dynamic content loading, form handling, and the chatbot functionality.
* **Google Fonts:** Utilizing `Inter` and `Lato` for modern and readable typography.

---

## Features

* **Responsive Design:** Optimized for seamless viewing on desktops, tablets, and mobile devices.
* **Intuitive Navigation:** Easy-to-use menu system for quick access to all sections.
* **Dynamic Content:** JavaScript-powered sections for filtering library resources and events (client-side, with future potential for backend integration).
* **Interactive Forms:**
    * **Book Suggestion:** Allows students to recommend new books for the library.
    * **Join SLC:** Application form for students interested in volunteering.
    * **Contact & Feedback:** A channel for general inquiries and suggestions.
* **Accordion UI:** Cleanly organized 'Past Council Archive' for easy Browse.
* **PATH Chatbot:** An AI-powered assistant (placeholder, requires backend integration) to answer student queries.

---

## Getting Started

Follow these steps to set up the project locally for development.

### Prerequisites

You need to have **Node.js** (which includes npm) installed on your system.

* Download and install Node.js (LTS version recommended) from [nodejs.org](https://nodejs.org/en/download).

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/WebDev4001/SLC
    cd slc-website
    ```

2.  **Install Dependencies:**
    Navigate to the project's root directory in your terminal and install Tailwind CSS and its dependencies:
    ```bash
    npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
    ```
    This command installs the necessary packages and creates `tailwind.config.js` and `postcss.config.js` files.

3.  **Configure Tailwind CSS:**
    Open `tailwind.config.js` and update the `content` array to include your HTML files. Also, extend the `theme` section with your custom colors, fonts, and animations.

    ```javascript
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./public/**/*.html",
        "./public/js/**/*.js",
      ],
      theme: {
        extend: {
          colors: {
            'blue-900': '#003366',    // Primary Deep Blue
            'blue-800': '#004080',
            'blue-700': '#004c99',
            'ivory': '#F5F5DC',       // Secondary Ivory White
            'gold-300': '#DAA520',    // Muted Gold for accents
            'gold-500': '#DAA520',
            'gold-600': '#C1911D',
          },
          fontFamily: {
            inter: ['Inter', 'sans-serif'],
            lato: ['Lato', 'sans-serif'],
            'roboto-slab': ['"Roboto Slab"', 'serif'],
          },
          animation: {
              'fade-in': 'fadeIn 0.8s ease-out forwards',
              'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
              'fade-in-down': 'fadeInDown 0.8s ease-out forwards',
              'fade-in-right': 'fadeInRight 0.8s ease-out forwards',
              'fade-in-left': 'fadeInLeft 0.8s ease-out forwards',
              'marquee-up': 'marqueeUp 20s linear infinite',
          },
          keyframes: {
              fadeIn: { from: { opacity: '0' }, to: { opacity: '1' }, },
              fadeInUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' }, },
              fadeInDown: { from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' }, },
              fadeInRight: { from: { opacity: '0', transform: 'translateX(-20px)' }, to: { opacity: '1', transform: 'translateX(0)' }, },
              fadeInLeft: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' }, },
              marqueeUp: { '0%': { transform: 'translateY(0%)' }, '100%': { transform: 'translateY(-100%)' }, }
          }
        },
      },
      plugins: [],
    }
    ```

4.  **Create Input CSS:**
    Create a file named `src/input.css` (create the `src` folder if it doesn't exist) and add the following Tailwind directives:

    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    /* Add custom CSS rules here, e.g., for accordion transitions or responsive embeds */
    #past-council-accordion .hidden {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease-out;
    }
    #past-council-accordion .accordion-open {
        max-height: 500px; /* Adjust based on max content height */
        transition: max-height 0.3s ease-in;
    }
    [data-accordion-toggle] svg {
        transform: rotate(0deg);
    }
    [data-accordion-toggle][aria-expanded="true"] svg {
        transform: rotate(180deg);
    }
    .map-container {
        position: relative;
        padding-bottom: 56.25%; /* 16:9 aspect ratio */
        height: 0;
        overflow: hidden;
    }
    .map-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    /* Scrollbar styles for chat window */
    #chat-window::-webkit-scrollbar { width: 8px; }
    #chat-window::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    #chat-window::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
    #chat-window::-webkit-scrollbar-thumb:hover { background: #555; }
    ```

### Running the Development Server

1.  **Compile and Watch CSS:**
    Open a **new terminal window** in your project's root directory and run the Tailwind CLI to compile your CSS. The `--watch` flag will automatically recompile whenever you save changes to your HTML or `input.css`.

    ```bash
    npx tailwindcss -i ./src/input.css -o ./public/css/style.css --watch
    ```

2.  **Open HTML Files:**
    With the Tailwind watcher running, you can simply open your HTML files (e.g., `public/index.html`) directly in your web browser. You'll see the Tailwind CSS styles applied. For a more robust development experience, you might consider using a simple local server extension for VS Code (like "Live Server").

---

## Project Structure

The project is organized as follows:

```
slc-website/
├── public/                 # Contains all static HTML files, compiled CSS, images, and JavaScript
│   ├── index.html
│   ├── about.html
│   ├── library.html
│   ├── engage.html
│   ├── council.html
│   ├── path.html
│   ├── css/
│   │   └── style.css       # Compiled Tailwind CSS output
│   ├── js/
│   │   ├── main.js         # Core JavaScript for navigation, animations, general interactions
│   │   ├── library.js      # JavaScript for library search/filter
│   │   ├── engage.js       # JavaScript for event filtering and form handling
│   │   └── chatbot.js      # JavaScript for chatbot interaction (requires backend)
│   └── images/             # All project images (logos, backgrounds, member photos, icons)
├── src/
│   └── input.css           # Tailwind CSS input file with directives
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration (for Autoprefixer)
├── package.json            # Node.js project dependencies
└── README.md
```

---

## Future Enhancements & Backend Integration

This project currently features a robust frontend structure. For full functionality, especially for forms and the chatbot, **backend integration** is required.

**Key areas for future development:**

* **Database Integration:** Implement a database (e.g., MongoDB, PostgreSQL, Firebase Firestore) to store:
    * Submitted book suggestions.
    * Join SLC applications and resumes.
    * Contact form feedback.
    * Dynamic library book data and event listings.
* **API Development:** Create server-side APIs (e.g., using Node.js/Express, Python/Flask/Django) to handle:
    * Form submissions and data validation.
    * File uploads (resumes).
    * Secure data storage.
    * Potentially, dynamic content delivery for the library and events.
* **Real Chatbot Integration:** Connect `js/chatbot.js` to a real AI chatbot service (e.g., Google Dialogflow, Botpress, custom LLM API) for intelligent responses.
* **User Authentication:** For administrative access to manage content or review applications.
* **Advanced Features:** User accounts, event registration, notification system, etc.

---

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---
#   S L C - W E B - T 1  
 
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const backendUrl = 'http://localhost:5000/api'; // Assuming backend runs on port 5000

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const loginMessage = document.getElementById('loginMessage');
            loginMessage.textContent = ''; // Clear previous messages

            try {
                const response = await fetch(`${backendUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    loginMessage.textContent = 'Login successful! Redirecting...';
                    loginMessage.className = 'text-green-500';
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // Redirect to home page after a short delay
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    loginMessage.textContent = data.message || 'Login failed. Please check your credentials.';
                    loginMessage.className = 'text-red-500';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = 'An error occurred. Please try again.';
                loginMessage.className = 'text-red-500';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.name.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const registerMessage = document.getElementById('registerMessage');
            registerMessage.textContent = ''; // Clear previous messages

            if (password !== confirmPassword) {
                registerMessage.textContent = 'Passwords do not match!';
                registerMessage.className = 'text-red-500';
                return;
            }
            if (password.length < 6) {
                registerMessage.textContent = 'Password must be at least 6 characters long.';
                registerMessage.className = 'text-red-500';
                return;
            }

            try {
                const response = await fetch(`${backendUrl}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password }),
                });

                const data = await response.json();

                if (response.status === 201) { // Check for 201 Created status
                    registerMessage.textContent = 'Registration successful! Redirecting to login...';
                    registerMessage.className = 'text-green-500';
                    localStorage.setItem('token', data.token); // Optionally log in user directly
                    localStorage.setItem('user', JSON.stringify(data.user));
                    // Redirect to login page after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                        // Or redirect to index.html if auto-login is desired:
                        // window.location.href = 'index.html';
                    }, 2000);
                } else {
                    registerMessage.textContent = data.message || 'Registration failed. Please try again.';
                    registerMessage.className = 'text-red-500';
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerMessage.textContent = 'An error occurred. Please try again.';
                registerMessage.className = 'text-red-500';
            }
        });
    }

    // Update navigation based on login state
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const navElement = document.querySelector('header nav ul.hidden.md\\:flex'); // Desktop Nav
    const mobileNavElement = document.getElementById('mobile-menu')?.querySelector('ul'); // Mobile Nav

    if (token && user && navElement && mobileNavElement) {
        // Remove Login and Register links
        const loginLinkDesktop = navElement.querySelector('a[href="login.html"]');
        const registerLinkDesktop = navElement.querySelector('a[href="register.html"]');
        if (loginLinkDesktop) loginLinkDesktop.parentElement.remove();
        if (registerLinkDesktop) registerLinkDesktop.parentElement.remove();

        const loginLinkMobile = mobileNavElement.querySelector('a[href="login.html"]');
        const registerLinkMobile = mobileNavElement.querySelector('a[href="register.html"]');
        if (loginLinkMobile) loginLinkMobile.parentElement.remove();
        if (registerLinkMobile) registerLinkMobile.parentElement.remove();

        // Add User Name/Profile link and Logout button
        const profileLinkDesktop = document.createElement('li');
        profileLinkDesktop.innerHTML = `<span class="text-gold-300">Hello, ${user.name}!</span>`; // Not a link for now
        navElement.appendChild(profileLinkDesktop);

        const logoutButtonDesktop = document.createElement('li');
        logoutButtonDesktop.innerHTML = '<a href="#" id="logoutButtonDesktop" class="hover:text-gold-300 transition duration-300">Logout</a>';
        navElement.appendChild(logoutButtonDesktop);
        logoutButtonDesktop.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });

        // Mobile Nav Updates
        const profileLinkMobile = document.createElement('li');
        profileLinkMobile.innerHTML = `<span class="text-gold-300 py-2 block">Hello, ${user.name}!</span>`;
        mobileNavElement.appendChild(profileLinkMobile);

        const logoutButtonMobile = document.createElement('li');
        logoutButtonMobile.innerHTML = '<a href="#" id="logoutButtonMobile" class="hover:text-gold-300 transition duration-300 py-2 block">Logout</a>';
        mobileNavElement.appendChild(logoutButtonMobile);
         logoutButtonMobile.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
});

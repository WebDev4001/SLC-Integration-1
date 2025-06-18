document.addEventListener('DOMContentLoaded', () => {
    // Hide loading spinner after content loads
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }

    // Smooth scrolling for anchor links (if any, though forms generally don't need it)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Mobile menu toggle - consolidate logic here if needed across pages
    const mobileMenuButtonHome = document.getElementById('mobile-menu-button');
    const mobileMenuHome = document.getElementById('mobile-menu');

    if (mobileMenuButtonHome && mobileMenuHome) {
        mobileMenuButtonHome.addEventListener('click', () => {
            mobileMenuHome.classList.toggle('hidden');
        });
    }

    const mobileMenuButtonCouncil = document.getElementById('mobile-menu-button-council');
    const mobileMenuCouncil = document.getElementById('mobile-menu-council');

    if (mobileMenuButtonCouncil && mobileMenuCouncil) {
        mobileMenuButtonCouncil.addEventListener('click', () => {
            mobileMenuCouncil.classList.toggle('hidden');
        });
    }

    const mobileMenuButtonLibrary = document.getElementById('mobile-menu-button-library');
    const mobileMenuLibrary = document.getElementById('mobile-menu-library');

    if (mobileMenuButtonLibrary && mobileMenuLibrary) {
        mobileMenuButtonLibrary.addEventListener('click', () => {
            mobileMenuLibrary.classList.toggle('hidden');
        });
    }

    const mobileMenuButtonEngage = document.getElementById('mobile-menu-button-engage');
    const mobileMenuEngage = document.getElementById('mobile-menu-engage');

    if (mobileMenuButtonEngage && mobileMenuEngage) {
        mobileMenuButtonEngage.addEventListener('click', () => {
            mobileMenuEngage.classList.toggle('hidden');
        });
    }

    const mobileMenuButtonPath = document.getElementById('mobile-menu-button-path');
    const mobileMenuPath = document.getElementById('mobile-menu-path');

    if (mobileMenuButtonPath && mobileMenuPath) {
        mobileMenuButtonPath.addEventListener('click', () => {
            mobileMenuPath.classList.toggle('hidden');
        });
    }

    // Add other global JavaScript functions like animations, etc.
});
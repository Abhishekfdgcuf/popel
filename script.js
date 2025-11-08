// Global variables
let blogData = [];
let currentSlide = 0;
let featuredBlogs = [];

// Theme management
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Initialize theme from localStorage or default to light
function initializeTheme() {
    const savedTheme = localStorage.getItem('popel-theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    if (theme === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<span class="theme-icon">☀️</span>';
    } else {
        body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<span class="theme-icon">🌙</span>';
    }
    localStorage.setItem('popel-theme', theme);
}

function toggleTheme() {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// API Configuration and Data Loading
function showApiStatus(message, isError = false) {
    const statusElement = document.getElementById('apiStatus');
    statusElement.textContent = message;
    statusElement.className = `api-status ${isError ? 'error' : 'success'}`;
    statusElement.style.display = 'block';
}

function showLoading(show = true) {
    const loading = document.getElementById('loading');
    const noBlogs = document.getElementById('noBlogs');
    
    if (show) {
        loading.style.display = 'block';
        noBlogs.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

async function loadBlogs() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    
    if (!apiUrl) {
        showApiStatus('Please enter a valid SheetDB API URL', true);
        return;
    }

    // Validate URL format
    if (!apiUrl.includes('sheetdb.io/api/v1/')) {
        showApiStatus('Please enter a valid SheetDB API URL (should contain sheetdb.io/api/v1/)', true);
        return;
    }

    showLoading(true);
    showApiStatus('Loading blogs...', false);

    try {
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('No blog data found or invalid data format');
        }

        // Validate required fields
        const validBlogs = data.filter(blog => 
            blog.title && 
            blog.content && 
            blog.author && 
            blog.date
        );

        if (validBlogs.length === 0) {
            throw new Error('No valid blog posts found. Please ensure your sheet has title, content, author, and date columns.');
        }

        blogData = validBlogs;
        featuredBlogs = blogData.slice(0, 4); // First 4 blogs for carousel
        
        // Save API URL to localStorage for persistence
        localStorage.setItem('popel-api-url', apiUrl);
        
        showApiStatus(`Successfully loaded ${blogData.length} blog posts!`, false);
        showLoading(false);
        
        renderFeaturedCarousel();
        renderBlogsGrid();
        
    } catch (error) {
        console.error('Error loading blogs:', error);
        showApiStatus(`Error loading blogs: ${error.message}`, true);
        showLoading(false);
        showNoBlogsMessage();
    }
}

function showNoBlogsMessage() {
    const noBlogs = document.getElementById('noBlogs');
    noBlogs.style.display = 'block';
}

// Featured Carousel Functions
function renderFeaturedCarousel() {
    const carousel = document.getElementById('featuredCarousel');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (featuredBlogs.length === 0) {
        carousel.innerHTML = '<div class="carousel-slide"><div class="carousel-content"><p>No featured posts available</p></div></div>';
        return;
    }

    // Render carousel slides
    carousel.innerHTML = featuredBlogs.map(blog => `
        <div class="carousel-slide">
            <div class="carousel-content">
                <h4>${escapeHtml(blog.title)}</h4>
                <p>${escapeHtml(truncateText(blog.content, 150))}</p>
                <div class="carousel-meta">
                    <span class="blog-author">By ${escapeHtml(blog.author)}</span>
                    <span class="blog-date">${formatDate(blog.date)}</span>
                </div>
            </div>
        </div>
    `).join('');

    // Render dots
    dotsContainer.innerHTML = featuredBlogs.map((_, index) => 
        `<span class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>`
    ).join('');

    // Reset to first slide
    currentSlide = 0;
    updateCarouselPosition();
}

function updateCarouselPosition() {
    const carousel = document.getElementById('featuredCarousel');
    const dots = document.querySelectorAll('.dot');
    
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    // Update active dot
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function nextSlide() {
    if (featuredBlogs.length === 0) return;
    currentSlide = (currentSlide + 1) % featuredBlogs.length;
    updateCarouselPosition();
}

function previousSlide() {
    if (featuredBlogs.length === 0) return;
    currentSlide = currentSlide === 0 ? featuredBlogs.length - 1 : currentSlide - 1;
    updateCarouselPosition();
}

function goToSlide(index) {
    if (featuredBlogs.length === 0) return;
    currentSlide = index;
    updateCarouselPosition();
}

// Blogs Grid Functions
function renderBlogsGrid() {
    const blogsGrid = document.getElementById('blogsGrid');
    
    if (blogData.length === 0) {
        showNoBlogsMessage();
        return;
    }

    blogsGrid.innerHTML = blogData.map(blog => `
        <div class="blog-card">
            ${blog.image ? `<img src="${escapeHtml(blog.image)}" alt="${escapeHtml(blog.title)}" class="blog-image" onerror="this.style.display='none'">` : ''}
            <div class="blog-content">
                <h4 class="blog-title">${escapeHtml(blog.title)}</h4>
                <p class="blog-excerpt">${escapeHtml(truncateText(blog.content, 120))}</p>
                <div class="blog-meta">
                    <span class="blog-author">By ${escapeHtml(blog.author)}</span>
                    <span class="blog-date">${formatDate(blog.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return dateString; // Return original if parsing fails
    }
}

function scrollToBlogs() {
    const blogsSection = document.getElementById('blogs');
    blogsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Auto-advance carousel (optional)
function startCarouselAutoplay() {
    setInterval(() => {
        if (featuredBlogs.length > 1) {
            nextSlide();
        }
    }, 5000); // Change slide every 5 seconds
}

// Keyboard navigation for carousel
function handleKeyboardNavigation(event) {
    if (event.key === 'ArrowLeft') {
        previousSlide();
    } else if (event.key === 'ArrowRight') {
        nextSlide();
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initializeTheme();
    
    // Add event listeners
    themeToggle.addEventListener('click', toggleTheme);
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Load saved API URL if exists
    const savedApiUrl = localStorage.getItem('popel-api-url');
    if (savedApiUrl) {
        document.getElementById('apiUrl').value = savedApiUrl;
        // Auto-load blogs if API URL is saved
        loadBlogs();
    }
    
    // Start carousel autoplay (uncomment if desired)
    // startCarouselAutoplay();
    
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Handle API URL input on Enter key
document.addEventListener('DOMContentLoaded', function() {
    const apiInput = document.getElementById('apiUrl');
    apiInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            loadBlogs();
        }
    });
});

// Touch/swipe support for mobile carousel
let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextSlide(); // Swipe left - next slide
        } else {
            previousSlide(); // Swipe right - previous slide
        }
    }
}

// Add touch event listeners to carousel
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.getElementById('featuredCarousel');
    carousel.addEventListener('touchstart', handleTouchStart, false);
    carousel.addEventListener('touchend', handleTouchEnd, false);
});

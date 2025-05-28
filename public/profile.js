document.addEventListener('DOMContentLoaded', () => {
    // Theme switching
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.querySelector('.theme-label');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });

    // Load user profile
    const usernameElement = document.getElementById('username');
    const fullNameElement = document.getElementById('full-name');
    const emailElement = document.getElementById('email');
    const joinDateElement = document.getElementById('join-date');
    const lastLoginElement = document.getElementById('last-login');
    const notificationsToggle = document.getElementById('notifications');
    const avatarInitials = document.getElementById('avatar-initials');
    const cachedDataElement = document.getElementById('cached-data');
    const refreshButton = document.getElementById('refresh-data');
    const logoutButton = document.getElementById('logout-btn');

    // Format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Get initials from name
    function getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }

    // Check authentication and load profile
    fetch('/api/profile')
        .then(response => {
            if (!response.ok) {
                window.location.href = '/';
                throw new Error('Not authenticated');
            }
            return response.json();
        })
        .then(data => {
            // Update profile information
            usernameElement.textContent = data.username;
            fullNameElement.textContent = data.profile.fullName;
            emailElement.textContent = data.profile.email;
            joinDateElement.textContent = formatDate(data.profile.joinDate);
            lastLoginElement.textContent = formatDate(data.profile.lastLogin);
            notificationsToggle.checked = data.profile.preferences.notifications;
            avatarInitials.textContent = getInitials(data.profile.fullName);

            // Load cached data
            loadCachedData();
        })
        .catch(error => {
            if (error.message !== 'Not authenticated') {
                console.error('Error loading profile:', error);
            }
        });

    // Load cached data
    function loadCachedData() {
        fetch('/data')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load data');
                }
                return response.json();
            })
            .then(data => {
                cachedDataElement.innerHTML = `
                    <p><strong>Время обновления:</strong> ${formatDate(data.timestamp)}</p>
                    <p><strong>Сообщение:</strong> ${data.message}</p>
                    <p><strong>Случайное значение:</strong> ${data.random}</p>
                `;
            })
            .catch(error => {
                cachedDataElement.innerHTML = '<p>Ошибка загрузки данных</p>';
                console.error('Error loading cached data:', error);
            });
    }

    // Refresh data button
    refreshButton.addEventListener('click', loadCachedData);

    // Notifications toggle
    notificationsToggle.addEventListener('change', () => {
        // Здесь можно добавить сохранение настройки на сервере
        console.log('Notifications:', notificationsToggle.checked);
    });

    // Logout button
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/logout', {
                method: 'POST'
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                alert('Ошибка при выходе');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Ошибка при выходе');
        }
    });
}); 
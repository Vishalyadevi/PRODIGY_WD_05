class WeatherUtils {
    static formatDate(timestamp, options = {}) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        });
    }

    static formatTime(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true
        });
    }

    static formatTemperature(temp, unit = 'C') {
        if (unit === 'F') {
            return Math.round((temp * 9/5) + 32);
        }
        return Math.round(temp);
    }

    static convertWindSpeed(speed, unit = 'kmh') {
        // API returns m/s, convert to km/h by default
        if (unit === 'kmh') {
            return Math.round(speed * 3.6);
        }
        if (unit === 'mph') {
            return Math.round(speed * 2.237);
        }
        return Math.round(speed);
    }

    static getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        return directions[Math.round(degrees / 22.5) % 16];
    }

    static getUVLevel(uvIndex) {
        if (uvIndex <= 2) return 'Low';
        if (uvIndex <= 5) return 'Moderate';
        if (uvIndex <= 7) return 'High';
        if (uvIndex <= 10) return 'Very High';
        return 'Extreme';
    }

    static getAQILevel(aqi) {
        switch (aqi) {
            case 1: return { label: 'Good', class: 'aqi-good' };
            case 2: return { label: 'Fair', class: 'aqi-fair' };
            case 3: return { label: 'Moderate', class: 'aqi-moderate' };
            case 4: return { label: 'Poor', class: 'aqi-poor' };
            case 5: return { label: 'Very Poor', class: 'aqi-very-poor' };
            default: return { label: 'Unknown', class: '' };
        }
    }

    static getAQIValue(components) {
        // Simple AQI calculation based on PM2.5
        const pm25 = components.pm2_5;
        if (pm25 <= 12) return 1; // Good
        if (pm25 <= 35) return 2; // Fair
        if (pm25 <= 55) return 3; // Moderate
        if (pm25 <= 150) return 4; // Poor
        return 5; // Very Poor
    }

    static capitalizeWords(str) {
        return str.replace(/\b\w/g, letter => letter.toUpperCase());
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    let message;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = "Location access denied. Please enable location services.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = "Location information is unavailable.";
                            break;
                        case error.TIMEOUT:
                            message = "Location request timed out.";
                            break;
                        default:
                            message = "An unknown error occurred while retrieving location.";
                            break;
                    }
                    reject(new Error(message));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 600000 // 10 minutes
                }
            );
        });
    }

    static animateValue(element, start, end, duration) {
        const startTime = Date.now();
        const range = end - start;

        function updateValue() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.round(start + (range * progress));
            
            element.textContent = value;
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        }
        
        requestAnimationFrame(updateValue);
    }

    static showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
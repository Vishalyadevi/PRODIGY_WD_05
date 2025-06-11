class WeatherApp {
    constructor() {
        this.weatherAPI = new WeatherAPI();
        this.currentUnit = 'C';
        this.currentLocation = null;
        this.searchTimeout = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadInitialWeather();
    }

    initializeElements() {
        // UI Elements
        this.elements = {
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            errorText: document.getElementById('errorText'),
            retryBtn: document.getElementById('retryBtn'),
            mainContent: document.getElementById('mainContent'),
            
            // Header
            unitToggle: document.getElementById('unitToggle'),
            locationBtn: document.getElementById('locationBtn'),
            
            // Search
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            suggestions: document.getElementById('suggestions'),
            
            // Current Weather
            currentLocation: document.getElementById('currentLocation'),
            currentDate: document.getElementById('currentDate'),
            currentTemp: document.getElementById('currentTemp'),
            currentIcon: document.getElementById('currentIcon'),
            weatherDescription: document.getElementById('weatherDescription'),
            feelsLike: document.getElementById('feelsLike'),
            windSpeed: document.getElementById('windSpeed'),
            humidity: document.getElementById('humidity'),
            uvIndex: document.getElementById('uvIndex'),
            pressure: document.getElementById('pressure'),
            
            // Forecast
            hourlyContainer: document.getElementById('hourlyContainer'),
            forecastContainer: document.getElementById('forecastContainer'),
            
            // Air Quality
            aqiValue: document.getElementById('aqiValue'),
            aqiLabel: document.getElementById('aqiLabel'),
            pm25: document.getElementById('pm25'),
            pm10: document.getElementById('pm10'),
            o3: document.getElementById('o3'),
            no2: document.getElementById('no2')
        };
    }

    bindEvents() {
        // Unit toggle
        this.elements.unitToggle.addEventListener('click', () => this.toggleUnit());
        
        // Location button
        this.elements.locationBtn.addEventListener('click', () => this.getCurrentLocation());
        
        // Search functionality
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Search suggestions
        this.elements.searchInput.addEventListener('input', 
            WeatherUtils.debounce((e) => this.handleSearchInput(e), 300)
        );
        
        // Retry button
        this.elements.retryBtn.addEventListener('click', () => this.loadInitialWeather());
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }

    async loadInitialWeather() {
        try {
            this.showLoading();
            
            // Try to get user's current location
            const location = await WeatherUtils.getCurrentLocation();
            await this.loadWeatherData(location.lat, location.lon);
            
        } catch (error) {
            console.error('Error getting current location:', error);
            
            // Fallback to a default city (London)
            try {
                await this.loadWeatherData(51.5074, -0.1278);
            } catch (fallbackError) {
                this.showError('Unable to load weather data. Please check your internet connection.');
            }
        }
    }

    async getCurrentLocation() {
        try {
            this.showLoading();
            const location = await WeatherUtils.getCurrentLocation();
            await this.loadWeatherData(location.lat, location.lon);
            WeatherUtils.showNotification('Location updated successfully!');
        } catch (error) {
            WeatherUtils.showNotification(error.message, 'error');
            this.hideLoading();
        }
    }

    async loadWeatherData(lat, lon) {
        try {
            this.showLoading();
            
            const weatherData = await this.weatherAPI.getAllWeatherData(lat, lon);
            this.currentLocation = { lat, lon };
            
            this.updateCurrentWeather(weatherData.current);
            this.updateHourlyForecast(weatherData.forecast);
            this.updateDailyForecast(weatherData.forecast);
            this.updateAirQuality(weatherData.airPollution);
            this.updateLocationDisplay(weatherData.location || weatherData.current);
            
            this.hideLoading();
            this.showMainContent();
            
        } catch (error) {
            console.error('Error loading weather data:', error);
            this.showError('Failed to load weather data. Please try again.');
        }
    }

    updateCurrentWeather(data) {
        // Temperature
        const temp = WeatherUtils.formatTemperature(data.main.temp, this.currentUnit);
        const feelsLike = WeatherUtils.formatTemperature(data.main.feels_like, this.currentUnit);
        
        this.elements.currentTemp.textContent = `${temp}°`;
        this.elements.feelsLike.textContent = `${feelsLike}°`;
        
        // Weather info
        this.elements.weatherDescription.textContent = WeatherUtils.capitalizeWords(data.weather[0].description);
        this.elements.currentIcon.src = this.weatherAPI.getWeatherIconUrl(data.weather[0].icon);
        this.elements.currentIcon.alt = data.weather[0].description;
        
        // Stats
        this.elements.windSpeed.textContent = `${WeatherUtils.convertWindSpeed(data.wind.speed)} km/h`;
        this.elements.humidity.textContent = `${data.main.humidity}%`;
        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
        
        // UV Index (not available in current weather, using dummy data)
        this.elements.uvIndex.textContent = '6';
        
        // Update date
        this.elements.currentDate.textContent = WeatherUtils.formatDate(data.dt);
    }

    updateLocationDisplay(data) {
        if (data.name && data.country) {
            this.elements.currentLocation.textContent = `${data.name}, ${data.country}`;
        } else if (data.local_names && data.local_names.en) {
            this.elements.currentLocation.textContent = `${data.local_names.en}, ${data.country}`;
        } else {
            this.elements.currentLocation.textContent = `${data.coord?.lat?.toFixed(2)}, ${data.coord?.lon?.toFixed(2)}`;
        }
    }

    updateHourlyForecast(data) {
        const hourlyItems = data.list.slice(0, 8); // Next 24 hours (3-hour intervals)
        
        this.elements.hourlyContainer.innerHTML = hourlyItems.map(item => {
            const time = WeatherUtils.formatTime(item.dt);
            const temp = WeatherUtils.formatTemperature(item.main.temp, this.currentUnit);
            const icon = this.weatherAPI.getWeatherIconUrl(item.weather[0].icon);
            const desc = WeatherUtils.capitalizeWords(item.weather[0].description);
            
            return `
                <div class="hourly-item">
                    <div class="hourly-time">${time}</div>
                    <div class="hourly-icon">
                        <img src="${icon}" alt="${desc}">
                    </div>
                    <div class="hourly-temp">${temp}°</div>
                    <div class="hourly-desc">${desc}</div>
                </div>
            `;
        }).join('');
    }

    updateDailyForecast(data) {
        // Group forecast data by day
        const dailyData = this.groupForecastByDay(data.list);
        const dailyForecasts = Object.values(dailyData).slice(0, 5);
        
        this.elements.forecastContainer.innerHTML = dailyForecasts.map(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            const dateText = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const high = WeatherUtils.formatTemperature(day.temp_max, this.currentUnit);
            const low = WeatherUtils.formatTemperature(day.temp_min, this.currentUnit);
            const icon = this.weatherAPI.getWeatherIconUrl(day.weather.icon);
            const desc = WeatherUtils.capitalizeWords(day.weather.description);
            
            return `
                <div class="forecast-item">
                    <div class="forecast-date">
                        <div class="forecast-day">${dayName}</div>
                        <div class="forecast-date-text">${dateText}</div>
                    </div>
                    <div class="forecast-weather">
                        <div class="forecast-icon">
                            <img src="${icon}" alt="${desc}">
                        </div>
                        <div class="forecast-desc">${desc}</div>
                    </div>
                    <div class="forecast-temps">
                        <span class="forecast-high">${high}°</span>
                        <span class="forecast-low">${low}°</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    groupForecastByDay(forecastList) {
        const grouped = {};
        
        forecastList.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            
            if (!grouped[dayKey]) {
                grouped[dayKey] = {
                    dt: item.dt,
                    temp_max: item.main.temp_max,
                    temp_min: item.main.temp_min,
                    weather: item.weather[0],
                    items: []
                };
            }
            
            grouped[dayKey].items.push(item);
            grouped[dayKey].temp_max = Math.max(grouped[dayKey].temp_max, item.main.temp_max);
            grouped[dayKey].temp_min = Math.min(grouped[dayKey].temp_min, item.main.temp_min);
        });
        
        return grouped;
    }

    updateAirQuality(data) {
        if (!data || !data.list || data.list.length === 0) {
            return;
        }
        
        const aqi = data.list[0];
        const components = aqi.components;
        
        // Calculate AQI value and level
        const aqiValue = WeatherUtils.getAQIValue(components);
        const aqiLevel = WeatherUtils.getAQILevel(aqiValue);
        
        this.elements.aqiValue.textContent = aqiValue;
        this.elements.aqiLabel.textContent = aqiLevel.label;
        this.elements.aqiLabel.className = `aqi-label ${aqiLevel.class}`;
        
        // Update component values
        this.elements.pm25.textContent = components.pm2_5?.toFixed(1) || 'N/A';
        this.elements.pm10.textContent = components.pm10?.toFixed(1) || 'N/A';
        this.elements.o3.textContent = components.o3?.toFixed(1) || 'N/A';
        this.elements.no2.textContent = components.no2?.toFixed(1) || 'N/A';
    }

    async handleSearchInput(event) {
        const query = event.target.value.trim();
        
        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }
        
        try {
            const cities = await this.weatherAPI.searchCities(query);
            this.showSuggestions(cities);
        } catch (error) {
            console.error('Error searching cities:', error);
            this.hideSuggestions();
        }
    }

    showSuggestions(cities) {
        if (cities.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.elements.suggestions.innerHTML = cities.map(city => {
            const displayName = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
            return `
                <div class="suggestion-item" data-lat="${city.lat}" data-lon="${city.lon}" data-name="${displayName}">
                    ${displayName}
                </div>
            `;
        }).join('');
        
        // Add click event listeners to suggestions
        this.elements.suggestions.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                const name = item.dataset.name;
                
                this.elements.searchInput.value = name;
                this.hideSuggestions();
                this.loadWeatherData(lat, lon);
            });
        });
        
        this.elements.suggestions.style.display = 'block';
    }

    hideSuggestions() {
        this.elements.suggestions.style.display = 'none';
        this.elements.suggestions.innerHTML = '';
    }

    async handleSearch() {
        const query = this.elements.searchInput.value.trim();
        
        if (!query) return;
        
        try {
            this.showLoading();
            const cities = await this.weatherAPI.searchCities(query);
            
            if (cities.length === 0) {
                WeatherUtils.showNotification('No cities found for your search.', 'error');
                this.hideLoading();
                return;
            }
            
            const city = cities[0];
            await this.loadWeatherData(city.lat, city.lon);
            this.hideSuggestions();
            
        } catch (error) {
            console.error('Error searching for city:', error);
            WeatherUtils.showNotification('Error searching for city. Please try again.', 'error');
            this.hideLoading();
        }
    }

    toggleUnit() {
        this.currentUnit = this.currentUnit === 'C' ? 'F' : 'C';
        this.elements.unitToggle.textContent = `°${this.currentUnit}`;
        
        // Reload weather data to update temperatures
        if (this.currentLocation) {
            this.loadWeatherData(this.currentLocation.lat, this.currentLocation.lon);
        }
    }

    showLoading() {
        this.elements.loading.classList.remove('hidden');
        this.elements.error.classList.add('hidden');
        this.elements.mainContent.classList.add('hidden');
    }

    hideLoading() {
        this.elements.loading.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.error.classList.remove('hidden');
        this.elements.loading.classList.add('hidden');
        this.elements.mainContent.classList.add('hidden');
    }

    showMainContent() {
        this.elements.mainContent.classList.remove('hidden');
        this.elements.error.classList.add('hidden');
        this.elements.loading.classList.add('hidden');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
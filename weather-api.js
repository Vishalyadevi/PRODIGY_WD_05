class WeatherAPI {
    constructor() {
        this.apiKey = '9955c93224ff7ab3e9352b4be2d8853a'; // OpenWeatherMap API key
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.geocodingUrl = 'https://api.openweathermap.org/geo/1.0';
        this.airPollutionUrl = 'https://api.openweathermap.org/data/2.5/air_pollution';
    }

    async getCurrentWeather(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching current weather:', error);
            throw error;
        }
    }

    async getForecast(lat, lon) {
        try {
            const response = await fetch(
                `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error(`Forecast API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching forecast:', error);
            throw error;
        }
    }

    async getAirPollution(lat, lon) {
        try {
            const response = await fetch(
                `${this.airPollutionUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`Air pollution API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching air pollution:', error);
            throw error;
        }
    }

    async searchCities(query) {
        try {
            const response = await fetch(
                `${this.geocodingUrl}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error searching cities:', error);
            throw error;
        }
    }

    async reverseGeocode(lat, lon) {
        try {
            const response = await fetch(
                `${this.geocodingUrl}/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`Reverse geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data[0] || null;
        } catch (error) {
            console.error('Error with reverse geocoding:', error);
            throw error;
        }
    }

    getWeatherIconUrl(iconCode) {
        return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    }

    async getAllWeatherData(lat, lon) {
        try {
            const [currentWeather, forecast, airPollution, locationData] = await Promise.all([
                this.getCurrentWeather(lat, lon),
                this.getForecast(lat, lon),
                this.getAirPollution(lat, lon),
                this.reverseGeocode(lat, lon)
            ]);

            return {
                current: currentWeather,
                forecast: forecast,
                airPollution: airPollution,
                location: locationData
            };
        } catch (error) {
            console.error('Error fetching all weather data:', error);
            throw error;
        }
    }
}
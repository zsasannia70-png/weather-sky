const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const weatherDisplay = document.getElementById('weatherDisplay');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const errorMsg = document.getElementById('errorMsg');

// UI Elements to update
const cityNameEl = document.getElementById('cityName');
const currentDateEl = document.getElementById('currentDate');
const temperatureEl = document.getElementById('temperature');
const weatherDescEl = document.getElementById('weatherDesc');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const cloudsEl = document.getElementById('clouds');

const WMO_CODES = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
};

async function getWeatherData(city) {
    try {
        showLoading();
        hideError();
        hideWeather();

        // 1. Geocoding: Get lat/lon for the city
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error(`City "${city}" not found. Please try another location.`);
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        const locationName = `${name}, ${country}`;

        // 2. Weather: Get weather for coordinates
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,cloudcover&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        updateUI(weatherData, locationName);
        showWeather();
    } catch (err) {
        showError(err.message);
    } finally {
        hideLoading();
    }
}

function updateUI(data, locationName) {
    const current = data.current_weather;
    const hourly = data.hourly;
    
    // Find index for current hour to get humidity and clouds
    const now = new Date();
    const currentHourStr = now.toISOString().slice(0, 13) + ':00';
    const hourIndex = hourly.time.findIndex(t => t.startsWith(currentHourStr)) || 0;

    cityNameEl.textContent = locationName;
    currentDateEl.textContent = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
    
    temperatureEl.textContent = Math.round(current.temperature);
    weatherDescEl.textContent = WMO_CODES[current.weathercode] || 'Unknown';
    
    humidityEl.textContent = `${hourly.relativehumidity_2m[hourIndex]}%`;
    windSpeedEl.textContent = `${current.windspeed} km/h`;
    cloudsEl.textContent = `${hourly.cloudcover[hourIndex]}%`;
}

function showLoading() { loading.classList.remove('hidden'); }
function hideLoading() { loading.classList.add('hidden'); }
function showWeather() { weatherDisplay.classList.remove('hidden'); }
function hideWeather() { weatherDisplay.classList.add('hidden'); }
function showError(msg) {
    errorMsg.textContent = msg;
    error.classList.remove('hidden');
}
function hideError() { error.classList.add('hidden'); }

searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) getWeatherData(city);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) getWeatherData(city);
    }
});

// Quick city selection
document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const city = btn.textContent;
        cityInput.value = city;
        getWeatherData(city);
    });
});

// Initial search for a default city
getWeatherData('Helsinki');

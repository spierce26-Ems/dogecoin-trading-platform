// Data Management Module - Handles fetching and caching crypto data
// UPDATED: Multi-API fallback with CORS proxy support

const DataManager = {
    cache: {
        currentPrice: null,
        historicalData: null,
        lastUpdate: null
    },
    dataSource: 'unknown', // Track which API is working
    isLiveData: false,

    // CORS proxy for APIs that block browser requests
    corsProxies: [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
    ],

    // Try multiple APIs with fallback (UPDATED with better sources)
    async getCurrentPrice() {
        const sources = [
            {
                name: 'CryptoCompare',
                fetch: () => this.fetchFromCryptoCompare()
            },
            {
                name: 'Messari',
                fetch: () => this.fetchFromMessari()
            },
            {
                name: 'CoinGecko',
                fetch: () => this.fetchFromCoinGecko()
            },
            {
                name: 'Binance (Proxy)',
                fetch: () => this.fetchFromBinanceWithProxy()
            },
            {
                name: 'CoinCap (Proxy)',
                fetch: () => this.fetchFromCoinCapWithProxy()
            }
        ];

        // Try each source in order
        for (const source of sources) {
            try {
                console.log(`Trying ${source.name} API...`);
                const data = await source.fetch();
                if (data && data.price > 0) {
                    this.cache.currentPrice = data;
                    this.cache.lastUpdate = Date.now();
                    this.dataSource = source.name;
                    this.isLiveData = true;
                    this.updateDataStatus('live', source.name);
                    console.log(`✅ ${source.name} API successful`);
                    return data;
                }
            } catch (error) {
                console.warn(`❌ ${source.name} failed:`, error.message);
                continue;
            }
        }

        // All APIs failed - use simulated data
        console.warn('⚠️ All APIs failed. Using simulated data.');
        this.dataSource = 'Simulated';
        this.isLiveData = false;
        this.updateDataStatus('simulated', 'All APIs unavailable');
        
        return this.generateSimulatedCurrentPrice();
    },

    // NEW: Fetch from CryptoCompare (browser-friendly, no CORS issues)
    async fetchFromCryptoCompare() {
        const response = await fetch('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=DOGE&tsyms=USD', {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const dogeData = data.RAW.DOGE.USD;
        
        return {
            price: dogeData.PRICE,
            change24h: dogeData.CHANGEPCT24HOUR,
            volume24h: dogeData.VOLUME24HOURTO,
            timestamp: Date.now()
        };
    },

    // NEW: Fetch from Messari (browser-friendly, no CORS issues)
    async fetchFromMessari() {
        const response = await fetch('https://data.messari.io/api/v1/assets/dogecoin/metrics', {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const json = await response.json();
        const data = json.data;
        
        return {
            price: data.market_data.price_usd,
            change24h: data.market_data.percent_change_usd_last_24_hours,
            volume24h: data.market_data.real_volume_last_24_hours,
            timestamp: Date.now()
        };
    },

    // Fetch from CoinGecko (direct, sometimes works)
    async fetchFromCoinGecko() {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true', {
            signal: AbortSignal.timeout(5000)
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        return {
            price: data.dogecoin.usd,
            change24h: data.dogecoin.usd_24h_change,
            volume24h: data.dogecoin.usd_24h_vol,
            timestamp: Date.now()
        };
    },

    // UPDATED: Fetch from Binance with CORS proxy
    async fetchFromBinanceWithProxy() {
        const apiUrl = 'https://api.binance.com/api/v3/ticker/24hr?symbol=DOGEUSDT';
        
        // Try first proxy
        try {
            const proxyUrl = this.corsProxies[0];
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            return {
                price: parseFloat(data.lastPrice),
                change24h: parseFloat(data.priceChangePercent),
                volume24h: parseFloat(data.quoteVolume),
                timestamp: Date.now()
            };
        } catch (error) {
            // Try second proxy
            const proxyUrl = this.corsProxies[1];
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            return {
                price: parseFloat(data.lastPrice),
                change24h: parseFloat(data.priceChangePercent),
                volume24h: parseFloat(data.quoteVolume),
                timestamp: Date.now()
            };
        }
    },

    // UPDATED: Fetch from CoinCap with CORS proxy
    async fetchFromCoinCapWithProxy() {
        const apiUrl = 'https://api.coincap.io/v2/assets/dogecoin';
        
        try {
            const proxyUrl = this.corsProxies[0];
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const json = await response.json();
            const data = json.data;
            
            return {
                price: parseFloat(data.priceUsd),
                change24h: parseFloat(data.changePercent24Hr),
                volume24h: parseFloat(data.volumeUsd24Hr),
                timestamp: Date.now()
            };
        } catch (error) {
            // Try second proxy
            const proxyUrl = this.corsProxies[1];
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl), {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const json = await response.json();
            const data = json.data;
            
            return {
                price: parseFloat(data.priceUsd),
                change24h: parseFloat(data.changePercent24Hr),
                volume24h: parseFloat(data.volumeUsd24Hr),
                timestamp: Date.now()
            };
        }
    },

    // Generate simulated current price
    generateSimulatedCurrentPrice() {
        return {
            price: 0.08234 + (Math.random() - 0.5) * 0.01,
            change24h: (Math.random() - 0.5) * 10,
            volume24h: 500000000 + Math.random() * 200000000,
            timestamp: Date.now()
        };
    },

    // Update status banner
    updateDataStatus(status, source) {
        const banner = document.getElementById('dataStatusBanner');
        const icon = document.getElementById('statusIcon');
        const title = document.getElementById('statusTitle');
        const subtitle = document.getElementById('statusSubtitle');
        const timestamp = document.getElementById('statusTimestamp');

        if (!banner) return;

        // Remove all status classes
        banner.className = 'data-status-banner';
        
        if (status === 'live') {
            banner.classList.add('status-live');
            icon.className = 'status-icon live';
            icon.innerHTML = '<i class="fas fa-check-circle"></i>';
            title.textContent = '🟢 LIVE DATA - Real Market Prices';
            subtitle.textContent = `Connected to ${source} API • Updates every 5 minutes`;
        } else if (status === 'simulated') {
            banner.classList.add('status-simulated');
            icon.className = 'status-icon simulated';
            icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            title.textContent = '⚠️ SIMULATED DATA - Not Real Prices';
            subtitle.textContent = 'API connections failed • DO NOT use for real trading decisions';
        } else if (status === 'error') {
            banner.classList.add('status-error');
            icon.className = 'status-icon error';
            icon.innerHTML = '<i class="fas fa-times-circle"></i>';
            title.textContent = '🔴 ERROR - Cannot Load Data';
            subtitle.textContent = source;
        }

        const now = new Date();
        timestamp.textContent = now.toLocaleTimeString();
    },

    // Fetch historical price data (5 years) with multiple sources
    async getHistoricalData(days = 1825) {
        // Try CoinGecko first (best historical data)
        try {
            console.log('Fetching historical data from CoinGecko...');
            const response = await fetch(`https://api.coingecko.com/api/v3/coins/dogecoin/market_chart?vs_currency=usd&days=${days}&interval=daily`, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            // Transform data to usable format
            const historicalData = data.prices.map((point, index) => ({
                timestamp: point[0],
                date: new Date(point[0]),
                price: point[1],
                volume: data.total_volumes[index] ? data.total_volumes[index][1] : 0
            }));
            
            this.cache.historicalData = historicalData;
            console.log('✅ Historical data loaded from CoinGecko');
            return historicalData;
        } catch (error) {
            console.warn('❌ CoinGecko historical data failed:', error.message);
        }

        // Try CryptoCompare as fallback
        try {
            console.log('Trying CryptoCompare for historical data...');
            const limit = Math.min(days, 2000); // CryptoCompare limit
            const response = await fetch(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=DOGE&tsym=USD&limit=${limit}`, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const json = await response.json();
            const historicalData = json.Data.Data.map(point => ({
                timestamp: point.time * 1000,
                date: new Date(point.time * 1000),
                price: point.close,
                volume: point.volumeto
            }));
            
            this.cache.historicalData = historicalData;
            console.log('✅ Historical data loaded from CryptoCompare');
            return historicalData;
        } catch (error) {
            console.warn('❌ CryptoCompare historical data failed:', error.message);
        }

        // All APIs failed - generate synthetic data
        console.warn('⚠️ All historical APIs failed. Generating simulated data.');
        this.updateDataStatus('simulated', 'Historical data unavailable');
        return this.generateSyntheticData(days);
    },

    // Generate synthetic data based on typical Dogecoin patterns
    generateSyntheticData(days) {
        const data = [];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        let basePrice = 0.05;
        let trend = 1.0;
        
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Simulate major events (Elon tweets, etc.)
            if (Math.random() > 0.98) {
                trend = 1 + (Math.random() * 0.5 - 0.25);
            }
            
            // Daily volatility (4-12% typical for DOGE)
            const dailyChange = (Math.random() - 0.5) * 0.12;
            basePrice = basePrice * (1 + dailyChange) * trend;
            
            // Keep price in realistic range
            basePrice = Math.max(0.01, Math.min(0.8, basePrice));
            
            // Decay trend
            trend = 1 + (trend - 1) * 0.95;
            
            data.push({
                timestamp: date.getTime(),
                date: date,
                price: basePrice,
                volume: Math.random() * 1000000000 + 200000000
            });
        }
        
        this.cache.historicalData = data;
        return data;
    },

    // Calculate volatility for different periods
    calculateVolatility(data, periods = [7, 30, 90]) {
        const results = {};
        
        periods.forEach(period => {
            const recentData = data.slice(-period);
            const returns = [];
            
            for (let i = 1; i < recentData.length; i++) {
                const dailyReturn = (recentData[i].price - recentData[i-1].price) / recentData[i-1].price;
                returns.push(dailyReturn);
            }
            
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);
            
            results[`${period}d`] = {
                volatility: stdDev * 100,
                avgReturn: mean * 100
            };
        });
        
        return results;
    },

    // Calculate technical indicators
    calculateRSI(data, period = 14) {
        if (data.length < period + 1) return 50;
        
        const prices = data.slice(-period - 1).map(d => d.price);
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return rsi;
    },

    // Calculate Simple Moving Average
    calculateSMA(data, period) {
        if (data.length < period) return null;
        
        const recentPrices = data.slice(-period).map(d => d.price);
        const sum = recentPrices.reduce((a, b) => a + b, 0);
        return sum / period;
    },

    // Calculate Moving Averages (alias for compatibility)
    calculateMA(data, period) {
        return this.calculateSMA(data, period);
    },

    // Calculate MACD
    calculateMACD(data) {
        const ema12 = this.calculateEMA(data, 12);
        const ema26 = this.calculateEMA(data, 26);
        
        if (!ema12 || !ema26) return null;
        
        const macd = ema12 - ema26;
        const signal = this.calculateEMA(data.slice(-9), 9);
        
        return {
            value: macd,
            signal: signal || macd,
            histogram: macd - (signal || macd)
        };
    },

    // Calculate Exponential Moving Average
    calculateEMA(data, period) {
        if (data.length < period) return null;
        
        const prices = data.map(d => d.price);
        const multiplier = 2 / (period + 1);
        
        let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }
        
        return ema;
    },

    // Calculate Bollinger Bands
    calculateBollingerBands(data, period = 20, stdDev = 2) {
        if (data.length < period) return null;
        
        const ma = this.calculateMA(data, period);
        const prices = data.slice(-period).map(d => d.price);
        
        const squaredDiffs = prices.map(price => Math.pow(price - ma, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        return {
            upper: ma + (standardDeviation * stdDev),
            middle: ma,
            lower: ma - (standardDeviation * stdDev)
        };
    },

    // Identify best trading hours based on historical volatility
    analyzeTradingHours(data) {
        const hourlyVolatility = {};
        
        for (let hour = 0; hour < 24; hour++) {
            hourlyVolatility[hour] = [];
        }
        
        for (let i = 1; i < data.length; i++) {
            const hour = data[i].date.getHours();
            const volatility = Math.abs(data[i].price - data[i-1].price) / data[i-1].price;
            hourlyVolatility[hour].push(volatility);
        }
        
        const hourlyAvg = {};
        Object.keys(hourlyVolatility).forEach(hour => {
            const values = hourlyVolatility[hour];
            if (values.length > 0) {
                hourlyAvg[hour] = values.reduce((a, b) => a + b, 0) / values.length;
            } else {
                hourlyAvg[hour] = 0;
            }
        });
        
        const sortedHours = Object.entries(hourlyAvg)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));
        
        return sortedHours;
    },

    // Format currency
    formatCurrency(value, decimals = 2) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    },

    // Format large numbers
    formatNumber(value) {
        if (value >= 1e9) {
            return (value / 1e9).toFixed(2) + 'B';
        } else if (value >= 1e6) {
            return (value / 1e6).toFixed(2) + 'M';
        } else if (value >= 1e3) {
            return (value / 1e3).toFixed(2) + 'K';
        }
        return value.toFixed(2);
    },

    // Format percentage
    formatPercentage(value, decimals = 2) {
        return (value >= 0 ? '+' : '') + value.toFixed(decimals) + '%';
    },

    // Get manual price override from localStorage
    getManualPrice() {
        const stored = localStorage.getItem('manual_doge_price');
        if (!stored) return null;
        
        try {
            const data = JSON.parse(stored);
            const age = Date.now() - data.timestamp;
            if (age > 60 * 60 * 1000) {
                localStorage.removeItem('manual_doge_price');
                return null;
            }
            return {
                price: data.price,
                change24h: 0,
                volume24h: 0,
                timestamp: data.timestamp
            };
        } catch (e) {
            return null;
        }
    },

    // Set manual price override
    setManualPrice(price) {
        const data = {
            price: price,
            timestamp: Date.now()
        };
        localStorage.setItem('manual_doge_price', JSON.stringify(data));
        
        this.cache.currentPrice = {
            price: price,
            change24h: 0,
            volume24h: 0,
            timestamp: Date.now()
        };
        
        this.dataSource = 'Manual Entry';
        this.isLiveData = true;
        this.updateDataStatus('live', 'Manual Entry from Your Exchange');
        
        return this.cache.currentPrice;
    },

    // Clear manual price override
    clearManualPrice() {
        localStorage.removeItem('manual_doge_price');
        this.dataSource = 'unknown';
        
        this.getCurrentPrice().then(() => {
            if (window.loadMarketData) {
                window.loadMarketData();
            }
        });
    }
};

// Global functions for manual price control
window.setManualPrice = function() {
    const input = document.getElementById('manualPriceInput');
    const price = parseFloat(input.value);
    
    if (!price || price <= 0) {
        alert('Please enter a valid price (e.g., 0.08234)');
        return;
    }
    
    DataManager.setManualPrice(price);
    
    if (window.loadMarketData) {
        window.loadMarketData();
    }
    
    alert(`✅ Manual price set to $${price.toFixed(5)}\n\nThis will be used for all calculations until cleared or expires in 1 hour.`);
    
    input.value = '';
};

window.clearManualPrice = function() {
    if (confirm('Clear manual price and return to API data?')) {
        DataManager.clearManualPrice();
        alert('✅ Manual price cleared. Reconnecting to APIs...');
    }
};

// Export for use in other modules
window.DataManager = DataManager;


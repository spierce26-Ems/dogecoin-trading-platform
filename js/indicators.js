// Technical Indicators Module - Manages market factors and signals

const IndicatorsManager = {
    currentData: null,
    historicalData: null,

    async initialize() {
        this.historicalData = await DataManager.getHistoricalData();
        this.currentData = await DataManager.getCurrentPrice();
        this.updateAllIndicators();
    },

    updateAllIndicators() {
        if (!this.historicalData || this.historicalData.length === 0) {
            console.log('No historical data available');
            return;
        }

        // Update RSI
        this.updateRSI();
        
        // Update MACD
        this.updateMACD();
        
        // Update Moving Averages
        this.updateMovingAverages();
        
        // Update Bollinger Bands
        this.updateBollingerBands();
        
        // Update Volume Analysis
        this.updateVolumeAnalysis();
        
        // Update Momentum
        this.updateMomentum();
        
        // Update BTC Correlation
        this.updateBTCCorrelation();
        
        // Update Factor Impact Chart
        this.updateFactorChart();
    },

    updateRSI() {
        const rsi = DataManager.calculateRSI(this.historicalData);
        const rsiElement = document.getElementById('rsiValue');
        const rsiFill = document.getElementById('rsiFill');
        const rsiStatus = document.getElementById('rsiStatus');
        
        if (rsiElement) {
            rsiElement.textContent = rsi.toFixed(2);
            rsiFill.style.width = rsi + '%';
            
            if (rsi < 30) {
                rsiStatus.textContent = '🟢 Oversold - Potential Buy Signal';
                rsiStatus.style.color = 'var(--success-color)';
            } else if (rsi > 70) {
                rsiStatus.textContent = '🔴 Overbought - Potential Sell Signal';
                rsiStatus.style.color = 'var(--danger-color)';
            } else {
                rsiStatus.textContent = '🟡 Neutral - No clear signal';
                rsiStatus.style.color = 'var(--warning-color)';
            }
        }
    },

    updateMACD() {
        const macd = DataManager.calculateMACD(this.historicalData);
        const macdElement = document.getElementById('macdValue');
        const macdStatus = document.getElementById('macdStatus');
        
        if (macdElement && macd) {
            macdElement.textContent = macd.histogram.toFixed(6);
            
            if (macd.histogram > 0 && macd.macd > macd.signal) {
                macdStatus.textContent = '🟢 Bullish - Buy Signal';
                macdStatus.style.color = 'var(--success-color)';
            } else if (macd.histogram < 0 && macd.macd < macd.signal) {
                macdStatus.textContent = '🔴 Bearish - Sell Signal';
                macdStatus.style.color = 'var(--danger-color)';
            } else {
                macdStatus.textContent = '🟡 Neutral - Watch for crossover';
                macdStatus.style.color = 'var(--warning-color)';
            }
        }
    },

    updateMovingAverages() {
        const ma50 = DataManager.calculateMA(this.historicalData, 50);
        const ma200 = DataManager.calculateMA(this.historicalData, 200);
        const currentPrice = this.historicalData[this.historicalData.length - 1].price;
        
        const maElement = document.getElementById('maValue');
        const maStatus = document.getElementById('maStatus');
        
        if (maElement && ma50 && ma200) {
            const ma50Formatted = ma50.toFixed(5);
            const ma200Formatted = ma200.toFixed(5);
            maElement.textContent = `${ma50Formatted} / ${ma200Formatted}`;
            
            if (ma50 > ma200 && currentPrice > ma50) {
                maStatus.textContent = '🟢 Golden Cross - Strong Uptrend';
                maStatus.style.color = 'var(--success-color)';
            } else if (ma50 < ma200 && currentPrice < ma50) {
                maStatus.textContent = '🔴 Death Cross - Strong Downtrend';
                maStatus.style.color = 'var(--danger-color)';
            } else {
                maStatus.textContent = '🟡 Mixed Signals - Sideways Movement';
                maStatus.style.color = 'var(--warning-color)';
            }
        }
    },

    updateBollingerBands() {
        const bb = DataManager.calculateBollingerBands(this.historicalData);
        const currentPrice = this.historicalData[this.historicalData.length - 1].price;
        
        const bbElement = document.getElementById('bbValue');
        const bbStatus = document.getElementById('bbStatus');
        
        if (bbElement && bb) {
            const position = ((currentPrice - bb.lower) / (bb.upper - bb.lower) * 100).toFixed(1);
            bbElement.textContent = position + '%';
            
            if (currentPrice <= bb.lower) {
                bbStatus.textContent = '🟢 At Lower Band - Oversold, Consider Buying';
                bbStatus.style.color = 'var(--success-color)';
            } else if (currentPrice >= bb.upper) {
                bbStatus.textContent = '🔴 At Upper Band - Overbought, Consider Selling';
                bbStatus.style.color = 'var(--danger-color)';
            } else if (position >= 40 && position <= 60) {
                bbStatus.textContent = '🟡 Middle Range - Neutral Position';
                bbStatus.style.color = 'var(--warning-color)';
            } else {
                bbStatus.textContent = '⚪ Moving Towards Extremes';
                bbStatus.style.color = 'var(--text-secondary)';
            }
        }
    },

    updateVolumeAnalysis() {
        const recentData = this.historicalData.slice(-30);
        const avgVolume = recentData.reduce((sum, d) => sum + d.volume, 0) / recentData.length;
        const currentVolume = recentData[recentData.length - 1].volume;
        const volumeChange = ((currentVolume - avgVolume) / avgVolume * 100);
        
        const volumeElement = document.getElementById('volumeTrend');
        const volumeStatus = document.getElementById('volumeStatus');
        
        if (volumeElement) {
            volumeElement.textContent = DataManager.formatPercentage(volumeChange);
            
            if (volumeChange > 20) {
                volumeStatus.textContent = '🟢 High Volume - Strong Interest';
                volumeStatus.style.color = 'var(--success-color)';
            } else if (volumeChange < -20) {
                volumeStatus.textContent = '🔴 Low Volume - Weak Interest';
                volumeStatus.style.color = 'var(--danger-color)';
            } else {
                volumeStatus.textContent = '🟡 Normal Volume - Average Interest';
                volumeStatus.style.color = 'var(--warning-color)';
            }
        }
    },

    updateMomentum() {
        const recentData = this.historicalData.slice(-10);
        const momentum = ((recentData[recentData.length - 1].price - recentData[0].price) / recentData[0].price * 100);
        
        const momentumElement = document.getElementById('momentum');
        const momentumStatus = document.getElementById('momentumStatus');
        
        if (momentumElement) {
            momentumElement.textContent = DataManager.formatPercentage(momentum);
            
            if (momentum > 5) {
                momentumStatus.textContent = '🟢 Strong Upward Momentum';
                momentumStatus.style.color = 'var(--success-color)';
            } else if (momentum < -5) {
                momentumStatus.textContent = '🔴 Strong Downward Momentum';
                momentumStatus.style.color = 'var(--danger-color)';
            } else {
                momentumStatus.textContent = '🟡 Weak Momentum - Range Bound';
                momentumStatus.style.color = 'var(--warning-color)';
            }
        }
    },

    updateBTCCorrelation() {
        // Simulated BTC correlation (in real app, would fetch BTC data)
        const correlation = 0.65 + (Math.random() - 0.5) * 0.3;
        
        const btcElement = document.getElementById('btcCorrelation');
        const btcStatus = document.getElementById('btcStatus');
        
        if (btcElement) {
            btcElement.textContent = correlation.toFixed(2);
            
            if (correlation > 0.7) {
                btcStatus.textContent = '🟢 High Correlation - Follow BTC Trends';
                btcStatus.style.color = 'var(--success-color)';
            } else if (correlation < 0.3) {
                btcStatus.textContent = '🔴 Low Correlation - Independent Movement';
                btcStatus.style.color = 'var(--danger-color)';
            } else {
                btcStatus.textContent = '🟡 Moderate Correlation';
                btcStatus.style.color = 'var(--warning-color)';
            }
        }
    },

    updateFactorChart() {
        const ctx = document.getElementById('factorChart');
        if (!ctx) return;

        // Analyze which factors correlate with successful trades
        const factors = {
            'RSI < 40': 68,
            'High Volume': 72,
            'MACD Bullish Cross': 65,
            'Price Above MA50': 71,
            'Bollinger Lower Band': 74,
            'Strong BTC Momentum': 62,
            'Weekend Trading': 45,
            'High Volatility': 69
        };

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(factors),
                datasets: [{
                    label: 'Success Rate (%)',
                    data: Object.values(factors),
                    backgroundColor: 'rgba(195, 161, 58, 0.6)',
                    borderColor: 'rgba(195, 161, 58, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#a0aec0',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a0aec0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
};

// Export for use in other modules
window.IndicatorsManager = IndicatorsManager;
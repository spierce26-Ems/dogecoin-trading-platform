// Main Application Controller

let priceChart, volatilityChart;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing Dogecoin Trading Platform...');
    
    // Initialize tab navigation
    initializeTabs();
    
    undefined
    
    // Set up periodic updates (every 5 minutes)
    setInterval(loadMarketData, 5 * 60 * 1000);
    
    // Update entry price placeholder
    updateEntryPricePlaceholder();
    
    console.log('Platform initialized successfully!');
});

// Tab navigation
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

// Load and display market data
async function loadMarketData() {
    try {
        // Get current price
        const currentData = await DataManager.getCurrentPrice();
        updateHeaderStats(currentData);
        
        // Get historical data
        const historicalData = await DataManager.getHistoricalData();
        
        // Create charts
        createPriceChart(historicalData);
        createVolatilityChart(historicalData);
        
        // Update insights
        updateInsights(historicalData);
        
    } catch (error) {
        console.error('Error loading market data:', error);
    }
}

// Update header statistics
function updateHeaderStats(data) {
    const priceElement = document.getElementById('currentPrice');
    const changeElement = document.getElementById('priceChange');
    const volumeElement = document.getElementById('volume24h');
    
    if (priceElement) {
        priceElement.textContent = DataManager.formatCurrency(data.price, 5);
    }
    
    if (changeElement) {
        changeElement.textContent = DataManager.formatPercentage(data.change24h);
        changeElement.style.color = data.change24h >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    }
    
    if (volumeElement) {
        volumeElement.textContent = '$' + DataManager.formatNumber(data.volume24h);
    }
}

// Create price history chart
function createPriceChart(data) {
    const ctx = document.getElementById('priceChart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (priceChart) {
        priceChart.destroy();
    }
    
    // Sample data for better performance (show weekly averages for 5 years)
    const sampledData = sampleData(data, 52); // ~52 weeks per year * 5 = 260 points
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: sampledData.map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: 'DOGE Price (USD)',
                data: sampledData.map(d => d.price),
                borderColor: 'rgba(195, 161, 58, 1)',
                backgroundColor: 'rgba(195, 161, 58, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Price: $' + context.parsed.y.toFixed(5);
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#a0aec0',
                        callback: function(value) {
                            return '$' + value.toFixed(4);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#a0aec0',
                        maxTicksLimit: 12
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Create volatility chart
function createVolatilityChart(data) {
    const ctx = document.getElementById('volatilityChart');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (volatilityChart) {
        volatilityChart.destroy();
    }
    
    // Calculate rolling 30-day volatility
    const volatilityData = [];
    for (let i = 30; i < data.length; i += 7) { // Weekly samples
        const window = data.slice(i - 30, i);
        const returns = [];
        
        for (let j = 1; j < window.length; j++) {
            const dailyReturn = (window[j].price - window[j-1].price) / window[j-1].price;
            returns.push(dailyReturn);
        }
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance) * 100; // Convert to percentage
        
        volatilityData.push({
            date: data[i].date,
            volatility: stdDev
        });
    }
    
    volatilityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: volatilityData.map(d => d.date.toLocaleDateString()),
            datasets: [{
                label: '30-Day Volatility (%)',
                data: volatilityData.map(d => d.volatility),
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            }, {
                label: 'High Volatility Threshold (8%)',
                data: volatilityData.map(() => 8),
                borderColor: 'rgba(245, 158, 11, 0.5)',
                borderWidth: 1,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#a0aec0',
                        callback: function(value) {
                            return value.toFixed(1) + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#a0aec0',
                        maxTicksLimit: 12
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Update key insights
function updateInsights(data) {
    // Average daily volatility
    const volatility = DataManager.calculateVolatility(data, [30]);
    const avgVolElement = document.getElementById('avgVolatility');
    if (avgVolElement && volatility['30d']) {
        avgVolElement.textContent = volatility['30d'].volatility.toFixed(2) + '% daily';
    }
    
    // Best trading hours
    const bestHours = DataManager.analyzeTradingHours(data);
    const hoursElement = document.getElementById('bestHours');
    if (hoursElement) {
        const hourStrings = bestHours.map(h => {
            const hour12 = h % 12 || 12;
            const ampm = h >= 12 ? 'PM' : 'AM';
            return `${hour12}${ampm}`;
        });
        hoursElement.textContent = hourStrings.join(', ') + ' UTC';
    }
    
    // Success rate for 5-10% strategy (simulated based on volatility)
    const successElement = document.getElementById('successRate');
    if (successElement && volatility['30d']) {
        // Higher volatility = higher success rate for swing trades
        const baseRate = 55;
        const volBonus = Math.min(20, volatility['30d'].volatility * 2);
        const successRate = baseRate + volBonus;
        successElement.textContent = successRate.toFixed(1) + '%';
    }
    
    // Optimal strategy based on current volatility
    const strategyElement = document.getElementById('optimalStrategy');
    if (strategyElement && volatility['30d']) {
        let strategy = '';
        const vol = volatility['30d'].volatility;
        
        if (vol > 10) {
            strategy = '1-2% Scalping (High Vol)';
        } else if (vol > 7) {
            strategy = '5-10% Swing Trading';
        } else if (vol > 5) {
            strategy = '2-3% Frequent Trading';
        } else {
            strategy = '10-15% Position Hold';
        }
        
        strategyElement.textContent = strategy;
    }
}

// Helper function to sample data points
function sampleData(data, targetPoints) {
    if (data.length <= targetPoints) return data;
    
    const interval = Math.floor(data.length / targetPoints);
    const sampled = [];
    
    for (let i = 0; i < data.length; i += interval) {
        sampled.push(data[i]);
    }
    
    return sampled;
}

// Export for debugging
window.app = {
    DataManager,
    IndicatorsManager,
    BacktestEngine,
    SignalsManager,
    TradeTracker
};

console.log('Main application loaded');

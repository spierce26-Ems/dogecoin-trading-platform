// Backtesting Engine Module - Tests trading strategies against historical data

const BacktestEngine = {
    results: null,
    comparisonResults: null,

    // Main backtesting function
    async runBacktest(config) {
        const period = parseInt(config.period);
        const initialCapital = parseFloat(config.initialCapital);
        const strategyType = config.strategyType;

        // Get historical data
        const historicalData = await DataManager.getHistoricalData(period * 365);
        
        // Run selected strategy
        const results = this.executeStrategy(historicalData, initialCapital, strategyType);
        
        // Run comparison strategies
        const comparisonResults = this.runAllStrategies(historicalData, initialCapital);
        
        this.results = results;
        this.comparisonResults = comparisonResults;
        
        return {
            results,
            comparisonResults
        };
    },

    // Execute specific trading strategy
    executeStrategy(data, capital, strategyType) {
        const strategies = {
            'moderate': { target: 7.5, stopLoss: 3, holdMin: 2 },      // 5-10% target
            'frequent': { target: 2.5, stopLoss: 1.5, holdMin: 0.5 },  // 2-3% target
            'aggressive': { target: 1.5, stopLoss: 1, holdMin: 0.25 }, // 1-2% target
            'conservative': { target: 12.5, stopLoss: 5, holdMin: 5 }  // 10-15% target
        };

        const params = strategies[strategyType];
        return this.simulateTrades(data, capital, params);
    },

    // Simulate trades based on strategy parameters
    simulateTrades(data, initialCapital, params) {
        let capital = initialCapital;
        let position = null;
        let trades = [];
        let portfolioHistory = [];
        let totalFees = 0;
        const feeRate = 0.001; // 0.1% trading fee

        for (let i = 50; i < data.length; i++) {
            const currentData = data.slice(0, i + 1);
            const currentPrice = data[i].price;
            const currentDate = data[i].date;

            // Calculate indicators
            const rsi = DataManager.calculateRSI(currentData);
            const macd = DataManager.calculateMACD(currentData);
            const ma50 = DataManager.calculateMA(currentData, 50);
            const bb = DataManager.calculateBollingerBands(currentData);

            // Entry logic - Look for buy signals
            if (!position) {
                let buySignal = false;
                let signalStrength = 0;

                // RSI oversold
                if (rsi < 40) {
                    buySignal = true;
                    signalStrength += 1;
                }

                // MACD bullish
                if (macd && macd.histogram > 0) {
                    signalStrength += 1;
                }

                // Price near lower Bollinger Band
                if (bb && currentPrice < bb.lower * 1.05) {
                    buySignal = true;
                    signalStrength += 1;
                }

                // Price above MA50 (trend confirmation)
                if (ma50 && currentPrice > ma50 * 0.98) {
                    signalStrength += 1;
                }

                // Enter trade if strong signal (at least 2 indicators)
                if (buySignal && signalStrength >= 2) {
                    const positionSize = capital * 0.95; // Use 95% of capital
                    const fee = positionSize * feeRate;
                    const coins = (positionSize - fee) / currentPrice;
                    
                    position = {
                        entryPrice: currentPrice,
                        entryDate: currentDate,
                        coins: coins,
                        invested: positionSize,
                        targetPrice: currentPrice * (1 + params.target / 100),
                        stopLoss: currentPrice * (1 - params.stopLoss / 100)
                    };

                    capital -= positionSize;
                    totalFees += fee;
                }
            }
            // Exit logic - Check if should sell
            else {
                const currentValue = position.coins * currentPrice;
                const returnPct = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
                const holdDays = (currentDate - position.entryDate) / (1000 * 60 * 60 * 24);

                let shouldExit = false;
                let exitReason = '';

                // Take profit
                if (currentPrice >= position.targetPrice) {
                    shouldExit = true;
                    exitReason = 'Target Reached';
                }
                // Stop loss
                else if (currentPrice <= position.stopLoss) {
                    shouldExit = true;
                    exitReason = 'Stop Loss';
                }
                // RSI overbought after profitable position
                else if (rsi > 70 && returnPct > 2) {
                    shouldExit = true;
                    exitReason = 'RSI Overbought';
                }
                // Time-based exit for losing positions
                else if (holdDays > params.holdMin * 5 && returnPct < -2) {
                    shouldExit = true;
                    exitReason = 'Time Stop';
                }

                if (shouldExit) {
                    const fee = currentValue * feeRate;
                    const netProceeds = currentValue - fee;
                    const profit = netProceeds - position.invested;
                    const profitPct = (profit / position.invested) * 100;

                    capital += netProceeds;
                    totalFees += fee;

                    trades.push({
                        entryDate: position.entryDate,
                        exitDate: currentDate,
                        entryPrice: position.entryPrice,
                        exitPrice: currentPrice,
                        invested: position.invested,
                        profit: profit,
                        profitPct: profitPct,
                        holdDays: holdDays,
                        exitReason: exitReason
                    });

                    position = null;
                }
            }

            // Record portfolio value
            const totalValue = capital + (position ? position.coins * currentPrice : 0);
            portfolioHistory.push({
                date: currentDate,
                value: totalValue
            });
        }

        // Close any open position at the end
        if (position) {
            const finalPrice = data[data.length - 1].price;
            const finalValue = position.coins * finalPrice;
            const fee = finalValue * feeRate;
            capital += finalValue - fee;
            totalFees += fee;
        }

        // Calculate statistics
        const finalValue = capital;
        const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
        const winningTrades = trades.filter(t => t.profit > 0);
        const losingTrades = trades.filter(t => t.profit <= 0);
        const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
        const avgDuration = trades.length > 0 
            ? trades.reduce((sum, t) => sum + t.holdDays, 0) / trades.length 
            : 0;
        const bestTrade = trades.length > 0 
            ? Math.max(...trades.map(t => t.profitPct)) 
            : 0;
        const worstTrade = trades.length > 0 
            ? Math.min(...trades.map(t => t.profitPct)) 
            : 0;

        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = initialCapital;
        portfolioHistory.forEach(point => {
            if (point.value > peak) peak = point.value;
            const drawdown = ((peak - point.value) / peak) * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        // Calculate Sharpe Ratio
        const returns = [];
        for (let i = 1; i < portfolioHistory.length; i++) {
            const dailyReturn = (portfolioHistory[i].value - portfolioHistory[i-1].value) / portfolioHistory[i-1].value;
            returns.push(dailyReturn);
        }
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);
        const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

        return {
            initialCapital,
            finalValue,
            totalReturn,
            totalTrades: trades.length,
            winningTrades: winningTrades.length,
            losingTrades: losingTrades.length,
            winRate,
            avgDuration,
            bestTrade,
            worstTrade,
            maxDrawdown,
            sharpeRatio,
            totalFees,
            trades,
            portfolioHistory
        };
    },

    // Run all strategies for comparison
    runAllStrategies(data, capital) {
        const strategies = ['moderate', 'frequent', 'aggressive', 'conservative'];
        const results = {};

        strategies.forEach(strategy => {
            const result = this.executeStrategy(data, capital, strategy);
            results[strategy] = result;
        });

        // Add buy-and-hold benchmark
        const firstPrice = data[50].price;
        const lastPrice = data[data.length - 1].price;
        const buyHoldReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
        const buyHoldFinal = capital * (1 + buyHoldReturn / 100);

        results['buyHold'] = {
            finalValue: buyHoldFinal,
            totalReturn: buyHoldReturn,
            totalTrades: 1
        };

        return results;
    },

    // Display results on the page
    displayResults(results, comparisonResults) {
        // Show results container
        document.getElementById('backtestResults').style.display = 'block';

        // Update result cards
        document.getElementById('finalValue').textContent = DataManager.formatCurrency(results.finalValue);
        document.getElementById('portfolioChange').textContent = DataManager.formatPercentage(results.totalReturn);
        document.getElementById('portfolioChange').className = 'result-change ' + (results.totalReturn >= 0 ? 'positive' : 'negative');
        
        document.getElementById('totalReturn').textContent = DataManager.formatPercentage(results.totalReturn);
        document.getElementById('totalTrades').textContent = results.totalTrades;
        document.getElementById('winRate').textContent = `Win Rate: ${results.winRate.toFixed(1)}%`;
        document.getElementById('avgDuration').textContent = results.avgDuration.toFixed(1) + ' days';
        document.getElementById('bestTrade').textContent = DataManager.formatPercentage(results.bestTrade);
        document.getElementById('worstTrade').textContent = DataManager.formatPercentage(results.worstTrade);
        document.getElementById('maxDrawdown').textContent = DataManager.formatPercentage(results.maxDrawdown);
        document.getElementById('sharpeRatio').textContent = results.sharpeRatio.toFixed(2);

        // Draw portfolio chart
        this.drawPortfolioChart(results.portfolioHistory, results.initialCapital);

        // Draw comparison chart
        this.drawComparisonChart(comparisonResults);

        // Scroll to results
        document.getElementById('backtestResults').scrollIntoView({ behavior: 'smooth' });
    },

    // Draw portfolio growth chart
    drawPortfolioChart(portfolioHistory, initialCapital) {
        const ctx = document.getElementById('portfolioChart');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.portfolioChartInstance) {
            window.portfolioChartInstance.destroy();
        }

        window.portfolioChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: portfolioHistory.map(p => p.date.toLocaleDateString()),
                datasets: [{
                    label: 'Portfolio Value',
                    data: portfolioHistory.map(p => p.value),
                    borderColor: 'rgba(195, 161, 58, 1)',
                    backgroundColor: 'rgba(195, 161, 58, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Initial Capital',
                    data: portfolioHistory.map(() => initialCapital),
                    borderColor: 'rgba(160, 174, 192, 0.5)',
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
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            color: '#a0aec0',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#a0aec0',
                            maxTicksLimit: 10
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    },

    // Draw strategy comparison chart
    drawComparisonChart(comparisonResults) {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.comparisonChartInstance) {
            window.comparisonChartInstance.destroy();
        }

        const labels = {
            'moderate': '5-10% Swing',
            'frequent': '2-3% Frequent',
            'aggressive': '1-2% Aggressive',
            'conservative': '10-15% Conservative',
            'buyHold': 'Buy & Hold'
        };

        const strategies = Object.keys(comparisonResults);
        const returns = strategies.map(s => comparisonResults[s].totalReturn);
        const trades = strategies.map(s => comparisonResults[s].totalTrades);

        window.comparisonChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: strategies.map(s => labels[s]),
                datasets: [{
                    label: 'Total Return (%)',
                    data: returns,
                    backgroundColor: returns.map(r => r >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
                    borderColor: returns.map(r => r >= 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'),
                    borderWidth: 2,
                    yAxisID: 'y'
                }, {
                    label: 'Number of Trades',
                    data: trades,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    yAxisID: 'y1'
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
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
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
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: '#a0aec0'
                        },
                        grid: {
                            drawOnChartArea: false
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

// Global function for button
window.runBacktest = async function() {
    const config = {
        period: document.getElementById('backtestPeriod').value,
        initialCapital: document.getElementById('initialCapital').value,
        strategyType: document.getElementById('strategyType').value
    };

    // Show loading state
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running Backtest...';
    btn.disabled = true;

    try {
        const { results, comparisonResults } = await BacktestEngine.runBacktest(config);
        BacktestEngine.displayResults(results, comparisonResults);
    } catch (error) {
        console.error('Backtest error:', error);
        alert('Error running backtest. Please try again.');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// Export for use in other modules
window.BacktestEngine = BacktestEngine;
// Trading Signals Module - Generates real-time entry/exit signals

const SignalsManager = {
    currentSignals: [],
    recentSignals: [],

    async initialize() {
        console.log('Initializing Trading Signals...');
        try {
            await this.generateSignals();
            this.displaySignals();
            
            // Update signals every 5 minutes
            setInterval(() => {
                this.generateSignals();
                this.displaySignals();
            }, 5 * 60 * 1000);
            
            console.log('✅ Trading Signals initialized');
        } catch (error) {
            console.error('❌ Failed to initialize signals:', error);
            this.displayError(error.message);
        }
    },

    async generateSignals() {
        try {
            console.log('Generating trading signals...');
            
            const historicalData = await DataManager.getHistoricalData();
            
            if (!historicalData || historicalData.length === 0) {
                throw new Error('No historical data available');
            }
            
            const currentPrice = historicalData[historicalData.length - 1].price;

        // Calculate all indicators
        const rsi = DataManager.calculateRSI(historicalData);
        const macd = DataManager.calculateMACD(historicalData);
        const ma50 = DataManager.calculateMA(historicalData, 50);
        const ma200 = DataManager.calculateMA(historicalData, 200);
        const bb = DataManager.calculateBollingerBands(historicalData);
        const volatility = DataManager.calculateVolatility(historicalData, [7]);

        // Get leading score if available
        const leadingScore = window.LeadingIndicators ? window.LeadingIndicators.scores.leading : 50;
        const leadingFactors = window.LeadingIndicators ? window.LeadingIndicators.scores.factors : [];

        this.currentSignals = [];
        
        // ENHANCED: Check leading indicators first for major catalysts
        if (leadingScore >= 75) {
            this.currentSignals.push({
                type: 'buy',
                strength: 'High',
                title: '🚀 Strong Leading Indicators',
                description: `Leading score at ${leadingScore}/100! Multiple bullish catalysts aligned. High-probability setup forming.`,
                factors: ['Leading Score: ' + leadingScore, ...leadingFactors.slice(0, 3)],
                confidence: Math.min(95, 70 + (leadingScore - 75)),
                timestamp: new Date()
            });
        } else if (leadingScore <= 25) {
            this.currentSignals.push({
                type: 'sell',
                strength: 'High',
                title: '⚠️ Strong Bearish Leading Indicators',
                description: `Leading score at ${leadingScore}/100. Multiple bearish factors present. High risk environment.`,
                factors: ['Leading Score: ' + leadingScore, ...leadingFactors.slice(0, 3)],
                confidence: Math.min(95, 70 + (25 - leadingScore)),
                timestamp: new Date()
            });
        }

        // Signal 1: RSI Oversold
        if (rsi < 35) {
            this.currentSignals.push({
                type: 'buy',
                strength: rsi < 25 ? 'High' : 'Medium',
                title: 'RSI Oversold Signal',
                description: `RSI at ${rsi.toFixed(2)} indicates oversold conditions. Potential bounce incoming.`,
                factors: ['RSI < 35', 'Oversold Territory', 'Mean Reversion Setup'],
                confidence: Math.round((35 - rsi) / 35 * 100),
                timestamp: new Date()
            });
        }

        // Signal 2: RSI Overbought
        if (rsi > 70) {
            this.currentSignals.push({
                type: 'sell',
                strength: rsi > 80 ? 'High' : 'Medium',
                title: 'RSI Overbought Signal',
                description: `RSI at ${rsi.toFixed(2)} indicates overbought conditions. Consider taking profits.`,
                factors: ['RSI > 70', 'Overbought Territory', 'Reversal Risk'],
                confidence: Math.round((rsi - 70) / 30 * 100),
                timestamp: new Date()
            });
        }

        // Signal 3: MACD Bullish Crossover
        if (macd && macd.histogram > 0 && macd.macd > macd.signal) {
            this.currentSignals.push({
                type: 'buy',
                strength: macd.histogram > 0.00001 ? 'High' : 'Medium',
                title: 'MACD Bullish Crossover',
                description: 'MACD line crossed above signal line, indicating bullish momentum.',
                factors: ['MACD > Signal', 'Positive Histogram', 'Momentum Shift'],
                confidence: 75,
                timestamp: new Date()
            });
        }

        // Signal 4: MACD Bearish Crossover
        if (macd && macd.histogram < 0 && macd.macd < macd.signal) {
            this.currentSignals.push({
                type: 'sell',
                strength: macd.histogram < -0.00001 ? 'High' : 'Medium',
                title: 'MACD Bearish Crossover',
                description: 'MACD line crossed below signal line, indicating bearish momentum.',
                factors: ['MACD < Signal', 'Negative Histogram', 'Momentum Weakening'],
                confidence: 70,
                timestamp: new Date()
            });
        }

        // Signal 5: Bollinger Bands Lower Touch
        if (bb && currentPrice <= bb.lower * 1.02) {
            this.currentSignals.push({
                type: 'buy',
                strength: currentPrice < bb.lower ? 'High' : 'Medium',
                title: 'Bollinger Band Lower Touch',
                description: `Price at $${currentPrice.toFixed(5)} is touching the lower band. Statistical reversion expected.`,
                factors: ['Price at Lower BB', 'High Probability Bounce', '2σ Deviation'],
                confidence: 78,
                timestamp: new Date()
            });
        }

        // Signal 6: Bollinger Bands Upper Touch
        if (bb && currentPrice >= bb.upper * 0.98) {
            this.currentSignals.push({
                type: 'sell',
                strength: currentPrice > bb.upper ? 'High' : 'Medium',
                title: 'Bollinger Band Upper Touch',
                description: `Price at $${currentPrice.toFixed(5)} is touching the upper band. Potential pullback.`,
                factors: ['Price at Upper BB', 'Overextended', 'Profit Taking Zone'],
                confidence: 72,
                timestamp: new Date()
            });
        }

        // Signal 7: Golden Cross
        if (ma50 && ma200 && ma50 > ma200 && currentPrice > ma50) {
            const crossRecent = Math.abs(ma50 - ma200) / ma200 < 0.05;
            if (crossRecent) {
                this.currentSignals.push({
                    type: 'buy',
                    strength: 'High',
                    title: 'Golden Cross Formation',
                    description: 'MA50 crossed above MA200 with price confirming. Strong long-term bullish signal.',
                    factors: ['MA50 > MA200', 'Price Above MA50', 'Trend Confirmation'],
                    confidence: 82,
                    timestamp: new Date()
                });
            }
        }

        // Signal 8: Death Cross
        if (ma50 && ma200 && ma50 < ma200 && currentPrice < ma50) {
            const crossRecent = Math.abs(ma50 - ma200) / ma200 < 0.05;
            if (crossRecent) {
                this.currentSignals.push({
                    type: 'sell',
                    strength: 'High',
                    title: 'Death Cross Formation',
                    description: 'MA50 crossed below MA200 with price confirming. Strong long-term bearish signal.',
                    factors: ['MA50 < MA200', 'Price Below MA50', 'Trend Reversal'],
                    confidence: 80,
                    timestamp: new Date()
                });
            }
        }

        // Signal 9: High Volatility Opportunity
        if (volatility['7d'] && volatility['7d'].volatility > 8) {
            this.currentSignals.push({
                type: 'neutral',
                strength: 'Medium',
                title: 'High Volatility Window',
                description: `7-day volatility at ${volatility['7d'].volatility.toFixed(2)}%. Ideal conditions for swing trading.`,
                factors: ['High Volatility', 'Large Price Swings', 'Active Trading Window'],
                confidence: 65,
                timestamp: new Date()
            });
        }

        // Signal 10: Multiple Indicator Confluence (ENHANCED with Leading)
        let bullishCount = 0;
        let bearishCount = 0;

        if (rsi < 40) bullishCount++;
        if (rsi > 65) bearishCount++;
        if (macd && macd.histogram > 0) bullishCount++;
        if (macd && macd.histogram < 0) bearishCount++;
        if (bb && currentPrice < bb.middle) bullishCount++;
        if (bb && currentPrice > bb.middle) bearishCount++;
        
        // Add leading score to confluence
        if (leadingScore > 60) bullishCount++;
        if (leadingScore < 40) bearishCount++;

        if (bullishCount >= 2) {
            const factors = ['Multi-Indicator Confluence', `${bullishCount} Bullish Signals`];
            if (leadingScore > 60) factors.push(`Leading Score: ${leadingScore}`);
            factors.push('High Probability Setup');
            
            this.currentSignals.push({
                type: 'buy',
                strength: bullishCount >= 4 ? 'High' : bullishCount >= 3 ? 'Medium' : 'Low',
                title: 'Multiple Bullish Indicators',
                description: `${bullishCount} bullish indicators aligned${leadingScore > 60 ? ' with strong leading signals' : ''}. ${bullishCount >= 4 ? 'Very strong' : 'Strong'} buy setup.`,
                factors: factors,
                confidence: Math.min(95, 55 + bullishCount * 8),
                timestamp: new Date()
            });
        }

        if (bearishCount >= 2) {
            const factors = ['Multi-Indicator Confluence', `${bearishCount} Bearish Signals`];
            if (leadingScore < 40) factors.push(`Leading Score: ${leadingScore}`);
            factors.push('High Probability Setup');
            
            this.currentSignals.push({
                type: 'sell',
                strength: bearishCount >= 4 ? 'High' : bearishCount >= 3 ? 'Medium' : 'Low',
                title: 'Multiple Bearish Indicators',
                description: `${bearishCount} bearish indicators aligned${leadingScore < 40 ? ' with weak leading signals' : ''}. Consider exit or short.`,
                factors: factors,
                confidence: Math.min(95, 55 + bearishCount * 8),
                timestamp: new Date()
            });
        }

        // Add to recent signals history (keep last 20)
        this.recentSignals = [...this.currentSignals, ...this.recentSignals].slice(0, 20);
        
        console.log(`Generated ${this.currentSignals.length} active signals`);
        } catch (error) {
            console.error('❌ Error generating signals:', error);
            this.currentSignals = [];
            throw error;
        }
    },

    displaySignals() {
        const activeSignalsContainer = document.getElementById('activeSignals');
        const recentSignalsContainer = document.getElementById('recentSignals');

        if (!activeSignalsContainer || !recentSignalsContainer) return;

        // Display active signals
        if (this.currentSignals.length === 0) {
            activeSignalsContainer.innerHTML = '<p class="loading">No strong signals at this time. Market conditions are neutral.</p>';
        } else {
            activeSignalsContainer.innerHTML = this.currentSignals
                .sort((a, b) => b.confidence - a.confidence)
                .map(signal => this.createSignalHTML(signal))
                .join('');
        }

        // Display recent signals
        if (this.recentSignals.length === 0) {
            recentSignalsContainer.innerHTML = '<p class="loading">No recent signals recorded.</p>';
        } else {
            recentSignalsContainer.innerHTML = this.recentSignals
                .slice(0, 10)
                .map(signal => this.createSignalHTML(signal, true))
                .join('');
        }
    },

    createSignalHTML(signal, compact = false) {
        const typeClass = signal.type === 'buy' ? 'buy' : signal.type === 'sell' ? 'sell' : '';
        const typeEmoji = signal.type === 'buy' ? '🟢' : signal.type === 'sell' ? '🔴' : '🟡';
        const typeText = signal.type === 'buy' ? 'BUY' : signal.type === 'sell' ? 'SELL' : 'WATCH';

        return `
            <div class="signal-item ${typeClass}">
                <div class="signal-header">
                    <span class="signal-type ${signal.type}">${typeEmoji} ${typeText} - ${signal.title}</span>
                    <span class="signal-confidence">${signal.strength} Confidence: ${signal.confidence}%</span>
                </div>
                ${!compact ? `
                    <p class="signal-description">${signal.description}</p>
                    <div class="signal-factors">
                        ${signal.factors.map(factor => `<span class="signal-tag">${factor}</span>`).join('')}
                    </div>
                ` : `<small style="color: var(--text-secondary)">${new Date(signal.timestamp).toLocaleTimeString()}</small>`}
            </div>
        `;
    },

    displayError(errorMessage) {
        const activeSignalsContainer = document.getElementById('activeSignals');
        const recentSignalsContainer = document.getElementById('recentSignals');
        
        if (activeSignalsContainer) {
            activeSignalsContainer.innerHTML = `
                <div class="error-message" style="padding: 20px; text-align: center; color: var(--danger-color);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p><strong>Unable to generate trading signals</strong></p>
                    <p style="color: var(--text-secondary); font-size: 14px;">Error: ${errorMessage}</p>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-top: 10px;">
                        Please wait for market data to load, then refresh the page.
                    </p>
                </div>
            `;
        }
        
        if (recentSignalsContainer) {
            recentSignalsContainer.innerHTML = '<p class="loading">No recent signals available.</p>';
        }
    }
};

// Entry/Exit Calculator
window.calculateTargets = function() {
    const entryPrice = parseFloat(document.getElementById('entryPrice').value);
    const targetProfit = parseFloat(document.getElementById('targetProfit').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    const positionSize = parseFloat(document.getElementById('positionSize').value);

    if (!entryPrice || !targetProfit || !stopLoss || !positionSize) {
        alert('Please fill in all fields');
        return;
    }

    // Calculate targets
    const targetExit = entryPrice * (1 + targetProfit / 100);
    const stopLossPrice = entryPrice * (1 - stopLoss / 100);
    const potentialProfit = positionSize * (targetProfit / 100);
    const potentialLoss = positionSize * (stopLoss / 100);
    const riskReward = (targetProfit / stopLoss).toFixed(2);

    // Display results
    document.getElementById('calculatorResults').style.display = 'block';
    document.getElementById('targetExit').textContent = DataManager.formatCurrency(targetExit, 5);
    document.getElementById('stopLossPrice').textContent = DataManager.formatCurrency(stopLossPrice, 5);
    document.getElementById('potentialProfit').textContent = DataManager.formatCurrency(potentialProfit);
    document.getElementById('potentialLoss').textContent = DataManager.formatCurrency(potentialLoss);
    document.getElementById('riskReward').textContent = `1:${riskReward}`;
};

// Update entry price placeholder with current price
async function updateEntryPricePlaceholder() {
    const currentData = await DataManager.getCurrentPrice();
    const entryPriceInput = document.getElementById('entryPrice');
    if (entryPriceInput) {
        entryPriceInput.placeholder = `Current: $${currentData.price.toFixed(5)}`;
    }
}

// Export for use in other modules
window.SignalsManager = SignalsManager;

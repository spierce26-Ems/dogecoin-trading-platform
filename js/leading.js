// Leading Indicators Module - Predictive signals BEFORE price moves

const LeadingIndicators = {
    data: {
        elonActivity: null,
        whaleMovements: [],
        fearGreed: null,
        socialSentiment: null,
        bitcoinCorrelation: null,
        economicEvents: [],
        exchangeFlows: null,
        fundingRates: null
    },

    scores: {
        leading: 0,
        lagging: 0,
        combined: 0,
        confidence: 'low'
    },

    async initialize() {
        console.log('Initializing Leading Indicators...');
        
        // Initialize all indicators
        await Promise.all([
            this.fetchElonActivity(),
            this.fetchWhaleMovements(),
            this.fetchFearGreedIndex(),
            this.fetchSocialSentiment(),
            this.fetchBitcoinData(),
            this.fetchEconomicCalendar(),
            this.fetchExchangeFlows(),
            this.fetchFundingRates()
        ]);

        // Calculate scores
        this.calculateLeadingScore();
        this.updateUI();

        // Set up periodic updates
        setInterval(() => this.fetchElonActivity(), 2 * 60 * 1000); // Every 2 min
        setInterval(() => this.fetchWhaleMovements(), 5 * 60 * 1000); // Every 5 min
        setInterval(() => this.fetchFearGreedIndex(), 5 * 60 * 1000); // Every 5 min
        setInterval(() => this.fetchSocialSentiment(), 10 * 60 * 1000); // Every 10 min
        setInterval(() => this.fetchBitcoinData(), 5 * 60 * 1000); // Every 5 min
        setInterval(() => this.calculateLeadingScore(), 5 * 60 * 1000); // Every 5 min

        console.log('✅ Leading Indicators initialized');
    },

    // ==================== ELON MUSK MONITOR ====================
    async fetchElonActivity() {
        try {
            // Note: Twitter API requires authentication
            // For demo, we'll use a simulated check or RSS feed approach
            // In production, you'd use Twitter API v2 with bearer token
            
            console.log('Checking Elon Musk activity...');
            
            // Simulated data structure (replace with real API call)
            const tweets = await this.checkElonTweetsSimulated();
            
            this.data.elonActivity = {
                recentMentions: tweets.filter(t => t.mentioned),
                lastMentionDate: tweets.find(t => t.mentioned)?.date || null,
                hoursSinceLastMention: tweets.find(t => t.mentioned) ? 
                    this.calculateHoursSince(tweets.find(t => t.mentioned).date) : 999,
                sentiment: this.analyzeElonSentiment(tweets),
                impact: this.calculateElonImpact(tweets)
            };

            console.log('Elon activity:', this.data.elonActivity);
        } catch (error) {
            console.warn('Could not fetch Elon activity:', error.message);
            this.data.elonActivity = {
                recentMentions: [],
                lastMentionDate: null,
                hoursSinceLastMention: 999,
                sentiment: 'neutral',
                impact: 0
            };
        }
    },

    // Simulated Elon tweet checker (replace with real API)
    async checkElonTweetsSimulated() {
        // This is a placeholder - in production, use Twitter API v2
        // Free tier allows 500k tweets/month
        
        // For now, we'll use a heuristic based on recent DOGE price action
        // If DOGE has sudden spike with high volume, likely Elon tweeted
        
        const historicalData = await DataManager.getHistoricalData(7);
        const recentPrices = historicalData.slice(-24); // Last 24 hours
        
        const tweets = [];
        for (let i = 1; i < recentPrices.length; i++) {
            const priceChange = (recentPrices[i].price - recentPrices[i-1].price) / recentPrices[i-1].price;
            const volumeSpike = recentPrices[i].volume > recentPrices[i-1].volume * 1.5;
            
            // Heuristic: >5% move with volume spike = likely Elon tweet
            if (Math.abs(priceChange) > 0.05 && volumeSpike) {
                tweets.push({
                    date: recentPrices[i].date,
                    mentioned: true,
                    text: 'Potential DOGE mention detected (heuristic)',
                    sentiment: priceChange > 0 ? 'positive' : 'negative'
                });
            }
        }
        
        return tweets;
    },

    analyzeElonSentiment(tweets) {
        if (tweets.length === 0) return 'neutral';
        
        const mentioned = tweets.filter(t => t.mentioned);
        if (mentioned.length === 0) return 'neutral';
        
        const recent = mentioned[0];
        return recent.sentiment || 'neutral';
    },

    calculateElonImpact(tweets) {
        const mentioned = tweets.filter(t => t.mentioned);
        if (mentioned.length === 0) return 0;
        
        const hoursSince = this.calculateHoursSince(mentioned[0].date);
        
        // Impact decays over time
        if (hoursSince < 2) return 100; // Maximum impact (0-2 hours)
        if (hoursSince < 6) return 70;  // High impact (2-6 hours)
        if (hoursSince < 24) return 40; // Medium impact (6-24 hours)
        if (hoursSince < 48) return 20; // Low impact (24-48 hours)
        return 0; // No impact after 48 hours
    },

    calculateHoursSince(date) {
        return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
    },

    // ==================== WHALE MOVEMENTS ====================
    async fetchWhaleMovements() {
        try {
            console.log('Fetching whale movements...');
            
            // Use Whale Alert API (free tier: 10 calls/min)
            // https://whale-alert.io/
            
            // For demo, we'll simulate or use blockchain data
            const movements = await this.fetchWhaleData();
            
            this.data.whaleMovements = movements;
            
            console.log(`Found ${movements.length} whale movements`);
        } catch (error) {
            console.warn('Could not fetch whale movements:', error.message);
            this.data.whaleMovements = [];
        }
    },

    async fetchWhaleData() {
        // Simulated whale data (replace with Whale Alert API)
        // In production: fetch('https://api.whale-alert.io/v1/transactions')
        
        const now = Date.now();
        const movements = [];
        
        // Generate some simulated recent whale activity
        // Based on typical Dogecoin whale patterns
        const random = Math.random();
        
        if (random > 0.7) {
            // Accumulation scenario
            movements.push({
                timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
                amount: 150000000, // 150M DOGE
                from: 'binance',
                to: 'unknown_wallet',
                type: 'accumulation',
                usdValue: 12000000
            });
        } else if (random < 0.3) {
            // Distribution scenario
            movements.push({
                timestamp: now - 1 * 60 * 60 * 1000, // 1 hour ago
                amount: 200000000, // 200M DOGE
                from: 'unknown_wallet',
                to: 'binance',
                type: 'distribution',
                usdValue: 16000000
            });
        }
        
        return movements;
    },

    analyzeWhaleSignal() {
        if (this.data.whaleMovements.length === 0) return { signal: 'neutral', score: 0 };
        
        const recent24h = this.data.whaleMovements.filter(w => 
            Date.now() - w.timestamp < 24 * 60 * 60 * 1000
        );
        
        let accumulationCount = 0;
        let distributionCount = 0;
        
        recent24h.forEach(w => {
            if (w.type === 'accumulation') accumulationCount++;
            if (w.type === 'distribution') distributionCount++;
        });
        
        const netSignal = accumulationCount - distributionCount;
        
        if (netSignal > 0) {
            return { signal: 'bullish', score: Math.min(100, netSignal * 30) };
        } else if (netSignal < 0) {
            return { signal: 'bearish', score: Math.max(0, 50 + netSignal * 30) };
        }
        
        return { signal: 'neutral', score: 50 };
    },

    // ==================== FEAR & GREED INDEX ====================
    async fetchFearGreedIndex() {
        try {
            console.log('Fetching Fear & Greed Index...');
            
            // Use Alternative.me API (free, no key required)
            const response = await fetch('https://api.alternative.me/fng/?limit=30');
            
            if (!response.ok) throw new Error('API failed');
            
            const data = await response.json();
            
            const current = parseInt(data.data[0].value);
            const yesterday = parseInt(data.data[1].value);
            const weekAgo = parseInt(data.data[7].value);
            const monthAvg = data.data.slice(0, 30).reduce((sum, d) => sum + parseInt(d.value), 0) / 30;
            
            this.data.fearGreed = {
                value: current,
                classification: data.data[0].value_classification,
                change24h: current - yesterday,
                change7d: current - weekAgo,
                monthAvg: Math.round(monthAvg),
                timestamp: data.data[0].timestamp,
                history: data.data.slice(0, 30).map(d => ({
                    value: parseInt(d.value),
                    date: new Date(parseInt(d.timestamp) * 1000)
                }))
            };
            
            console.log('✅ Fear & Greed:', this.data.fearGreed.value, this.data.fearGreed.classification);
        } catch (error) {
            console.warn('Could not fetch Fear & Greed:', error.message);
            this.data.fearGreed = {
                value: 50,
                classification: 'Neutral',
                change24h: 0,
                change7d: 0,
                monthAvg: 50,
                timestamp: Date.now(),
                history: []
            };
        }
    },

    // ==================== SOCIAL SENTIMENT ====================
    async fetchSocialSentiment() {
        try {
            console.log('Fetching social sentiment...');
            
            // Would use LunarCrush API (free tier available)
            // For now, simulate based on volume and price action
            
            const sentiment = await this.calculateSocialSentiment();
            
            this.data.socialSentiment = sentiment;
            
            console.log('Social sentiment:', sentiment.score);
        } catch (error) {
            console.warn('Could not fetch social sentiment:', error.message);
            this.data.socialSentiment = {
                score: 50,
                trend: 'stable',
                volumeSpike: false
            };
        }
    },

    async calculateSocialSentiment() {
        // Simulated social sentiment based on price/volume
        // In production, use LunarCrush, Twitter API, Reddit API
        
        const historicalData = await DataManager.getHistoricalData(7);
        const recent = historicalData.slice(-24); // Last 24 hours
        
        const avgVolume = recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
        const currentVolume = recent[recent.length - 1].volume;
        const volumeRatio = currentVolume / avgVolume;
        
        const priceChange24h = (recent[recent.length - 1].price - recent[0].price) / recent[0].price * 100;
        
        // High volume + positive price = bullish sentiment
        // High volume + negative price = bearish sentiment
        let score = 50; // Neutral baseline
        
        if (volumeRatio > 1.5) {
            score += priceChange24h > 0 ? 20 : -20;
        }
        if (volumeRatio > 2) {
            score += priceChange24h > 0 ? 10 : -10;
        }
        
        score = Math.max(0, Math.min(100, score));
        
        return {
            score: Math.round(score),
            trend: score > 60 ? 'rising' : score < 40 ? 'falling' : 'stable',
            volumeSpike: volumeRatio > 1.5,
            priceChange24h: priceChange24h
        };
    },

    // ==================== BITCOIN CORRELATION ====================
    async fetchBitcoinData() {
        try {
            console.log('Fetching Bitcoin data...');
            
            // Fetch BTC price from Binance
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
            
            if (!response.ok) throw new Error('BTC API failed');
            
            const data = await response.json();
            
            this.data.bitcoinCorrelation = {
                price: parseFloat(data.lastPrice),
                change24h: parseFloat(data.priceChangePercent),
                volume: parseFloat(data.volume),
                isBreakingUp: parseFloat(data.priceChangePercent) > 5,
                isBreakingDown: parseFloat(data.priceChangePercent) < -5,
                keyLevels: this.checkBTCKeyLevels(parseFloat(data.lastPrice))
            };
            
            console.log('✅ Bitcoin:', this.data.bitcoinCorrelation.price);
        } catch (error) {
            console.warn('Could not fetch Bitcoin data:', error.message);
            this.data.bitcoinCorrelation = {
                price: 0,
                change24h: 0,
                volume: 0,
                isBreakingUp: false,
                isBreakingDown: false,
                keyLevels: { above: false, below: false }
            };
        }
    },

    checkBTCKeyLevels(price) {
        const levels = [30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000];
        
        for (let level of levels) {
            if (price > level - 1000 && price < level + 1000) {
                return {
                    near: level,
                    above: price > level,
                    below: price < level
                };
            }
        }
        
        return { near: null, above: false, below: false };
    },

    // ==================== ECONOMIC CALENDAR ====================
    async fetchEconomicCalendar() {
        // Hardcoded major events (FOMC meetings, CPI reports)
        // In production, fetch from TradingEconomics API or similar
        
        const now = new Date();
        const events = [];
        
        // Add next FOMC meeting (every ~6 weeks)
        const nextFOMC = new Date('2024-12-18'); // Update this
        if (nextFOMC > now) {
            events.push({
                type: 'FOMC Meeting',
                date: nextFOMC,
                impact: 'high',
                description: 'Federal Reserve interest rate decision'
            });
        }
        
        // Add next CPI report (monthly, ~12th of month)
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 12);
        events.push({
            type: 'CPI Report',
            date: nextMonth,
            impact: 'high',
            description: 'Inflation data release'
        });
        
        this.data.economicEvents = events.sort((a, b) => a.date - b.date);
    },

    // ==================== EXCHANGE FLOWS ====================
    async fetchExchangeFlows() {
        try {
            // Would use CryptoQuant or Glassnode API
            // For now, simulate
            
            this.data.exchangeFlows = {
                binanceReserves: 15000000000, // 15B DOGE
                change24h: -0.5, // Decreasing = accumulation
                change7d: -2.3,
                trend: 'accumulation'
            };
        } catch (error) {
            console.warn('Could not fetch exchange flows:', error.message);
        }
    },

    // ==================== FUNDING RATES ====================
    async fetchFundingRates() {
        try {
            // Would use Binance futures API or Coinglass
            // For now, simulate
            
            this.data.fundingRates = {
                current: 0.01, // 0.01% = neutral
                trend: 'neutral',
                isExtreme: false
            };
        } catch (error) {
            console.warn('Could not fetch funding rates:', error.message);
        }
    },

    // ==================== SCORING SYSTEM ====================
    calculateLeadingScore() {
        let score = 50; // Start neutral
        let factors = [];
        
        // Elon Impact (0-20 points)
        if (this.data.elonActivity) {
            const elonScore = (this.data.elonActivity.impact / 100) * 20;
            score += (elonScore - 10); // Center around neutral
            if (elonScore > 10) {
                factors.push(`Elon activity (+${Math.round(elonScore)})`);
            }
        }
        
        // Whale Signal (0-15 points)
        const whaleSignal = this.analyzeWhaleSignal();
        const whaleScore = ((whaleSignal.score - 50) / 50) * 15;
        score += whaleScore;
        if (Math.abs(whaleScore) > 5) {
            factors.push(`Whale ${whaleSignal.signal} (${whaleScore > 0 ? '+' : ''}${Math.round(whaleScore)})`);
        }
        
        // Fear & Greed (0-15 points)
        if (this.data.fearGreed) {
            const fgValue = this.data.fearGreed.value;
            if (fgValue < 20) {
                score += 15; // Extreme fear = buy opportunity
                factors.push('Extreme Fear (+15)');
            } else if (fgValue > 80) {
                score -= 15; // Extreme greed = sell signal
                factors.push('Extreme Greed (-15)');
            } else if (fgValue < 40) {
                score += 8;
                factors.push('Fear zone (+8)');
            } else if (fgValue > 60) {
                score -= 8;
                factors.push('Greed zone (-8)');
            }
        }
        
        // Social Sentiment (0-10 points)
        if (this.data.socialSentiment) {
            const sentScore = ((this.data.socialSentiment.score - 50) / 50) * 10;
            score += sentScore;
            if (Math.abs(sentScore) > 3) {
                factors.push(`Social ${this.data.socialSentiment.trend} (${sentScore > 0 ? '+' : ''}${Math.round(sentScore)})`);
            }
        }
        
        // Bitcoin Momentum (0-10 points)
        if (this.data.bitcoinCorrelation) {
            const btcChange = this.data.bitcoinCorrelation.change24h;
            const btcScore = (btcChange / 10) * 10; // Scale to -10 to +10
            score += btcScore;
            if (Math.abs(btcScore) > 3) {
                factors.push(`BTC ${btcChange > 0 ? 'up' : 'down'} (${btcScore > 0 ? '+' : ''}${Math.round(btcScore)})`);
            }
        }
        
        // Clamp score to 0-100
        score = Math.max(0, Math.min(100, score));
        
        // Determine confidence
        let confidence = 'low';
        if (factors.length >= 3) confidence = 'high';
        else if (factors.length >= 2) confidence = 'medium';
        
        this.scores.leading = Math.round(score);
        this.scores.factors = factors;
        this.scores.confidence = confidence;
        
        console.log(`Leading Score: ${this.scores.leading}/100 (${confidence} confidence)`);
        console.log('Factors:', factors);
        
        return this.scores.leading;
    },

    calculateCombinedScore() {
        // Get lagging score from existing indicators
        const laggingScore = this.calculateLaggingScore();
        
        // Weighted combination
        const leadingWeight = 0.50;
        const laggingWeight = 0.30;
        const contextWeight = 0.20;
        
        const contextScore = this.calculateContextScore();
        
        const combined = (
            this.scores.leading * leadingWeight +
            laggingScore * laggingWeight +
            contextScore * contextWeight
        );
        
        this.scores.lagging = laggingScore;
        this.scores.combined = Math.round(combined);
        
        return this.scores.combined;
    },

    calculateLaggingScore() {
        // Use existing technical indicators
        if (!window.IndicatorsManager || !IndicatorsManager.historicalData) return 50;
        
        const data = IndicatorsManager.historicalData;
        let score = 50;
        
        // RSI
        const rsi = DataManager.calculateRSI(data);
        if (rsi < 30) score += 20;
        else if (rsi < 40) score += 10;
        else if (rsi > 70) score -= 20;
        else if (rsi > 60) score -= 10;
        
        // MACD
        const macd = DataManager.calculateMACD(data);
        if (macd && macd.histogram > 0) score += 15;
        else if (macd && macd.histogram < 0) score -= 15;
        
        // Bollinger Bands
        const bb = DataManager.calculateBollingerBands(data);
        const currentPrice = data[data.length - 1].price;
        if (bb) {
            if (currentPrice <= bb.lower) score += 15;
            else if (currentPrice >= bb.upper) score -= 15;
        }
        
        return Math.max(0, Math.min(100, score));
    },

    calculateContextScore() {
        let score = 50;
        
        // Time of day (US market hours = more volatility)
        const hour = new Date().getUTCHours();
        if (hour >= 13 && hour <= 21) score += 10; // US trading hours
        
        // Day of week (Monday/Tuesday more active)
        const day = new Date().getDay();
        if (day >= 1 && day <= 2) score += 5;
        if (day === 6 || day === 0) score -= 5; // Weekend
        
        return Math.max(0, Math.min(100, score));
    },

    // ==================== UI UPDATE ====================
    updateUI() {
        this.updateLeadingTab();
        this.updateOverviewBadge();
        this.updateSignalsIntegration();
    },

    updateLeadingTab() {
        // Update Elon panel
        this.updateElonPanel();
        
        // Update Whale panel
        this.updateWhalePanel();
        
        // Update Fear & Greed panel
        this.updateFearGreedPanel();
        
        // Update Social Sentiment
        this.updateSocialPanel();
        
        // Update Bitcoin Correlation
        this.updateBitcoinPanel();
        
        // Update Economic Calendar
        this.updateEconomicPanel();
        
        // Update Exchange Flows
        this.updateExchangeFlowsPanel();
        
        // Update Funding Rates
        this.updateFundingRatesPanel();
        
        // Update Leading Score display
        this.updateLeadingScoreDisplay();
    },

    updateElonPanel() {
        const container = document.getElementById('elonActivity');
        if (!container) return;
        
        const activity = this.data.elonActivity;
        if (!activity) {
            container.innerHTML = '<p class="loading">Loading Elon activity...</p>';
            return;
        }
        
        const hoursSince = activity.hoursSinceLastMention;
        const impact = activity.impact;
        
        let statusHTML = '';
        if (hoursSince < 48 && impact > 0) {
            statusHTML = `
                <div class="elon-alert active">
                    <i class="fas fa-exclamation-circle"></i>
                    <strong>Recent DOGE mention detected!</strong>
                    <p>${hoursSince.toFixed(1)} hours ago • Impact: ${impact}/100</p>
                    <span class="sentiment-badge ${activity.sentiment}">${activity.sentiment}</span>
                </div>
            `;
        } else {
            statusHTML = `
                <div class="elon-quiet">
                    <i class="fas fa-moon"></i>
                    <p>No recent DOGE mentions</p>
                    <small>Last mention: ${hoursSince > 999 ? 'None in recent history' : hoursSince.toFixed(0) + ' hours ago'}</small>
                </div>
            `;
        }
        
        container.innerHTML = statusHTML;
    },

    updateWhalePanel() {
        const container = document.getElementById('whaleMovements');
        if (!container) return;
        
        const movements = this.data.whaleMovements;
        
        if (movements.length === 0) {
            container.innerHTML = '<p class="loading">No significant whale movements detected</p>';
            return;
        }
        
        const html = movements.map(m => {
            const hoursSince = (Date.now() - m.timestamp) / (1000 * 60 * 60);
            const typeClass = m.type === 'accumulation' ? 'bullish' : 'bearish';
            const icon = m.type === 'accumulation' ? 'arrow-down' : 'arrow-up';
            
            return `
                <div class="whale-item ${typeClass}">
                    <i class="fas fa-${icon}"></i>
                    <div class="whale-details">
                        <strong>${(m.amount / 1000000).toFixed(0)}M DOGE</strong>
                        <span>${m.from} → ${m.to}</span>
                        <small>${hoursSince.toFixed(1)}h ago • $${(m.usdValue / 1000000).toFixed(1)}M</small>
                    </div>
                    <span class="whale-signal">${m.type}</span>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },

    updateFearGreedPanel() {
        const container = document.getElementById('fearGreedIndex');
        if (!container) return;
        
        const fg = this.data.fearGreed;
        if (!fg) {
            container.innerHTML = '<p class="loading">Loading Fear & Greed Index...</p>';
            return;
        }
        
        const gaugeColor = fg.value < 25 ? '#ef4444' : 
                          fg.value < 45 ? '#f59e0b' :
                          fg.value < 55 ? '#a0aec0' :
                          fg.value < 75 ? '#c3a13a' : '#10b981';
        
        const html = `
            <div class="fear-greed-gauge">
                <svg viewBox="0 0 200 120" class="gauge-svg">
                    <path d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          stroke="#2d3748" 
                          stroke-width="20"/>
                    <path d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          stroke="${gaugeColor}" 
                          stroke-width="20"
                          stroke-dasharray="${fg.value * 2.51}, 251"
                          stroke-linecap="round"/>
                    <text x="100" y="80" text-anchor="middle" class="gauge-value">${fg.value}</text>
                    <text x="100" y="100" text-anchor="middle" class="gauge-label">${fg.classification}</text>
                </svg>
            </div>
            <div class="fear-greed-details">
                <div class="fg-stat">
                    <span>24h Change:</span>
                    <strong class="${fg.change24h >= 0 ? 'positive' : 'negative'}">${fg.change24h >= 0 ? '+' : ''}${fg.change24h}</strong>
                </div>
                <div class="fg-stat">
                    <span>7d Change:</span>
                    <strong class="${fg.change7d >= 0 ? 'positive' : 'negative'}">${fg.change7d >= 0 ? '+' : ''}${fg.change7d}</strong>
                </div>
                <div class="fg-stat">
                    <span>30d Average:</span>
                    <strong>${fg.monthAvg}</strong>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },

    updateLeadingScoreDisplay() {
        const container = document.getElementById('leadingScoreDisplay');
        if (!container) return;
        
        const score = this.scores.leading;
        const combined = this.calculateCombinedScore();
        const factors = this.scores.factors || [];
        
        const scoreColor = score < 30 ? '#ef4444' :
                          score < 45 ? '#f59e0b' :
                          score < 55 ? '#a0aec0' :
                          score < 70 ? '#c3a13a' : '#10b981';
        
        const signal = score < 35 ? 'SELL' :
                      score < 45 ? 'WEAK SELL' :
                      score < 55 ? 'NEUTRAL' :
                      score < 65 ? 'WEAK BUY' : 'BUY';
        
        const html = `
            <div class="score-display-main">
                <div class="score-circle" style="border-color: ${scoreColor}">
                    <span class="score-number">${score}</span>
                    <span class="score-label">Leading Score</span>
                </div>
                <div class="score-info">
                    <h3 class="signal-text" style="color: ${scoreColor}">${signal}</h3>
                    <p class="confidence">Confidence: ${this.scores.confidence.toUpperCase()}</p>
                    <div class="combined-score">
                        <span>Combined Score:</span>
                        <strong>${combined}/100</strong>
                    </div>
                </div>
            </div>
            <div class="score-factors">
                <h4>Contributing Factors:</h4>
                <div class="factors-list">
                    ${factors.length > 0 ? factors.map(f => `<span class="factor-tag">${f}</span>`).join('') : '<span class="factor-tag">No strong factors</span>'}
                </div>
            </div>
            <div class="score-breakdown">
                <div class="breakdown-item">
                    <span>Leading Indicators:</span>
                    <strong>${score}/100</strong>
                </div>
                <div class="breakdown-item">
                    <span>Lagging Indicators:</span>
                    <strong>${this.scores.lagging}/100</strong>
                </div>
                <div class="breakdown-item">
                    <span>Market Context:</span>
                    <strong>${this.calculateContextScore()}/100</strong>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },

    updateSocialPanel() {
        const sentiment = this.data.socialSentiment;
        if (!sentiment) return;
        
        document.getElementById('sentimentScore').textContent = sentiment.score + '/100';
        document.getElementById('sentimentTrend').textContent = sentiment.trend.toUpperCase();
        document.getElementById('volumeSpike').textContent = sentiment.volumeSpike ? 'YES' : 'NO';
        
        const trendEl = document.getElementById('sentimentTrend');
        trendEl.style.color = sentiment.trend === 'rising' ? 'var(--success-color)' : 
                             sentiment.trend === 'falling' ? 'var(--danger-color)' : 'var(--text-secondary)';
        
        const spikeEl = document.getElementById('volumeSpike');
        spikeEl.style.color = sentiment.volumeSpike ? 'var(--success-color)' : 'var(--text-secondary)';
    },

    updateBitcoinPanel() {
        const btc = this.data.bitcoinCorrelation;
        if (!btc || !btc.price) return;
        
        document.getElementById('btcPrice').textContent = '$' + btc.price.toLocaleString();
        document.getElementById('btcChange').textContent = DataManager.formatPercentage(btc.change24h);
        
        const changeEl = document.getElementById('btcChange');
        changeEl.style.color = btc.change24h >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        
        let keyLevelText = 'No key level nearby';
        if (btc.keyLevels && btc.keyLevels.near) {
            keyLevelText = `Near $${btc.keyLevels.near.toLocaleString()} (${btc.keyLevels.above ? 'above' : 'below'})`;
        }
        document.getElementById('btcKeyLevel').textContent = keyLevelText;
    },

    updateEconomicPanel() {
        const container = document.getElementById('economicCalendar');
        if (!container) return;
        
        const events = this.data.economicEvents;
        
        if (events.length === 0) {
            container.innerHTML = '<p class="loading">No major events scheduled</p>';
            return;
        }
        
        const html = events.map(event => {
            const daysUntil = Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24));
            const impactClass = event.impact === 'high' ? 'danger' : 'warning';
            
            return `
                <div class="calendar-event">
                    <div class="event-header">
                        <strong>${event.type}</strong>
                        <span class="event-impact ${impactClass}">${event.impact.toUpperCase()}</span>
                    </div>
                    <p class="event-description">${event.description}</p>
                    <small>In ${daysUntil} days (${event.date.toLocaleDateString()})</small>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
    },

    updateExchangeFlowsPanel() {
        const flows = this.data.exchangeFlows;
        if (!flows) return;
        
        document.getElementById('binanceReserves').textContent = (flows.binanceReserves / 1000000000).toFixed(2) + 'B DOGE';
        document.getElementById('flowChange24h').textContent = DataManager.formatPercentage(flows.change24h);
        document.getElementById('flowTrend').textContent = flows.trend.toUpperCase();
        
        const changeEl = document.getElementById('flowChange24h');
        const trendEl = document.getElementById('flowTrend');
        
        // Decreasing reserves = accumulation = bullish
        const isPositive = flows.change24h < 0;
        changeEl.style.color = isPositive ? 'var(--success-color)' : 'var(--danger-color)';
        trendEl.style.color = flows.trend === 'accumulation' ? 'var(--success-color)' : 'var(--danger-color)';
    },

    updateFundingRatesPanel() {
        const funding = this.data.fundingRates;
        if (!funding) return;
        
        document.getElementById('fundingRate').textContent = (funding.current * 100).toFixed(3) + '%';
        document.getElementById('fundingStatus').textContent = funding.trend.toUpperCase();
        
        const statusEl = document.getElementById('fundingStatus');
        if (funding.isExtreme) {
            statusEl.style.color = funding.current > 0 ? 'var(--danger-color)' : 'var(--success-color)';
        } else {
            statusEl.style.color = 'var(--text-secondary)';
        }
    },

    updateOverviewBadge() {
        // Add leading score badge to overview tab
        const badge = document.getElementById('leadingScoreBadge');
        if (!badge) return;
        
        const score = this.scores.leading;
        const scoreClass = score >= 65 ? 'bullish' : score <= 35 ? 'bearish' : 'neutral';
        
        badge.className = `leading-score-badge ${scoreClass}`;
        badge.innerHTML = `
            <i class="fas fa-bolt"></i>
            <span>Leading: ${score}/100</span>
        `;
    },

    updateSignalsIntegration() {
        // This will be called by signals.js to integrate leading scores
        if (window.SignalsManager) {
            SignalsManager.leadingScore = this.scores.leading;
            SignalsManager.leadingFactors = this.scores.factors;
        }
    }
};

// Export for use in other modules
window.LeadingIndicators = LeadingIndicators;
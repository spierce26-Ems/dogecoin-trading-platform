// Trade Tracker Module - Manages personal trade journal

const TradeTracker = {
    trades: [],

    async initialize() {
        await this.loadTrades();
        this.displayTrades();
        this.updateStats();
    },

    async loadTrades() {
        // Load trades from localStorage
        const stored = localStorage.getItem('dogecoin_trades');
        if (stored) {
            try {
                this.trades = JSON.parse(stored);
            } catch (e) {
                console.error('Error loading trades:', e);
                this.trades = [];
            }
        }
    },

    saveTrades() {
        localStorage.setItem('dogecoin_trades', JSON.stringify(this.trades));
    },

    addTrade(trade) {
        // Calculate return
        const returnPct = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
        const pnl = trade.positionSize * (returnPct / 100);

        const tradeData = {
            id: Date.now(),
            date: trade.date,
            type: trade.type,
            entryPrice: trade.entryPrice,
            exitPrice: trade.exitPrice,
            positionSize: trade.positionSize,
            returnPct: returnPct,
            pnl: pnl,
            notes: trade.notes || '',
            timestamp: new Date().toISOString()
        };

        this.trades.unshift(tradeData); // Add to beginning
        this.saveTrades();
        this.displayTrades();
        this.updateStats();
    },

    deleteTrade(id) {
        if (confirm('Are you sure you want to delete this trade?')) {
            this.trades = this.trades.filter(t => t.id !== id);
            this.saveTrades();
            this.displayTrades();
            this.updateStats();
        }
    },

    displayTrades() {
        const tbody = document.getElementById('tradesTableBody');
        if (!tbody) return;

        if (this.trades.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No trades logged yet. Click "Log New Trade" to start tracking.</td></tr>';
            return;
        }

        tbody.innerHTML = this.trades.map(trade => {
            const typeLabels = {
                'swing': 'Swing Trade',
                'frequent': 'Frequent',
                'scalp': 'Scalp',
                'hold': 'Position Hold'
            };

            return `
                <tr>
                    <td>${new Date(trade.date).toLocaleDateString()}</td>
                    <td><span class="trade-type-badge trade-type-${trade.type}">${typeLabels[trade.type]}</span></td>
                    <td>$${trade.entryPrice.toFixed(5)}</td>
                    <td>$${trade.exitPrice.toFixed(5)}</td>
                    <td>$${trade.positionSize.toLocaleString()}</td>
                    <td style="color: ${trade.returnPct >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">
                        ${trade.returnPct >= 0 ? '+' : ''}${trade.returnPct.toFixed(2)}%
                    </td>
                    <td style="color: ${trade.pnl >= 0 ? 'var(--success-color)' : 'var(--danger-color)'}; font-weight: 600;">
                        ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}
                    </td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${trade.notes || '-'}</td>
                    <td>
                        <button class="action-btn" onclick="TradeTracker.deleteTrade(${trade.id})" title="Delete Trade">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    updateStats() {
        if (this.trades.length === 0) {
            document.getElementById('trackerTotalTrades').textContent = '0';
            document.getElementById('trackerWinRate').textContent = '0%';
            document.getElementById('trackerPnL').textContent = '$0';
            document.getElementById('trackerAvgReturn').textContent = '0%';
            return;
        }

        const totalTrades = this.trades.length;
        const winningTrades = this.trades.filter(t => t.pnl > 0).length;
        const winRate = (winningTrades / totalTrades * 100).toFixed(1);
        const totalPnL = this.trades.reduce((sum, t) => sum + t.pnl, 0);
        const avgReturn = this.trades.reduce((sum, t) => sum + t.returnPct, 0) / totalTrades;

        document.getElementById('trackerTotalTrades').textContent = totalTrades;
        document.getElementById('trackerWinRate').textContent = winRate + '%';
        
        const pnlElement = document.getElementById('trackerPnL');
        pnlElement.textContent = (totalPnL >= 0 ? '+' : '') + DataManager.formatCurrency(totalPnL);
        pnlElement.style.color = totalPnL >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        
        const avgElement = document.getElementById('trackerAvgReturn');
        avgElement.textContent = (avgReturn >= 0 ? '+' : '') + avgReturn.toFixed(2) + '%';
        avgElement.style.color = avgReturn >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    }
};

// Modal functions
window.openAddTradeModal = function() {
    const modal = document.getElementById('addTradeModal');
    modal.classList.add('active');
    
    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('tradeDate').value = now.toISOString().slice(0, 16);
};

window.closeAddTradeModal = function() {
    const modal = document.getElementById('addTradeModal');
    modal.classList.remove('active');
    document.getElementById('addTradeForm').reset();
};

window.submitTrade = function(event) {
    event.preventDefault();

    const trade = {
        date: document.getElementById('tradeDate').value,
        type: document.getElementById('tradeType').value,
        entryPrice: parseFloat(document.getElementById('tradeEntryPrice').value),
        exitPrice: parseFloat(document.getElementById('tradeExitPrice').value),
        positionSize: parseFloat(document.getElementById('tradePositionSize').value),
        notes: document.getElementById('tradeNotes').value
    };

    TradeTracker.addTrade(trade);
    closeAddTradeModal();
};

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('addTradeModal');
    if (event.target === modal) {
        closeAddTradeModal();
    }
});

// Export for use in other modules
window.TradeTracker = TradeTracker;
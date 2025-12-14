/*
 * SCM STOCK CONTROL SYSTEM - CORE JAVASCRIPT ENGINE
 * The brain of the entire SCM operation
 * Version: 1.0 | Mission: Supply Chain Excellence
 */

// ===== GLOBAL SCM SYSTEM CONFIGURATION =====
const SCM_CONFIG = {
    SYSTEM_NAME: "SCM Stock Control System",
    VERSION: "1.0.0",
    CURRENCY: "P", // Botswana Pula
    LOW_STOCK_THRESHOLD: 10,
    CRITICAL_STOCK_THRESHOLD: 5,
    DATE_FORMAT: "en-US",
    STORAGE_KEYS: {
        INTERNAL_STOCK: 'internalStock',
        EXTERNAL_STOCK: 'externalStock',
        ISSUE_HISTORY: 'issueHistory',
        SYSTEM_SETTINGS: 'scmSettings',
        USER_SESSION: 'userSession'
    }
};

// ===== SCM DATA MODELS =====
class StockItem {
    constructor(data) {
        this.id = data.id || Date.now();
        this.itemName = data.itemName;
        this.category = data.category;
        this.quantity = parseInt(data.quantity);
        this.unitCost = parseFloat(data.unitCost);
        this.supplierName = data.supplierName;
        this.dateReceived = data.dateReceived || new Date().toISOString().split('T')[0];
        this.notes = data.notes || '';
        this.stockType = data.stockType || 'Internal-Use';
        this.dateAdded = data.dateAdded || new Date().toISOString();
        this.lastUpdated = new Date().toISOString();
    }

    get totalValue() {
        return this.quantity * this.unitCost;
    }

    get isLowStock() {
        return this.quantity < SCM_CONFIG.LOW_STOCK_THRESHOLD;
    }

    get isCriticalStock() {
        return this.quantity < SCM_CONFIG.CRITICAL_STOCK_THRESHOLD;
    }

    toStorage() {
        return {
            id: this.id,
            itemName: this.itemName,
            category: this.category,
            quantity: this.quantity,
            unitCost: this.unitCost,
            supplierName: this.supplierName,
            dateReceived: this.dateReceived,
            notes: this.notes,
            stockType: this.stockType,
            dateAdded: this.dateAdded,
            lastUpdated: this.lastUpdated
        };
    }
}

class IssueRecord {
    constructor(data) {
        this.id = data.id || Date.now();
        this.itemId = data.itemId;
        this.itemName = data.itemName;
        this.stockType = data.stockType;
        this.category = data.category;
        this.quantityIssued = parseInt(data.quantityIssued);
        this.unitCost = parseFloat(data.unitCost);
        this.totalValue = data.totalValue || this.quantityIssued * this.unitCost;
        this.issuedTo = data.issuedTo;
        this.reason = data.reason;
        this.notes = data.notes || '';
        this.date = data.date || new Date().toISOString().split('T')[0];
        this.timestamp = data.timestamp || new Date().toISOString();
        this.remainingBalance = data.remainingBalance;
        this.issuedBy = data.issuedBy || 'System User';
    }

    toStorage() {
        return {
            id: this.id,
            itemId: this.itemId,
            itemName: this.itemName,
            stockType: this.stockType,
            category: this.category,
            quantityIssued: this.quantityIssued,
            unitCost: this.unitCost,
            totalValue: this.totalValue,
            issuedTo: this.issuedTo,
            reason: this.reason,
            notes: this.notes,
            date: this.date,
            timestamp: this.timestamp,
            remainingBalance: this.remainingBalance,
            issuedBy: this.issuedBy
        };
    }
}

// ===== SCM STORAGE MANAGER =====
class SCMStorage {
    static get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`SCM Storage Error (${key}):`, error);
            this.showError('Storage Error', 'Failed to load data from storage.');
            return null;
        }
    }

    static set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`SCM Storage Error (${key}):`, error);
            this.showError('Storage Error', 'Failed to save data to storage.');
            return false;
        }
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }

    static showError(title, message) {
        if (typeof alert === 'function') {
            alert(`❌ ${title}\n\n${message}`);
        }
    }
}

// ===== SCM VALIDATION ENGINE =====
class SCMValidator {
    static validateStockItem(data) {
        const errors = [];

        if (!data.itemName || data.itemName.trim().length < 2) {
            errors.push('Item name must be at least 2 characters');
        }

        if (!data.category) {
            errors.push('Category is required');
        }

        if (!data.quantity || data.quantity < 1) {
            errors.push('Quantity must be at least 1');
        }

        if (!data.unitCost || data.unitCost < 0) {
            errors.push('Unit cost must be a positive number');
        }

        if (!data.supplierName || data.supplierName.trim().length < 2) {
            errors.push('Supplier name is required');
        }

        if (!data.dateReceived) {
            errors.push('Date received is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static validateIssueRequest(data, availableQuantity) {
        const errors = [];

        if (!data.itemId) {
            errors.push('Item selection is required');
        }

        if (!data.quantityIssued || data.quantityIssued < 1) {
            errors.push('Quantity to issue must be at least 1');
        }

        if (data.quantityIssued > availableQuantity) {
            errors.push(`Cannot issue more than ${availableQuantity} units (available stock)`);
        }

        if (!data.issuedTo || data.issuedTo.trim().length < 2) {
            errors.push('Recipient name is required');
        }

        if (!data.reason) {
            errors.push('Reason for issuance is required');
        }

        if (!data.date) {
            errors.push('Issue date is required');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    static validateSearchTerm(term) {
        return term && term.trim().length >= 2;
    }
}

// ===== SCM CALCULATION ENGINE =====
class SCMCalculator {
    static calculateStockValue(stockArray) {
        return stockArray.reduce((total, item) => {
            return total + (item.quantity * item.unitCost);
        }, 0);
    }

    static calculateStockTurnover(issuedValue, averageInventory) {
        if (averageInventory === 0) return 0;
        return (issuedValue / averageInventory).toFixed(2);
    }

    static calculateLowStockCount(stockArray) {
        return stockArray.filter(item => item.quantity < SCM_CONFIG.LOW_STOCK_THRESHOLD).length;
    }

    static calculateCriticalStockCount(stockArray) {
        return stockArray.filter(item => item.quantity < SCM_CONFIG.CRITICAL_STOCK_THRESHOLD).length;
    }

    static formatCurrency(amount) {
        return `${SCM_CONFIG.CURRENCY} ${parseFloat(amount).toFixed(2)}`;
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString(SCM_CONFIG.DATE_FORMAT, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    static formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString(SCM_CONFIG.DATE_FORMAT, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// ===== SCM DATA MANAGER =====
class SCMDataManager {
    static getAllStock() {
        const internal = SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK) || [];
        const external = SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK) || [];
        return [...internal, ...external];
    }

    static getStockByType(type) {
        const key = type === 'internal' ? 
            SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK : 
            SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK;
        return SCMStorage.get(key) || [];
    }

    static saveStockItem(itemData, stockType) {
        const key = stockType === 'internal' ? 
            SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK : 
            SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK;
        
        const currentStock = SCMStorage.get(key) || [];
        const newItem = new StockItem({ ...itemData, stockType: stockType === 'internal' ? 'Internal-Use' : 'External-Use' });
        
        currentStock.push(newItem.toStorage());
        
        return SCMStorage.set(key, currentStock);
    }

    static updateStockItem(itemId, updates, stockType) {
        const key = stockType === 'internal' ? 
            SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK : 
            SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK;
        
        const currentStock = SCMStorage.get(key) || [];
        const itemIndex = currentStock.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return false;
        
        currentStock[itemIndex] = {
            ...currentStock[itemIndex],
            ...updates,
            lastUpdated: new Date().toISOString()
        };
        
        return SCMStorage.set(key, currentStock);
    }

    static deleteStockItem(itemId, stockType) {
        const key = stockType === 'internal' ? 
            SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK : 
            SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK;
        
        const currentStock = SCMStorage.get(key) || [];
        const filteredStock = currentStock.filter(item => item.id !== itemId);
        
        return SCMStorage.set(key, filteredStock);
    }

    static issueStock(itemId, quantity, issueData) {
        // Determine stock type
        const internalStock = SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK) || [];
        const externalStock = SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK) || [];
        
        let stockArray, stockType, item;
        
        item = internalStock.find(i => i.id === itemId);
        if (item) {
            stockArray = internalStock;
            stockType = 'internal';
        } else {
            item = externalStock.find(i => i.id === itemId);
            if (item) {
                stockArray = externalStock;
                stockType = 'external';
            } else {
                return { success: false, message: 'Item not found' };
            }
        }

        // Check available quantity
        if (item.quantity < quantity) {
            return { 
                success: false, 
                message: `Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}` 
            };
        }

        // Update stock quantity
        const itemIndex = stockArray.findIndex(i => i.id === itemId);
        stockArray[itemIndex].quantity -= quantity;
        stockArray[itemIndex].lastUpdated = new Date().toISOString();

        // Save updated stock
        const key = stockType === 'internal' ? 
            SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK : 
            SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK;
        SCMStorage.set(key, stockArray);

        // Create issue record
        const issueRecord = new IssueRecord({
            itemId: itemId,
            itemName: item.itemName,
            stockType: stockType === 'internal' ? 'Internal-Use' : 'External-Use',
            category: item.category,
            quantityIssued: quantity,
            unitCost: item.unitCost,
            issuedTo: issueData.issuedTo,
            reason: issueData.reason,
            notes: issueData.notes,
            date: issueData.date,
            remainingBalance: stockArray[itemIndex].quantity,
            issuedBy: issueData.issuedBy || 'System User'
        });

        // Save issue record
        const issueHistory = SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.ISSUE_HISTORY) || [];
        issueHistory.push(issueRecord.toStorage());
        SCMStorage.set(SCM_CONFIG.STORAGE_KEYS.ISSUE_HISTORY, issueHistory);

        return { 
            success: true, 
            message: 'Stock issued successfully',
            data: issueRecord 
        };
    }

    static getIssueHistory(filter = {}) {
        const history = SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.ISSUE_HISTORY) || [];
        
        if (!filter || Object.keys(filter).length === 0) {
            return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        return history.filter(record => {
            let match = true;

            if (filter.startDate && new Date(record.date) < new Date(filter.startDate)) {
                match = false;
            }

            if (filter.endDate && new Date(record.date) > new Date(filter.endDate)) {
                match = false;
            }

            if (filter.stockType && record.stockType !== filter.stockType) {
                match = false;
            }

            if (filter.searchTerm) {
                const searchLower = filter.searchTerm.toLowerCase();
                match = match && (
                    record.itemName.toLowerCase().includes(searchLower) ||
                    record.issuedTo.toLowerCase().includes(searchLower) ||
                    (record.notes && record.notes.toLowerCase().includes(searchLower))
                );
            }

            return match;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}

// ===== SCM UI UTILITIES =====
class SCMUI {
    static showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.scm-notification');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `scm-notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .scm-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 8px;
                background: white;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                z-index: 9999;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
                border-left: 4px solid;
            }
            
            .scm-notification.success {
                border-left-color: #2e7d32;
                background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%);
            }
            
            .scm-notification.error {
                border-left-color: #c62828;
                background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
            }
            
            .scm-notification.warning {
                border-left-color: #f57c00;
                background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
            }
            
            .scm-notification.info {
                border-left-color: #0288d1;
                background: linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-icon {
                font-size: 1.5rem;
            }
            
            .notification-message {
                font-weight: 500;
                color: #333;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            
            // Add slideOut animation
            const slideOutStyle = document.createElement('style');
            slideOutStyle.textContent = `
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(slideOutStyle);
            
            setTimeout(() => notification.remove(), 300);
        }, duration);

        return notification;
    }

    static showConfirmation(message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.className = 'scm-confirmation-overlay';
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'scm-confirmation-modal';
            
            modal.innerHTML = `
                <div class="confirmation-content">
                    <div class="confirmation-message">${message}</div>
                    <div class="confirmation-actions">
                        <button class="btn-secondary cancel-btn">${cancelText}</button>
                        <button class="btn-primary confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;

            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                .scm-confirmation-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    backdrop-filter: blur(5px);
                    animation: fadeIn 0.3s ease;
                }
                
                .scm-confirmation-modal {
                    background: white;
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideInUp 0.3s ease;
                }
                
                .confirmation-message {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    color: #333;
                }
                
                .confirmation-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideInUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `;

            document.head.appendChild(style);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Handle button clicks
            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');

            const cleanup = () => {
                overlay.style.animation = 'fadeOut 0.3s ease forwards';
                modal.style.animation = 'slideOutDown 0.3s ease forwards';
                
                // Add animations
                const exitStyle = document.createElement('style');
                exitStyle.textContent = `
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    
                    @keyframes slideOutDown {
                        from {
                            transform: translateY(0);
                            opacity: 1;
                        }
                        to {
                            transform: translateY(20px);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(exitStyle);
                
                setTimeout(() => {
                    document.head.removeChild(style);
                    document.head.removeChild(exitStyle);
                    document.body.removeChild(overlay);
                }, 300);
            };

            confirmBtn.onclick = () => {
                cleanup();
                setTimeout(() => resolve(true), 300);
            };

            cancelBtn.onclick = () => {
                cleanup();
                setTimeout(() => resolve(false), 300);
            };

            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    setTimeout(() => resolve(false), 300);
                }
            };
        });
    }

    static showLoading(container, message = 'Loading...') {
        const loadingId = 'scm-loading-' + Date.now();
        const loadingHtml = `
            <div id="${loadingId}" class="scm-loading">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .scm-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                gap: 16px;
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #e0e0e0;
                border-top-color: #2196f3;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .loading-message {
                color: #666;
                font-weight: 500;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;

        document.head.appendChild(style);
        
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (container) {
            container.innerHTML = loadingHtml;
        }

        return {
            remove: () => {
                const element = document.getElementById(loadingId);
                if (element) element.remove();
                document.head.removeChild(style);
            },
            updateMessage: (newMessage) => {
                const messageEl = document.querySelector(`#${loadingId} .loading-message`);
                if (messageEl) messageEl.textContent = newMessage;
            }
        };
    }

    static updateNavigation() {
        const currentPage = window.location.pathname.split('/').pop();
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage || 
                (currentPage === '' && link.getAttribute('href') === 'dashboard.html')) {
                link.classList.add('active');
            }
        });
    }

    static formatTableDate(dateString) {
        return SCMCalculator.formatDate(dateString);
    }

    static createCategoryTag(category) {
        return `<span class="category-tag">${category}</span>`;
    }

    static createStockTypeTag(stockType) {
        const isInternal = stockType === 'Internal-Use';
        const className = isInternal ? 'internal-tag' : 'external-tag';
        const icon = isInternal ? '🏢' : '💰';
        return `<span class="type-tag ${className}">${icon} ${stockType}</span>`;
    }

    static createStatusTag(quantity, issuedCount) {
        if (quantity < 5) {
            return '<span class="status-tag status-critical">Critical</span>';
        } else if (issuedCount === 0 && quantity > 20) {
            return '<span class="status-tag status-slow">Slow Moving</span>';
        } else if (issuedCount > 10) {
            return '<span class="status-tag status-fast">Fast Moving</span>';
        } else {
            return '<span class="status-tag status-normal">Normal</span>';
        }
    }
}

// ===== SCM EXPORT MANAGER =====
class SCMExporter {
    static exportToCSV(data, filename = 'scm-export.csv') {
        if (!data || data.length === 0) {
            SCMUI.showNotification('No data to export', 'warning');
            return;
        }

        try {
            // Get headers from first object
            const headers = Object.keys(data[0]);
            
            // Create CSV content
            const csvContent = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => {
                        let cell = row[header] !== null && row[header] !== undefined ? row[header] : '';
                        cell = cell.toString();
                        
                        // Escape quotes and wrap in quotes if contains comma, quote, or newline
                        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                            cell = `"${cell.replace(/"/g, '""')}"`;
                        }
                        
                        return cell;
                    }).join(',')
                )
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            SCMUI.showNotification('CSV exported successfully', 'success');
            
        } catch (error) {
            console.error('Export error:', error);
            SCMUI.showNotification('Export failed: ' + error.message, 'error');
        }
    }

    static exportStockToCSV() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const allStock = [...internalStock, ...externalStock];
        
        this.exportToCSV(allStock, `scm-stock-${new Date().toISOString().split('T')[0]}.csv`);
    }

    static exportHistoryToCSV() {
        const history = SCMDataManager.getIssueHistory();
        this.exportToCSV(history, `scm-history-${new Date().toISOString().split('T')[0]}.csv`);
    }

    static generateReport() {
        const reportData = {
            generated: new Date().toISOString(),
            system: SCM_CONFIG.SYSTEM_NAME,
            version: SCM_CONFIG.VERSION,
            summary: this.generateSummary(),
            stockAnalysis: this.generateStockAnalysis(),
            movementAnalysis: this.generateMovementAnalysis(),
            recommendations: this.generateRecommendations()
        };

        // For now, export as JSON
        const filename = `scm-report-${new Date().toISOString().split('T')[0]}.json`;
        const dataStr = JSON.stringify(reportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        SCMUI.showNotification('Report generated successfully', 'success');
    }

    static generateSummary() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const history = SCMDataManager.getIssueHistory();
        
        return {
            totalItems: internalStock.length + externalStock.length,
            totalValue: SCMCalculator.calculateStockValue([...internalStock, ...externalStock]),
            lowStockItems: SCMCalculator.calculateLowStockCount([...internalStock, ...externalStock]),
            totalIssues: history.length,
            last30DaysIssues: history.filter(h => {
                const issueDate = new Date(h.date);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                return issueDate > thirtyDaysAgo;
            }).length
        };
    }

    static generateStockAnalysis() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        
        // Group by category
        const categoryAnalysis = {};
        [...internalStock, ...externalStock].forEach(item => {
            if (!categoryAnalysis[item.category]) {
                categoryAnalysis[item.category] = {
                    count: 0,
                    totalValue: 0,
                    items: []
                };
            }
            categoryAnalysis[item.category].count++;
            categoryAnalysis[item.category].totalValue += item.quantity * item.unitCost;
            categoryAnalysis[item.category].items.push(item.itemName);
        });

        return {
            internal: {
                count: internalStock.length,
                value: SCMCalculator.calculateStockValue(internalStock),
                lowStock: SCMCalculator.calculateLowStockCount(internalStock)
            },
            external: {
                count: externalStock.length,
                value: SCMCalculator.calculateStockValue(externalStock),
                lowStock: SCMCalculator.calculateLowStockCount(externalStock)
            },
            byCategory: categoryAnalysis
        };
    }

    static generateMovementAnalysis() {
        const history = SCMDataManager.getIssueHistory();
        
        // Last 30 days analysis
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentHistory = history.filter(h => new Date(h.date) > thirtyDaysAgo);
        
        // Group by day
        const dailyMovement = {};
        recentHistory.forEach(record => {
            if (!dailyMovement[record.date]) {
                dailyMovement[record.date] = {
                    internal: 0,
                    external: 0,
                    totalValue: 0
                };
            }
            
            if (record.stockType === 'Internal-Use') {
                dailyMovement[record.date].internal += record.quantityIssued;
            } else {
                dailyMovement[record.date].external += record.quantityIssued;
            }
            
            dailyMovement[record.date].totalValue += record.totalValue;
        });

        return {
            totalMovements: recentHistory.length,
            totalQuantity: recentHistory.reduce((sum, r) => sum + r.quantityIssued, 0),
            totalValue: recentHistory.reduce((sum, r) => sum + r.totalValue, 0),
            dailyBreakdown: dailyMovement
        };
    }

    static generateRecommendations() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const allStock = [...internalStock, ...externalStock];
        
        const recommendations = [];
        const urgentActions = [];
        const strategicSuggestions = [];

        // Check for low stock
        const lowStock = allStock.filter(item => item.quantity < SCM_CONFIG.LOW_STOCK_THRESHOLD);
        if (lowStock.length > 0) {
            urgentActions.push(`Reorder ${lowStock.length} low stock items`);
        }

        // Check for critical stock
        const criticalStock = allStock.filter(item => item.quantity < SCM_CONFIG.CRITICAL_STOCK_THRESHOLD);
        if (criticalStock.length > 0) {
            urgentActions.push(`CRITICAL: ${criticalStock.length} items below minimum threshold`);
        }

        // Check for high-value slow-moving items
        const slowMoving = allStock.filter(item => {
            // Items with high value but no movement in last 60 days
            const itemValue = item.quantity * item.unitCost;
            return itemValue > 1000; // Example threshold
        });

        if (slowMoving.length > 0) {
            strategicSuggestions.push(`Review ${slowMoving.length} high-value items for potential reduction`);
        }

        // Efficiency recommendations
        const totalValue = SCMCalculator.calculateStockValue(allStock);
        if (totalValue > 50000) {
            strategicSuggestions.push('Consider inventory insurance for high-value stock');
        }

        if (urgentActions.length === 0) {
            recommendations.push('No urgent actions required');
        } else {
            recommendations.push(...urgentActions);
        }

        if (strategicSuggestions.length > 0) {
            recommendations.push(...strategicSuggestions);
        }

        return {
            timestamp: new Date().toISOString(),
            recommendations: recommendations,
            priority: urgentActions.length > 0 ? 'HIGH' : strategicSuggestions.length > 0 ? 'MEDIUM' : 'LOW'
        };
    }
}

// ===== SCM INITIALIZATION =====
class SCMInitializer {
    static initializeSystem() {
        // Set current date displays
        this.updateCurrentDate();
        
        // Update navigation
        SCMUI.updateNavigation();
        
        // Set up global error handling
        this.setupErrorHandling();
        
        // Log system startup
        console.log(`${SCM_CONFIG.SYSTEM_NAME} v${SCM_CONFIG.VERSION} initialized`);
    }

    static updateCurrentDate() {
        const dateElements = document.querySelectorAll('#current-date');
        if (dateElements.length > 0) {
            const now = new Date();
            const formattedDate = now.toLocaleDateString(SCM_CONFIG.DATE_FORMAT, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateElements.forEach(el => {
                el.textContent = formattedDate;
            });
        }
    }

    static setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('SCM System Error:', event.error);
            SCMUI.showNotification('System error occurred. Check console for details.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('SCM Unhandled Promise Rejection:', event.reason);
            SCMUI.showNotification('Async error occurred. Check console for details.', 'error');
        });
    }

    static clearAllData() {
        return SCMUI.showConfirmation(
            'WARNING: This will delete ALL system data including stock items and history. This action cannot be undone. Are you absolutely sure?',
            'Delete Everything',
            'Cancel'
        ).then(confirmed => {
            if (confirmed) {
                SCMStorage.clear();
                SCMUI.showNotification('All system data cleared successfully', 'success');
                
                // Reload page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        });
    }

    static exportSystemBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            system: SCM_CONFIG.SYSTEM_NAME,
            version: SCM_CONFIG.VERSION,
            data: {
                internalStock: SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.INTERNAL_STOCK),
                externalStock: SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.EXTERNAL_STOCK),
                issueHistory: SCMStorage.get(SCM_CONFIG.STORAGE_KEYS.ISSUE_HISTORY)
            }
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `scm-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        SCMUI.showNotification('System backup exported successfully', 'success');
    }
}

// ===== SCM EVENT HANDLERS =====
class SCMEvents {
    static initializeEventHandlers() {
        // Global refresh button
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="refresh"]') || 
                e.target.closest('[data-action="refresh"]')) {
                this.handleRefresh();
            }
            
            if (e.target.matches('[data-action="export-csv"]') || 
                e.target.closest('[data-action="export-csv"]')) {
                SCMExporter.exportStockToCSV();
            }
            
            if (e.target.matches('[data-action="export-history"]') || 
                e.target.closest('[data-action="export-history"]')) {
                SCMExporter.exportHistoryToCSV();
            }
            
            if (e.target.matches('[data-action="generate-report"]') || 
                e.target.closest('[data-action="generate-report"]')) {
                SCMExporter.generateReport();
            }
            
            if (e.target.matches('[data-action="clear-data"]') || 
                e.target.closest('[data-action="clear-data"]')) {
                SCMInitializer.clearAllData();
            }
            
            if (e.target.matches('[data-action="backup"]') || 
                e.target.closest('[data-action="backup"]')) {
                SCMInitializer.exportSystemBackup();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('#add-stock-form')) {
                e.preventDefault();
                this.handleAddStock(e.target);
            }
            
            if (e.target.matches('#issue-form')) {
                e.preventDefault();
                this.handleIssueStock(e.target);
            }
            
            if (e.target.matches('#edit-form')) {
                e.preventDefault();
                this.handleEditStock(e.target);
            }
        });

        // Search functionality
        document.addEventListener('input', (e) => {
            if (e.target.matches('[data-search]')) {
                this.handleSearch(e.target.value, e.target.dataset.searchTarget);
            }
        });

        // Filter changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('[data-filter]')) {
                this.handleFilterChange();
            }
        });

        // Print functionality
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-print]') || e.target.closest('[data-print]')) {
                window.print();
            }
        });
    }

    static handleRefresh() {
        SCMUI.showNotification('Refreshing data...', 'info', 1000);
        
        // Trigger custom event for page-specific refresh
        const refreshEvent = new CustomEvent('scm:refresh');
        document.dispatchEvent(refreshEvent);
        
        // Update date
        SCMInitializer.updateCurrentDate();
    }

    static handleAddStock(form) {
        const formData = new FormData(form);
        const stockType = formData.get('stock-type') || 'internal';
        
        const itemData = {
            itemName: formData.get('item-name'),
            category: formData.get('category'),
            quantity: parseInt(formData.get('quantity')),
            unitCost: parseFloat(formData.get('unit-cost')),
            supplierName: formData.get('supplier-name'),
            dateReceived: formData.get('date-received'),
            notes: formData.get('notes')
        };

        // Validate
        const validation = SCMValidator.validateStockItem(itemData);
        if (!validation.isValid) {
            SCMUI.showNotification(validation.errors.join(', '), 'error');
            return;
        }

        // Save to storage
        const success = SCMDataManager.saveStockItem(itemData, stockType);
        
        if (success) {
            SCMUI.showNotification('Stock item added successfully!', 'success');
            form.reset();
            
            // Reset date to today
            const dateInput = form.querySelector('input[type="date"]');
            if (dateInput) {
                dateInput.valueAsDate = new Date();
            }
            
            // Trigger refresh
            this.handleRefresh();
        } else {
            SCMUI.showNotification('Failed to save stock item', 'error');
        }
    }

    static handleIssueStock(form) {
        const formData = new FormData(form);
        
        const issueData = {
            itemId: parseInt(formData.get('item-id')),
            quantityIssued: parseInt(formData.get('issue-quantity')),
            issuedTo: formData.get('issued-to'),
            reason: formData.get('reason'),
            notes: formData.get('issue-notes'),
            date: formData.get('issue-date'),
            issuedBy: 'Current User' // This would come from login system
        };

        // Get current item quantity for validation
        const itemId = issueData.itemId;
        const allStock = SCMDataManager.getAllStock();
        const item = allStock.find(i => i.id === itemId);
        
        if (!item) {
            SCMUI.showNotification('Selected item not found', 'error');
            return;
        }

        // Validate
        const validation = SCMValidator.validateIssueRequest(issueData, item.quantity);
        if (!validation.isValid) {
            SCMUI.showNotification(validation.errors.join(', '), 'error');
            return;
        }

        // Confirm issuance
        SCMUI.showConfirmation(
            `Issue ${issueData.quantityIssued} units of ${item.itemName} to ${issueData.issuedTo}?`,
            'Confirm Issue',
            'Cancel'
        ).then(confirmed => {
            if (confirmed) {
                const result = SCMDataManager.issueStock(itemId, issueData.quantityIssued, issueData);
                
                if (result.success) {
                    SCMUI.showNotification('Stock issued successfully!', 'success');
                    form.reset();
                    
                    // Reset date to today
                    const dateInput = form.querySelector('input[type="date"]');
                    if (dateInput) {
                        dateInput.valueAsDate = new Date();
                    }
                    
                    // Trigger refresh
                    this.handleRefresh();
                } else {
                    SCMUI.showNotification(result.message, 'error');
                }
            }
        });
    }

    static handleEditStock(form) {
        const formData = new FormData(form);
        
        const updates = {
            itemName: formData.get('edit-item-name'),
            quantity: parseInt(formData.get('edit-quantity')),
            unitCost: parseFloat(formData.get('edit-unit-cost')),
            notes: formData.get('edit-notes')
        };

        const itemId = parseInt(formData.get('edit-id'));
        const stockType = formData.get('edit-type');

        // Basic validation
        if (!updates.itemName || updates.itemName.trim().length < 2) {
            SCMUI.showNotification('Item name must be at least 2 characters', 'error');
            return;
        }

        if (updates.quantity < 0) {
            SCMUI.showNotification('Quantity cannot be negative', 'error');
            return;
        }

        if (updates.unitCost < 0) {
            SCMUI.showNotification('Unit cost cannot be negative', 'error');
            return;
        }

        const success = SCMDataManager.updateStockItem(itemId, updates, stockType);
        
        if (success) {
            SCMUI.showNotification('Stock item updated successfully!', 'success');
            
            // Close modal if exists
            const modal = document.getElementById('edit-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Trigger refresh
            this.handleRefresh();
        } else {
            SCMUI.showNotification('Failed to update stock item', 'error');
        }
    }

    static handleSearch(searchTerm, targetSelector) {
        if (!SCMValidator.validateSearchTerm(searchTerm)) {
            // If search term is too short, show all results
            const allRows = document.querySelectorAll(`${targetSelector} tbody tr`);
            allRows.forEach(row => row.style.display = '');
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const rows = document.querySelectorAll(`${targetSelector} tbody tr`);
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchLower) ? '' : 'none';
        });
    }

    static handleFilterChange() {
        // This would be implemented per page
        const filterEvent = new CustomEvent('scm:filter-change');
        document.dispatchEvent(filterEvent);
    }
}

// ===== PAGE-SPECIFIC FUNCTIONS =====
// Dashboard Page
function initializeDashboard() {
    function updateDashboard() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const issueHistory = SCMDataManager.getIssueHistory();
        
        // Update internal stock metrics
        document.getElementById('internal-total-items').textContent = internalStock.length;
        document.getElementById('internal-total-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(internalStock));
        
        const internalLowCount = SCMCalculator.calculateLowStockCount(internalStock);
        document.getElementById('internal-low-count').textContent = internalLowCount;
        document.getElementById('internal-low-stock').style.display = 
            internalLowCount > 0 ? 'flex' : 'none';
        
        // Update external stock metrics
        document.getElementById('external-total-items').textContent = externalStock.length;
        document.getElementById('external-total-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(externalStock));
        
        const externalLowCount = SCMCalculator.calculateLowStockCount(externalStock);
        document.getElementById('external-low-count').textContent = externalLowCount;
        document.getElementById('external-low-stock').style.display = 
            externalLowCount > 0 ? 'flex' : 'none';
        
        // Update recent issues
        const recentIssues = issueHistory.slice(0, 5);
        document.getElementById('recent-issues-count').textContent = recentIssues.length;
        
        const activityBody = document.getElementById('activity-table-body');
        if (recentIssues.length > 0) {
            activityBody.innerHTML = recentIssues.map(issue => `
                <tr>
                    <td>${SCMCalculator.formatDate(issue.date)}</td>
                    <td>${issue.itemName}</td>
                    <td>${SCMUI.createStockTypeTag(issue.stockType)}</td>
                    <td><span class="tag issued">Issued</span></td>
                    <td class="text-danger">-${issue.quantityIssued}</td>
                    <td>${issue.remainingBalance}</td>
                </tr>
            `).join('');
        } else {
            activityBody.innerHTML = `
                <tr>
                    <td colspan="6" class="no-data">No recent activity</td>
                </tr>
            `;
        }
    }
    
    // Initial update
    updateDashboard();
    
    // Listen for refresh events
    document.addEventListener('scm:refresh', updateDashboard);
    
    // Set up refresh button
    const refreshBtn = document.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
        refreshBtn.onclick = updateDashboard;
    }
}

// Inventory Page
function initializeInventory() {
    let currentFilter = {};
    
    function renderInventory() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        
        // Apply filters
        let filteredInternal = [...internalStock];
        let filteredExternal = [...externalStock];
        
        if (currentFilter.category) {
            filteredInternal = filteredInternal.filter(item => item.category === currentFilter.category);
            filteredExternal = filteredExternal.filter(item => item.category === currentFilter.category);
        }
        
        if (currentFilter.search) {
            const searchLower = currentFilter.search.toLowerCase();
            filteredInternal = filteredInternal.filter(item => 
                item.itemName.toLowerCase().includes(searchLower) ||
                item.supplierName.toLowerCase().includes(searchLower)
            );
            filteredExternal = filteredExternal.filter(item => 
                item.itemName.toLowerCase().includes(searchLower) ||
                item.supplierName.toLowerCase().includes(searchLower)
            );
        }
        
        // Update summary
        document.getElementById('internal-count').textContent = filteredInternal.length;
        document.getElementById('internal-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(filteredInternal));
        document.getElementById('internal-low').textContent = 
            SCMCalculator.calculateLowStockCount(filteredInternal);
        
        document.getElementById('external-count').textContent = filteredExternal.length;
        document.getElementById('external-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(filteredExternal));
        document.getElementById('external-low').textContent = 
            SCMCalculator.calculateLowStockCount(filteredExternal);
        
        // Render tables
        renderTable('internal-table-body', filteredInternal, 'internal');
        renderTable('external-table-body', filteredExternal, 'external');
        
        // Update overall summary
        const allFiltered = [...filteredInternal, ...filteredExternal];
        document.getElementById('total-items-count').textContent = allFiltered.length;
        document.getElementById('total-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(allFiltered));
        document.getElementById('low-stock-count').textContent = 
            SCMCalculator.calculateLowStockCount(allFiltered);
        document.getElementById('categories-count').textContent = 
            new Set(allFiltered.map(item => item.category)).size;
    }
    
    function renderTable(tbodyId, items, stockType) {
        const tbody = document.getElementById(tbodyId);
        
        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">No ${stockType === 'internal' ? 'internal-use' : 'external-use'} stock items found</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = items.map(item => `
            <tr class="${item.quantity < SCM_CONFIG.LOW_STOCK_THRESHOLD ? 'low-stock-row' : ''}">
                <td>${item.itemName}</td>
                <td>${SCMUI.createCategoryTag(item.category)}</td>
                <td><span class="quantity-cell ${item.quantity < 10 ? 'low-quantity' : ''}">${item.quantity}</span></td>
                <td>${SCMCalculator.formatCurrency(item.unitCost)}</td>
                <td><strong>${SCMCalculator.formatCurrency(item.quantity * item.unitCost)}</strong></td>
                <td>${item.supplierName}</td>
                <td>${SCMCalculator.formatDate(item.dateReceived)}</td>
                <td>${item.notes || '-'}</td>
                <td class="action-buttons">
                    <button class="action-btn edit-btn" onclick="editItem(${item.id}, '${stockType}')">✏️ Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteItem(${item.id}, '${stockType}')">🗑️ Delete</button>
                    <button class="action-btn issue-btn" onclick="issueItem(${item.id}, '${stockType}')">📤 Issue</button>
                </td>
            </tr>
        `).join('');
    }
    
    // Global functions for button clicks
    window.editItem = function(itemId, stockType) {
        const items = stockType === 'internal' ? 
            SCMDataManager.getStockByType('internal') : 
            SCMDataManager.getStockByType('external');
        
        const item = items.find(i => i.id === itemId);
        if (!item) return;
        
        // Populate edit modal
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-type').value = stockType;
        document.getElementById('edit-item-name').value = item.itemName;
        document.getElementById('edit-quantity').value = item.quantity;
        document.getElementById('edit-unit-cost').value = item.unitCost;
        document.getElementById('edit-notes').value = item.notes || '';
        
        // Show modal
        document.getElementById('edit-modal').style.display = 'block';
    };
    
    window.deleteItem = function(itemId, stockType) {
        SCMUI.showConfirmation(
            'Are you sure you want to delete this item? This action cannot be undone.',
            'Delete',
            'Cancel'
        ).then(confirmed => {
            if (confirmed) {
                const success = SCMDataManager.deleteStockItem(itemId, stockType);
                if (success) {
                    SCMUI.showNotification('Item deleted successfully', 'success');
                    renderInventory();
                } else {
                    SCMUI.showNotification('Failed to delete item', 'error');
                }
            }
        });
    };
    
    window.issueItem = function(itemId, stockType) {
        const items = stockType === 'internal' ? 
            SCMDataManager.getStockByType('internal') : 
            SCMDataManager.getStockByType('external');
        
        const item = items.find(i => i.id === itemId);
        if (!item) return;
        
        // Redirect to issue page with pre-filled data
        const encodedName = encodeURIComponent(item.itemName);
        const encodedType = encodeURIComponent(stockType === 'internal' ? 'Internal-Use' : 'External-Use');
        window.location.href = `issue - stock.html?item=${encodedName}&type=${encodedType}&max=${item.quantity}`;
    };
    
    // Set up filter handlers
    const categoryFilter = document.getElementById('category-filter');
    const searchInput = document.getElementById('global-search');
    
    if (categoryFilter) {
        categoryFilter.onchange = function() {
            currentFilter.category = this.value || null;
            renderInventory();
        };
    }
    
    if (searchInput) {
        searchInput.oninput = function() {
            currentFilter.search = this.value.trim() || null;
            renderInventory();
        };
    }
    
    // Initial render
    renderInventory();
    
    // Listen for refresh events
    document.addEventListener('scm:refresh', renderInventory);
}

// Reports Page
function initializeReports() {
    function generateReports() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const issueHistory = SCMDataManager.getIssueHistory();
        
        // Update KPI cards
        const totalValue = SCMCalculator.calculateStockValue([...internalStock, ...externalStock]);
        document.getElementById('kpi-total-value').textContent = 
            SCMCalculator.formatCurrency(totalValue);
        
        const lowStockCount = SCMCalculator.calculateLowStockCount([...internalStock, ...externalStock]);
        document.getElementById('kpi-low-stock').textContent = lowStockCount;
        
        // Calculate turnover ratio (simplified)
        const lastMonthHistory = issueHistory.filter(record => {
            const recordDate = new Date(record.date);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return recordDate > thirtyDaysAgo;
        });
        
        const issuedValue = lastMonthHistory.reduce((sum, record) => sum + record.totalValue, 0);
        const avgInventory = totalValue / 2;
        const turnover = avgInventory > 0 ? (issuedValue / avgInventory).toFixed(2) : '0.00';
        document.getElementById('kpi-turnover').textContent = turnover;
        
        // Update internal report
        document.getElementById('internal-items').textContent = internalStock.length;
        document.getElementById('internal-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(internalStock));
        
        const internalAvgCost = internalStock.length > 0 ? 
            internalStock.reduce((sum, item) => sum + item.unitCost, 0) / internalStock.length : 0;
        document.getElementById('internal-avg-cost').textContent = 
            SCMCalculator.formatCurrency(internalAvgCost);
        
        const internalIssued = lastMonthHistory.filter(record => record.stockType === 'Internal-Use').length;
        document.getElementById('internal-issued-month').textContent = internalIssued;
        
        // Update external report
        document.getElementById('external-items').textContent = externalStock.length;
        document.getElementById('external-value').textContent = 
            SCMCalculator.formatCurrency(SCMCalculator.calculateStockValue(externalStock));
        
        // Calculate potential revenue (30% markup)
        const potentialRevenue = externalStock.reduce((sum, item) => 
            sum + (item.quantity * item.unitCost * 1.3), 0);
        document.getElementById('potential-revenue').textContent = 
            SCMCalculator.formatCurrency(potentialRevenue);
        
        const externalIssued = lastMonthHistory.filter(record => record.stockType === 'External-Use').length;
        document.getElementById('external-sold-month').textContent = externalIssued;
        
        // Generate insights
        generateInsights();
    }
    
    function generateInsights() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const issueHistory = SCMDataManager.getIssueHistory();
        
        // Internal insights
        const internalInsights = [];
        const internalLowStock = internalStock.filter(item => item.quantity < SCM_CONFIG.LOW_STOCK_THRESHOLD);
        
        if (internalLowStock.length > 0) {
            internalInsights.push(`${internalLowStock.length} internal items below minimum stock level`);
        }
        
        const highValueInternal = internalStock.filter(item => (item.quantity * item.unitCost) > 1000);
        if (highValueInternal.length > 0) {
            internalInsights.push(`${highValueInternal.length} high-value internal items (> P 1000)`);
        }
        
        if (internalInsights.length === 0) {
            internalInsights.push('Internal stock levels are optimal');
        }
        
        document.getElementById('internal-insights').innerHTML = 
            internalInsights.map(insight => `<li>${insight}</li>`).join('');
        
        // External insights
        const externalInsights = [];
        const externalLowStock = externalStock.filter(item => item.quantity < SCM_CONFIG.LOW_STOCK_THRESHOLD);
        
        if (externalLowStock.length > 0) {
            externalInsights.push(`${externalLowStock.length} resale items need restocking`);
        }
        
        const fastMoving = externalStock.filter(item => {
            const itemIssues = issueHistory.filter(record => 
                record.itemName === item.itemName && 
                record.stockType === 'External-Use'
            );
            return itemIssues.length >= 3;
        });
        
        if (fastMoving.length > 0) {
            externalInsights.push(`${fastMoving.length} items are fast-moving (consider increasing stock)`);
        }
        
        if (externalInsights.length === 0) {
            externalInsights.push('External stock levels are well-managed');
        }
        
        document.getElementById('external-insights').innerHTML = 
            externalInsights.map(insight => `<li>${insight}</li>`).join('');
        
        // Generate recommendations
        generateRecommendations();
    }
    
    function generateRecommendations() {
        const internalStock = SCMDataManager.getStockByType('internal');
        const externalStock = SCMDataManager.getStockByType('external');
        const allStock = [...internalStock, ...externalStock];
        
        const urgentActions = [];
        const strategicRecs = [];
        const efficiencyImps = [];
        
        // Urgent actions
        const criticalStock = allStock.filter(item => item.quantity < SCM_CONFIG.CRITICAL_STOCK_THRESHOLD);
        if (criticalStock.length > 0) {
            urgentActions.push(`Immediate reorder needed for ${criticalStock.length} critical items`);
        }
        
        // Strategic recommendations
        const slowMoving = allStock.filter(item => {
            const itemValue = item.quantity * item.unitCost;
            return itemValue > 500 && item.quantity > 20;
        });
        
        if (slowMoving.length > 0) {
            strategicRecs.push(`Consider reducing stock of ${slowMoving.length} high-value slow-moving items`);
        }
        
        // Efficiency improvements
        const categories = new Set(allStock.map(item => item.category));
        if (categories.size > 10) {
            efficiencyImps.push('Consider consolidating product categories for better management');
        }
        
        // Update DOM
        updateList('urgent-actions', urgentActions, 'No urgent actions required');
        updateList('strategic-recommendations', strategicRecs, 'Continue current inventory strategy');
        updateList('efficiency-improvements', efficiencyImps, 'Current efficiency levels are good');
    }
    
    function updateList(elementId, items, emptyMessage) {
        const list = document.getElementById(elementId);
        
        if (items.length === 0) {
            list.innerHTML = `<li>${emptyMessage}</li>`;
        } else {
            list.innerHTML = items.map(item => `<li>${item}</li>`).join('');
        }
    }
    
    // Initial generation
    generateReports();
    
    // Listen for refresh events
    document.addEventListener('scm:refresh', generateReports);
    
    // Set up period selector
    const periodSelector = document.getElementById('report-period');
    if (periodSelector) {
        periodSelector.onchange = generateReports;
    }
}

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Initialize core system
    SCMInitializer.initializeSystem();
    SCMEvents.initializeEventHandlers();
    
    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop();
    
    switch(currentPage) {
        case 'dashboard.html':
        case '':
        case 'index.html':
            initializeDashboard();
            break;
        case 'inventory.html':
            initializeInventory();
            break;
        case 'reports.html':
            initializeReports();
            break;
        // Add other page initializations as needed
    }
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const activeForm = document.querySelector('form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Ctrl/Cmd + R to refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            SCMEvents.handleRefresh();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.style.display === 'block') {
                    modal.style.display = 'none';
                }
            });
        }
    });
    
    // Global click handler for modal close buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close-modal') || 
            e.target.closest('.close-modal')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        // Close modal when clicking outside
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Add system info to console
    console.log(`%c${SCM_CONFIG.SYSTEM_NAME} v${SCM_CONFIG.VERSION}`, 
        'color: #2196f3; font-size: 16px; font-weight: bold;');
    console.log('%cSupply Chain Management Excellence', 'color: #666;');
    console.log('%cSystem initialized and ready', 'color: #4caf50;');
});

// ===== GLOBAL EXPORTS =====
// Make core functions available globally
window.SCM = {
    config: SCM_CONFIG,
    storage: SCMStorage,
    validator: SCMValidator,
    calculator: SCMCalculator,
    data: SCMDataManager,
    ui: SCMUI,
    exporter: SCMExporter,
    init: SCMInitializer,
    events: SCMEvents
};

// ===== POLYFILLS FOR BROWSER COMPATIBILITY =====
if (!window.CustomEvent) {
    window.CustomEvent = function(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };
    window.CustomEvent.prototype = window.Event.prototype;
}

// ===== SYSTEM READY MESSAGE =====
console.log('SCM JavaScript Engine Loaded Successfully');
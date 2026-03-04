/**
 * =============================================================================
 * Module: ViewManager (Quản lý Giao diện)
 * =============================================================================
 * 
 * @description
 * Module quản lý việc chuyển đổi giữa các View trong ứng dụng.
 * Ứng dụng có 3 View chính:
 * 1. Config: Cấu hình tham số và chọn file.
 * 2. Viz: Hiển thị minh họa thuật toán.
 * 3. Result: Hiển thị kết quả và tải xuống.
 * 
 * @author CS523 - DSA Nâng Cao
 * @version 2.0.0
 */

class ViewManager {
    /**
     * Khởi tạo ViewManager.
     * 
     * @constructor
     * @description
     * Lấy tham chiếu đến tất cả các View từ DOM.
     */
    constructor() {
        this.views = null;
        this.navTabs = null;
        this.currentView = 'config';
        this.simulationStarted = false;
        this._initialized = false;
    }
    
    /**
     * Khởi tạo views sau khi DOM đã sẵn sàng.
     * @private
     */
    _initViews() {
        if (this._initialized) return;
        
        this.views = {
            config: document.getElementById('view-config'),   // Màn hình cấu hình
            viz: document.getElementById('view-viz'),         // Màn hình minh họa
            result: document.getElementById('view-result')    // Màn hình kết quả
        };
        
        // Navigation tabs
        this.navTabs = {
            config: document.getElementById('navTab1'),
            viz: document.getElementById('navTab2'),
            result: document.getElementById('navTab3')
        };
        
        this.navStatusText = document.getElementById('navStatusText');
        this.navStatusDot = document.getElementById('navStatusDot');
        
        // Setup navigation tab click handlers
        this._setupNavigation();
        
        this._initialized = true;
        console.log('ViewManager initialized:', this.views);
    }
    
    /**
     * Setup navigation tab click handlers.
     * @private
     */
    _setupNavigation() {
        if (this.navTabs.config) {
            this.navTabs.config.addEventListener('click', () => {
                this.showConfig();
            });
        }
        
        if (this.navTabs.viz) {
            this.navTabs.viz.addEventListener('click', () => {
                if (this.simulationStarted) {
                    this.showVisualization();
                }
            });
        }
        
        if (this.navTabs.result) {
            this.navTabs.result.addEventListener('click', () => {
                if (this.simulationStarted) {
                    this.showResult();
                }
            });
        }
    }
    
    /**
     * Enable navigation to visualization (called when simulation starts).
     */
    enableVizNav() {
        this.simulationStarted = true;
        if (this.navTabs.viz) {
            this.navTabs.viz.disabled = false;
            this.navTabs.viz.classList.remove('text-slate-400');
            this.navTabs.viz.classList.add('text-slate-200', 'hover:text-white', 'hover:bg-slate-600');
        }
        this._updateStatus('Đang chạy...', 'animate-pulse bg-green-500');
    }
    
    /**
     * Enable navigation to result (called when simulation completes).
     */
    enableResultNav() {
        if (this.navTabs.result) {
            this.navTabs.result.disabled = false;
            this.navTabs.result.classList.remove('text-slate-400');
            this.navTabs.result.classList.add('text-slate-200', 'hover:text-white', 'hover:bg-slate-600');
        }
        this._updateStatus('Hoàn tất!', 'bg-emerald-500');
    }
    
    /**
     * Update navigation status indicator.
     * @private
     */
    _updateStatus(text, dotClass) {
        if (this.navStatusText) {
            this.navStatusText.textContent = text;
        }
        if (this.navStatusDot) {
            this.navStatusDot.className = `w-2 h-2 rounded-full ${dotClass}`;
        }
    }
    
    /**
     * Update active tab styling.
     * @private
     */
    _updateNavTabs(activeView) {
        const tabMap = { config: 'config', viz: 'viz', result: 'result' };
        
        Object.keys(this.navTabs).forEach(key => {
            const tab = this.navTabs[key];
            if (!tab) return;
            
            if (key === activeView) {
                tab.classList.remove('text-slate-400', 'text-slate-200', 'hover:text-white', 'hover:bg-slate-600');
                tab.classList.add('bg-white', 'text-blue-600', 'shadow-md');
            } else {
                tab.classList.remove('bg-white', 'text-blue-600', 'shadow-md');
                if (!tab.disabled) {
                    tab.classList.add('text-slate-200', 'hover:text-white', 'hover:bg-slate-600');
                } else {
                    tab.classList.add('text-slate-400');
                }
            }
        });
    }

    /**
     * Hiển thị một View và ẩn các View khác.
     * 
     * @param {string} viewName - Tên view: 'config', 'viz', hoặc 'result'.
     * @returns {void}
     * 
     * @example
     * viewManager.show('viz'); // Chuyển sang màn hình minh họa
     */
    show(viewName) {
        this._initViews();
        
        if (!this.views) {
            console.error('ViewManager: views not initialized');
            return;
        }
        
        this.currentView = viewName;
        
        Object.keys(this.views).forEach(key => {
            const view = this.views[key];
            if (!view) {
                console.warn(`ViewManager: view "${key}" not found`);
                return;
            }
            
            if (key === viewName) {
                view.classList.remove('hidden-view');
                view.classList.add('active-view');
                console.log(`ViewManager: showing "${key}"`);
            } else {
                view.classList.add('hidden-view');
                view.classList.remove('active-view');
            }
        });
        
        // Update navigation tabs
        this._updateNavTabs(viewName);
    }

    /**
     * Chuyển sang màn hình Cấu hình.
     * 
     * @returns {void}
     * @description
     * Người dùng có thể chọn file và điều chỉnh tham số M, K.
     */
    showConfig() {
        this.show('config');
    }

    /**
     * Chuyển sang màn hình Minh họa.
     * 
     * @returns {void}
     * @description
     * Hiển thị animation từng bước của thuật toán sắp xếp ngoại.
     */
    showVisualization() {
        this.show('viz');
    }

    /**
     * Chuyển sang màn hình Kết quả.
     * 
     * @returns {void}
     * @description
     * Hiển thị dữ liệu đã sắp xếp và các nút tải xuống.
     */
    showResult() {
        this.show('result');
    }
}

// Xuất instance global
window.viewManager = new ViewManager();
/**
 * =============================================================================
 * Module: EducationGuide (Hướng dẫn Học tập)
 * =============================================================================
 * 
 * @description
 * Module quản lý "Góc Học Tập" - cung cấp giải thích chi tiết về từng bước
 * của thuật toán sắp xếp ngoại, giúp người dùng hiểu rõ hơn về quá trình.
 * 
 * @features
 * - Cập nhật tiêu đề và mô tả theo từng bước.
 * - Giải thích ý nghĩa của các thao tác (đọc, sắp xếp, ghi, trộn).
 * - Hỗ trợ học thuật toán External Sort một cách trực quan.
 * 
 * @author CS523 - DSA Nâng Cao
 * @version 2.0.0
 */

class EducationGuide {
    /**
     * Khởi tạo EducationGuide.
     * 
     * @constructor
     * @description
     * Lấy tham chiếu đến các phần tử DOM hiển thị hướng dẫn.
     */
    constructor() {
        // Các phần tử hiển thị
        this.titleEl = document.getElementById('eduStepTitle');
        this.descEl = document.getElementById('eduStepDesc');
        
        // Nodes kiến trúc (không sử dụng trong V2, giữ để tương thích)
        this.nodes = {
            diskIn: null,
            ram: null,
            diskOut: null
        };
        
        // Label tham số M
        this.lblM = document.getElementById('lblM');

        this._init();
    }

    /**
     * Khởi tạo trạng thái ban đầu.
     * 
     * @private
     * @returns {void}
     */
    _init() {
        this.reset();
    }

    /**
     * Reset về trạng thái sẵn sàng.
     * 
     * @returns {void}
     * @description
     * Hiển thị thông báo mặc định khi chưa bắt đầu sắp xếp.
     */
    reset() {
        this._updateText(
            "Sẵn sàng", 
            "Hãy chọn tập tin và nhấn Bắt đầu để xem quá trình sắp xếp."
        );
        this._highlightNode(null);
    }

    /**
     * Cập nhật hướng dẫn dựa trên bước hiện tại.
     * 
     * @param {Object} step - Đối tượng chứa thông tin bước.
     * @param {string} step.phase - Giai đoạn ('run_generation', 'merge_pass', 'complete').
     * @param {string} step.step - Bước cụ thể trong giai đoạn.
     * @param {string} [step.message] - Thông điệp từ generator.
     * @returns {void}
     * 
     * @description
     * Phân tích thông tin bước và hiển thị giải thích phù hợp.
     */
    update(step) {
        if (!step) return;

        // Xử lý theo phase và step từ ExternalSort generator
        const phase = step.phase;
        const stepType = step.step;
        
        switch (phase) {
            case 'run_generation_start':
                this._updateText(
                    "Bắt đầu Giai đoạn 1",
                    `Chia dữ liệu thành các Run nhỏ vừa với RAM (M=${step.memoryLimit || '?'} phần tử).`
                );
                break;
                
            case 'run_generation':
                this._handleRunGenerationStep(step);
                break;
                
            case 'run_generation_complete':
                this._updateText(
                    "Hoàn tất Giai đoạn 1",
                    `Đã tạo ${step.totalRuns || step.runs?.length || '?'} Run. Sẵn sàng trộn.`
                );
                break;
                
            case 'merge_start':
                this._updateText(
                    "Bắt đầu Giai đoạn 2",
                    `Trộn các Run bằng K-Way Merge (K=${step.kWay || '?'}).`
                );
                break;
                
            case 'merge_pass_start':
                this._updateText(
                    `Pass ${step.passNumber || '?'}`,
                    `Trộn ${step.runsCount || '?'} Run thành các Run lớn hơn.`
                );
                break;
                
            case 'merge_pass':
                this._handleMergeStep(step);
                break;
                
            case 'merge_pass_complete':
                this._updateText(
                    `Kết thúc Pass ${step.passNumber || '?'}`,
                    `Còn lại ${step.runs?.length || '?'} Run.`
                );
                break;
                
            case 'merge_complete':
                this._updateText(
                    "Hoàn tất trộn",
                    "Tất cả Run đã được trộn thành 1 Run duy nhất!"
                );
                break;
                
            case 'complete':
                this._updateText(
                    "Sắp xếp hoàn tất!",
                    `Đã sắp xếp xong ${step.sortedData?.length || '?'} phần tử với ${step.comparisonCount || '?'} phép so sánh.`
                );
                break;
                
            default:
                // Fallback: sử dụng message từ generator
                if (step.message) {
                    this._updateText(stepType || "Đang xử lý", step.message);
                }
                break;
        }
    }
    
    /**
     * Xử lý các bước trong giai đoạn tạo Run.
     * 
     * @private
     * @param {Object} step - Thông tin bước.
     * @returns {void}
     */
    _handleRunGenerationStep(step) {
        switch (step.step) {
            case 'read_chunk':
                this._updateText(
                    "Đọc dữ liệu vào RAM",
                    `Đọc ${step.chunk?.length || '?'} phần tử từ đĩa vào bộ nhớ. Do RAM có hạn, chỉ đọc được từng phần nhỏ.`
                );
                this._highlightNode('ram');
                break;
                
            case 'sort_chunk':
            case 'sorting_compare':
            case 'sorting_insert':
                this._updateText(
                    "Sắp xếp trong RAM",
                    step.message || "Đang sắp xếp nội bộ bằng Insertion Sort để dễ minh họa."
                );
                this._highlightNode('ram');
                break;
                
            case 'sorting_complete':
                this._updateText(
                    "Sắp xếp xong",
                    "RAM: Dữ liệu đã được sắp xếp tăng dần. Sẵn sàng ghi ra đĩa."
                );
                this._highlightNode('ram');
                break;
                
            case 'write_run':
                this._updateText(
                    "Tạo Run",
                    `Ghi Run #${(step.runIndex || 0) + 1} xuống đĩa tạm. Run này đã có thứ tự tăng dần.`
                );
                this._highlightNode('diskOut');
                break;
        }
    }
    
    /**
     * Xử lý các bước trong giai đoạn trộn.
     * 
     * @private
     * @param {Object} step - Thông tin bước.
     * @returns {void}
     */
    _handleMergeStep(step) {
        switch (step.step) {
            case 'merge_start':
                this._updateText(
                    "Trộn nhóm Run",
                    `Bắt đầu trộn ${step.runs?.length || '?'} Run thành 1 Run mới.`
                );
                break;
                
            case 'merge_compare':
                const minVal = step.minElement?.value?.toFixed(2) || '?';
                this._updateText(
                    "So sánh tìm Min",
                    `So sánh đầu các Run, tìm được Min = ${minVal}.`
                );
                this._highlightNode('ram');
                break;
                
            case 'merge_select':
                this._updateText(
                    "Chọn phần tử nhỏ nhất",
                    `Đưa ${step.selectedValue?.toFixed(2) || '?'} vào Output. Lấy phần tử tiếp theo từ Run ${(step.selectedRunIndex || 0) + 1}.`
                );
                this._highlightNode('diskOut');
                break;
                
            case 'merge_complete':
                this._updateText(
                    "Trộn xong nhóm",
                    `Đã tạo Run mới với ${step.mergedRun?.length || '?'} phần tử.`
                );
                break;
                
            case 'single_run':
                this._updateText(
                    "Run lẻ",
                    `Run lẻ (${step.run?.length || '?'} phần tử) được chuyển sang pass sau.`
                );
                break;
        }
    }

    /**
     * Cập nhật text hiển thị.
     * 
     * @private
     * @param {string} title - Tiêu đề bước.
     * @param {string} desc - Mô tả chi tiết.
     * @returns {void}
     */
    _updateText(title, desc) {
        if (this.titleEl) this.titleEl.textContent = title;
        if (this.descEl) this.descEl.textContent = desc;
    }

    /**
     * Highlight node trong sơ đồ kiến trúc.
     * 
     * @private
     * @param {string|null} nodeName - Tên node ('diskIn', 'ram', 'diskOut') hoặc null.
     * @returns {void}
     */
    _highlightNode(nodeName) {
        // Reset tất cả
        Object.values(this.nodes).forEach(el => {
            if (el) el.classList.remove('active');
        });

        // Highlight node được chỉ định
        if (nodeName && this.nodes[nodeName]) {
            this.nodes[nodeName].classList.add('active');
        }
    }
}

// Xuất ra phạm vi global
window.EducationGuide = EducationGuide;
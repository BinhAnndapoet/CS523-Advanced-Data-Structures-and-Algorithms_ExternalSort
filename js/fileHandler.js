/**
 * =============================================================================
 * Module: FileHandler (Xử Lý File)
 * =============================================================================
 * 
 * @description
 * Module này chịu trách nhiệm xử lý các thao tác đọc và ghi file nhị phân.
 * Hỗ trợ:
 * - Đọc file .bin chứa các số thực 8 bytes (Float64/double).
 * - Kiểm tra tính hợp lệ của dữ liệu.
 * - Tạo và tải xuống file kết quả (binary hoặc text).
 * 
 * @author CS523 - DSA Nâng Cao
 * @version 2.0.0
 */

class FileHandler {
    /**
     * Khởi tạo FileHandler.
     * 
     * @constructor
     * @description
     * Lưu trữ thông tin về file đang xử lý.
     */
    constructor() {
        this.data = null;       // Dữ liệu đã đọc
        this.fileName = '';     // Tên file
        this.fileSize = 0;      // Kích thước file (bytes)
    }

    /**
     * Đọc file nhị phân và chuyển đổi thành ArrayBuffer.
     * 
     * @static
     * @async
     * @param {File} file - Đối tượng File từ input hoặc drag-drop.
     * @returns {Promise<ArrayBuffer>} ArrayBuffer chứa dữ liệu nhị phân.
     * @throws {Error} Nếu kích thước file không phải bội số của 8 bytes.
     * 
     * @example
     * const buffer = await FileHandler.readFileAsArrayBuffer(file);
     * const data = new Float64Array(buffer);
     */
    static async readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    
                    // Kiểm tra kích thước file: Phải là bội số của 8 (do mỗi số double là 8 bytes)
                    if (arrayBuffer.byteLength % 8 !== 0) {
                        reject(new Error('File không hợp lệ: Kích thước không phải bội số của 8 bytes'));
                        return;
                    }

                    // Chuyển đổi ArrayBuffer thành Float64Array
                    const float64Array = new Float64Array(arrayBuffer);
                    resolve(float64Array);
                } catch (error) {
                    reject(new Error('Lỗi khi đọc file: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Không thể đọc file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Lấy thông tin chi tiết về file đã đọc.
     * 
     * @returns {Object} Đối tượng chứa thông tin file.
     * @property {string} name - Tên file.
     * @property {string} size - Kích thước đã format (ví dụ: "1.5 MB").
     * @property {number} elementCount - Số lượng phần tử.
     */
    getFileInfo() {
        return {
            name: this.fileName,
            size: this._formatFileSize(this.fileSize),
            elementCount: this.data ? this.data.length : 0
        };
    }

    /**
     * Chuyển đổi kích thước file sang định dạng dễ đọc.
     * 
     * @private
     * @param {number} bytes - Kích thước tính bằng bytes.
     * @returns {string} Chuỗi đã format (ví dụ: "1.5 MB").
     */
    _formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Lấy dữ liệu dưới dạng mảng JavaScript tiêu chuẩn.
     * 
     * @returns {Array<number>} Mảng chứa các số thực.
     */
    getDataAsArray() {
        return this.data ? Array.from(this.data) : [];
    }

    /**
     * Tạo Blob chứa dữ liệu nhị phân (Float64Array).
     * 
     * @static
     * @param {Array<number>|Float64Array} data - Dữ liệu cần ghi.
     * @param {string} [fileName='sorted_data.bin'] - Tên file (không sử dụng).
     * @returns {Blob} Blob chứa dữ liệu nhị phân.
     * 
     * @example
     * const blob = FileHandler.createBinaryFile(sortedData);
     * FileHandler.downloadFile(blob, 'output.bin');
     */
    static createBinaryFile(data, fileName = 'sorted_data.bin') {
        const float64Array = new Float64Array(data);
        return new Blob([float64Array.buffer], { type: 'application/octet-stream' });
    }

    /**
     * Tải xuống một Blob dưới dạng file.
     * 
     * @static
     * @param {Blob} blob - Blob cần tải xuống.
     * @param {string} fileName - Tên file sẽ lưu.
     * @returns {void}
     * 
     * @example
     * FileHandler.downloadFile(blob, 'sorted_output.bin');
     */
    static downloadFile(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Kiểm tra tính hợp lệ của dữ liệu.
     * 
     * @static
     * @param {Float64Array|Array<number>} data - Dữ liệu cần kiểm tra.
     * @returns {boolean} True nếu hợp lệ (không có NaN, Infinity).
     * 
     * @example
     * if (FileHandler.validateData(data)) {
     *     // Dữ liệu OK, có thể xử lý
     * }
     */
    static validateData(data) {
        if (!data || data.length === 0) {
            return false;
        }

        for (let i = 0; i < data.length; i++) {
            if (!Number.isFinite(data[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Tạo Blob chứa dữ liệu dạng text (mỗi số một dòng).
     * 
     * @static
     * @param {Array<number>} data - Dữ liệu cần ghi.
     * @returns {Blob} Blob chứa text.
     * 
     * @example
     * const blob = FileHandler.createTextFile(sortedData);
     * // blob chứa: "123.45\n678.90\n..."
     */
    static createTextFile(data) {
        const text = data.join('\n');
        return new Blob([text], { type: 'text/plain' });
    }
}

// Xuất ra phạm vi global
window.FileHandler = FileHandler;
class SortController {
    constructor() {
        // Core Modules
        this.viz = null;       
        this.sorter = null;     
        this.guide = null;   
        
        // Data State
        this.inputData = null;            
        this.ramSize = 4;         
        this.mergeChannels = 2;   // K-Way
        this.finalData = null;       
        
        document.addEventListener('DOMContentLoaded', () => this.boot());
    }

    async boot() {
        console.log('🚀 AlgoViz Controller is starting...');
        
        // DOM References
        this.dom = {
            fileInput: document.getElementById('fileInput'),
            ramInput: document.getElementById('ramInput'),
            ramDisplay: document.getElementById('ramDisplay'),
            kInput: document.getElementById('kInput'),
            kDisplay: document.getElementById('kDisplay'),
            btnStart: document.getElementById('btnStartSimulation'),
            btnBack: document.getElementById('btnBackToConfig'),
            btnReset: document.getElementById('btnReset'),
            btnStep: document.getElementById('btnStep'),
            btnNew: document.getElementById('btnNewSort'),
            estChunks: document.getElementById('estChunks'),
            estPasses: document.getElementById('estPasses'),
            previewTable: document.getElementById('previewBody'),
            fileName: document.getElementById('fileNameDisplay'),
            previewBox: document.getElementById('previewContainer')
        };

        this._attachEvents();
        
        // Initialize Modules
        if (this.dom.ramInput) this.ramSize = parseInt(this.dom.ramInput.value);
        if (this.dom.kInput) this.mergeChannels = parseInt(this.dom.kInput.value);
        
        // Changed Classes
        this.viz = new SortVisualizer();
        this.guide = new EducationGuide();
        
        if (this._checkStorage()) return;
        
        viewManager.showConfig();
        console.log('✅ System Ready!');
    }

    _attachEvents() {
        if (this.dom.btnStart) this.dom.btnStart.addEventListener('click', () => this.runProcess());
        if (this.dom.btnBack) this.dom.btnBack.addEventListener('click', () => {
            this.hardReset();
            viewManager.showConfig();
        });
        
        if (this.dom.btnReset) this.dom.btnReset.addEventListener('click', () => {
            this.viz.clearAll();
            this.runProcess();
        });
        
        if (this.dom.btnStep) this.dom.btnStep.addEventListener('click', () => this.viz.nextStep());
        if (this.dom.btnNew) this.dom.btnNew.addEventListener('click', () => {
            this.hardReset();
            viewManager.showConfig();
        });

        const btnBin = document.getElementById('btnDownloadBin');
        const btnTxt = document.getElementById('btnDownloadTxt');
        if (btnBin) btnBin.addEventListener('click', () => this._exportBin());
        if (btnTxt) btnTxt.addEventListener('click', () => this._exportTxt());

        const btnGen = document.getElementById('btnGenRandom');
        const inpGen = document.getElementById('randomCountInput');
        if (btnGen && inpGen) {
            btnGen.addEventListener('click', (e) => { 
                e.stopPropagation();
                let val = Math.max(5, Math.min(1000, parseInt(inpGen.value) || 50));
                inpGen.value = val;
                this.createRandomData(val); 
            });
        }
        
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.addEventListener('click', () => this.dom.fileInput.click());
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-violet-500'); });
            dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('border-violet-500'); });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('border-violet-500');
                if (e.dataTransfer.files.length) this._onFile(e.dataTransfer.files[0]);
            });
        }

        if (this.dom.fileInput) this.dom.fileInput.addEventListener('change', (e) => this._onFile(e.target.files[0]));
        
        if (this.dom.ramInput) {
            this.dom.ramInput.addEventListener('input', (e) => {
                this.ramSize = parseInt(e.target.value);
                if (this.dom.ramDisplay) this.dom.ramDisplay.textContent = this.ramSize;
                this._calcEstimates();
            });
        }
        
        if (this.dom.kInput) {
            this.dom.kInput.addEventListener('input', (e) => {
                this.mergeChannels = parseInt(e.target.value);
                if (this.dom.kDisplay) this.dom.kDisplay.textContent = this.mergeChannels;
                this._calcEstimates();
            });
        }
    }
    
    _calcEstimates() {
        if (!this.inputData) return;
        const total = this.inputData.length;
        const chunks = Math.ceil(total / this.ramSize);
        let passes = chunks > 1 ? Math.ceil(Math.log(chunks) / Math.log(this.mergeChannels)) : 0;
        
        if (this.dom.estChunks) this.dom.estChunks.textContent = chunks;
        if (this.dom.estPasses) this.dom.estPasses.textContent = passes;
    }

    async createRandomData(size) {
        console.log(`🎲 Generating ${size} random items...`);
        const arr = new Float64Array(size);
        for (let i = 0; i < size; i++) arr[i] = Math.random() * 100;
        this.inputData = arr;
        
        // Mock File event
        this._onFile(null, true);
    }

    async _onFile(file, isMock = false) {
        if (!isMock) {
            if (!file) return;
            if (this.dom.fileName) this.dom.fileName.textContent = file.name;
            try {
                const buf = await FileHandler.readFileAsArrayBuffer(file);
                this.inputData = new Float64Array(buf);
            } catch (err) {
                alert("Error: " + err.message);
                return;
            }
        } else {
             if (this.dom.fileName) this.dom.fileName.textContent = "Random_Data.bin";
        }

        console.log(`📂 Data Loaded: ${this.inputData.length} items`);
        this._calcEstimates();
        this._renderPreview();
        if (this.dom.previewBox) this.dom.previewBox.classList.remove('hidden');
    }
    
    _renderPreview() {
        if (!this.inputData || !this.dom.previewTable) return;
        this.dom.previewTable.innerHTML = '';
        const limit = Math.min(this.inputData.length, 50);
        
        for (let i = 0; i < limit; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="py-1 px-4 text-slate-400 w-16">${i}</td><td class="py-1 px-4 font-mono font-bold text-violet-600">${this.inputData[i].toFixed(2)}</td>`;
            this.dom.previewTable.appendChild(tr);
        }
    }

    async runProcess() {
        if (!this.inputData) { alert("Vui lòng chọn dữ liệu!"); return; }
        
        console.log(`🎬 ACTION: M=${this.ramSize}, K=${this.mergeChannels}`);
        viewManager.enableVizNav();
        viewManager.showVisualization();
        
        // Updated Class Name
        this.sorter = new ExternalMergeSorter(this.inputData, {
            memoryLimit: this.ramSize,
            kWay: this.mergeChannels
        });

        this.viz.clearAll();
        this.guide.reset();
        this.viz.drawInput(this.inputData);

        await this._executeLoop();
    }
    
    async _executeLoop() {
        for (const step of this.sorter.executeSort()) {
            await this.viz.render(step);
            if (step.phase === 'complete') {
                this.finalData = step.sortedData;
                this._saveState(step);
            }
            this.guide.update(step);
        }
    }
    
    _exportBin() {
        if (!this.finalData) return;
        FileHandler.downloadFile(FileHandler.createBinaryFile(this.finalData), 'sorted.bin');
    }
    
    _exportTxt() {
        if (!this.finalData) return;
        // Mock download via URL blob
        const blob = FileHandler.createTextFile(this.finalData);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'sorted.txt';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    
    hardReset() {
        this.inputData = null;
        this.finalData = null;
        if (this.dom.fileName) this.dom.fileName.textContent = "Chưa có file";
        if (this.dom.previewBox) this.dom.previewBox.classList.add('hidden');
        this.viz.clearAll();
        sessionStorage.removeItem('algoVizState');
    }
    
    _saveState(step) {
        const state = {
            sortedData: Array.from(step.sortedData),
            meta: step,
            config: { m: this.ramSize, k: this.mergeChannels },
            ts: Date.now()
        };
        sessionStorage.setItem('algoVizState', JSON.stringify(state));
    }
    
    _checkStorage() {
        try {
            const raw = sessionStorage.getItem('algoVizState');
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.finalData = new Float64Array(data.sortedData);
            this.ramSize = data.config.m;
            this.mergeChannels = data.config.k;
            
            // Re-render final screen
            const mockStep = { ...data.meta, sortedData: this.finalData, phase: 'complete' };
            this.viz._showResults(mockStep);
            viewManager.showResult();
            return true;
        } catch (e) { return false; }
    }
}

// Global Instance
window.MainController = new SortController();
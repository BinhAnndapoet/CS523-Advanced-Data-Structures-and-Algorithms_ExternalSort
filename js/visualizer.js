/**
 * =============================================================================
 * Module: SortVisualizer (Hiển thị)
 * =============================================================================
 */

class SortVisualizer {
    constructor() {
        // UI Containers
        this.el = {
            input: document.getElementById('viz-input-stream'),
            ram: document.getElementById('viz-ram-buffer'),
            disk: document.getElementById('viz-disk-runs'),
            lanes: document.getElementById('viz-merge-lanes'),
            heap: document.getElementById('viz-min-heap-tree'),
            output: document.getElementById('viz-final-output'),
            
            // Labels & Text
            stepLbl: document.getElementById('lblStepCount'),
            status: document.getElementById('vizStatusText'),
            phase: document.getElementById('vizPhaseTitle'),
            inputRem: document.getElementById('inputRemaining'),
            
            // Phase 1 specific
            ramSts: document.getElementById('ramStatus'),
            runsCnt: document.getElementById('runsCount'),
            cmpBox: document.getElementById('currentCompareBox'),
            cmpTxt: document.getElementById('compareDetail'),
            
            // Phase 2 specific
            mergeInfo: document.getElementById('mergeInputInfo'),
            outCnt: document.getElementById('outputCount'),
            
            // Stats
            sComp: document.getElementById('statCompares'),
            sWrite: document.getElementById('statWrites'),
            
            // Controls
            slider: document.getElementById('speedSlider'),
            per: document.getElementById('speedPercent'),
            btnPlay: document.getElementById('btnPlay'),
            btnPause: document.getElementById('btnPause')
        };
        
        this.delay = 500;
        this.paused = false;
        this.stepFlag = false;
        this.cnt = 0;
        this.stat = { cmp: 0, w: 0 };
        
        this._initControls();
    }
    
    _initControls() {
        if (this.el.slider) {
            this.el.slider.addEventListener('input', (e) => {
                const v = parseInt(e.target.value);
                this.delay = Math.max(10, 2010 - v); // Invert logic
                if (this.el.per) this.el.per.textContent = Math.round((v-100)/1900*100) + '%';
            });
            // Init default
            const v = parseInt(this.el.slider.value);
            this.delay = Math.max(10, 2010 - v);
        }
        
        if (this.el.btnPlay) this.el.btnPlay.addEventListener('click', () => { this.paused = false; this._uiPlay(true); });
        if (this.el.btnPause) this.el.btnPause.addEventListener('click', () => { this.paused = true; this._uiPlay(false); });
    }
    
    _uiPlay(isPlaying) {
        this.el.btnPlay?.classList.toggle('hidden', isPlaying);
        this.el.btnPause?.classList.toggle('hidden', !isPlaying);
        if (this.el.status) this.el.status.textContent = isPlaying ? "Đang xử lý..." : "Tạm dừng";
    }
    
    nextStep() {
        this.stepFlag = true;
        this.paused = false;
    }
    
    clearAll() {
        this.cnt = 0;
        this.paused = false;
        this.stat = { cmp: 0, w: 0 };
        this._uiPlay(true);
        
        ['input', 'ram', 'disk', 'lanes', 'heap', 'output'].forEach(k => {
            if (this.el[k]) this.el[k].innerHTML = '';
        });
        
        document.getElementById('viz-phase-1')?.classList.remove('hidden');
        document.getElementById('viz-phase-2')?.classList.add('hidden');
        if (this.el.phase) this.el.phase.textContent = "Phase 1: Tạo Runs";
    }

    drawInput(data) {
        if (!this.el.input) return;
        this.el.input.innerHTML = '';
        if (this.el.inputRem) this.el.inputRem.textContent = data.length;
        
        data.slice(0, 20).forEach((val, i) => {
            const div = document.createElement('div');
            div.className = 'bg-slate-700/50 p-2 rounded text-xs font-mono text-slate-300 flex justify-between border border-slate-600';
            div.innerHTML = `<span>[${i}]</span><span class="text-white font-bold">${val.toFixed(1)}</span>`;
            this.el.input.appendChild(div);
        });
    }

    async render(step) {
        while (this.paused && !this.stepFlag) await new Promise(r => setTimeout(r, 100));
        
        if (this.stepFlag) { this.stepFlag = false; this.paused = true; this._uiPlay(false); }
        
        this.cnt++;
        
        // Update stats
        if (step.step === 'sorting_compare' || step.step === 'merge_compare') this.stat.cmp++;
        if (step.step === 'write_run' || step.step === 'merge_select') this.stat.w++;
        
        if (this.el.sComp) this.el.sComp.textContent = this.stat.cmp;
        if (this.el.sWrite) this.el.sWrite.textContent = this.stat.w;
        
        // Inspector
        this._logInspector(step);

        // Routing
        if (step.phase.startsWith('run_')) this._drawPhase1(step);
        else if (step.phase.startsWith('merge_')) this._drawPhase2(step);
        else if (step.phase === 'complete') this._showResults(step);

        await new Promise(r => setTimeout(r, this.delay));
    }

    _logInspector(step) {
        const box = document.getElementById('inspectorContent');
        if (!box) return;
        const div = document.createElement('div');
        div.className = 'border-l-2 border-violet-500 pl-2 py-1 mb-1 animate-fade-in';
        div.innerHTML = `<span class="text-violet-400 font-bold">[${step.step}]</span> <span class="text-slate-400">${step.message}</span>`;
        box.prepend(div);
        if (box.children.length > 20) box.lastChild.remove();
    }

    _drawPhase1(step) {
        const p1 = document.getElementById('viz-phase-1');
        const p2 = document.getElementById('viz-phase-2');
        if (p1.classList.contains('hidden')) { p1.classList.remove('hidden'); p2.classList.add('hidden'); }

        switch(step.step) {
            case 'read_chunk':
                if (this.el.ramSts) this.el.ramSts.textContent = "READING";
                this._drawRam(step.chunk, false);
                break;
            case 'sorting_compare':
                if (this.el.ramSts) this.el.ramSts.textContent = "COMPARING";
                this._drawRam(step.array, false, step.comparing);
                this._showCmp(step);
                break;
            case 'sorting_complete':
                if (this.el.ramSts) this.el.ramSts.textContent = "SORTED";
                this._drawRam(step.sortedArray, true);
                if (this.el.cmpBox) this.el.cmpBox.classList.add('hidden');
                break;
            case 'write_run':
                this._addDiskRun(step.runIndex, step.run);
                this.el.ram.innerHTML = ''; // Clear RAM
                if (this.el.runsCnt) this.el.runsCnt.textContent = (step.runIndex + 1);
                break;
        }
    }

    _showCmp(step) {
        if (!this.el.cmpBox || !this.el.cmpTxt) return;
        const arr = step.array;
        const idx = step.comparing[0];
        const key = step.key;
        if (idx !== undefined) {
             this.el.cmpBox.classList.remove('hidden');
             const val = arr[idx];
             this.el.cmpTxt.innerHTML = `<span class="text-white">${val.toFixed(1)}</span> ${val > key ? '>' : '≤'} <span class="text-fuchsia-400">${key.toFixed(1)}</span>`;
        }
    }

    _drawRam(data, sorted, highlights=[]) {
        if (!this.el.ram) return;
        this.el.ram.innerHTML = '';
        const max = Math.max(...data, 1);
        
        data.forEach((v, i) => {
            const h = (v / max) * 100;
            const bar = document.createElement('div');
            let color = sorted ? 'bg-emerald-500' : 'bg-violet-500';
            if (highlights.includes(i)) color = 'bg-amber-400 box-shadow-glow';
            
            bar.className = `w-8 mx-0.5 rounded-t-md transition-all ${color} relative group`;
            bar.style.height = `${Math.max(10, h)}%`;
            bar.innerHTML = `<span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-white font-bold opacity-0 group-hover:opacity-100">${v.toFixed(0)}</span>`;
            this.el.ram.appendChild(bar);
        });
    }

    /**
     * UPDATED: Hiển thị chi tiết giá trị của Run
     */
    _addDiskRun(idx, data) {
        if (!this.el.disk) return;
        
        // Tạo chuỗi preview: "1.0, 5.2, 9.9..."
        const preview = data.slice(0, 6).map(v => v.toFixed(1)).join(', ');
        const more = data.length > 6 ? `... (+${data.length - 6})` : '';
        
        const d = document.createElement('div');
        d.className = 'bg-slate-700 p-2 rounded border-l-4 border-fuchsia-500 text-xs text-slate-300 animate-fade-in mb-2 shadow-sm';
        
        // Dòng tiêu đề: Run X [N items]
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-1';
        header.innerHTML = `
            <span class="font-bold text-fuchsia-400">Run ${idx+1}</span>
            <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">${data.length} items</span>
        `;
        
        // Dòng dữ liệu
        const content = document.createElement('div');
        content.className = 'font-mono text-slate-400 break-all bg-slate-800/50 p-1.5 rounded border border-slate-600/50';
        content.textContent = `[${preview}${more}]`;
        
        d.appendChild(header);
        d.appendChild(content);
        
        this.el.disk.appendChild(d);
        // Auto scroll xuống dưới cùng
        this.el.disk.scrollTop = this.el.disk.scrollHeight;
    }

    _drawPhase2(step) {
        const p1 = document.getElementById('viz-phase-1');
        const p2 = document.getElementById('viz-phase-2');
        if (p2.classList.contains('hidden')) { 
            p1.classList.add('hidden'); p2.classList.remove('hidden'); 
            if (this.el.phase) this.el.phase.textContent = "Phase 2: K-Way Merge";
        }

        if (step.step === 'init' && step.runs) {
            this._drawLanes(step.runs);
            if (this.el.mergeInfo) this.el.mergeInfo.textContent = `${step.runs.length} Runs`;
        }
        
        if (step.step === 'merge_compare') {
            this._drawHeap(step.comparing);
        }
        
        if (step.step === 'merge_select') {
            this._addToOutput(step.selectedValue);
            // Update lanes visual (simple remove top)
             const lane = document.getElementById(`lane-${step.selectedRunIndex}`);
             if(lane && lane.children.length > 1) lane.children[1].remove(); 
        }
    }

    _drawLanes(runs) {
        if (!this.el.lanes) return;
        this.el.lanes.innerHTML = '';
        runs.forEach((r, i) => {
            const col = document.createElement('div');
            col.id = `lane-${i}`;
            col.className = 'min-w-[60px] flex flex-col gap-1';
            col.innerHTML = `<div class="text-[10px] font-bold text-center text-slate-500">R${i+1}</div>`;
            r.slice(0, 5).forEach(v => {
                const b = document.createElement('div');
                b.className = 'bg-slate-700 text-center text-[10px] text-white py-1 rounded border border-slate-600';
                b.textContent = v.toFixed(0);
                col.appendChild(b);
            });
            this.el.lanes.appendChild(col);
        });
    }

    _drawHeap(items) {
        if (!this.el.heap) return;
        this.el.heap.innerHTML = '';
        if(!items || !items.length) return;
        
        const minVal = Math.min(...items.map(i => i.value));
        
        items.forEach(it => {
            const isMin = it.value === minVal;
            const node = document.createElement('div');
            node.className = `w-12 h-12 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${isMin ? 'bg-amber-500 border-yellow-300 text-white scale-110 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-slate-700 border-slate-500 text-slate-300'}`;
            node.innerHTML = `<div>${it.value.toFixed(0)}<div class="text-[8px] opacity-70">R${it.runIndex+1}</div></div>`;
            this.el.heap.appendChild(node);
        });
    }

    _addToOutput(val) {
        if (!this.el.output) return;
        const d = document.createElement('div');
        d.className = 'bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded animate-fade-in';
        d.textContent = val.toFixed(1);
        this.el.output.appendChild(d);
        this.el.output.scrollTop = this.el.output.scrollHeight;
        if (this.el.outCnt) this.el.outCnt.textContent = (this.el.output.children.length) + " items";
    }
    
    _showResults(step) {
        const data = step.sortedData || [];
        document.getElementById('resTotalElements').textContent = data.length;
        document.getElementById('resTotalCompares').textContent = this.stat.cmp;
        document.getElementById('resTotalSteps').textContent = this.cnt;
        viewManager.enableResultNav();
        viewManager.showResult();
    }
}

window.SortVisualizer = SortVisualizer;
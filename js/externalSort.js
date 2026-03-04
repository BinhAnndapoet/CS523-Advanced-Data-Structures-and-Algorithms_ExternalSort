class ExternalMergeSorter {
    constructor(data, options = {}) {
        this.M = options.memoryLimit || 4;  
        this.K = options.kWay || 2;               
        
        this.source = Array.isArray(data) ? [...data] : Array.from(data);
        this.runs = [];          
        this.result = [];    
        
        this.metrics = { cmp: 0, read: 0, write: 0 };
    }

    reset() {
        this.runs = [];
        this.result = [];
        this.metrics = { cmp: 0, read: 0, write: 0 };
    }

    *executeSort() {
        const data = [...this.source];
        
        // === PHASE 1: GENERATE RUNS ===
        yield* this._phaseOne(data);
        
        // === PHASE 2: MERGE RUNS ===
        yield* this._phaseTwo();
        
        if (this.runs.length === 1) this.result = [...this.runs[0]];
        
        yield {
            phase: 'complete',
            step: 'finished',
            message: 'Hoàn tất quá trình sắp xếp.',
            sortedData: this.result,
            comparisonCount: this.metrics.cmp,
            readCount: this.metrics.read,
            writeCount: this.metrics.write
        };
    }

    *_phaseOne(data) {
        yield {
            phase: 'run_generation_start',
            step: 'init',
            message: `Bắt đầu Phase 1: Tạo Runs (M=${this.M})`,
            totalElements: data.length,
            memoryLimit: this.M
        };

        let runIdx = 0;
        let pos = 0;

        while (pos < data.length) {
            // Read
            const chunk = data.slice(pos, pos + this.M);
            this.metrics.read++;
            
            yield {
                phase: 'run_generation',
                step: 'read_chunk',
                message: `Đọc ${chunk.length} phần tử vào RAM`,
                runIndex: runIdx,
                chunk: [...chunk],
                chunkSize: chunk.length,
                position: pos,
                currentChunk: [...chunk]
            };

            // Sort Internal
            const sorted = yield* this._internalSort(chunk, runIdx);
            
            // Write
            this.runs.push([...sorted]);
            this.metrics.write++;

            yield {
                phase: 'run_generation',
                step: 'write_run',
                message: `Ghi Run #${runIdx + 1} xuống đĩa`,
                runIndex: runIdx,
                run: [...sorted],
                allRuns: this.runs.map(r => [...r])
            };

            pos += this.M;
            runIdx++;
        }

        yield {
            phase: 'run_generation_complete',
            step: 'phase_complete',
            message: `Phase 1 xong. Đã tạo ${this.runs.length} Runs.`,
            runs: this.runs.map(r => [...r]),
            totalRuns: this.runs.length
        };
    }

    *_internalSort(chunk, runIdx) {
        const arr = [...chunk];
        
        yield {
            phase: 'run_generation',
            step: 'sort_chunk',
            message: 'Sắp xếp nội bộ (Insertion Sort)',
            runIndex: runIdx,
            array: [...arr],
            currentChunk: [...arr]
        };

        for (let i = 1; i < arr.length; i++) {
            const key = arr[i];
            let j = i - 1;

            yield {
                phase: 'run_generation',
                step: 'sorting_compare',
                message: `Xét phần tử ${key.toFixed(2)}`,
                runIndex: runIdx,
                array: [...arr],
                comparing: [i],
                key: key,
                currentChunk: [...arr]
            };

            while (j >= 0) {
                this.metrics.cmp++;
                
                yield {
                    phase: 'run_generation',
                    step: 'sorting_compare',
                    message: `So sánh ${key.toFixed(2)} vs ${arr[j].toFixed(2)}`,
                    runIndex: runIdx,
                    array: [...arr],
                    comparing: [j, i],
                    key: key,
                    currentChunk: [...arr]
                };

                if (arr[j] > key) {
                    arr[j + 1] = arr[j];
                    j--;
                } else {
                    break;
                }
            }

            arr[j + 1] = key;

            yield {
                phase: 'run_generation',
                step: 'sorting_insert',
                message: `Chèn ${key.toFixed(2)}`,
                runIndex: runIdx,
                array: [...arr],
                insertedAt: j + 1,
                currentChunk: [...arr]
            };
        }

        yield {
            phase: 'run_generation',
            step: 'sorting_complete',
            message: 'Sắp xếp xong chunk hiện tại',
            runIndex: runIdx,
            sortedArray: [...arr],
            currentChunk: [...arr]
        };

        return arr;
    }

    *_phaseTwo() {
        if (this.runs.length <= 1) {
            yield { phase: 'merge_start', step: 'skip', message: 'Không cần merge.', runs: this.runs, kWay: this.K };
            return;
        }

        yield {
            phase: 'merge_start',
            step: 'init',
            message: `Bắt đầu Phase 2: K-Way Merge (K=${this.K})`,
            runs: this.runs.map(r => [...r]),
            kWay: this.K
        };

        let passNum = 1;

        while (this.runs.length > 1) {
            yield {
                phase: 'merge_pass_start',
                step: 'pass_init',
                message: `--- Pass ${passNum} ---`,
                passNumber: passNum,
                runsCount: this.runs.length,
                runs: this.runs.map(r => [...r])
            };

            const nextRuns = [];
            let grpIdx = 0;

            while (this.runs.length > 0) {
                const batch = this.runs.splice(0, Math.min(this.K, this.runs.length));

                if (batch.length === 1) {
                    nextRuns.push(batch[0]);
                    yield {
                        phase: 'merge_pass',
                        step: 'single_run',
                        message: `Run lẻ, giữ nguyên`,
                        passNumber: passNum,
                        groupIndex: grpIdx,
                        run: [...batch[0]]
                    };
                } else {
                    const merged = yield* this._mergeK(batch, passNum, grpIdx);
                    nextRuns.push(merged);
                }
                grpIdx++;
            }

            this.runs = nextRuns;
            yield {
                phase: 'merge_pass_complete',
                step: 'pass_done',
                message: `Xong Pass ${passNum}`,
                passNumber: passNum,
                runs: this.runs.map(r => [...r])
            };
            passNum++;
        }

        yield {
            phase: 'merge_complete',
            step: 'done',
            message: 'Merge hoàn tất.',
            finalRun: this.runs.length > 0 ? [...this.runs[0]] : []
        };
    }

    *_mergeK(runs, passNum, grpIdx) {
        yield {
            phase: 'merge_pass',
            step: 'merge_start',
            message: `Merge nhóm ${grpIdx + 1}`,
            passNumber: passNum,
            groupIndex: grpIdx,
            runs: runs.map(r => [...r])
        };

        const res = [];
        const ptrs = new Array(runs.length).fill(0);

        while (true) {
            let minVal = Infinity;
            let minRunIdx = -1;
            const comparing = [];

            for (let i = 0; i < runs.length; i++) {
                if (ptrs[i] < runs[i].length) {
                    const val = runs[i][ptrs[i]];
                    comparing.push({ runIndex: i, elementIndex: ptrs[i], value: val });
                    this.metrics.cmp++;
                    if (val < minVal) { minVal = val; minRunIdx = i; }
                }
            }

            if (minRunIdx === -1) break;

            yield {
                phase: 'merge_pass',
                step: 'merge_compare',
                message: `Tìm Min trong ${comparing.length} đầu runs`,
                passNumber: passNum,
                groupIndex: grpIdx,
                comparing: comparing,
                minElement: { runIndex: minRunIdx, value: minVal }
            };

            res.push(minVal);
            ptrs[minRunIdx]++;
            this.metrics.write++;

            yield {
                phase: 'merge_pass',
                step: 'merge_select',
                message: `Chọn ${minVal.toFixed(2)}`,
                passNumber: passNum,
                groupIndex: grpIdx,
                selectedValue: minVal,
                selectedRunIndex: minRunIdx,
                currentResult: [...res]
            };
        }

        yield {
            phase: 'merge_pass',
            step: 'merge_complete',
            message: `Xong nhóm ${grpIdx + 1}`,
            passNumber: passNum,
            groupIndex: grpIdx,
            mergedRun: [...res]
        };

        return res;
    }
}

window.ExternalMergeSorter = ExternalMergeSorter;
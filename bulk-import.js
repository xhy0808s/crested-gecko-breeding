// 대량 데이터 가져오기 및 최적화 시스템
'use strict';

// 전역 오류 처리
window.addEventListener('error', function(e) {
    console.error('전역 오류:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('처리되지 않은 Promise 오류:', e.reason);
});
class BulkDataManager {
    constructor() {
        // 보안 검사
        this.validateSecurity();
        
        // 설정
        this.batchSize = 10; // 한 번에 처리할 개체 수
        this.compressionLevel = 0.7; // 이미지 압축 품질
        this.maxImageSize = 200; // 최대 이미지 크기 (KB)
    }
    
    // 보안 검사 함수
    validateSecurity() {
        if (typeof window === 'undefined') {
            throw new Error('브라우저 환경이 아닙니다.');
        }
        
        // CSP 위반 방지를 위한 기본 검사
        try {
            const testDiv = document.createElement('div');
            testDiv.innerHTML = '<span>test</span>';
            if (!testDiv.querySelector('span')) {
                throw new Error('DOM 조작이 제한되어 있습니다.');
            }
        } catch (e) {
            throw new Error('보안 정책으로 인해 실행할 수 없습니다.');
        }
        
        return true;
    }
    
    // Excel/CSV 파일에서 대량 데이터 가져오기
    async importFromFile(file) {
        try {
            const fileType = file.name.toLowerCase();
            let data = [];
            
            if (fileType.includes('.csv')) {
                data = await this.parseCSV(file);
            } else if (fileType.includes('.xlsx') || fileType.includes('.xls')) {
                data = await this.parseExcel(file);
            } else if (fileType.includes('.json')) {
                data = await this.parseJSON(file);
            } else {
                throw new Error('지원하지 않는 파일 형식입니다. CSV, Excel, JSON 파일을 사용해주세요.');
            }
            
            console.log(`📊 ${data.length}개의 개체 데이터를 발견했습니다.`);
            
            // 배치 처리로 데이터 저장
            await this.processBatchData(data);
            
        } catch (error) {
            console.error('파일 가져오기 실패:', error);
            throw error;
        }
    }
    
    // CSV 파일 파싱
    async parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const headers = lines[0].split(',').map(h => h.trim());
                    const data = [];
                    
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim());
                            const item = {};
                            headers.forEach((header, index) => {
                                item[header] = values[index] || '';
                            });
                            data.push(item);
                        }
                    }
                    
                    resolve(this.normalizeData(data));
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    // JSON 파일 파싱
    async parseJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(this.normalizeData(Array.isArray(data) ? data : [data]));
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }
    
    // 데이터 정규화 (다양한 형식을 표준 형식으로 변환)
    normalizeData(rawData) {
        return rawData.map((item, index) => {
            return {
                id: Date.now().toString() + '_' + index,
                name: item.name || item.이름 || item.개체명 || `개체_${index + 1}`,
                gender: this.normalizeGender(item.gender || item.성별 || item.sex || ''),
                generation: this.normalizeGeneration(item.generation || item.세대 || item.gen || 'F1'),
                morph: item.morph || item.모프 || item.품종 || '',
                status: '활성',
                birthDate: this.normalizeDate(item.birthDate || item.출생일 || item.birth || ''),
                parent1: item.parent1 || item.부개체 || item.father || '',
                parent2: item.parent2 || item.모개체 || item.mother || '',
                notes: item.notes || item.메모 || item.비고 || '',
                weight: item.weight || item.무게 || '',
                imageData: null, // 이미지는 별도 처리
                createdAt: new Date().toISOString()
            };
        });
    }
    
    // 성별 정규화
    normalizeGender(gender) {
        const g = gender.toLowerCase();
        if (g.includes('수컷') || g.includes('male') || g.includes('m')) return '수컷';
        if (g.includes('암컷') || g.includes('female') || g.includes('f')) return '암컷';
        return '미구분';
    }
    
    // 세대 정규화
    normalizeGeneration(generation) {
        const g = generation.toUpperCase();
        if (g.includes('F1') || g.includes('1')) return 'F1';
        if (g.includes('F2') || g.includes('2')) return 'F2';
        if (g.includes('F3') || g.includes('3')) return 'F3';
        if (g.includes('F4') || g.includes('4')) return 'F4';
        if (g.includes('F5') || g.includes('5')) return 'F5';
        if (g.includes('F6') || g.includes('6')) return 'F6';
        return 'F1';
    }
    
    // 날짜 정규화
    normalizeDate(date) {
        if (!date) return new Date().toISOString().split('T')[0];
        
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return d.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    }
    
    // 배치 처리로 데이터 저장
    async processBatchData(data) {
        const totalBatches = Math.ceil(data.length / this.batchSize);
        let processedCount = 0;
        
        for (let i = 0; i < totalBatches; i++) {
            const start = i * this.batchSize;
            const end = start + this.batchSize;
            const batch = data.slice(start, end);
            
            console.log(`📦 배치 ${i + 1}/${totalBatches} 처리 중... (${batch.length}개 개체)`);
            
            // 진행률 표시 업데이트
            this.updateProgress(processedCount, data.length);
            
            try {
                // 기존 데이터 가져오기
                let animals = window.getAllAnimals ? window.getAllAnimals() : [];
                
                // 중복 체크 및 추가
                for (const item of batch) {
                    const exists = animals.find(a => a.name === item.name);
                    if (!exists) {
                        animals.push(item);
                        processedCount++;
                    } else {
                        console.log(`⚠️ 중복된 개체 건너뛰기: ${item.name}`);
                    }
                }
                
                // 저장 (용량 최적화)
                await this.saveOptimizedData('geckoBreedingData', animals);
                
                // Firebase 동기화
                if (window.firebaseSync && window.firebaseSync.isInitialized) {
                    await window.firebaseSync.saveToCloud('animals', animals);
                }
                
                // UI 업데이트
                if (window.updateStatistics) {
                    window.updateStatistics();
                }
                
                // 배치 간 지연 (브라우저 과부하 방지)
                await this.delay(100);
                
            } catch (error) {
                console.error(`배치 ${i + 1} 처리 실패:`, error);
                
                // 저장 공간 부족 시 압축 시도
                if (error.name === 'QuotaExceededError') {
                    console.log('💾 저장 공간 부족 - 데이터 압축 시도');
                    await this.compressAndSave();
                }
            }
        }
        
        this.updateProgress(processedCount, data.length, true);
        console.log(`✅ 총 ${processedCount}개 개체 가져오기 완료!`);
    }
    
    // 최적화된 데이터 저장
    async saveOptimizedData(key, data) {
        try {
            // 데이터 압축 (불필요한 필드 제거)
            const compressedData = data.map(item => {
                const compressed = { ...item };
                
                // 빈 값 제거
                Object.keys(compressed).forEach(k => {
                    if (!compressed[k] || compressed[k] === '') {
                        delete compressed[k];
                    }
                });
                
                // 이미지 압축 (있는 경우)
                if (compressed.imageData && compressed.imageData.length > this.maxImageSize * 1024) {
                    compressed.imageData = await this.compressImage(compressed.imageData);
                }
                
                return compressed;
            });
            
            localStorage.setItem(key, JSON.stringify(compressedData));
            
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // 저장 공간 부족 시 추가 압축
                throw error;
            } else {
                throw error;
            }
        }
    }
    
    // 이미지 압축
    async compressImage(imageData) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                // 최대 크기 제한
                const maxSize = 300;
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, 0, 0, width, height);
                const compressedData = canvas.toDataURL('image/jpeg', this.compressionLevel);
                
                resolve(compressedData);
            };
            
            img.src = imageData;
        });
    }
    
    // 전체 데이터 압축
    async compressAndSave() {
        try {
            console.log('🗜️ 전체 데이터 압축 시작...');
            
            const animals = window.getAllAnimals ? window.getAllAnimals() : [];
            const babies = window.getBabies ? window.getBabies() : [];
            
            // 이미지 압축
            for (const animal of animals) {
                if (animal.imageData) {
                    animal.imageData = await this.compressImage(animal.imageData);
                }
            }
            
            for (const baby of babies) {
                if (baby.imageData) {
                    baby.imageData = await this.compressImage(baby.imageData);
                }
                
                // 성장 기록 이미지 압축
                if (baby.growthRecords) {
                    for (const stage of Object.keys(baby.growthRecords)) {
                        if (baby.growthRecords[stage].image) {
                            baby.growthRecords[stage].image = await this.compressImage(baby.growthRecords[stage].image);
                        }
                    }
                }
            }
            
            // 압축된 데이터 저장
            localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
            localStorage.setItem('babies', JSON.stringify(babies));
            
            console.log('✅ 데이터 압축 완료');
            
        } catch (error) {
            console.error('데이터 압축 실패:', error);
            throw error;
        }
    }
    
    // 진행률 업데이트
    updateProgress(current, total, completed = false) {
        const percentage = Math.round((current / total) * 100);
        const progressElement = document.getElementById('importProgress');
        
        if (progressElement) {
            if (completed) {
                progressElement.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            <span class="text-green-800 font-semibold">가져오기 완료!</span>
                        </div>
                        <p class="text-sm text-green-700 mt-1">총 ${current}개의 개체가 성공적으로 추가되었습니다.</p>
                    </div>
                `;
            } else {
                progressElement.innerHTML = `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-blue-800 font-semibold">데이터 가져오는 중...</span>
                            <span class="text-blue-600">${percentage}%</span>
                        </div>
                        <div class="w-full bg-blue-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                        </div>
                        <p class="text-sm text-blue-700 mt-1">${current}/${total} 개체 처리됨</p>
                    </div>
                `;
            }
        }
    }
    
    // 지연 함수
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // CSV 템플릿 다운로드
    downloadTemplate() {
        const template = `name,gender,generation,morph,birthDate,parent1,parent2,notes,weight
루시퍼,수컷,F1,릴리화이트,2024-01-15,,,첫 번째 개체,45g
퍼시,암컷,F1,달마시안,2024-02-20,,,두 번째 개체,42g
베이비1,미구분,F2,노멀,2024-06-10,루시퍼,퍼시,첫 번째 베이비,5g`;
        
        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = '게코_데이터_템플릿.csv';
        link.click();
    }
    
    // 현재 데이터 내보내기
    exportData() {
        try {
            const animals = window.getAllAnimals ? window.getAllAnimals() : [];
            const babies = window.getBabies ? window.getBabies() : [];
            
            const exportData = {
                animals: animals,
                babies: babies,
                exportDate: new Date().toISOString(),
                totalCount: animals.length + babies.length
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], 
                { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `게코_데이터_백업_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            console.log('✅ 데이터 내보내기 완료');
            
        } catch (error) {
            console.error('데이터 내보내기 실패:', error);
            alert('데이터 내보내기 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.BulkDataManager = BulkDataManager;

// 안전한 초기화
try {
    window.bulkDataManager = new BulkDataManager();
    console.log('✅ 대량 데이터 관리자 초기화 완료');
} catch (error) {
    console.error('❌ 대량 데이터 관리자 초기화 실패:', error);
    // 비상 모드로 기본 객체 생성
    window.bulkDataManager = {
        importFromFile: function() {
            throw new Error('대량 데이터 관리자가 올바르게 초기화되지 않았습니다.');
        },
        downloadTemplate: function() {
            alert('템플릿 다운로드를 사용할 수 없습니다.');
        },
        exportData: function() {
            alert('데이터 내보내기를 사용할 수 없습니다.');
        }
    };
}
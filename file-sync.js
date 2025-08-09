// 확실한 파일 기반 동기화 시스템
'use strict';

class FileSync {
    constructor() {
        this.init();
    }
    
    init() {
        this.createFileSyncUI();
    }
    
    createFileSyncUI() {
        const header = document.querySelector('h1');
        if (!header) return;
        
        const syncContainer = document.createElement('div');
        syncContainer.id = 'fileSyncContainer';
        syncContainer.className = 'mb-6 p-4 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg';
        
        syncContainer.innerHTML = `
            <div class="text-center">
                <div class="mb-4">
                    <i class="fas fa-file-export text-blue-500 text-3xl mb-2"></i>
                    <h3 class="text-lg font-bold text-blue-800">📁 파일로 데이터 공유</h3>
                    <p class="text-sm text-blue-600">가장 확실한 기기 간 데이터 공유 방법</p>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div class="p-4 bg-white rounded-lg border shadow-sm">
                        <h4 class="font-bold text-green-700 mb-2">📤 내보내기</h4>
                        <p class="text-sm text-gray-600 mb-3">현재 데이터를 파일로 저장</p>
                        <button onclick="fileSync.exportAllData()" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            <i class="fas fa-download mr-2"></i>데이터 내보내기
                        </button>
                    </div>
                    
                    <div class="p-4 bg-white rounded-lg border shadow-sm">
                        <h4 class="font-bold text-blue-700 mb-2">📥 가져오기</h4>
                        <p class="text-sm text-gray-600 mb-3">다른 기기의 데이터 불러오기</p>
                        <input type="file" id="importFileInput" accept=".json" style="display: none;" onchange="fileSync.importData(this)">
                        <button onclick="document.getElementById('importFileInput').click()" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            <i class="fas fa-upload mr-2"></i>데이터 가져오기
                        </button>
                    </div>
                </div>
                
                <div class="text-xs text-gray-500 bg-white p-3 rounded-lg">
                    <p><strong>💡 사용법:</strong></p>
                    <p>1️⃣ 첫 번째 기기: "데이터 내보내기" → 파일 다운로드</p>
                    <p>2️⃣ 파일을 다른 기기로 전송 (카톡, 이메일, USB 등)</p>
                    <p>3️⃣ 두 번째 기기: "데이터 가져오기" → 파일 선택</p>
                </div>
            </div>
        `;
        
        header.insertAdjacentElement('afterend', syncContainer);
    }
    
    exportAllData() {
        try {
            const animals = window.getAllAnimals ? window.getAllAnimals() : [];
            const babies = window.getBabies ? window.getBabies() : [];
            
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                },
                data: {
                    animals: animals,
                    babies: babies
                },
                counts: {
                    totalAnimals: animals.length,
                    totalBabies: babies.length,
                    total: animals.length + babies.length
                }
            };
            
            // 파일명 생성 (날짜 포함)
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
            const filename = `게코브리딩_데이터_${dateStr}_${timeStr}.json`;
            
            // 파일 다운로드
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json;charset=utf-8;'
            });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // URL 해제
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            
            this.showSuccess(`데이터 내보내기 완료!\n파일명: ${filename}\n총 ${exportData.counts.total}개 개체 내보냄`);
            
        } catch (error) {
            console.error('내보내기 실패:', error);
            this.showError('데이터 내보내기 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    importData(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.json')) {
            this.showError('JSON 파일만 업로드 가능합니다.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 데이터 유효성 검사
                if (!importData.data || !Array.isArray(importData.data.animals)) {
                    throw new Error('올바른 게코 브리딩 데이터 파일이 아닙니다.');
                }
                
                const importAnimals = importData.data.animals || [];
                const importBabies = importData.data.babies || [];
                
                // 확인 모달 표시
                this.showImportConfirmModal(importData, importAnimals, importBabies);
                
            } catch (error) {
                console.error('가져오기 실패:', error);
                this.showError('파일을 읽을 수 없습니다: ' + error.message);
            }
        };
        
        reader.readAsText(file, 'utf-8');
        
        // 파일 입력 초기화
        fileInput.value = '';
    }
    
    showImportConfirmModal(importData, importAnimals, importBabies) {
        const currentAnimals = window.getAllAnimals ? window.getAllAnimals() : [];
        const currentBabies = window.getBabies ? window.getBabies() : [];
        
        const modal = `
            <div class="modal-header bg-blue-50 border-b">
                <h2 class="text-xl font-bold text-blue-800">📥 데이터 가져오기 확인</h2>
            </div>
            <div class="modal-body">
                <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 class="font-bold mb-2">📊 가져올 데이터:</h4>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>성체:</strong> ${importAnimals.length}마리</p>
                            <p><strong>베이비:</strong> ${importBabies.length}마리</p>
                        </div>
                        <div>
                            <p><strong>내보낸 날짜:</strong><br>${new Date(importData.exportDate).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 class="font-bold text-yellow-800 mb-2">🔄 병합 방식:</h4>
                    <p class="text-sm text-yellow-700">
                        현재 데이터: <strong>${currentAnimals.length + currentBabies.length}마리</strong><br>
                        가져올 데이터: <strong>${importAnimals.length + importBabies.length}마리</strong><br>
                        예상 결과: <strong>최대 ${currentAnimals.length + currentBabies.length + importAnimals.length + importBabies.length}마리</strong>
                        (중복 제거됨)
                    </p>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-3">
                    <button onclick="fileSync.executeImport(${JSON.stringify(importAnimals).replace(/"/g, '&quot;')}, ${JSON.stringify(importBabies).replace(/"/g, '&quot;')})" 
                            class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg">
                        ✅ 가져오기 실행
                    </button>
                    <button onclick="window.closeModal()" 
                            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg">
                        ❌ 취소
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('modalContent').innerHTML = modal;
        document.getElementById('modalOverlay').classList.remove('hidden');
    }
    
    executeImport(importAnimals, importBabies) {
        try {
            const currentAnimals = window.getAllAnimals ? window.getAllAnimals() : [];
            const currentBabies = window.getBabies ? window.getBabies() : [];
            
            // 데이터 병합 (중복 제거)
            const mergedAnimals = this.mergeArrays(currentAnimals, importAnimals);
            const mergedBabies = this.mergeArrays(currentBabies, importBabies);
            
            // 저장
            if (window.safeLocalStorageSet) {
                window.safeLocalStorageSet('geckoBreedingData', mergedAnimals);
                window.safeLocalStorageSet('babies', mergedBabies);
            } else {
                localStorage.setItem('geckoBreedingData', JSON.stringify(mergedAnimals));
                localStorage.setItem('babies', JSON.stringify(mergedBabies));
            }
            
            // UI 업데이트
            if (window.updateStatistics) {
                window.updateStatistics();
            }
            
            window.closeModal();
            
            this.showSuccess(`데이터 가져오기 완료!\n총 ${mergedAnimals.length + mergedBabies.length}마리 (성체 ${mergedAnimals.length}, 베이비 ${mergedBabies.length})`);
            
        } catch (error) {
            console.error('데이터 가져오기 실행 실패:', error);
            this.showError('데이터 가져오기 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    mergeArrays(current, imported) {
        const merged = [...current];
        
        imported.forEach(importedItem => {
            // ID 또는 이름으로 중복 검사
            const existingIndex = merged.findIndex(currentItem => 
                currentItem.id === importedItem.id || 
                currentItem.name === importedItem.name
            );
            
            if (existingIndex >= 0) {
                // 더 최신 데이터로 업데이트
                const currentDate = new Date(merged[existingIndex].createdAt || merged[existingIndex].timestamp || 0);
                const importedDate = new Date(importedItem.createdAt || importedItem.timestamp || 0);
                
                if (importedDate >= currentDate) {
                    merged[existingIndex] = importedItem;
                }
            } else {
                // 새로운 데이터 추가
                merged.push(importedItem);
            }
        });
        
        return merged;
    }
    
    showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert('✅ ' + message);
        }
    }
    
    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert('❌ ' + message);
        }
    }
}

// 전역에서 사용할 수 있도록 내보내기
window.FileSync = FileSync;

// 자동 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.fileSync = new FileSync();
});
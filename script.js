// 간단한 파충류 브리딩 관리 시스템
'use strict';

const LOCAL_STORAGE_KEY = 'gecko-breeding-data';

// 디바운싱 함수
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 안전한 localStorage 접근 함수들
window.safeLocalStorageGet = function(key, defaultValue = []) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`localStorage 읽기 오류 (${key}):`, error);
        return defaultValue;
    }
};

window.safeLocalStorageSet = function(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.error('localStorage 용량 초과:', error);
            if (window.showToast) {
                window.showToast('저장 공간이 부족합니다. 일부 데이터를 정리해주세요.', 'warning');
            }
        } else {
            console.error(`localStorage 저장 오류 (${key}):`, error);
        }
        return false;
    }
};

// 데이터 가져오기 함수들 (안전한 버전)
window.getAllAnimals = function() {
    return safeLocalStorageGet('geckoBreedingData', []);
};

window.getBabies = function() {
    return safeLocalStorageGet('babies', []);
};

window.getHealthRecords = function() {
    return safeLocalStorageGet('healthRecords', []);
};

// 안전한 HTML 생성을 위한 유틸리티 함수
window.sanitizeInput = function(input) {
    if (typeof input !== 'string') return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

window.createElementSafely = function(tagName, attributes = {}, children = []) {
    const element = document.createElement(tagName);
    
    // 속성 설정
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'innerHTML') {
            // innerHTML 대신 textContent 사용 권장
            console.warn('innerHTML 사용을 피하고 textContent를 사용하세요.');
            element.innerHTML = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    // 자식 요소 추가
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
};

// 전역 함수들
window.openModal = function() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('hidden');
    }
};

window.closeModal = function() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
};

// 모달 표시 함수들
window.showAnimalRegistrationModal = function() {
    // 개체 등록 모달 내용 생성
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4 sm:mb-6">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900">
                    <i class="fas fa-plus-circle mr-2 text-green-600"></i>개체 등록
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 p-2">
                    <i class="fas fa-times text-lg sm:text-xl"></i>
                </button>
            </div>
            
            <form class="space-y-4" onsubmit="registerAnimal(); return false;">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">개체 이름 *</label>
                    <input type="text" id="animalName" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base" required placeholder="예: Luna-01">
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                        <select id="animalGender" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base" required>
                            <option value="">선택하세요</option>
                            <option value="수컷">수컷 ♂</option>
                            <option value="암컷">암컷 ♀</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">세대 *</label>
                        <select id="animalGeneration" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base" required>
                            <option value="">선택하세요</option>
                            <option value="F1">F1 (1세대)</option>
                            <option value="F2">F2 (2세대)</option>
                            <option value="F3">F3 (3세대)</option>
                            <option value="F4">F4 (4세대)</option>
                            <option value="F5">F5 (5세대)</option>
                            <option value="F6">F6 (6세대)</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">모프</label>
                    <input type="text" id="animalMorphSearch" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base" placeholder="예: 노멀, 릴리화이트, 달마시안">
                    <input type="hidden" id="animalMorph">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">이미지</label>
                    <input type="file" id="animalImage" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base">
                    <p class="text-xs text-gray-500 mt-1">선택사항. 5MB 이하의 이미지 파일</p>
                </div>
                
                <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-base">
                        취소
                    </button>
                    <button type="submit" class="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base">
                        <i class="fas fa-plus mr-2"></i>등록하기
                    </button>
                </div>
            </form>
        </div>
    `;
    
    openModal();
};

window.showAnimalListModal = function() {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4 sm:mb-6">
                <h2 class="text-lg sm:text-xl font-bold text-gray-900">
                    <i class="fas fa-list mr-2 text-blue-600"></i>개체 목록
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 p-2">
                    <i class="fas fa-times text-lg sm:text-xl"></i>
                </button>
            </div>
            
            <div id="animalListContainer" class="max-h-96 overflow-y-auto">
                <!-- 개체 목록이 여기에 로드됩니다 -->
            </div>
        </div>
    `;
    
    openModal();
    
    // 개체 목록 로드
    if (typeof window.loadAnimalList === 'function') {
        window.loadAnimalList();
    }
};

window.showBabyModal = function() {
    showToast('베이비 등록 기능을 준비 중입니다.', 'info');
};

window.showBabyListModal = function() {
    showToast('베이비 목록 기능을 준비 중입니다.', 'info');
};

window.showSoldListModal = function() {
    showToast('분양 완료 목록을 준비 중입니다.', 'info');
};

window.showBulkImportModal = function() {
    showToast('대량 가져오기 기능을 준비 중입니다.', 'info');
};

window.showMorphCalculatorModal = function() {
    showToast('모프 계산기를 준비 중입니다.', 'info');
};

window.showFamilyTreeModal = function() {
    showToast('혈통 트리 기능을 준비 중입니다.', 'info');
};

window.showHealthManagementModal = function() {
    showToast('건강 관리 기능을 준비 중입니다.', 'info');
};

window.manualSync = function() {
    showToast('수동 동기화를 실행합니다.', 'info');
    if (window.firebaseSync && typeof window.firebaseSync.processSyncQueue === 'function') {
        window.firebaseSync.processSyncQueue();
    }
};

window.toggleUserMenu = function() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        userMenu.classList.toggle('hidden');
    }
};

window.changeUser = function() {
    showToast('사용자 변경 기능을 준비 중입니다.', 'info');
    toggleUserMenu();
};

window.logout = function() {
    if (confirm('로그아웃하시겠습니까?')) {
        localStorage.removeItem('currentUser');
        location.reload();
    }
    toggleUserMenu();
};

// 토스트 알림 시스템
window.showToast = function(message, type = 'info') {
    const toastId = 'toast-' + Date.now();
    const toastColors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white', 
        warning: 'bg-yellow-500 text-black',
        info: 'bg-blue-500 text-white'
    };
    
    const toastIcons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle', 
        info: 'fas fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `fixed top-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto p-3 sm:p-4 rounded-lg shadow-lg z-50 sm:max-w-sm transform translate-x-full transition-transform duration-300 ${toastColors[type]}`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2 sm:space-x-3">
            <i class="${toastIcons[type]} text-sm sm:text-base"></i>
            <span class="text-sm font-medium">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // 애니메이션으로 표시
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 5000);
    
    // 클릭시 즉시 제거
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    });
};

// 이미지 처리 함수
window.processImageFile = async function(file) {
    return new Promise((resolve, reject) => {
        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
            reject(new Error('이미지 크기가 너무 큽니다. (5MB 이하)'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 이미지 리사이즈 (800x600 최대)
                const maxWidth = 800;
                const maxHeight = 600;
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = () => reject(new Error('이미지 로드 실패'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsDataURL(file);
    });
};

window.saveAnimal = async function(name, gender, generation, morph, imageData) {
    const animal = {
        id: Date.now().toString(),
        name: name,
        gender: gender,
        generation: generation,
        morph: morph,
        imageData: imageData,
        status: '활성',
        // 산란 관련 필드 (암컷만)
        breedingStatus: gender === '암컷' ? '일반' : null,
        lastLayingDate: null,
        nextExpectedLayingDate: null,
        totalLayingCount: 0,
        layingRecords: [],
        restPeriodStart: null,
        createdAt: new Date().toISOString()
    };
    
    try {
        // 입력값 검증
        if (!name || !gender || !generation) {
            throw new Error('필수 항목이 누락되었습니다.');
        }
        
        // 이름 중복 검사
        const animals = getAllAnimals();
        const duplicateAnimal = animals.find(a => a.name.toLowerCase() === name.toLowerCase());
        if (duplicateAnimal) {
            throw new Error(`이미 "${name}" 이름의 개체가 존재합니다.`);
        }
        
        animals.push(animal);
        
        // 안전한 저장
        const saveSuccess = safeLocalStorageSet('geckoBreedingData', animals);
        if (!saveSuccess) {
            throw new Error('데이터 저장에 실패했습니다.');
        }
        
        // Firebase 동기화 (에러 방지)
        try {
            if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
                await window.firebaseSync.saveToCloud('animals', animals);
            }
        } catch (error) {
            console.warn('Firebase 동기화 실패 (개체):', error.message);
        }
        
        showToast('개체가 성공적으로 등록되었습니다!', 'success');
        window.closeModal();
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('저장 공간이 부족합니다. 일부 데이터를 삭제한 후 다시 시도해주세요.');
        } else {
            alert('개체 등록 중 오류가 발생했습니다: ' + e.message);
        }
    }
};

window.registerAnimal = async function() {
    const name = document.getElementById('animalName').value;
    const gender = document.getElementById('animalGender').value;
    const generation = document.getElementById('animalGeneration').value;
    // 숨겨진 모프 필드에서 값을 가져옴
    let morph = document.getElementById('animalMorph').value;
    // 만약 숨겨진 필드가 비어있으면 검색 필드에서 값을 가져옴
    if (!morph) {
        morph = document.getElementById('animalMorphSearch').value;
    }
    const imageInput = document.getElementById('animalImage');
    
    if (!name || !gender || !generation) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }

    let imageData = null;
    if (imageInput.files[0]) {
        const file = imageInput.files[0];
        try {
            imageData = await processImageFile(file);
            await saveAnimal(name, gender, generation, morph, imageData);
        } catch (error) {
            console.error('이미지 처리 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다. 다른 이미지를 선택해주세요.');
        }
    } else {
        await saveAnimal(name, gender, generation, morph, imageData);
    }
};

window.loadAnimalList = function() {
    const animals = getAllAnimals();
    // 분양완료 상태가 아닌 개체들만 표시
    const activeAnimals = animals.filter(animal => animal.status !== '분양완료');
    const container = document.getElementById('animalListContainer');
    
    if (!container) {
        console.warn('animalListContainer 엘리먼트를 찾을 수 없습니다.');
        return;
    }
    
    if (activeAnimals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-dragon text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">활성 개체가 없습니다.</p>
                <p class="text-sm text-gray-400 mt-2">개체를 등록하거나 분양완료 목록을 확인해보세요!</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    activeAnimals.forEach((animal, index) => {
        const statusColor = typeof window.getStatusColor === 'function' ? window.getStatusColor(animal.status) : 'bg-gray-100 text-gray-800';
        
        // 산란 상태 정보 (암컷만)
        let breedingStatusInfo = null;
        if (animal.gender === '암컷' && animal.breedingStatus) {
            breedingStatusInfo = window.getBreedingStatusInfo(animal.breedingStatus);
        }
        
        html += `
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200 ${breedingStatusInfo ? breedingStatusInfo.color.replace('bg-', 'hover:bg-').replace('100', '200') : ''}">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <h4 class="font-semibold text-gray-900">${animal.name}</h4>
                        ${breedingStatusInfo ? `<span class="text-lg" title="${breedingStatusInfo.description}">${breedingStatusInfo.icon}</span>` : ''}
                    </div>
                    <div class="flex flex-col items-end space-y-1">
                        <span class="px-2 py-1 text-xs rounded-full ${statusColor}">${animal.status}</span>
                        ${breedingStatusInfo && breedingStatusInfo.label !== '일반' ? 
                            `<span class="px-2 py-1 text-xs rounded-full ${breedingStatusInfo.color}">${breedingStatusInfo.label}</span>` : ''}
                    </div>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><i class="fas fa-venus-mars mr-2"></i>${animal.gender}</p>
                    <p><i class="fas fa-layer-group mr-2"></i>${animal.generation}</p>
                    ${animal.morph ? `<p><i class="fas fa-dna mr-2"></i>${animal.morph}</p>` : ''}
                    ${breedingStatusInfo && breedingStatusInfo.label !== '일반' ? 
                        `<p><i class="fas fa-info-circle mr-2"></i>${breedingStatusInfo.description}</p>` : ''}
                    ${animal.lastLayingDate ? 
                        `<p><i class="fas fa-calendar mr-2"></i>지난 산란: ${new Date(animal.lastLayingDate).toLocaleDateString('ko-KR')}</p>` : ''}
                    ${animal.totalLayingCount > 0 ? 
                        `<p><i class="fas fa-egg mr-2"></i>산란 횟수: ${animal.totalLayingCount}회</p>` : ''}
                </div>
                ${animal.imageData ? `
                    <div class="mt-3">
                        <img src="${animal.imageData}" alt="${animal.name}" class="w-full h-32 object-cover rounded-lg">
                    </div>
                ` : ''}
                <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="showAnimalDetails('${animal.id}')" class="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                            <i class="fas fa-info-circle mr-1"></i>상세보기
                        </button>
                        <button onclick="editAnimal('${animal.id}')" class="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                    </div>
                    ${animal.gender === '암컷' ? `
                        <button onclick="showBreedingManagement('${animal.id}')" class="w-full px-3 py-2 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700">
                            <i class="fas fa-heart mr-2"></i>산란 관리
                        </button>
                    ` : ''}
                    ${animal.promotedFrom === 'baby' ? `
                        <button onclick="showAnimalGrowthRecords('${animal.id}')" class="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                            <i class="fas fa-chart-line mr-2"></i>성장 기록 보기
                        </button>
                    ` : ''}
                    <button onclick="deleteAnimal('${animal.id}')" class="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                        <i class="fas fa-trash mr-2"></i>삭제
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// 기존 간단한 모프 계산기
window.calculateMorphs = function() {
    const fatherMorphs = document.getElementById('fatherMorphs').value;
    const motherMorphs = document.getElementById('motherMorphs').value;
    
    if (!fatherMorphs || !motherMorphs) {
        alert('부모 모프를 모두 선택해주세요.');
        return;
    }
    
    let result = `부모 모프 조합:\n`;
    result += `부개체: ${fatherMorphs}\n`;
    result += `모개체: ${motherMorphs}\n\n`;
    
    // Lily White 경고
    if (fatherMorphs.includes('Lily White') && motherMorphs.includes('Lily White')) {
        result += `⚠️ 경고: Lily White x Lily White 조합은 위험할 수 있습니다!\n`;
    }
    
    document.getElementById('morphResults').innerHTML = result.replace(/\n/g, '<br>');
};

// 고급 모프 계산기
window.updateMorphDisplay = function(parent) {
    const selectId = parent === 'father' ? 'fatherMorphs' : 'motherMorphs';
    const displayId = parent === 'father' ? 'fatherMorphDisplay' : 'motherMorphDisplay';
    
    const selectedMorph = document.getElementById(selectId).value;
    const displayElement = document.getElementById(displayId);
    
    if (selectedMorph) {
        const morphInfo = getMorphInfo(selectedMorph);
        displayElement.innerHTML = `
            <strong>${selectedMorph}</strong><br>
            <small>${morphInfo.description}</small><br>
            <span class="text-xs">유전 형태: ${morphInfo.inheritance}</span>
        `;
        displayElement.classList.remove('hidden');
    } else {
        displayElement.classList.add('hidden');
    }
};

window.getMorphInfo = function(morph) {
    const morphDatabase = {
        '노멀': {
            description: '야생형 크레스티드 게코의 기본 모프',
            inheritance: '열성',
            rarity: '일반'
        },
        '릴리화이트': {
            description: '흰색 패턴이 특징인 우성 모프',
            inheritance: '우성',
            rarity: '중급',
            warning: '동형접합(Super Lily White)은 치명적일 수 있음'
        },
        '달마시안': {
            description: '점박이 패턴의 우성 모프',
            inheritance: '우성',
            rarity: '중급'
        },
        '슈퍼달마시안': {
            description: '더욱 진한 점박이 패턴',
            inheritance: '우성 동형접합',
            rarity: '고급'
        },
        '할리퀸': {
            description: '크림/화이트 패턴의 공우성 모프',
            inheritance: '공우성',
            rarity: '고급'
        },
        '핀스트라이프': {
            description: '가느다란 줄무늬 패턴',
            inheritance: '공우성',
            rarity: '중급'
        },
        '팬텀': {
            description: '핀스트라이프의 슈퍼 형태',
            inheritance: '공우성 동형접합',
            rarity: '고급'
        },
        '세이블': {
            description: '어두운 색상의 열성 모프',
            inheritance: '열성',
            rarity: '중급'
        }
    };
    
    return morphDatabase[morph] || {
        description: '알려지지 않은 모프',
        inheritance: '미상',
        rarity: '미상'
    };
};

window.calculateAdvancedMorphs = function() {
    const fatherMorph = document.getElementById('fatherMorphs').value;
    const motherMorph = document.getElementById('motherMorphs').value;
    
    if (!fatherMorph || !motherMorph) {
        alert('부모 모프를 모두 선택해주세요.');
        return;
    }
    
    const fatherInfo = typeof window.getMorphInfo === 'function' ? window.getMorphInfo(fatherMorph) : {inheritance: '미상', description: '알수없음'};
    const motherInfo = typeof window.getMorphInfo === 'function' ? window.getMorphInfo(motherMorph) : {inheritance: '미상', description: '알수없음'};
    
    const results = typeof window.calculateGeneticOutcome === 'function' ? 
        window.calculateGeneticOutcome(fatherMorph, motherMorph, fatherInfo, motherInfo) : 
        {outcomes: [{morph: '예상 결과 불명', percentage: '50%', rarity: '일반'}]};
    
    let html = `
        <div class="bg-white rounded-lg p-4 border border-gray-200 mb-4">
            <h4 class="font-semibold text-gray-900 mb-2">부모 정보</h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-blue-600">♂ ${fatherMorph}</span><br>
                    <span class="text-xs text-gray-500">${fatherInfo.inheritance}</span>
                </div>
                <div>
                    <span class="text-pink-600">♀ ${motherMorph}</span><br>
                    <span class="text-xs text-gray-500">${motherInfo.inheritance}</span>
                </div>
            </div>
        </div>
        
        <h4 class="font-semibold text-gray-900 mb-3">예상 후손</h4>
    `;
    
    results.outcomes.forEach(outcome => {
        const rarityColor = typeof window.getRarityColor === 'function' ? 
            window.getRarityColor(outcome.rarity) : 'bg-gray-100 text-gray-800';
        html += `
            <div class="bg-white rounded-lg p-3 border border-gray-200 mb-2">
                <div class="flex items-center justify-between">
                    <div>
                        <span class="font-medium">${outcome.morph}</span>
                        <span class="ml-2 px-2 py-1 text-xs rounded-full ${rarityColor}">${outcome.rarity}</span>
                    </div>
                    <span class="text-sm font-bold text-purple-600">${outcome.probability}%</span>
                </div>
                ${outcome.description ? `<p class="text-xs text-gray-500 mt-1">${outcome.description}</p>` : ''}
            </div>
        `;
    });
    
    if (results.warnings.length > 0) {
        html += '<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">';
        html += '<h5 class="font-semibold text-yellow-800 mb-2"><i class="fas fa-exclamation-triangle mr-2"></i>주의사항</h5>';
        results.warnings.forEach(warning => {
            html += `<p class="text-sm text-yellow-700">• ${warning}</p>`;
        });
        html += '</div>';
    }
    
    document.getElementById('morphResults').innerHTML = html;
};

window.calculateGeneticOutcome = function(father, mother, fatherInfo, motherInfo) {
    let outcomes = [];
    let warnings = [];
    
    // 릴리화이트 x 릴리화이트 경고
    if (father === '릴리화이트' && mother === '릴리화이트') {
        warnings.push('릴리화이트 x 릴리화이트 조합에서 슈퍼 릴리화이트(25%)는 생존율이 낮을 수 있습니다.');
        outcomes.push(
            { morph: '릴리화이트', probability: 50, rarity: '중급', description: '헤테로 릴리화이트' },
            { morph: '슈퍼 릴리화이트', probability: 25, rarity: '위험', description: '동형접합 - 생존율 낮음' },
            { morph: '노멀', probability: 25, rarity: '일반', description: '야생형' }
        );
    }
    // 달마시안 x 달마시안
    else if (father === '달마시안' && mother === '달마시안') {
        outcomes.push(
            { morph: '달마시안', probability: 50, rarity: '중급' },
            { morph: '슈퍼달마시안', probability: 25, rarity: '고급' },
            { morph: '노멀', probability: 25, rarity: '일반' }
        );
    }
    // 할리퀸 x 할리퀸
    else if (father === '할리퀸' && mother === '할리퀸') {
        outcomes.push(
            { morph: '할리퀸', probability: 50, rarity: '고급' },
            { morph: '팬텀', probability: 25, rarity: '최고급' },
            { morph: '노멀', probability: 25, rarity: '일반' }
        );
    }
    // 우성 x 노멀
    else if ((father === '릴리화이트' || father === '달마시안') && mother === '노멀') {
        outcomes.push(
            { morph: father, probability: 50, rarity: '중급' },
            { morph: '노멀', probability: 50, rarity: '일반' }
        );
    }
    else if (father === '노멀' && (mother === '릴리화이트' || mother === '달마시안')) {
        outcomes.push(
            { morph: mother, probability: 50, rarity: '중급' },
            { morph: '노멀', probability: 50, rarity: '일반' }
        );
    }
    // 기본 경우
    else {
        outcomes.push(
            { morph: '혼합형', probability: 60, rarity: '중급', description: '부모의 특성이 조합된 형태' },
            { morph: '노멀', probability: 25, rarity: '일반' },
            { morph: '특수형', probability: 15, rarity: '고급', description: '예상치 못한 조합' }
        );
    }
    
    return { outcomes, warnings };
};

window.getRarityColor = function(rarity) {
    switch(rarity) {
        case '일반': return 'bg-gray-100 text-gray-800';
        case '중급': return 'bg-blue-100 text-blue-800';
        case '고급': return 'bg-purple-100 text-purple-800';
        case '최고급': return 'bg-yellow-100 text-yellow-800';
        case '위험': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// 베이비 관리 함수들
window.generateBabyId = function(parent1, parent2, birthDate) {
    const date = new Date(birthDate);
    const year = String(date.getFullYear()).slice(-2); // 24 (2024년)
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // 부모 이름에서 구분자 생성 (각각 1글자씩)
    const parent1Code = parent1.charAt(0);
    const parent2Code = parent2.charAt(0);
    
    // 같은 부모 조합의 베이비 수 계산
    const babies = getBabies();
    const sameParentBabies = babies.filter(baby => 
        (baby.parent1 === parent1 && baby.parent2 === parent2) ||
        (baby.parent1 === parent2 && baby.parent2 === parent1)
    );
    
    const babyNumber = sameParentBabies.length + 1;
    
    // 짧은 ID 형식: YYMMDD-P1P2-01 (총 11자리)
    return `${year}${month}${day}-${parent1Code}${parent2Code}-${String(babyNumber).padStart(2, '0')}`;
};

window.saveBaby = async function(gender, morph, parent1, parent2, birthDate, generation, imageData) {
    try {
        console.log('saveBaby 시작:', { gender, morph, parent1, parent2, birthDate, generation });
        
        if (!gender || !parent1 || !parent2 || !birthDate || !generation) {
            const missing = [];
            if (!gender) missing.push('성별');
            if (!parent1) missing.push('부개체');
            if (!parent2) missing.push('모개체');
            if (!birthDate) missing.push('출생일');
            if (!generation) missing.push('세대');
            
            alert(`필수 정보가 누락되었습니다: ${missing.join(', ')}`);
            return;
        }
        
        const babyId = generateBabyId(parent1, parent2, birthDate);
        console.log('생성된 베이비 ID:', babyId);
        
        const baby = {
            id: Date.now().toString(),
            name: babyId,
            gender: gender || '미구분',
            morph: morph || '',
            parent1: parent1,
            parent2: parent2,
            birthDate: birthDate,
            generation: generation, // 세대 정보 추가
            imageData: imageData,
            status: '베이비',
            growthRecords: {
                birth: { weight: null, date: birthDate, image: null },
                '1g': { weight: null, date: null, image: null },
                '5g': { weight: null, date: null, image: null },
                '10g': { weight: null, date: null, image: null },
                '15g': { weight: null, date: null, image: null },
                '20g': { weight: null, date: null, image: null },
                '25g': { weight: null, date: null, image: null },
                '30g': { weight: null, date: null, image: null },
                '35g': { weight: null, date: null, image: null },
                '40g': { weight: null, date: null, image: null }
            },
            createdAt: new Date().toISOString()
        };
        
        console.log('생성된 베이비 객체:', baby);
    
    try {
        let babies = getBabies();
        babies.push(baby);
        localStorage.setItem('babies', JSON.stringify(babies));
        
        // Firebase 동기화 (에러 방지)
        try {
            if (window.firebaseSync && window.firebaseSync.isInitialized) {
                await window.firebaseSync.saveToCloud('babies', babies);
            }
        } catch (error) {
            console.warn('Firebase 동기화 실패 (베이비):', error.message);
        }
        
        alert(`베이비가 등록되었습니다!\nID: ${babyId} (${generation}세대)`);
        closeModal();
        updateStatistics();
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('저장 공간이 부족합니다. 일부 데이터를 삭제한 후 다시 시도해주세요.');
        } else {
            alert('베이비 등록 중 오류가 발생했습니다: ' + e.message);
        }
    }
    
    } catch (error) {
        console.error('saveBaby 전체 오류:', error);
        alert('베이비 저장 중 예상치 못한 오류가 발생했습니다: ' + error.message);
    }
};

window.registerBaby = async function() {
    const gender = document.getElementById('babyGender').value;
    // 숨겨진 모프 필드에서 값을 가져옴
    let morph = document.getElementById('babyMorph').value;
    // 만약 숨겨진 필드가 비어있으면 검색 필드에서 값을 가져옴
    if (!morph) {
        morph = document.getElementById('babyMorphSearch').value;
    }
    const parent1 = document.getElementById('babyParent1').value;
    const parent2 = document.getElementById('babyParent2').value;
    const birthDate = document.getElementById('babyBirthDate').value;
    const generation = document.getElementById('babyGeneration').value;
    const imageInput = document.getElementById('babyImage');
    
    if (!gender || !parent1 || !parent2 || !birthDate) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    if (!generation) {
        alert('부모를 모두 선택해주세요. 세대가 자동으로 계산되어야 합니다.');
        return;
    }
    
    let imageData = null;
    if (imageInput.files[0]) {
        const file = imageInput.files[0];
        try {
            imageData = await processImageFile(file);
            await saveBaby(gender, morph, parent1, parent2, birthDate, generation, imageData);
        } catch (error) {
            console.error('이미지 처리 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다. 다른 이미지를 선택해주세요.');
        }
    } else {
        await saveBaby(gender, morph, parent1, parent2, birthDate, generation, imageData);
    }
};

window.loadBabyList = function() {
    const babies = getBabies();
    const container = document.getElementById('babyListContainer');
    
    if (!container) return;
    
    if (babies.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-baby text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">등록된 베이비가 없습니다.</p>
                <p class="text-sm text-gray-400 mt-2">베이비를 등록해보세요!</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    babies.forEach((baby, index) => {
        const birthDate = new Date(baby.birthDate);
        const formattedDate = birthDate.toLocaleDateString('ko-KR');
        const genderColor = getGenderColor(baby.gender);
        
        html += `
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-900 font-mono text-sm">${baby.name}</h4>
                    <span class="px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800">베이비</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><i class="fas fa-venus-mars mr-2"></i><span class="px-2 py-1 text-xs rounded-full ${genderColor}">${baby.gender}</span></p>
                    ${baby.generation ? `<p><i class="fas fa-layer-group mr-2"></i><span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">${baby.generation}세대</span></p>` : ''}
                    ${baby.morph ? `<p><i class="fas fa-dna mr-2"></i>${baby.morph}</p>` : ''}
                    <p><i class="fas fa-users mr-2"></i>${baby.parent1} × ${baby.parent2}</p>
                    <p><i class="fas fa-calendar mr-2"></i>${formattedDate}</p>
                </div>
                ${baby.imageData ? `
                    <div class="mt-3">
                        <img src="${baby.imageData}" alt="${baby.name}" class="w-full h-32 object-cover rounded-lg">
                    </div>
                ` : ''}
                <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="showBabyDetails('${baby.id}')" class="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                            <i class="fas fa-info-circle mr-1"></i>상세보기
                        </button>
                        <button onclick="editBaby('${baby.id}')" class="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                    </div>
                    <button onclick="showGrowthRecords('${baby.id}')" class="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                        <i class="fas fa-chart-line mr-2"></i>성장 기록
                    </button>
                    <button onclick="promoteToAdult('${baby.id}')" class="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        <i class="fas fa-arrow-up mr-2"></i>개체 목록으로 이동
                    </button>
                    <button onclick="deleteBaby('${baby.id}')" class="w-full px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">
                        <i class="fas fa-trash mr-2"></i>삭제
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// 성장 기록 관리 함수들
window.showGrowthRecords = function(entityId, isAdult = false) {
    let entity;
    if (isAdult) {
        const animals = getAllAnimals();
        entity = animals.find(a => a.id === entityId);
    } else {
        const babies = getBabies();
        entity = babies.find(b => b.id === entityId);
    }
    
    if (!entity) {
        alert(isAdult ? '개체 정보를 찾을 수 없습니다.' : '베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    const modalContent = document.getElementById('modalContent');
    const growthStages = [
        { key: 'birth', label: '태어났을때', weight: '0g' },
        { key: '1g', label: '1그람', weight: '1g' },
        { key: '5g', label: '5그람', weight: '5g' },
        { key: '10g', label: '10그람', weight: '10g' },
        { key: '15g', label: '15그람', weight: '15g' },
        { key: '20g', label: '20그람', weight: '20g' },
        { key: '25g', label: '25그람', weight: '25g' },
        { key: '30g', label: '30그람', weight: '30g' },
        { key: '35g', label: '35그람', weight: '35g' },
        { key: '40g', label: '40그람', weight: '40g' }
    ];
    
    let html = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-chart-line mr-2"></i>${entity.name} 성장 기록
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    `;
    
    growthStages.forEach(stage => {
        const record = entity.growthRecords ? entity.growthRecords[stage.key] : null;
        const isRecorded = record && record.date;
        const statusColor = isRecorded ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600';
        
        html += `
            <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="font-semibold text-gray-900">${stage.label}</h3>
                    <span class="px-2 py-1 text-xs rounded-full ${statusColor}">
                        ${isRecorded ? '기록됨' : '미기록'}
                    </span>
                </div>
                
                ${isRecorded ? `
                    <div class="space-y-2 text-sm text-gray-600">
                        <p><i class="fas fa-weight mr-2"></i>${record.weight || stage.weight}</p>
                        <p><i class="fas fa-calendar mr-2"></i>${new Date(record.date).toLocaleDateString('ko-KR')}</p>
                    </div>
                    ${record.image ? `
                        <div class="mt-3">
                            <img src="${record.image}" alt="${stage.label}" class="w-full h-24 object-cover rounded-lg">
                        </div>
                    ` : ''}
                ` : `
                    <button onclick="recordGrowth('${entityId}', '${stage.key}', '${stage.weight}')" 
                            class="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>기록하기
                    </button>
                `}
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    modalContent.innerHTML = html;
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.recordGrowth = function(babyId, stage, targetWeight) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-plus-circle mr-2"></i>성장 기록 추가
                </h2>
                <button onclick="showGrowthRecords('${babyId}')" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-arrow-left text-xl"></i>
                </button>
            </div>
            
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">목표 무게</label>
                    <input type="text" value="${targetWeight}" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" readonly>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">실제 무게 *</label>
                    <input type="number" id="actualWeight" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="예: 5.2" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">측정 날짜 *</label>
                    <input type="date" id="measureDate" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">사진</label>
                    <input type="file" id="growthImage" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="showGrowthRecords('${babyId}')" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        취소
                    </button>
                    <button type="button" onclick="saveGrowthRecord('${babyId}', '${stage}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        저장
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // 오늘 날짜를 기본값으로 설정
    document.getElementById('measureDate').value = new Date().toISOString().split('T')[0];
};

window.saveGrowthRecord = function(babyId, stage) {
    const actualWeight = document.getElementById('actualWeight').value;
    const measureDate = document.getElementById('measureDate').value;
    const imageInput = document.getElementById('growthImage');
    
    if (!actualWeight || !measureDate) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    const saveRecord = (imageData) => {
        let babies = getBabies();
        const babyIndex = babies.findIndex(b => b.id === babyId);
        
        if (babyIndex === -1) {
            alert('베이비 정보를 찾을 수 없습니다.');
            return;
        }
        
        if (!babies[babyIndex].growthRecords) {
            babies[babyIndex].growthRecords = {};
        }
        
        babies[babyIndex].growthRecords[stage] = {
            weight: actualWeight + 'g',
            date: measureDate,
            image: imageData
        };
        
        try {
            localStorage.setItem('babies', JSON.stringify(babies));
            alert('성장 기록이 저장되었습니다!');
            showGrowthRecords(babyId);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                alert('저장 공간이 부족합니다. 이미지 크기를 줄이거나 일부 데이터를 삭제해주세요.');
            } else {
                alert('성장 기록 저장 중 오류가 발생했습니다: ' + e.message);
            }
        }
    };
    
    if (imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            saveRecord(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        saveRecord(null);
    }
};

// 베이비 승격 함수들
window.promoteToAdult = function(babyId) {
    try {
        console.log('promoteToAdult 시작:', babyId);
        
        const babies = getBabies();
        const baby = babies.find(b => b.id === babyId);
        
        if (!baby) {
            alert('베이비 정보를 찾을 수 없습니다.');
            console.error('베이비를 찾을 수 없음:', babyId, 'babies:', babies);
            return;
        }
        
        console.log('베이비 정보:', baby);
    
    // 부모 개체들의 세대 확인
    const animals = getAllAnimals();
    const parent1 = animals.find(a => a.name === baby.parent1);
    const parent2 = animals.find(a => a.name === baby.parent2);
    
    let generation = 'F2'; // 기본값
    
    if (parent1 && parent2) {
        // 두 부모 중 더 높은 세대 + 1
        const parent1Gen = parseInt(parent1.generation.replace('F', ''));
        const parent2Gen = parseInt(parent2.generation.replace('F', ''));
        const maxParentGen = Math.max(parent1Gen, parent2Gen);
        generation = `F${maxParentGen + 1}`;
    } else if (parent1) {
        const parent1Gen = parseInt(parent1.generation.replace('F', ''));
        generation = `F${parent1Gen + 1}`;
    } else if (parent2) {
        const parent2Gen = parseInt(parent2.generation.replace('F', ''));
        generation = `F${parent2Gen + 1}`;
    }
    
    // 최대 F6까지만
    const genNum = parseInt(generation.replace('F', ''));
    if (genNum > 6) {
        generation = 'F6';
    }
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-arrow-up mr-2"></i>개체 목록으로 이동
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    베이비 "${baby.name}"을(를) 성체 개체 목록으로 이동합니다.
                </p>
            </div>
            
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">개체 이름</label>
                    <input type="text" id="adultName" value="${baby.name}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                    <select id="adultGender" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                        <option value="">선택하세요</option>
                        <option value="수컷" ${baby.gender === '수컷' ? 'selected' : ''}>수컷</option>
                        <option value="암컷" ${baby.gender === '암컷' ? 'selected' : ''}>암컷</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">세대 (자동 계산됨)</label>
                    <input type="text" id="adultGeneration" value="${generation}" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" readonly>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">모프</label>
                    <input type="text" id="adultMorph" value="${baby.morph || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">부모 정보</label>
                    <div class="text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                        <p><i class="fas fa-users mr-2"></i>${baby.parent1} × ${baby.parent2}</p>
                        <p><i class="fas fa-calendar mr-2"></i>출생: ${new Date(baby.birthDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                </div>
                
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p class="text-sm text-yellow-800">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        주의: 이동 후 베이비 목록에서 제거되며, 성장 기록은 유지됩니다.
                    </p>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        취소
                    </button>
                    <button type="button" onclick="confirmPromoteToAdult('${babyId}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        이동
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
    console.log('promoteToAdult 모달 표시 완료');
    
    } catch (error) {
        console.error('promoteToAdult 오류:', error);
        alert('개체 이동 모달 표시 중 오류가 발생했습니다: ' + error.message);
    }
};

window.confirmPromoteToAdult = async function(babyId) {
    try {
        console.log('confirmPromoteToAdult 시작:', babyId);
        
        const babies = getBabies();
        const baby = babies.find(b => b.id === babyId);
        
        if (!baby) {
            alert('베이비 정보를 찾을 수 없습니다.');
            console.error('베이비를 찾을 수 없음:', babyId);
            return;
        }
        
        console.log('베이비 정보:', baby);
        
        const adultName = document.getElementById('adultName').value;
        const adultGender = document.getElementById('adultGender').value;
        const adultGeneration = document.getElementById('adultGeneration').value;
        const adultMorph = document.getElementById('adultMorph').value;
        
        console.log('입력값들:', { adultName, adultGender, adultGeneration, adultMorph });
        
        if (!adultName || !adultGender) {
            alert('필수 항목을 모두 입력해주세요.');
            return;
        }
        
        // 성체 개체로 추가
        const adult = {
            id: Date.now().toString(),
            name: adultName,
            gender: adultGender,
            generation: adultGeneration,
            morph: adultMorph,
            imageData: baby.imageData,
            status: '활성',
            birthDate: baby.birthDate,
            parent1: baby.parent1,
            parent2: baby.parent2,
            growthRecords: baby.growthRecords, // 성장 기록 보존
            createdAt: new Date().toISOString(),
            promotedFrom: 'baby' // 베이비에서 승격되었음을 표시
        };
        
        console.log('생성된 성체 객체:', adult);
        
        // 성체 목록에 추가
        let animals = getAllAnimals();
        animals.push(adult);
        
        try {
            localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
            console.log('성체 목록에 추가 완료');
            
            // Firebase 동기화 (에러 방지)
            try {
                if (window.firebaseSync && window.firebaseSync.isInitialized) {
                    await window.firebaseSync.saveToCloud('animals', animals);
                }
            } catch (error) {
                console.warn('Firebase 동기화 실패 (성체 추가):', error.message);
            }
        } catch (storageError) {
            console.error('성체 저장 오류:', storageError);
            if (storageError.name === 'QuotaExceededError') {
                alert('저장 공간이 부족합니다. 일부 데이터를 삭제한 후 다시 시도해주세요.');
            } else {
                alert('성체 저장 중 오류가 발생했습니다: ' + storageError.message);
            }
            return;
        }
        
        // 베이비 목록에서 제거
        const updatedBabies = babies.filter(b => b.id !== babyId);
        try {
            localStorage.setItem('babies', JSON.stringify(updatedBabies));
            console.log('베이비 목록에서 제거 완료');
            
            // Firebase 동기화 (에러 방지)
            try {
                if (window.firebaseSync && window.firebaseSync.isInitialized) {
                    await window.firebaseSync.saveToCloud('babies', updatedBabies);
                }
            } catch (error) {
                console.warn('Firebase 동기화 실패 (베이비 제거):', error.message);
            }
        } catch (storageError) {
            console.error('베이비 제거 오류:', storageError);
            alert('베이비 제거 중 오류가 발생했습니다: ' + storageError.message);
            return;
        }
        
        alert(`${adultName}이(가) 개체 목록으로 이동되었습니다! (${adultGeneration})`);
        closeModal();
        updateStatistics();
        
        // 베이비 목록과 개체 목록 새로고침
        if (document.getElementById('babyListContainer')) {
            loadBabyList();
        }
        if (document.getElementById('animalListContainer')) {
            loadAnimalList();
        }
        
        console.log('개체 목록 이동 완료');
        
    } catch (error) {
        console.error('confirmPromoteToAdult 전체 오류:', error);
        alert('개체 목록 이동 중 오류가 발생했습니다: ' + error.message);
    }
};

// 베이비 관리 함수들
window.showBabyDetails = function(babyId) {
    const babies = getBabies();
    const baby = babies.find(b => b.id === babyId);
    
    if (!baby) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    const birthDate = new Date(baby.birthDate);
    const formattedDate = birthDate.toLocaleDateString('ko-KR');
    const genderColor = getGenderColor(baby.gender);
    
    // 성장 기록 요약
    let growthSummary = '';
    if (baby.growthRecords) {
        const recordedStages = Object.keys(baby.growthRecords).filter(stage => baby.growthRecords[stage].weight);
        growthSummary = `${recordedStages.length}/10 단계 기록됨`;
    }
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-baby mr-2"></i>베이비 상세 정보
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                ${baby.imageData ? `
                    <div class="text-center">
                        <img src="${baby.imageData}" alt="${baby.name}" class="w-48 h-48 object-cover rounded-lg mx-auto border-4 border-pink-200">
                    </div>
                ` : ''}
                
                <div class="bg-pink-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-pink-800 mb-3">${baby.name}</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">성별:</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${genderColor}">${baby.gender}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">세대:</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">${baby.generation || 'F2'}세대</span>
                        </div>
                        <div>
                            <span class="text-gray-600">모프:</span>
                            <span class="ml-2 text-gray-900">${baby.morph || '미지정'}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">출생일:</span>
                            <span class="ml-2 text-gray-900">${formattedDate}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-800 mb-2">부모 정보</h4>
                    <p class="text-sm text-blue-700">
                        <i class="fas fa-mars mr-1"></i>부개체: ${baby.parent1}
                    </p>
                    <p class="text-sm text-blue-700">
                        <i class="fas fa-venus mr-1"></i>모개체: ${baby.parent2}
                    </p>
                </div>
                
                <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="font-semibold text-green-800 mb-2">성장 기록</h4>
                    <p class="text-sm text-green-700">
                        <i class="fas fa-chart-line mr-1"></i>${growthSummary}
                    </p>
                    <button onclick="showGrowthRecords('${baby.id}')" class="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                        성장 기록 보기
                    </button>
                </div>
                
                <div class="flex justify-center space-x-3 pt-4">
                    <button onclick="editBaby('${baby.id}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        <i class="fas fa-edit mr-2"></i>수정
                    </button>
                    <button onclick="promoteToAdult('${baby.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-arrow-up mr-2"></i>개체로 승격
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.editBaby = function(babyId) {
    const babies = getBabies();
    const baby = babies.find(b => b.id === babyId);
    
    if (!baby) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 등록된 개체들 가져오기
    const animals = getAllAnimals();
    const maleAnimals = animals.filter(a => a.gender === '수컷' && a.status === '활성');
    const femaleAnimals = animals.filter(a => a.gender === '암컷' && a.status === '활성');
    
    let maleOptions = '<option value="">선택하세요</option>';
    maleAnimals.forEach(animal => {
        const selected = animal.name === baby.parent1 ? 'selected' : '';
        maleOptions += `<option value="${animal.name}" ${selected}>${animal.name} (${animal.generation}세대, ${animal.morph || 'Normal'})</option>`;
    });
    
    let femaleOptions = '<option value="">선택하세요</option>';
    femaleAnimals.forEach(animal => {
        const selected = animal.name === baby.parent2 ? 'selected' : '';
        femaleOptions += `<option value="${animal.name}" ${selected}>${animal.name} (${animal.generation}세대, ${animal.morph || 'Normal'})</option>`;
    });
    
    // 모프 옵션 생성
    const morphOptions = `
        <option value="">선택하세요</option>
        <optgroup label="베이스 모프">
            <option value="노멀" ${baby.morph === '노멀' ? 'selected' : ''}>노멀</option>
            <option value="루아" ${baby.morph === '루아' ? 'selected' : ''}>루아</option>
            <option value="부항" ${baby.morph === '부항' ? 'selected' : ''}>부항</option>
            <option value="부항 밀리" ${baby.morph === '부항 밀리' ? 'selected' : ''}>부항 밀리</option>
            <option value="밀리 세이블" ${baby.morph === '밀리 세이블' ? 'selected' : ''}>밀리 세이블</option>
            <option value="릴리화이트" ${baby.morph === '릴리화이트' ? 'selected' : ''}>릴리화이트</option>
            <option value="릴리100%헷아직" ${baby.morph === '릴리100%헷아직' ? 'selected' : ''}>릴리100%헷아직</option>
            <option value="헷아직" ${baby.morph === '헷아직' ? 'selected' : ''}>헷아직</option>
        </optgroup>
        <optgroup label="패턴 모프">
            <option value="세이블" ${baby.morph === '세이블' ? 'selected' : ''}>세이블</option>
            <option value="슈퍼세이블 밀리" ${baby.morph === '슈퍼세이블 밀리' ? 'selected' : ''}>슈퍼세이블 밀리</option>
            <option value="슈퍼 세이블" ${baby.morph === '슈퍼 세이블' ? 'selected' : ''}>슈퍼 세이블</option>
            <option value="아잔틱" ${baby.morph === '아잔틱' ? 'selected' : ''}>아잔틱</option>
            <option value="초초" ${baby.morph === '초초' ? 'selected' : ''}>초초</option>
            <option value="카푸치노" ${baby.morph === '카푸치노' ? 'selected' : ''}>카푸치노</option>
            <option value="프라푸치노" ${baby.morph === '프라푸치노' ? 'selected' : ''}>프라푸치노</option>
        </optgroup>
    `;
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-edit mr-2"></i>베이비 수정
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form class="space-y-4">
                <div class="mb-4 p-3 bg-orange-50 rounded-lg">
                    <p class="text-sm text-orange-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        베이비 ID: ${baby.name} (수정 불가)
                    </p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                    <select id="editBabyGender" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                        <option value="">선택하세요</option>
                        <option value="미구분" ${baby.gender === '미구분' ? 'selected' : ''}>미구분</option>
                        <option value="수컷" ${baby.gender === '수컷' ? 'selected' : ''}>수컷</option>
                        <option value="수컷 추정" ${baby.gender === '수컷 추정' ? 'selected' : ''}>수컷 추정</option>
                        <option value="암컷" ${baby.gender === '암컷' ? 'selected' : ''}>암컷</option>
                        <option value="암컷 추정" ${baby.gender === '암컷 추정' ? 'selected' : ''}>암컷 추정</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">모프</label>
                    <select id="editBabyMorph" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        ${morphOptions}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">부개체 (수컷) *</label>
                    <select id="editBabyParent1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                        ${maleOptions}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">모개체 (암컷) *</label>
                    <select id="editBabyParent2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                        ${femaleOptions}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">태어난 날짜 *</label>
                    <input type="date" id="editBabyBirthDate" value="${baby.birthDate}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">이미지 변경</label>
                    <input type="file" id="editBabyImage" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    ${baby.imageData ? '<p class="text-xs text-gray-500 mt-1">현재 이미지가 있습니다. 새 파일을 선택하면 교체됩니다.</p>' : ''}
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        취소
                    </button>
                    <button type="button" onclick="saveBabyEdit('${babyId}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        수정 완료
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.saveBabyEdit = function(babyId) {
    const babies = getBabies();
    const babyIndex = babies.findIndex(b => b.id === babyId);
    
    if (babyIndex === -1) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    const gender = document.getElementById('editBabyGender').value;
    const morph = document.getElementById('editBabyMorph').value;
    const parent1 = document.getElementById('editBabyParent1').value;
    const parent2 = document.getElementById('editBabyParent2').value;
    const birthDate = document.getElementById('editBabyBirthDate').value;
    const imageInput = document.getElementById('editBabyImage');
    
    if (!gender || !parent1 || !parent2 || !birthDate) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    // 새로운 ID 생성 (부모나 출생일이 변경된 경우)
    const newBabyId = generateBabyId(parent1, parent2, birthDate);
    
    const updateBaby = function(imageData = null) {
        babies[babyIndex] = {
            ...babies[babyIndex],
            name: newBabyId,
            gender: gender,
            morph: morph,
            parent1: parent1,
            parent2: parent2,
            birthDate: birthDate,
            imageData: imageData || babies[babyIndex].imageData,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('babies', JSON.stringify(babies));
        alert('베이비 정보가 수정되었습니다!');
        closeModal();
        updateStatistics();
        loadBabyList();
    };
    
    if (imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            updateBaby(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        updateBaby();
    }
};

window.deleteBaby = function(babyId) {
    const babies = getBabies();
    const baby = babies.find(b => b.id === babyId);
    
    if (!baby) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`정말로 베이비 "${baby.name}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 성장 기록도 함께 삭제됩니다.`)) {
        const updatedBabies = babies.filter(b => b.id !== babyId);
        localStorage.setItem('babies', JSON.stringify(updatedBabies));
        
        alert('베이비가 삭제되었습니다.');
        updateStatistics();
        loadBabyList();
    }
};

// 성체 개체 관리 함수들
window.showAnimalDetails = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    const statusColor = getStatusColor(animal.status);
    const birthDate = animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('ko-KR') : '미기록';
    
    // 성장 기록 요약 (베이비에서 승격된 경우)
    let growthSection = '';
    if (animal.promotedFrom === 'baby' && animal.growthRecords) {
        const recordedStages = Object.keys(animal.growthRecords).filter(stage => animal.growthRecords[stage].weight);
        growthSection = `
            <div class="bg-green-50 rounded-lg p-4">
                <h4 class="font-semibold text-green-800 mb-2">성장 기록</h4>
                <p class="text-sm text-green-700">
                    <i class="fas fa-chart-line mr-1"></i>${recordedStages.length}/10 단계 기록됨
                </p>
                <button onclick="showAnimalGrowthRecords('${animal.id}')" class="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                    성장 기록 보기
                </button>
            </div>
        `;
    }
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-dragon mr-2"></i>개체 상세 정보
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="space-y-4">
                ${animal.imageData ? `
                    <div class="text-center">
                        <img src="${animal.imageData}" alt="${animal.name}" class="w-48 h-48 object-cover rounded-lg mx-auto border-4 border-green-200">
                    </div>
                ` : ''}
                
                <div class="bg-green-50 rounded-lg p-4">
                    <h3 class="text-lg font-semibold text-green-800 mb-3">${animal.name}</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">성별:</span>
                            <span class="ml-2 text-gray-900">${animal.gender}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">세대:</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">${animal.generation}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">모프:</span>
                            <span class="ml-2 text-gray-900">${animal.morph || '미지정'}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">상태:</span>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${statusColor}">${animal.status}</span>
                        </div>
                        ${animal.birthDate ? `
                            <div>
                                <span class="text-gray-600">출생일:</span>
                                <span class="ml-2 text-gray-900">${birthDate}</span>
                            </div>
                        ` : ''}
                        ${animal.promotedFrom === 'baby' ? `
                            <div>
                                <span class="text-gray-600">출처:</span>
                                <span class="ml-2 px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800">베이비에서 승격</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                ${animal.parent1 && animal.parent2 ? `
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-800 mb-2">부모 정보</h4>
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-mars mr-1"></i>부개체: ${animal.parent1}
                        </p>
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-venus mr-1"></i>모개체: ${animal.parent2}
                        </p>
                    </div>
                ` : ''}
                
                ${growthSection}
                
                <div class="flex justify-center space-x-3 pt-4">
                    <button onclick="editAnimal('${animal.id}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        <i class="fas fa-edit mr-2"></i>수정
                    </button>
                    <button onclick="changeAnimalStatus('${animal.id}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-exchange-alt mr-2"></i>상태 변경
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.editAnimal = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 모프 옵션 생성 (축약된 버전 - 주요 모프만)
    const morphOptions = `
        <option value="">선택하세요</option>
        <optgroup label="베이스 모프">
            <option value="노멀" ${animal.morph === '노멀' ? 'selected' : ''}>노멀</option>
            <option value="루아" ${animal.morph === '루아' ? 'selected' : ''}>루아</option>
            <option value="부항" ${animal.morph === '부항' ? 'selected' : ''}>부항</option>
            <option value="릴리화이트" ${animal.morph === '릴리화이트' ? 'selected' : ''}>릴리화이트</option>
            <option value="헷아직" ${animal.morph === '헷아직' ? 'selected' : ''}>헷아직</option>
        </optgroup>
        <optgroup label="패턴 모프">
            <option value="세이블" ${animal.morph === '세이블' ? 'selected' : ''}>세이블</option>
            <option value="달마시안" ${animal.morph === '달마시안' ? 'selected' : ''}>달마시안</option>
            <option value="할리퀸" ${animal.morph === '할리퀸' ? 'selected' : ''}>할리퀸</option>
            <option value="팬텀" ${animal.morph === '팬텀' ? 'selected' : ''}>팬텀</option>
        </optgroup>
    `;
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-edit mr-2"></i>개체 수정
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">개체 이름 *</label>
                    <input type="text" id="editAnimalName" value="${animal.name}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">성별 *</label>
                    <select id="editAnimalGender" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                        <option value="">선택하세요</option>
                        <option value="수컷" ${animal.gender === '수컷' ? 'selected' : ''}>수컷</option>
                        <option value="암컷" ${animal.gender === '암컷' ? 'selected' : ''}>암컷</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">세대 *</label>
                    <select id="editAnimalGeneration" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent" required>
                        <option value="">선택하세요</option>
                        <option value="F1" ${animal.generation === 'F1' ? 'selected' : ''}>F1</option>
                        <option value="F2" ${animal.generation === 'F2' ? 'selected' : ''}>F2</option>
                        <option value="F3" ${animal.generation === 'F3' ? 'selected' : ''}>F3</option>
                        <option value="F4" ${animal.generation === 'F4' ? 'selected' : ''}>F4</option>
                        <option value="F5" ${animal.generation === 'F5' ? 'selected' : ''}>F5</option>
                        <option value="F6" ${animal.generation === 'F6' ? 'selected' : ''}>F6</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">모프</label>
                    <select id="editAnimalMorph" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                        ${morphOptions}
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">이미지 변경</label>
                    <input type="file" id="editAnimalImage" accept="image/*" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    ${animal.imageData ? '<p class="text-xs text-gray-500 mt-1">현재 이미지가 있습니다. 새 파일을 선택하면 교체됩니다.</p>' : ''}
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        취소
                    </button>
                    <button type="button" onclick="saveAnimalEdit('${animalId}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                        수정 완료
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.saveAnimalEdit = function(animalId) {
    const animals = getAllAnimals();
    const animalIndex = animals.findIndex(a => a.id === animalId);
    
    if (animalIndex === -1) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    const name = document.getElementById('editAnimalName').value;
    const gender = document.getElementById('editAnimalGender').value;
    const generation = document.getElementById('editAnimalGeneration').value;
    const morph = document.getElementById('editAnimalMorph').value;
    const imageInput = document.getElementById('editAnimalImage');
    
    if (!name || !gender || !generation) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    const updateAnimal = function(imageData = null) {
        animals[animalIndex] = {
            ...animals[animalIndex],
            name: name,
            gender: gender,
            generation: generation,
            morph: morph,
            imageData: imageData || animals[animalIndex].imageData,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
        alert('개체 정보가 수정되었습니다!');
        closeModal();
        updateStatistics();
        loadAnimalList();
    };
    
    if (imageInput.files[0]) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            updateAnimal(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        updateAnimal();
    }
};

window.changeAnimalStatus = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-exchange-alt mr-2"></i>상태 변경
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    개체 "${animal.name}"의 상태를 변경합니다.
                </p>
            </div>
            
            <div class="space-y-3">
                <button onclick="updateAnimalStatus('${animalId}', '활성')" class="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 ${animal.status === '활성' ? 'ring-2 ring-green-300' : ''}">
                    <i class="fas fa-heart mr-2"></i>활성 (번식 가능)
                </button>
                <button onclick="updateAnimalStatus('${animalId}', '분양완료')" class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${animal.status === '분양완료' ? 'ring-2 ring-blue-300' : ''}">
                    <i class="fas fa-handshake mr-2"></i>분양완료
                </button>
                <button onclick="updateAnimalStatus('${animalId}', '사망')" class="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 ${animal.status === '사망' ? 'ring-2 ring-red-300' : ''}">
                    <i class="fas fa-cross mr-2"></i>사망
                </button>
            </div>
            
            <div class="flex justify-center mt-6">
                <button onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    취소
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.updateAnimalStatus = function(animalId, newStatus) {
    const animals = getAllAnimals();
    const animalIndex = animals.findIndex(a => a.id === animalId);
    
    if (animalIndex === -1) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    animals[animalIndex].status = newStatus;
    animals[animalIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
    
    // Firebase 동기화 (에러 방지)
    try {
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveToCloud('animals', animals);
        }
    } catch (error) {
        console.warn('Firebase 동기화 실패 (상태 업데이트):', error.message);
    }
    
    alert(`상태가 "${newStatus}"로 변경되었습니다.`);
    closeModal();
    updateStatistics();
    
    // 현재 열린 모달에 따라 적절한 목록 새로고침
    if (newStatus === '분양완료') {
        // 분양완료로 변경된 경우, 개체 목록에서는 사라지고 분양완료 목록에 나타남
        loadAnimalList();
        // 분양완료 목록이 열려있다면 새로고침
        if (document.getElementById('soldListContainer')) {
            loadSoldList();
        }
    } else {
        // 다른 상태로 변경된 경우
        loadAnimalList();
        if (document.getElementById('soldListContainer')) {
            loadSoldList();
        }
    }
};

window.deleteAnimal = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`정말로 개체 "${animal.name}"을(를) 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        const updatedAnimals = animals.filter(a => a.id !== animalId);
        localStorage.setItem('geckoBreedingData', JSON.stringify(updatedAnimals));
        
        alert('개체가 삭제되었습니다.');
        updateStatistics();
        loadAnimalList();
    }
};

window.showAnimalGrowthRecords = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal || !animal.growthRecords) {
        alert('성장 기록을 찾을 수 없습니다.');
        return;
    }
    
    // 베이비 성장 기록 함수 재사용
    showGrowthRecords(animalId, true); // true는 성체 모드
};

// 분양 완료 목록 관리 함수들
window.loadSoldList = function() {
    const animals = getAllAnimals();
    const soldAnimals = animals.filter(animal => animal.status === '분양완료');
    const container = document.getElementById('soldListContainer');
    
    if (!container) return;
    
    if (soldAnimals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-handshake text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">분양 완료된 개체가 없습니다.</p>
                <p class="text-sm text-gray-400 mt-2">개체의 상태를 '분양완료'로 변경하면 여기에 표시됩니다.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    soldAnimals.forEach((animal, index) => {
        const soldDate = animal.updatedAt ? new Date(animal.updatedAt).toLocaleDateString('ko-KR') : '미기록';
        
        html += `
            <div class="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-900">${animal.name}</h4>
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">분양완료</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><i class="fas fa-venus-mars mr-2"></i>${animal.gender}</p>
                    <p><i class="fas fa-layer-group mr-2"></i>${animal.generation}</p>
                    ${animal.morph ? `<p><i class="fas fa-dna mr-2"></i>${animal.morph}</p>` : ''}
                    <p><i class="fas fa-calendar mr-2"></i>분양일: ${soldDate}</p>
                    ${animal.parent1 && animal.parent2 ? `<p><i class="fas fa-users mr-2"></i>${animal.parent1} × ${animal.parent2}</p>` : ''}
                </div>
                ${animal.imageData ? `
                    <div class="mt-3">
                        <img src="${animal.imageData}" alt="${animal.name}" class="w-full h-32 object-cover rounded-lg">
                    </div>
                ` : ''}
                <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="showSoldAnimalDetails('${animal.id}')" class="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            <i class="fas fa-info-circle mr-1"></i>상세보기
                        </button>
                        <button onclick="returnToActive('${animal.id}')" class="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                            <i class="fas fa-undo mr-1"></i>복원
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

window.showSoldAnimalDetails = function(animalId) {
    // 기존 개체 상세보기 함수 재사용
    if (typeof window.showAnimalDetails === 'function') {
        window.showAnimalDetails(animalId);
    } else {
        console.error('showAnimalDetails 함수를 찾을 수 없습니다.');
        alert('상세 정보를 로드할 수 없습니다.');
    }
};

window.returnToActive = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`"${animal.name}"을(를) 활성 상태로 복원하시겠습니까?`)) {
        if (typeof window.updateAnimalStatus === 'function') {
            window.updateAnimalStatus(animalId, '활성');
        } else {
            // 직접 업데이트
            animal.status = '활성';
            localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
        }
        
        if (typeof window.loadSoldList === 'function') {
            window.loadSoldList();
        }
        
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
    }
};

// 헬퍼 함수들
window.getStatusColor = function(status) {
    switch(status) {
        case '활성': return 'bg-green-100 text-green-800';
        case '분양완료': return 'bg-blue-100 text-blue-800';
        case '사망': return 'bg-red-100 text-red-800';
        case '삭제': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// 산란 상태 색상 및 아이콘
window.getBreedingStatusInfo = function(breedingStatus) {
    switch(breedingStatus) {
        case '산란중':
            return {
                color: 'bg-orange-100 text-orange-800 border-2 border-orange-300',
                icon: '🥚',
                label: '산란중',
                description: '현재 산란 진행 중'
            };
        case '휴식기':
            return {
                color: 'bg-blue-100 text-blue-800 border-2 border-blue-300',
                icon: '😴',
                label: '휴식기',
                description: '산란 후 회복 중'
            };
        case '산란준비':
            return {
                color: 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300',
                icon: '⏰',
                label: '산란준비',
                description: '교미 후 산란 대기 중'
            };
        case '일반':
        default:
            return {
                color: 'bg-gray-50 text-gray-600',
                icon: '🐉',
                label: '일반',
                description: '일반 상태'
            };
    }
};

window.getGenderColor = function(gender) {
    switch(gender) {
        case '미구분': return 'bg-gray-100 text-gray-800';
        case '수컷': return 'bg-blue-100 text-blue-800';
        case '수컷 추정': return 'bg-blue-50 text-blue-600 border border-blue-200';
        case '암컷': return 'bg-pink-100 text-pink-800';
        case '암컷 추정': return 'bg-pink-50 text-pink-600 border border-pink-200';
        default: return 'bg-gray-100 text-gray-800';
    }
};

window.getAllAnimals = function() {
    const data = localStorage.getItem('geckoBreedingData');
    return data ? JSON.parse(data) : [];
};

window.getBabies = function() {
    const data = localStorage.getItem('babies');
    return data ? JSON.parse(data) : [];
};

window.updateStatistics = function() {
    try {
        const animals = window.getAllAnimals ? window.getAllAnimals() : [];
        const babies = window.getBabies ? window.getBabies() : [];
    
        // 활성 개체만 총 개체 수에 포함 (분양완료 제외)
        const activeAnimals = animals.filter(a => a.status !== '분양완료');
        const totalElement = document.getElementById('totalAnimals');
        if (totalElement) {
            totalElement.textContent = activeAnimals.length;
        }
    
        // 세대별 개체 수 (활성 개체만)
        const f1Count = activeAnimals.filter(a => a.generation === 'F1').length;
        const f2Count = activeAnimals.filter(a => a.generation === 'F2').length;
        const f3Count = activeAnimals.filter(a => a.generation === 'F3').length;
        const f4PlusCount = activeAnimals.filter(a => ['F4', 'F5', 'F6'].includes(a.generation)).length;
        
        const elements = {
            f1Count,
            f2Count, 
            f3Count,
            f4PlusCount,
            babyCount: babies.length,
            soldCount: animals.filter(a => a.status === '분양완료').length
        };
        
        // DOM 업데이트 (에러 방지)
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
        // 산란 알림 업데이트
        updateBreedingAlerts(animals);
        
    } catch (error) {
        console.warn('통계 업데이트 실패:', error);
    }
};

// 성능 최적화를 위한 디바운스 함수
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// 로컬 스토리지 용량 체크
window.checkStorageQuota = function() {
    try {
        const test = 'test';
        localStorage.setItem('test', test);
        localStorage.removeItem('test');
        
        // 대략적인 사용량 계산
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        
        // 5MB 이상일 경우 경고
        if (totalSize > 5000000) {
            console.warn('⚠️ 로컬 스토리지 사용량이 많습니다:', Math.round(totalSize / 1000000) + 'MB');
            return false;
        }
        return true;
    } catch (e) {
        console.error('❌ 스토리지 용량 초과:', e);
        return false;
    }
};

// 이미지 압축 함수
window.compressImage = function(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // 비율 유지하면서 크기 조정
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 그리기 및 압축
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        
        img.src = URL.createObjectURL(file);
    });
};

// 개선된 이미지 처리 함수
window.processImageFile = async function(file) {
    if (!file) return null;
    
    // 파일 크기 체크 (10MB 이상일 경우 압축)
    if (file.size > 10 * 1024 * 1024) {
        console.log('📦 큰 이미지 파일 압축 중...');
        return await compressImage(file, 600, 450, 0.7);
    } else if (file.size > 2 * 1024 * 1024) {
        console.log('📦 이미지 파일 최적화 중...');
        return await compressImage(file, 800, 600, 0.8);
    } else {
        // 작은 파일은 그대로
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
};

// 데이터 정합성 검사
window.validateDataIntegrity = function() {
    try {
        const animals = getAllAnimals();
        const babies = getBabies();
        const healthRecords = getHealthRecords();
        
        let issues = [];
        
        // 중복 ID 검사
        const animalIds = animals.map(a => a.id);
        const duplicateAnimalIds = animalIds.filter((id, index) => animalIds.indexOf(id) !== index);
        if (duplicateAnimalIds.length > 0) {
            issues.push(`중복된 개체 ID 발견: ${duplicateAnimalIds.join(', ')}`);
        }
        
        const babyIds = babies.map(b => b.id);
        const duplicateBabyIds = babyIds.filter((id, index) => babyIds.indexOf(id) !== index);
        if (duplicateBabyIds.length > 0) {
            issues.push(`중복된 베이비 ID 발견: ${duplicateBabyIds.join(', ')}`);
        }
        
        // 필수 필드 검사
        animals.forEach((animal, index) => {
            if (!animal.name || !animal.gender || !animal.generation) {
                issues.push(`개체 #${index + 1}: 필수 정보 누락`);
            }
        });
        
        babies.forEach((baby, index) => {
            if (!baby.name || !baby.parent1 || !baby.parent2) {
                issues.push(`베이비 #${index + 1}: 필수 정보 누락`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('⚠️ 데이터 정합성 이슈:', issues);
            return false;
        }
        
        console.log('✅ 데이터 정합성 검사 완료');
        return true;
    } catch (error) {
        console.error('❌ 데이터 정합성 검사 실패:', error);
        return false;
    }
};

// 자동 백업 시스템
window.createAutoBackup = function() {
    try {
        const backupData = {
            animals: getAllAnimals(),
            babies: getBabies(),
            healthRecords: getHealthRecords(),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const backupKey = `backup_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, JSON.stringify(backupData));
        
        // 7일 이상 된 백업은 자동 삭제
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        for (let key in localStorage) {
            if (key.startsWith('backup_')) {
                const backupDate = new Date(key.replace('backup_', ''));
                if (backupDate < sevenDaysAgo) {
                    localStorage.removeItem(key);
                }
            }
        }
        
        console.log('💾 자동 백업 생성 완료:', backupKey);
    } catch (error) {
        console.error('❌ 자동 백업 실패:', error);
    }
};

// 페이지 로드 시 초기화
window.onload = function() {
    // 데이터 정합성 검사
    validateDataIntegrity();
    
    // 스토리지 용량 체크
    checkStorageQuota();
    
    // 통계 업데이트
    updateStatistics();
    
    // 자동 백업 (하루에 한 번)
    const lastBackup = localStorage.getItem('lastBackupDate');
    const today = new Date().toDateString();
    if (lastBackup !== today) {
        createAutoBackup();
        localStorage.setItem('lastBackupDate', today);
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // URL 쿼리 파라미터로 바로가기 지원
    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        
        switch(action) {
            case 'register':
                showAnimalRegistrationModal();
                break;
            case 'baby':
                showBabyModal();
                break;
            case 'health':
                showHealthManagementModal();
                break;
        }
    }, 1500);
    
    // 첫 방문 시 알림 권한 및 PWA 설치 안내
    setTimeout(() => {
        if (!localStorage.getItem('notificationAsked')) {
            requestNotificationPermission();
            localStorage.setItem('notificationAsked', 'true');
        }
        
        // PWA 설치 안내 (일주일에 한 번)
        const lastInstallPrompt = localStorage.getItem('lastInstallPrompt');
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        if (!lastInstallPrompt || parseInt(lastInstallPrompt) < oneWeekAgo) {
            if (deferredPrompt) {
                showInstallButton();
                localStorage.setItem('lastInstallPrompt', Date.now().toString());
            }
        }
    }, 3000);
    
    console.log('🚀 크레스티드 게코 브리딩 시스템 초기화 완료');
};

// PWA 설치 및 Service Worker 등록
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
            console.log('✅ Service Worker 등록 성공:', registration);
            
            // 업데이트 확인
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
        })
        .catch((error) => {
            console.error('❌ Service Worker 등록 실패:', error);
        });
}

// PWA 설치 프롬프트
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 PWA 설치 프롬프트 준비됨');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

window.showInstallButton = function() {
    const existingButton = document.getElementById('installButton');
    if (existingButton) existingButton.remove();
    
    const installButton = document.createElement('button');
    installButton.innerHTML = `
        <i class="fas fa-download mr-2"></i>앱으로 설치
    `;
    installButton.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-green-700 transition-colors z-50';
    installButton.id = 'installButton';
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA 설치 결과:', outcome);
            deferredPrompt = null;
            installButton.remove();
        }
    });
    
    document.body.appendChild(installButton);
    
    // 10초 후 자동 숨김
    setTimeout(() => {
        if (installButton && document.body.contains(installButton)) {
            installButton.style.opacity = '0';
            setTimeout(() => installButton.remove(), 300);
        }
    }, 10000);
};

// 업데이트 알림 표시
window.showUpdateNotification = function() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 transform -translate-y-full transition-transform';
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-sync-alt mr-3 text-lg"></i>
                <span>새 버전이 사용 가능합니다!</span>
            </div>
            <div class="flex space-x-2">
                <button onclick="updateApp()" class="px-3 py-1 bg-white text-blue-600 rounded text-sm hover:bg-gray-100">
                    업데이트
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="px-3 py-1 border border-white rounded text-sm hover:bg-blue-700">
                    나중에
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.remove('-translate-y-full');
    }, 100);
};

window.updateApp = function() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
};

// 푸시 알림 권한 요청
window.requestNotificationPermission = function() {
    if ('Notification' in window && navigator.serviceWorker) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ 알림 권한 허용됨');
                
                // 웰컴 알림 표시
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification('게코 브리딩 시스템', {
                        body: '📱 모바일에서도 완벽하게 사용할 수 있습니다!',
                        icon: './icons/icon-192x192.png',
                        badge: './icons/icon-96x96.png',
                        tag: 'welcome'
                    });
                });
            }
        });
    }
};

// 건강 관리 시스템
window.saveHealthRecord = function() {
    const entityId = document.getElementById('healthEntitySelect').value;
    const healthType = document.getElementById('healthType').value;
    const healthDate = document.getElementById('healthDate').value;
    const healthNotes = document.getElementById('healthNotes').value;
    
    if (!entityId || !healthType || !healthDate) {
        alert('개체, 기록 유형, 날짜를 모두 입력해주세요.');
        return;
    }
    
    const healthRecord = {
        id: Date.now().toString(),
        entityId: entityId,
        type: healthType,
        date: healthDate,
        notes: healthNotes,
        createdAt: new Date().toISOString()
    };
    
    let healthRecords = getHealthRecords();
    healthRecords.push(healthRecord);
    localStorage.setItem('healthRecords', JSON.stringify(healthRecords));
    
    // Firebase 동기화 (에러 방지)
    try {
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            window.firebaseSync.saveToCloud('healthRecords', healthRecords);
        }
    } catch (error) {
        console.warn('Firebase 동기화 실패 (건강기록):', error.message);
    }
    
    alert('건강 기록이 저장되었습니다!');
    
    // 폼 초기화
    document.getElementById('healthEntitySelect').value = '';
    document.getElementById('healthType').value = '';
    document.getElementById('healthNotes').value = '';
    
    // 최근 기록 새로고침
    loadRecentHealthRecords();
    loadHealthReminders();
};

window.getHealthRecords = function() {
    const data = localStorage.getItem('healthRecords');
    return data ? JSON.parse(data) : [];
};

window.loadRecentHealthRecords = function() {
    const healthRecords = getHealthRecords();
    const animals = getAllAnimals();
    const babies = getBabies();
    const allEntities = [...animals, ...babies];
    
    // 최근 10개 기록만 표시
    const recentRecords = healthRecords.slice(-10).reverse();
    
    const container = document.getElementById('recentHealthRecords');
    if (!container) return;
    
    if (recentRecords.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">등록된 건강 기록이 없습니다.</p>';
        return;
    }
    
    let html = '';
    recentRecords.forEach(record => {
        const entity = allEntities.find(e => e.id === record.entityId);
        const entityName = entity ? entity.name : '삭제된 개체';
        const typeColor = getHealthTypeColor(record.type);
        
        html += `
            <div class="bg-white rounded-lg p-3 border border-gray-200">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-medium text-gray-900">${entityName}</span>
                    <span class="px-2 py-1 text-xs rounded-full ${typeColor}">${record.type}</span>
                </div>
                <p class="text-sm text-gray-600 mb-1">${new Date(record.date).toLocaleDateString('ko-KR')}</p>
                ${record.notes ? `<p class="text-xs text-gray-500">${record.notes}</p>` : ''}
            </div>
        `;
    });
    
    container.innerHTML = html;
};

window.loadHealthReminders = function() {
    const healthRecords = getHealthRecords();
    const animals = getAllAnimals();
    const babies = getBabies();
    const allEntities = [...animals, ...babies];
    
    const container = document.getElementById('healthReminders');
    if (!container) return;
    
    let reminders = [];
    
    // 탈피 주기 체크 (일반적으로 4-6주마다)
    allEntities.forEach(entity => {
        const lastShed = healthRecords
            .filter(r => r.entityId === entity.id && r.type === '탈피')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
        if (lastShed) {
            const daysSinceLastShed = Math.floor((new Date() - new Date(lastShed.date)) / (1000 * 60 * 60 * 24));
            if (daysSinceLastShed > 42) { // 6주 이상
                reminders.push({
                    type: 'warning',
                    message: `${entity.name}: 탈피한지 ${daysSinceLastShed}일 경과`,
                    icon: 'fas fa-exclamation-triangle'
                });
            }
        } else if (entity.status !== '베이비') {
            // 성체인데 탈피 기록이 없음
            reminders.push({
                type: 'info',
                message: `${entity.name}: 탈피 기록이 없습니다`,
                icon: 'fas fa-info-circle'
            });
        }
    });
    
    // 정기 건강검진 체크 (3개월마다)
    allEntities.forEach(entity => {
        const lastCheckup = healthRecords
            .filter(r => r.entityId === entity.id && r.type === '건강검진')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
        if (lastCheckup) {
            const daysSinceLastCheckup = Math.floor((new Date() - new Date(lastCheckup.date)) / (1000 * 60 * 60 * 24));
            if (daysSinceLastCheckup > 90) { // 3개월 이상
                reminders.push({
                    type: 'info',
                    message: `${entity.name}: 건강검진이 ${daysSinceLastCheckup}일 경과`,
                    icon: 'fas fa-stethoscope'
                });
            }
        }
    });
    
    if (reminders.length === 0) {
        container.innerHTML = '<p class="text-gray-500">현재 알림이 없습니다.</p>';
        return;
    }
    
    let html = '';
    reminders.forEach(reminder => {
        const colorClass = reminder.type === 'warning' ? 'text-yellow-700 bg-yellow-50' : 'text-blue-700 bg-blue-50';
        html += `
            <div class="p-2 rounded-lg ${colorClass}">
                <i class="${reminder.icon} mr-2"></i>${reminder.message}
            </div>
        `;
    });
    
    container.innerHTML = html;
};

window.getHealthTypeColor = function(type) {
    switch(type) {
        case '건강검진': return 'bg-green-100 text-green-800';
        case '탈피': return 'bg-blue-100 text-blue-800';
        case '질병': return 'bg-red-100 text-red-800';
        case '예방접종': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// 중복 제거됨 - 위쪽에 있는 updateStatistics 함수 사용

// 산란 관리 시스템
window.showBreedingManagement = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal || animal.gender !== '암컷') {
        alert('암컷 개체만 산란 관리가 가능합니다.');
        return;
    }
    
    const currentStatus = animal.breedingStatus || '일반';
    const statusInfo = window.getBreedingStatusInfo(currentStatus);
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-heart mr-2"></i>${animal.name} - 산란 관리
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- 현재 산란 상태 -->
            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 class="font-semibold text-gray-800 mb-3">현재 상태</h3>
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${statusInfo.icon}</span>
                    <div>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}">
                            ${statusInfo.label}
                        </span>
                        <p class="text-sm text-gray-600 mt-1">${statusInfo.description}</p>
                    </div>
                </div>
                ${animal.lastLayingDate ? `
                    <div class="mt-3 text-sm text-gray-600">
                        <p><i class="fas fa-calendar mr-2"></i>마지막 산란: ${new Date(animal.lastLayingDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                ` : ''}
                ${animal.nextExpectedLayingDate ? `
                    <div class="mt-2 text-sm text-gray-600">
                        <p><i class="fas fa-clock mr-2"></i>다음 예상 산란: ${new Date(animal.nextExpectedLayingDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                ` : ''}
            </div>
            
            <!-- 산란 상태 변경 -->
            <div class="bg-white border rounded-lg p-4 mb-6">
                <h3 class="font-semibold text-gray-800 mb-3">산란 상태 변경</h3>
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="changeBreedingStatus('${animalId}', '산란준비')" 
                            class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm">
                        ⏰ 산란 준비
                    </button>
                    <button onclick="changeBreedingStatus('${animalId}', '산란중')" 
                            class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">
                        🥚 산란 시작
                    </button>
                    <button onclick="completeLayingWithRecord('${animalId}')" 
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                        😴 산란 완료
                    </button>
                    <button onclick="changeBreedingStatus('${animalId}', '일반')" 
                            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm">
                        🐉 일반 상태
                    </button>
                </div>
            </div>
            
            <!-- 산란 기록 -->
            <div class="bg-white border rounded-lg p-4">
                <h3 class="font-semibold text-gray-800 mb-3">산란 기록 요약</h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-pink-600">${animal.totalLayingCount || 0}</div>
                        <div class="text-sm text-gray-600">총 산란 횟수</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-blue-600">
                            ${animal.layingRecords ? animal.layingRecords.length : 0}
                        </div>
                        <div class="text-sm text-gray-600">기록된 산란</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-green-600">
                            ${animal.lastLayingDate ? 
                                Math.floor((new Date() - new Date(animal.lastLayingDate)) / (1000 * 60 * 60 * 24)) + '일' 
                                : '-'}
                        </div>
                        <div class="text-sm text-gray-600">마지막 산란 후</div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <button onclick="showLayingHistory('${animalId}')" 
                            class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        <i class="fas fa-history mr-2"></i>상세 산란 기록 보기
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

// 산란 상태 변경
window.changeBreedingStatus = function(animalId, newStatus) {
    const animals = getAllAnimals();
    const animalIndex = animals.findIndex(a => a.id === animalId);
    
    if (animalIndex === -1) {
        alert('개체를 찾을 수 없습니다.');
        return;
    }
    
    const animal = animals[animalIndex];
    const statusInfo = window.getBreedingStatusInfo(newStatus);
    
    if (confirm(`"${animal.name}"의 산란 상태를 "${statusInfo.label}"로 변경하시겠습니까?`)) {
        
        // 상태에 따른 추가 처리
        if (newStatus === '산란준비') {
            // 예상 산란일 계산 (30-45일 후)
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + 37); // 평균 37일
            animal.nextExpectedLayingDate = expectedDate.toISOString();
        } else if (newStatus === '산란중') {
            // 산란 시작 시간 기록
            animal.layingStartDate = new Date().toISOString();
        } else if (newStatus === '일반') {
            // 일반 상태로 돌아갈 때 예상일 초기화
            animal.nextExpectedLayingDate = null;
        }
        
        animal.breedingStatus = newStatus;
        animal.statusUpdatedAt = new Date().toISOString();
        
        // 저장 및 동기화
        localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
        
        // Firebase 동기화
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
            window.firebaseSync.saveToCloud('animals', animals);
        }
        
        alert(`산란 상태가 "${statusInfo.label}"로 변경되었습니다.`);
        
        // 모달 닫고 목록 새로고침
        window.closeModal();
        if (typeof window.loadAnimalList === 'function') {
            window.loadAnimalList();
        }
    }
};

// 산란 완료 및 기록 추가
window.completeLayingWithRecord = function(animalId) {
    const eggCount = prompt('산란한 알 개수를 입력하세요:', '2');
    if (eggCount === null) return;
    
    const count = parseInt(eggCount);
    if (isNaN(count) || count < 0) {
        alert('올바른 숫자를 입력해주세요.');
        return;
    }
    
    const animals = getAllAnimals();
    const animalIndex = animals.findIndex(a => a.id === animalId);
    
    if (animalIndex === -1) {
        alert('개체를 찾을 수 없습니다.');
        return;
    }
    
    const animal = animals[animalIndex];
    const now = new Date();
    
    // 산란 기록 추가
    if (!animal.layingRecords) animal.layingRecords = [];
    
    const layingRecord = {
        id: Date.now().toString(),
        date: now.toISOString(),
        eggCount: count,
        startDate: animal.layingStartDate || now.toISOString(),
        notes: '',
        createdAt: now.toISOString()
    };
    
    animal.layingRecords.push(layingRecord);
    animal.totalLayingCount = (animal.totalLayingCount || 0) + 1;
    animal.lastLayingDate = now.toISOString();
    animal.breedingStatus = '휴식기';
    animal.restPeriodStart = now.toISOString();
    animal.statusUpdatedAt = now.toISOString();
    
    // 다음 예상 산란일 계산 (45-60일 후)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 52); // 평균 52일
    animal.nextExpectedLayingDate = nextDate.toISOString();
    
    // 저장 및 동기화
    localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
    
    // Firebase 동기화
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
        window.firebaseSync.saveToCloud('animals', animals);
    }
    
    alert(`산란 완료! ${count}개의 알이 기록되었습니다. 휴식기로 들어갑니다.`);
    
    // 모달 닫고 목록 새로고침
    window.closeModal();
    if (typeof window.loadAnimalList === 'function') {
        window.loadAnimalList();
    }
};

// 산란 이력 보기
window.showLayingHistory = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체를 찾을 수 없습니다.');
        return;
    }
    
    const records = animal.layingRecords || [];
    
    let historyHtml = '';
    if (records.length === 0) {
        historyHtml = '<p class="text-gray-500 text-center py-8">아직 산란 기록이 없습니다.</p>';
    } else {
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        historyHtml = '<div class="space-y-3">';
        records.forEach((record, index) => {
            const date = new Date(record.date);
            const daysPassed = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
            
            historyHtml += `
                <div class="bg-white border rounded-lg p-4">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-lg">🥚</span>
                            <span class="font-medium">${index + 1}번째 산란</span>
                        </div>
                        <span class="text-sm text-gray-500">${daysPassed}일 전</span>
                    </div>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span class="text-gray-600">산란일:</span>
                            <span class="ml-2 font-medium">${date.toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div>
                            <span class="text-gray-600">알 개수:</span>
                            <span class="ml-2 font-medium text-pink-600">${record.eggCount}개</span>
                        </div>
                    </div>
                    ${record.notes ? `
                        <div class="mt-2 text-sm">
                            <span class="text-gray-600">메모:</span>
                            <p class="mt-1 text-gray-800">${record.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        historyHtml += '</div>';
    }
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-history mr-2"></i>${animal.name} - 산란 이력
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <!-- 요약 정보 -->
            <div class="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-6">
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-2xl font-bold text-pink-600">${animal.totalLayingCount || 0}</div>
                        <div class="text-sm text-gray-600">총 산란</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-purple-600">
                            ${records.reduce((sum, r) => sum + (r.eggCount || 0), 0)}
                        </div>
                        <div class="text-sm text-gray-600">총 알 수</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-blue-600">
                            ${records.length > 0 ? 
                                Math.round(records.reduce((sum, r) => sum + (r.eggCount || 0), 0) / records.length * 10) / 10 
                                : 0}
                        </div>
                        <div class="text-sm text-gray-600">평균 알 수</div>
                    </div>
                    <div>
                        <div class="text-2xl font-bold text-green-600">
                            ${animal.lastLayingDate ? 
                                Math.floor((new Date() - new Date(animal.lastLayingDate)) / (1000 * 60 * 60 * 24)) + '일' 
                                : '-'}
                        </div>
                        <div class="text-sm text-gray-600">마지막 산란</div>
                    </div>
                </div>
            </div>
            
            <!-- 산란 기록 목록 -->
            <div class="max-h-96 overflow-y-auto">
                ${historyHtml}
            </div>
            
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="showBreedingManagement('${animalId}')" 
                        class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                    <i class="fas fa-arrow-left mr-2"></i>산란 관리로 돌아가기
                </button>
            </div>
        </div>
    `;
};

// 산란 알림 대시보드 업데이트
window.updateBreedingAlerts = function(animals) {
    const alertContainer = document.getElementById('breedingAlerts');
    if (!alertContainer) return;
    
    const females = animals.filter(a => a.gender === '암컷' && a.status === '활성');
    const alerts = [];
    const today = new Date();
    
    females.forEach(animal => {
        if (!animal.breedingStatus) return;
        
        // 산란 예정일 알림
        if (animal.nextExpectedLayingDate) {
            const expectedDate = new Date(animal.nextExpectedLayingDate);
            const daysUntil = Math.floor((expectedDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 5 && daysUntil >= 0) {
                alerts.push({
                    type: 'warning',
                    icon: '⏰',
                    title: `${animal.name} 산란 예정`,
                    message: `${daysUntil === 0 ? '오늘' : daysUntil + '일 후'} 산란 예정일입니다.`,
                    animalId: animal.id
                });
            } else if (daysUntil < 0 && daysUntil >= -7) {
                alerts.push({
                    type: 'danger',
                    icon: '⚠️',
                    title: `${animal.name} 산란 지연`,
                    message: `예정일에서 ${Math.abs(daysUntil)}일 경과했습니다.`,
                    animalId: animal.id
                });
            }
        }
        
        // 산란 중 장기간 알림
        if (animal.breedingStatus === '산란중' && animal.layingStartDate) {
            const startDate = new Date(animal.layingStartDate);
            const daysSince = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
            
            if (daysSince >= 7) {
                alerts.push({
                    type: 'info',
                    icon: '🥚',
                    title: `${animal.name} 장기 산란`,
                    message: `${daysSince}일간 산란 중입니다. 상태를 확인해주세요.`,
                    animalId: animal.id
                });
            }
        }
        
        // 휴식기 종료 알림
        if (animal.breedingStatus === '휴식기' && animal.restPeriodStart) {
            const restStart = new Date(animal.restPeriodStart);
            const restDays = Math.floor((today - restStart) / (1000 * 60 * 60 * 24));
            
            if (restDays >= 30) {
                alerts.push({
                    type: 'success',
                    icon: '😴',
                    title: `${animal.name} 휴식기 종료`,
                    message: `휴식기 ${restDays}일 경과. 상태를 업데이트해주세요.`,
                    animalId: animal.id
                });
            }
        }
    });
    
    if (alerts.length === 0) {
        alertContainer.classList.add('hidden');
        return;
    }
    
    alertContainer.classList.remove('hidden');
    
    const alertTitle = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">
                <i class="fas fa-bell mr-2 text-yellow-500"></i>산란 알림 (${alerts.length}건)
            </h3>
            <button onclick="document.getElementById('breedingAlerts').classList.add('hidden')" 
                    class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    let alertHtml = alertTitle + '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    alerts.forEach(alert => {
        const typeColors = {
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            danger: 'bg-red-50 border-red-200 text-red-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800',
            success: 'bg-green-50 border-green-200 text-green-800'
        };
        
        alertHtml += `
            <div class="${typeColors[alert.type]} border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow" 
                 onclick="showBreedingManagement('${alert.animalId}')">
                <div class="flex items-start space-x-3">
                    <span class="text-xl">${alert.icon}</span>
                    <div class="flex-1">
                        <h4 class="font-semibold mb-1">${alert.title}</h4>
                        <p class="text-sm">${alert.message}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    alertHtml += '</div>';
    alertContainer.innerHTML = alertHtml;
};

// 건강 관리 기능들
window.saveHealthRecord = function() {
    const entityId = document.getElementById('healthEntitySelect').value;
    const healthType = document.getElementById('healthType').value;
    const healthDate = document.getElementById('healthDate').value;
    const healthNotes = document.getElementById('healthNotes').value;
    
    if (!entityId || !healthType || !healthDate) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    const healthRecord = {
        id: Date.now().toString(),
        entityId: entityId,
        type: healthType,
        date: healthDate,
        notes: healthNotes,
        createdAt: new Date().toISOString()
    };
    
    try {
        const records = getHealthRecords();
        records.push(healthRecord);
        localStorage.setItem('healthRecords', JSON.stringify(records));
        
        // Firebase 동기화
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
            window.firebaseSync.saveToCloud('healthRecords', records);
        }
        
        alert('건강 기록이 저장되었습니다.');
        
        // 폼 초기화
        document.getElementById('healthEntitySelect').value = '';
        document.getElementById('healthType').value = '';
        document.getElementById('healthNotes').value = '';
        
        // 기록 목록 새로고침
        loadRecentHealthRecords();
        
    } catch (error) {
        console.error('건강 기록 저장 오류:', error);
        alert('건강 기록 저장 중 오류가 발생했습니다.');
    }
};

window.loadHealthReminders = function() {
    const container = document.getElementById('healthReminders');
    if (!container) return;
    
    const animals = getAllAnimals();
    const babies = getBabies();
    const allEntities = [...animals, ...babies];
    const healthRecords = getHealthRecords();
    const reminders = [];
    const today = new Date();
    
    allEntities.forEach(entity => {
        if (entity.status !== '활성' && entity.status !== '베이비') return;
        
        const entityRecords = healthRecords.filter(r => r.entityId === entity.id);
        
        // 마지막 탈피 기록 확인
        const lastShedding = entityRecords
            .filter(r => r.type === '탈피')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
        if (lastShedding) {
            const daysSinceShedding = Math.floor((today - new Date(lastShedding.date)) / (1000 * 60 * 60 * 24));
            if (daysSinceShedding > 30) {
                reminders.push({
                    type: 'warning',
                    message: `${entity.name}: 탈피가 ${daysSinceShedding}일 경과`,
                    icon: 'fas fa-exclamation-triangle'
                });
            }
        } else {
            reminders.push({
                type: 'info',
                message: `${entity.name}: 탈피 기록 없음`,
                icon: 'fas fa-info-circle'
            });
        }
        
        // 마지막 건강검진 확인
        const lastCheckup = entityRecords
            .filter(r => r.type === '건강검진')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            
        if (lastCheckup) {
            const daysSinceCheckup = Math.floor((today - new Date(lastCheckup.date)) / (1000 * 60 * 60 * 24));
            if (daysSinceCheckup > 90) {
                reminders.push({
                    type: 'info',
                    message: `${entity.name}: 건강검진이 ${daysSinceCheckup}일 경과`,
                    icon: 'fas fa-stethoscope'
                });
            }
        }
    });
    
    if (reminders.length === 0) {
        container.innerHTML = '<p class="text-gray-500">현재 알림이 없습니다.</p>';
        return;
    }
    
    let html = '';
    reminders.forEach(reminder => {
        const colorClass = reminder.type === 'warning' ? 'text-yellow-700 bg-yellow-50' : 'text-blue-700 bg-blue-50';
        html += `
            <div class="p-2 rounded-lg ${colorClass}">
                <i class="${reminder.icon} mr-2"></i>${reminder.message}
            </div>
        `;
    });
    
    container.innerHTML = html;
};

window.loadRecentHealthRecords = function() {
    const container = document.getElementById('recentHealthRecords');
    if (!container) return;
    
    const records = getHealthRecords()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
        
    if (records.length === 0) {
        container.innerHTML = '<p class="text-gray-500">건강 기록이 없습니다.</p>';
        return;
    }
    
    const animals = getAllAnimals();
    const babies = getBabies();
    const allEntities = [...animals, ...babies];
    
    let html = '';
    records.forEach(record => {
        const entity = allEntities.find(e => e.id === record.entityId);
        const entityName = entity ? entity.name : '알 수 없음';
        const typeColor = window.getHealthTypeColor ? window.getHealthTypeColor(record.type) : 'bg-gray-100 text-gray-800';
        
        html += `
            <div class="flex items-center justify-between p-2 border-b border-gray-100">
                <div class="flex items-center space-x-3">
                    <span class="px-2 py-1 text-xs rounded-full ${typeColor}">${record.type}</span>
                    <span class="text-sm font-medium">${entityName}</span>
                </div>
                <span class="text-xs text-gray-500">${new Date(record.date).toLocaleDateString('ko-KR')}</span>
            </div>
        `;
    });
    
    container.innerHTML = html;
};

window.getHealthRecords = function() {
    const data = localStorage.getItem('healthRecords');
    return data ? JSON.parse(data) : [];
};

// 추가 누락된 함수들
window.showAnimalDetails = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    const modalContent = document.getElementById('modalContent');
    const statusColor = window.getStatusColor(animal.status);
    const breedingInfo = animal.gender === '암컷' && animal.breedingStatus ? 
        window.getBreedingStatusInfo(animal.breedingStatus) : null;
    
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-dragon mr-2"></i>${animal.name} 상세 정보
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- 기본 정보 -->
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-800 mb-3">기본 정보</h3>
                    <div class="space-y-2 text-sm">
                        <p><strong>이름:</strong> ${animal.name}</p>
                        <p><strong>성별:</strong> ${animal.gender}</p>
                        <p><strong>세대:</strong> ${animal.generation}</p>
                        <p><strong>모프:</strong> ${animal.morph || '미지정'}</p>
                        <p><strong>상태:</strong> <span class="px-2 py-1 rounded-full text-xs ${statusColor}">${animal.status}</span></p>
                        ${breedingInfo ? `
                            <p><strong>산란 상태:</strong> <span class="px-2 py-1 rounded-full text-xs ${breedingInfo.color}">${breedingInfo.label}</span></p>
                        ` : ''}
                        <p><strong>등록일:</strong> ${new Date(animal.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                </div>
                
                <!-- 이미지 -->
                <div>
                    ${animal.imageData ? `
                        <img src="${animal.imageData}" alt="${animal.name}" class="w-full h-64 object-cover rounded-lg">
                    ` : `
                        <div class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-dragon text-4xl text-gray-400"></i>
                        </div>
                    `}
                </div>
            </div>
            
            <!-- 액션 버튼 -->
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="editAnimal('${animal.id}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    <i class="fas fa-edit mr-2"></i>수정
                </button>
                ${animal.gender === '암컷' ? `
                    <button onclick="showBreedingManagement('${animal.id}')" class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                        <i class="fas fa-heart mr-2"></i>산란 관리
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.editAnimal = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 간단한 편집 모달
    const newName = prompt('개체 이름:', animal.name);
    if (newName === null) return;
    
    const newMorph = prompt('모프:', animal.morph || '');
    if (newMorph === null) return;
    
    // 업데이트
    const animalIndex = animals.findIndex(a => a.id === animalId);
    animals[animalIndex] = {
        ...animal,
        name: newName.trim(),
        morph: newMorph.trim(),
        updatedAt: new Date().toISOString()
    };
    
    // 저장
    localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
    
    // Firebase 동기화
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
        window.firebaseSync.saveToCloud('animals', animals);
    }
    
    alert('개체 정보가 업데이트되었습니다.');
    
    // 모달 닫고 목록 새로고침
    window.closeModal();
    if (typeof window.loadAnimalList === 'function') {
        window.loadAnimalList();
    }
};

window.deleteAnimal = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`"${animal.name}"을(를) 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        
        const updatedAnimals = animals.filter(a => a.id !== animalId);
        localStorage.setItem('geckoBreedingData', JSON.stringify(updatedAnimals));
        
        // Firebase 동기화
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
            window.firebaseSync.saveToCloud('animals', updatedAnimals);
        }
        
        alert('개체가 삭제되었습니다.');
        
        // 목록 새로고침
        if (typeof window.loadAnimalList === 'function') {
            window.loadAnimalList();
        }
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
    }
};

window.loadSoldList = function() {
    const animals = getAllAnimals();
    const soldAnimals = animals.filter(animal => animal.status === '분양완료');
    const container = document.getElementById('soldListContainer');
    
    if (!container) {
        console.warn('soldListContainer 엘리먼트를 찾을 수 없습니다.');
        return;
    }
    
    if (soldAnimals.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-handshake text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">분양 완료된 개체가 없습니다.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    soldAnimals.forEach(animal => {
        html += `
            <div class="bg-white rounded-lg shadow-md p-4 border border-blue-200">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-900">${animal.name}</h4>
                    <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">분양완료</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><i class="fas fa-venus-mars mr-2"></i>${animal.gender}</p>
                    <p><i class="fas fa-layer-group mr-2"></i>${animal.generation}</p>
                    ${animal.morph ? `<p><i class="fas fa-dna mr-2"></i>${animal.morph}</p>` : ''}
                </div>
                ${animal.imageData ? `
                    <div class="mt-3">
                        <img src="${animal.imageData}" alt="${animal.name}" class="w-full h-32 object-cover rounded-lg">
                    </div>
                ` : ''}
                <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="showSoldAnimalDetails('${animal.id}')" class="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            <i class="fas fa-info-circle mr-1"></i>상세보기
                        </button>
                        <button onclick="returnToActive('${animal.id}')" class="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                            <i class="fas fa-undo mr-1"></i>복원
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// 추가 모프 관련 함수들
window.calculateGeneticOutcome = function(fatherMorph, motherMorph, fatherInfo, motherInfo) {
    const outcomes = [];
    
    // 기본 유전 계산 (단순화된 버전)
    if (fatherMorph === '노멀' && motherMorph === '노먀') {
        outcomes.push({ morph: '노먀', percentage: '100%', rarity: '일반' });
    } else if (fatherMorph.includes('릴리화이트') || motherMorph.includes('릴리화이트')) {
        outcomes.push({ morph: '릴리화이트', percentage: '50%', rarity: '중급' });
        outcomes.push({ morph: '노먀', percentage: '50%', rarity: '일반' });
    } else if (fatherMorph.includes('달마시안') || motherMorph.includes('달마시안')) {
        outcomes.push({ morph: '달마시안', percentage: '50%', rarity: '중급' });
        outcomes.push({ morph: '노멀', percentage: '50%', rarity: '일반' });
    } else {
        outcomes.push({ morph: `${fatherMorph} x ${motherMorph} 후손`, percentage: '100%', rarity: '일반' });
    }
    
    // 릴리화이트 위험 경고
    let warnings = [];
    if (fatherMorph.includes('릴리화이트') && motherMorph.includes('릴리화이트')) {
        warnings.push('⚠️ 릴리화이트 x 릴리화이트 조합은 위험할 수 있습니다!');
    }
    
    return { outcomes, warnings };
};

window.getRarityColor = function(rarity) {
    switch(rarity) {
        case '일반': return 'bg-gray-100 text-gray-800';
        case '중급': return 'bg-blue-100 text-blue-800';
        case '고급': return 'bg-purple-100 text-purple-800';
        case '최고급': return 'bg-gold-100 text-yellow-800';
        case '위험': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

// 베이비 관련 함수들
window.showBabyDetails = function(babyId) {
    const babies = getBabies();
    const baby = babies.find(b => b.id === babyId);
    
    if (!baby) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    const age = baby.birthDate ? Math.floor((new Date() - new Date(baby.birthDate)) / (1000 * 60 * 60 * 24)) : 0;
    const genderColor = window.getGenderColor(baby.gender);
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">
                    <i class="fas fa-baby mr-2"></i>${baby.name} 상세 정보
                </h2>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-800 mb-3">기본 정보</h3>
                    <div class="space-y-2 text-sm">
                        <p><strong>ID:</strong> ${baby.id}</p>
                        <p><strong>나이:</strong> ${age}일</p>
                        <p><strong>성별:</strong> <span class="px-2 py-1 rounded-full text-xs ${genderColor}">${baby.gender}</span></p>
                        <p><strong>세대:</strong> ${baby.generation || 'F?'}</p>
                        <p><strong>모프:</strong> ${baby.morph || '미지정'}</p>
                        <p><strong>부모:</strong> ${baby.parent1} × ${baby.parent2}</p>
                        <p><strong>태어났 날:</strong> ${new Date(baby.birthDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                </div>
                
                <div>
                    ${baby.imageData ? `
                        <img src="${baby.imageData}" alt="${baby.name}" class="w-full h-64 object-cover rounded-lg">
                    ` : `
                        <div class="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-baby text-4xl text-gray-400"></i>
                        </div>
                    `}
                </div>
            </div>
            
            <div class="mt-6 flex justify-end space-x-3">
                <button onclick="editBaby('${baby.id}')" class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    <i class="fas fa-edit mr-2"></i>수정
                </button>
                <button onclick="promoteBabyToAdult('${baby.id}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <i class="fas fa-arrow-up mr-2"></i>성체로 승격
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.remove('hidden');
};

window.editBaby = function(babyId) {
    const babies = getBabies();
    const baby = babies.find(b => b.id === babyId);
    
    if (!baby) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    const newGender = prompt('성별 (미구분/수컷/암컷/수컷 추정/암컷 추정):', baby.gender);
    if (newGender === null) return;
    
    const newMorph = prompt('모프:', baby.morph || '');
    if (newMorph === null) return;
    
    const babyIndex = babies.findIndex(b => b.id === babyId);
    babies[babyIndex] = {
        ...baby,
        gender: newGender.trim(),
        morph: newMorph.trim(),
        updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('babies', JSON.stringify(babies));
    
    if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
        window.firebaseSync.saveToCloud('babies', babies);
    }
    
    alert('베이비 정보가 업데이트되었습니다.');
    
    window.closeModal();
    if (typeof window.loadBabyList === 'function') {
        window.loadBabyList();
    }
};

window.promoteBabyToAdult = function(babyId) {
    const babies = getBabies();
    const baby = babies.find(b => b.id === babyId);
    
    if (!baby) {
        alert('베이비 정보를 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`"${baby.id}"를 성체로 승격시키시겠습니까?`)) {
        const adultName = prompt('성체 이름을 입력하세요:', baby.id);
        if (!adultName) return;
        
        // 성체 객체 생성
        const adult = {
            id: Date.now().toString(),
            name: adultName.trim(),
            gender: baby.gender,
            generation: baby.generation,
            morph: baby.morph,
            imageData: baby.imageData,
            status: '활성',
            // 산란 관련 필드 (암컷만)
            breedingStatus: baby.gender === '암컷' ? '일반' : null,
            lastLayingDate: null,
            nextExpectedLayingDate: null,
            totalLayingCount: 0,
            layingRecords: [],
            restPeriodStart: null,
            promotedFrom: 'baby',
            originalBabyId: baby.id,
            createdAt: new Date().toISOString()
        };
        
        // 성체 등록
        const animals = getAllAnimals();
        animals.push(adult);
        localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
        
        // 베이비 삭제
        const updatedBabies = babies.filter(b => b.id !== babyId);
        localStorage.setItem('babies', JSON.stringify(updatedBabies));
        
        // Firebase 동기화
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
            window.firebaseSync.saveToCloud('animals', animals);
            window.firebaseSync.saveToCloud('babies', updatedBabies);
        }
        
        alert(`"${adultName}"이(가) 성체로 승격되었습니다!`);
        
        window.closeModal();
        if (typeof window.loadBabyList === 'function') {
            window.loadBabyList();
        }
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
    }
};

console.log('✅ 산란 관리 시스템이 로드되었습니다.');
console.log('✅ 베이비 관리 시스템이 로드되었습니다.');

// 누락된 필수 함수들 추가
window.closeModal = function() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
};

window.registerBaby = async function() {
    const gender = document.getElementById('babyGender').value;
    const morph = document.getElementById('babyMorph').value || document.getElementById('babyMorphSearch').value;
    const parent1Name = document.getElementById('babyParent1').value;
    const parent2Name = document.getElementById('babyParent2').value;
    const birthDate = document.getElementById('babyBirthDate').value;
    const generation = document.getElementById('babyGeneration').value;
    const imageInput = document.getElementById('babyImage');
    
    if (!gender || !parent1Name || !parent2Name || !birthDate) {
        alert('필수 항목을 모두 입력해주세요.');
        return;
    }
    
    // 베이비 ID 생성
    const date = new Date(birthDate);
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const parent1Initial = parent1Name.charAt(0);
    const parent2Initial = parent2Name.charAt(0);
    const parentInitials = parent1Initial + parent2Initial;
    
    const existingBabies = getBabies();
    const sameParentBabies = existingBabies.filter(b => 
        b.parent1 === parent1Name && b.parent2 === parent2Name
    );
    const sequence = (sameParentBabies.length + 1).toString().padStart(2, '0');
    
    const babyId = `${year}${month}${day}-${parentInitials}-${sequence}`;
    
    let imageData = null;
    if (imageInput.files[0]) {
        try {
            imageData = await processImageFile(imageInput.files[0]);
        } catch (error) {
            console.error('이미지 처리 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
            return;
        }
    }
    
    const baby = {
        id: babyId,
        name: babyId,
        gender: gender,
        morph: morph,
        generation: generation,
        parent1: parent1Name,
        parent2: parent2Name,
        birthDate: birthDate,
        imageData: imageData,
        status: '베이비',
        weight: null,
        notes: '',
        growthRecords: {},
        createdAt: new Date().toISOString()
    };
    
    try {
        const babies = getBabies();
        babies.push(baby);
        localStorage.setItem('babies', JSON.stringify(babies));
        
        // Firebase 동기화
        if (window.firebaseSync && typeof window.firebaseSync.saveToCloud === 'function') {
            await window.firebaseSync.saveToCloud('babies', babies);
        }
        
        alert('베이비가 성공적으로 등록되었습니다!');
        window.closeModal();
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
    } catch (error) {
        console.error('베이비 등록 오류:', error);
        alert('베이비 등록 중 오류가 발생했습니다.');
    }
};

window.loadBabyList = function() {
    const babies = getBabies();
    const container = document.getElementById('babyListContainer');
    
    if (!container) {
        console.warn('babyListContainer 엘리먼트를 찾을 수 없습니다.');
        return;
    }
    
    if (babies.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-baby text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">등록된 베이비가 없습니다.</p>
                <p class="text-sm text-gray-400 mt-2">베이비를 등록해보세요!</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
    
    babies.forEach(baby => {
        const genderColor = window.getGenderColor ? window.getGenderColor(baby.gender) : 'bg-gray-100 text-gray-800';
        const age = baby.birthDate ? Math.floor((new Date() - new Date(baby.birthDate)) / (1000 * 60 * 60 * 24)) : 0;
        
        html += `
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-900">${baby.name}</h4>
                    <span class="px-2 py-1 text-xs rounded-full ${genderColor}">${baby.gender}</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <p><i class="fas fa-calendar mr-2"></i>${age}일 된</p>
                    <p><i class="fas fa-layer-group mr-2"></i>${baby.generation || 'F?'}</p>
                    ${baby.morph ? `<p><i class="fas fa-dna mr-2"></i>${baby.morph}</p>` : ''}
                    <p><i class="fas fa-heart mr-2"></i>${baby.parent1} × ${baby.parent2}</p>
                </div>
                ${baby.imageData ? `
                    <div class="mt-3">
                        <img src="${baby.imageData}" alt="${baby.name}" class="w-full h-32 object-cover rounded-lg">
                    </div>
                ` : ''}
                <div class="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="showBabyDetails('${baby.id}')" class="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                            <i class="fas fa-info-circle mr-1"></i>상세보기
                        </button>
                        <button onclick="editBaby('${baby.id}')" class="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                    </div>
                    <button onclick="promoteBabyToAdult('${baby.id}')" class="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                        <i class="fas fa-arrow-up mr-2"></i>성체로 승격
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
};

// 안전한 초기화 및 에러 방지
window.safeInit = function() {
    try {
        // 모든 필수 함수들이 존재하는지 확인
        const requiredFunctions = [
            'updateStatistics',
            'getAllAnimals', 
            'getBabies',
            'getStatusColor',
            'getMorphInfo'
        ];
        
        const missingFunctions = requiredFunctions.filter(fn => 
            typeof window[fn] !== 'function'
        );
        
        if (missingFunctions.length > 0) {
            console.warn('누락된 함수들:', missingFunctions);
        }
        
        // 통계 업데이트
        if (typeof window.updateStatistics === 'function') {
            window.updateStatistics();
        }
        
        console.log('✅ 안전한 초기화 완료');
        
    } catch (error) {
        console.error('❌ 초기화 에러:', error);
    }
};

// 페이지 로드 시 통계 업데이트
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(window.safeInit, 1500);
});
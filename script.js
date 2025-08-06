// 간단한 파충류 브리딩 관리 시스템
const LOCAL_STORAGE_KEY = 'gecko-breeding-data';

// 전역 함수들
window.closeModal = function() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('hidden');
    }
};

window.saveAnimal = function(name, gender, generation, morph, imageData) {
    const animal = {
        id: Date.now().toString(),
        name: name,
        gender: gender,
        generation: generation,
        morph: morph,
        imageData: imageData,
        status: '활성',
        createdAt: new Date().toISOString()
    };
    
    try {
        let animals = getAllAnimals();
        animals.push(animal);
        localStorage.setItem('geckoBreedingData', JSON.stringify(animals));
        
        // Firebase 동기화
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            await window.firebaseSync.saveToCloud('animals', animals);
        }
        
        alert('개체가 성공적으로 등록되었습니다!');
        closeModal();
        updateStatistics();
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            alert('저장 공간이 부족합니다. 일부 데이터를 삭제한 후 다시 시도해주세요.');
        } else {
            alert('개체 등록 중 오류가 발생했습니다: ' + e.message);
        }
    }
};

window.registerAnimal = function() {
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
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            saveAnimal(name, gender, generation, morph, imageData);
        };
        reader.readAsDataURL(file);
    } else {
        saveAnimal(name, gender, generation, morph, imageData);
    }
};

window.loadAnimalList = function() {
    const animals = getAllAnimals();
    // 분양완료 상태가 아닌 개체들만 표시
    const activeAnimals = animals.filter(animal => animal.status !== '분양완료');
    const container = document.getElementById('animalListContainer');
    
    if (!container) return;
    
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
        const statusColor = getStatusColor(animal.status);
        html += `
            <div class="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-900">${animal.name}</h4>
                    <span class="px-2 py-1 text-xs rounded-full ${statusColor}">${animal.status}</span>
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
                        <button onclick="showAnimalDetails('${animal.id}')" class="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                            <i class="fas fa-info-circle mr-1"></i>상세보기
                        </button>
                        <button onclick="editAnimal('${animal.id}')" class="px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700">
                            <i class="fas fa-edit mr-1"></i>수정
                        </button>
                    </div>
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

window.saveBaby = function(gender, morph, parent1, parent2, birthDate, generation, imageData) {
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
        
        // Firebase 동기화
        if (window.firebaseSync && window.firebaseSync.isInitialized) {
            await window.firebaseSync.saveToCloud('babies', babies);
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

window.registerBaby = function() {
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
        const reader = new FileReader();
        reader.onload = function(e) {
            imageData = e.target.result;
            saveBaby(gender, morph, parent1, parent2, birthDate, generation, imageData);
        };
        reader.readAsDataURL(file);
    } else {
        saveBaby(gender, morph, parent1, parent2, birthDate, generation, imageData);
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

window.confirmPromoteToAdult = function(babyId) {
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
            
            // Firebase 동기화
            if (window.firebaseSync && window.firebaseSync.isInitialized) {
                await window.firebaseSync.saveToCloud('animals', animals);
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
            
            // Firebase 동기화
            if (window.firebaseSync && window.firebaseSync.isInitialized) {
                await window.firebaseSync.saveToCloud('babies', updatedBabies);
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
    
    // Firebase 동기화
    if (window.firebaseSync && window.firebaseSync.isInitialized) {
        window.firebaseSync.saveToCloud('animals', animals);
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
    showAnimalDetails(animalId);
};

window.returnToActive = function(animalId) {
    const animals = getAllAnimals();
    const animal = animals.find(a => a.id === animalId);
    
    if (!animal) {
        alert('개체 정보를 찾을 수 없습니다.');
        return;
    }
    
    if (confirm(`"${animal.name}"을(를) 활성 상태로 복원하시겠습니까?`)) {
        updateAnimalStatus(animalId, '활성');
        loadSoldList(); // 분양 완료 목록 새로고침
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
    const animals = getAllAnimals();
    const babies = getBabies();
    
    // 활성 개체만 총 개체 수에 포함 (분양완료 제외)
    const activeAnimals = animals.filter(a => a.status !== '분양완료');
    document.getElementById('totalAnimals').textContent = activeAnimals.length;
    
    // 세대별 개체 수 (활성 개체만)
    const f1Count = activeAnimals.filter(a => a.generation === 'F1').length;
    const f2Count = activeAnimals.filter(a => a.generation === 'F2').length;
    const f3Count = activeAnimals.filter(a => a.generation === 'F3').length;
    const f4PlusCount = activeAnimals.filter(a => ['F4', 'F5', 'F6'].includes(a.generation)).length;
    
    document.getElementById('f1Count').textContent = f1Count;
    document.getElementById('f2Count').textContent = f2Count;
    document.getElementById('f3Count').textContent = f3Count;
    document.getElementById('f4PlusCount').textContent = f4PlusCount;
    
    // 베이비 통계 업데이트
    const totalBabies = babies.length;
    
    if (document.getElementById('babyCount')) {
        document.getElementById('babyCount').textContent = totalBabies;
    }
    
    // 분양 완료 통계 업데이트
    const soldAnimals = animals.filter(a => a.status === '분양완료');
    if (document.getElementById('soldCount')) {
        document.getElementById('soldCount').textContent = soldAnimals.length;
    }
};

// 페이지 로드 시 초기화
window.onload = function() {
    updateStatistics();
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
};

console.log('✅ 베이비 관리 시스템이 로드되었습니다.');
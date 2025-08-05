// 로컬 스토리지 사용 (Firebase 연결 문제 우회)
const LOCAL_STORAGE_KEY = 'gecko-breeding-data';

// 플랜 시스템 정의
const paymentSystem = {
  plans: {
    free: { 
      name: 'Free', 
      limits: { 
        animals: 5, 
        generations: ['f1'], 
        imagesPerAnimal: 1 
      } 
    },
    pro: { 
      name: 'Pro', 
      limits: { 
        animals: 50, 
        generations: ['f1', 'f2', 'f3'], 
        imagesPerAnimal: 5 
      } 
    },
    enterprise: { 
      name: 'Enterprise', 
      limits: { 
        animals: 200, 
        generations: ['f1', 'f2', 'f3', 'f4'], 
        imagesPerAnimal: 10 
      } 
    },
    lifetime: { 
      name: 'Lifetime Pro', 
      limits: { 
        animals: -1, 
        generations: ['f1', 'f2', 'f3', 'f4', 'f5'], 
        imagesPerAnimal: -1 
      } 
    },
    admin: { 
      name: 'Admin', 
      limits: { 
        animals: -1, 
        generations: ['f1', 'f2', 'f3', 'f4', 'f5'], 
        imagesPerAnimal: -1 
      } 
    }
  }
};

function saveToLocalStorage(data) {
  const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  existing.f1 = existing.f1 || [];
  existing.f1.push({
    id: Date.now().toString(),
    ...data,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
}

function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  return data.f1 || [];
}

const animalNameInput = document.getElementById("animalName");
const animalImageInput = document.getElementById("animalImage");
const registerStatus = document.getElementById("registerStatus");
const generationSelect = document.getElementById("generationSelect");
const animalGenderSelect = document.getElementById("animalGender");
const animalStatusSelect = document.getElementById("animalStatus");
const fatherSelect = document.getElementById("fatherSelect");
const motherSelect = document.getElementById("motherSelect");
const treeGenerationSelect = document.getElementById("treeGeneration");

function updateGenerationFields() {
  const generation = generationSelect.value;
  const gender = animalGenderSelect.value;
  const parentFields = document.getElementById("parentFields");
  
  if (generation === "F1") {
    // F1은 부모 정보 없음
    parentFields.style.display = "none";
  } else {
    // F2 이상은 부모 정보 필요
    if (gender) {
      // 성별이 선택되어 있으면 부모 필드 표시
      parentFields.style.display = "block";
      loadParentOptions(generation);
    } else {
      // 성별이 선택되지 않았으면 부모 필드 숨김
      parentFields.style.display = "none";
    }
  }
}

function loadParentOptions(generation) {
  const allAnimals = getAllAnimals();
  const parentGeneration = getParentGeneration(generation);
  
  console.log('부모 옵션 로드:', { generation, parentGeneration, allAnimals });
  
  // 부모 세대의 개체들만 필터링
  const parentAnimals = allAnimals.filter(animal => animal.generation === parentGeneration);
  
  console.log('부모 세대 개체들:', parentAnimals);
  
  // 부개체 옵션 (수컷만)
  fatherSelect.innerHTML = '<option value="">부개체 선택</option>';
  const maleParents = parentAnimals.filter(animal => animal.gender === '수컷');
  console.log('수컷 부모들:', maleParents);
  
  maleParents.forEach(animal => {
    const option = `<option value="${animal.name}">${animal.name}</option>`;
    fatherSelect.innerHTML += option;
  });
  
  // 부개체를 모를 경우 "없음" 옵션 추가
  fatherSelect.innerHTML += '<option value="unknown">없음 (부개체 불명)</option>';
  
  // 모개체 옵션 (암컷만)
  motherSelect.innerHTML = '<option value="">모개체 선택</option>';
  const femaleParents = parentAnimals.filter(animal => animal.gender === '암컷');
  console.log('암컷 부모들:', femaleParents);
  
  femaleParents.forEach(animal => {
    const option = `<option value="${animal.name}">${animal.name}</option>`;
    motherSelect.innerHTML += option;
  });
}

function getParentGeneration(generation) {
  const generationNumber = parseInt(generation.substring(1));
  return `F${generationNumber - 1}`;
}

function getAllAnimals() {
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  const allAnimals = [];
  
  console.log('로컬 스토리지 데이터:', data);
  
  // F1 개체들
  if (data.f1) {
    data.f1.forEach(animal => {
      allAnimals.push({...animal, generation: 'F1'});
    });
  }
  
  // F2 개체들
  if (data.f2) {
    data.f2.forEach(animal => {
      allAnimals.push({...animal, generation: 'F2'});
    });
  }
  
  // F3, F4, F5 등 추가 세대들
  for (let i = 3; i <= 5; i++) {
    const genKey = `f${i}`;
    if (data[genKey]) {
      data[genKey].forEach(animal => {
        allAnimals.push({...animal, generation: `F${i}`});
      });
    }
  }
  
  console.log('모든 개체들:', allAnimals);
  return allAnimals;
}

function toggleParentFields() {
  const gender = animalGenderSelect.value;
  const generation = generationSelect.value;
  const parentFields = document.getElementById("parentFields");
  
  // F1은 부모 정보가 필요 없음
  if (generation === "F1") {
    parentFields.style.display = "none";
    return;
  }
  
  // F2 이상은 부모 정보 필요
  if (gender) {
    // 성별이 선택되면 부모 필드 표시
    parentFields.style.display = "block";
    
    // 부모 옵션 로드
    loadParentOptions(generation);
  } else {
    // 성별이 선택되지 않았으면 부모 필드 숨김
    parentFields.style.display = "none";
  }
}

window.registerAnimal = async function() {
  const name = animalNameInput.value;
  const category = document.getElementById('animalCategory').value;
  const generation = generationSelect.value;
  const gender = animalGenderSelect.value;
  const status = animalStatusSelect.value;
  const father = fatherSelect.value;
  const mother = motherSelect.value;
  const file = animalImageInput.files[0];

  // 선택된 모프들 수집
  const selectedMorphs = [];
  const morphCategories = ['basic', 'lily', 'sable', 'axanthic', 'choco', 'pinstripe', 'harlequin', 'color'];
  
  morphCategories.forEach(category => {
    const checkboxes = document.querySelectorAll(`input[name="animal-morph-${category}"]:checked`);
    checkboxes.forEach(checkbox => {
      selectedMorphs.push(checkbox.value);
    });
  });

  // 테스터를 위한 플랜 제한 완화
  const currentUser = userManager.getCurrentUser();
  const animalCount = getAllAnimals().length;
  const plan = paymentSystem.plans[currentUser?.plan || 'free'];
  
  // 테스터를 위해 개체 수 제한 완화 (모든 사용자에게 무제한 허용)
  // if (plan && plan.limits.animals !== -1 && animalCount >= plan.limits.animals) {
  //   showStatus("registerStatus", `${plan.name} 플랜은 최대 ${plan.limits.animals}개체까지만 등록할 수 있습니다. 업그레이드하세요.`, "error");
  //   return;
  // }
  
  // 테스터를 위해 세대 제한 완화 (모든 세대 허용)
  // if (plan && plan.limits.generations && !plan.limits.generations.includes(generation.toLowerCase())) {
  //   const allowedGenerations = plan.limits.generations.map(g => g.toUpperCase()).join(', ');
  //   showStatus("registerStatus", `${plan.name} 플랜은 ${allowedGenerations} 세대까지만 등록할 수 있습니다.`, "error");
  //   return;
  // }
  
  if (!name) {
    showStatus("registerStatus", "이름을 입력해주세요.", "error");
    return;
  }

  if (!gender) {
    showStatus("registerStatus", "성별을 선택해주세요.", "error");
    return;
  }

  // F2 이상에서 부모 선택 확인
  if (generation !== "F1") {
    // 부개체와 모개체 중 최소 1개는 필수
    const hasFather = father && father !== "unknown";
    const hasMother = mother && mother !== "";
    
    if (!hasFather && !hasMother) {
      showStatus("registerStatus", "부개체와 모개체 중 최소 1개는 선택해야 합니다.", "error");
      return;
    }
    
    // 둘 다 없는 경우는 허용하지 않음
    if (!hasFather && !hasMother) {
      showStatus("registerStatus", "부개체와 모개체 중 하나는 반드시 선택해주세요.", "error");
      return;
    }
  }
  
  // 릴리화이트 위험성 경고
  if (selectedMorphs.includes('lily-white')) {
    const hasLilyWhite = await checkLilyWhiteInParents(father, mother);
    if (hasLilyWhite) {
      const warning = confirm("⚠️ 경고: 릴리화이트끼리 메이팅은 치명적 결함을 가진 자손을 낳을 수 있습니다. 계속하시겠습니까?");
      if (!warning) return;
    }
  }

  try {
    showStatus("registerStatus", "등록 중...", "info");
    
    // 파일이 있으면 이미지 데이터를 압축하여 Base64로 변환
    let fileInfo = null;
    let imageData = null;
    
    if (file) {
      // 테스터를 위한 파일 크기 제한 완화 (50MB로 증가)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      
      if (file.size > maxFileSize) {
        const maxSizeMB = maxFileSize / (1024 * 1024);
        showStatus("registerStatus", `파일 크기가 너무 큽니다 (${maxSizeMB}MB 이하).`, "error");
        return;
      }
      
      // 테스터를 위해 이미지 개수 제한 완화 (무제한 허용)
      // const plan = paymentSystem.plans[currentUser?.plan || 'free'];
      // if (plan && plan.limits.imagesPerAnimal !== -1) {
      //   const currentImages = 0;
      //   if (currentImages >= plan.limits.imagesPerAnimal) {
      //     showStatus("registerStatus", `${plan.name} 플랜은 개체당 ${plan.limits.imagesPerAnimal}장까지만 등록할 수 있습니다.`, "error");
      //     return;
      //   }
      // }
      
      fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      
      // 이미지를 압축하여 Base64로 변환
      imageData = await compressImage(file);
    }

    // 로컬 스토리지에 저장
    const data = {
      name,
      category,
      generation,
      gender,
      status,
      father: father || null,
      mother: mother || null,
      morphs: selectedMorphs,
      fileInfo: fileInfo,
      imageData: imageData,
      imageStatus: file ? "pending" : "no-file",
      createdAt: new Date().toISOString()
    };
    
    saveAnimalToStorage(data);
    
    console.log("등록 성공:", data);
    showStatus("registerStatus", `${generation} 개체가 성공적으로 등록되었습니다!` + (file ? " (이미지 포함)" : ""), "success");
    
    // 입력 필드 초기화
    animalNameInput.value = "";
    animalGenderSelect.value = "";
    fatherSelect.value = "";
    motherSelect.value = "";
    animalImageInput.value = "";
    
    // 이미지 미리보기 초기화
    document.getElementById("imagePreview").style.display = "none";
    
    // 부모 필드 숨기기
    document.getElementById("parentFields").style.display = "none";
    
    // 옵션 다시 로드
    updateGenerationFields();
    
  } catch (err) {
    console.error("등록 오류:", err);
    if (err.message.includes('quota')) {
      showStatus("registerStatus", "저장 공간이 부족합니다. 이미지 크기를 줄이거나 기존 데이터를 정리해주세요.", "error");
    } else {
      showStatus("registerStatus", "등록에 실패했습니다: " + err.message, "error");
    }
  }
}

// 이미지 압축 함수
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      // 이미지 크기 제한 (최대 1200x1200으로 증가)
      const maxSize = 1200;
      let width = img.width;
      let height = img.height;
      
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
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);
      
      // 압축된 이미지를 Base64로 변환 (품질 0.9로 증가)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(compressedDataUrl);
    };
    
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function saveAnimalToStorage(animalData) {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    const generationKey = animalData.generation.toLowerCase();
    
    if (!data[generationKey]) {
      data[generationKey] = [];
    }
    
    data[generationKey].push({
      id: Date.now().toString(),
      ...animalData
    });
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      throw new Error('저장 공간이 부족합니다.');
    }
    throw err;
  }
}

function loadF1Options() {
  const f1Data = loadFromLocalStorage();
  
  // F1 등록용 부모 선택 옵션 (성별에 따라)
  const gender = animalGenderSelect.value;
  const currentName = animalNameInput.value;
  
  if (gender === "male") {
    fatherSelect.innerHTML = '<option value="">아버지 선택 (선택사항)</option>';
    f1Data.forEach((item) => {
      if (item.name !== currentName) {
        const option = `<option value="${item.name}">${item.name}</option>`;
        fatherSelect.innerHTML += option;
      }
    });
  } else if (gender === "female") {
    motherSelect.innerHTML = '<option value="">어머니 선택 (선택사항)</option>';
    f1Data.forEach((item) => {
      if (item.name !== currentName) {
        const option = `<option value="${item.name}">${item.name}</option>`;
        motherSelect.innerHTML += option;
      }
    });
  }
  
  // F2 생성용 부모 선택 옵션
  fatherSelect.innerHTML = '<option value="">아버지 선택</option>';
  motherSelect.innerHTML = '<option value="">어머니 선택</option>';
  
  f1Data.forEach((item) => {
    const option = `<option value="${item.name}">${item.name}</option>`;
    fatherSelect.innerHTML += option;
    motherSelect.innerHTML += option;
  });
  
  console.log("F1 옵션 로드 완료:", f1Data.length, "개");
}

function showRegisteredAnimals() {
  // 새로운 필터링 시스템 사용
  filterAnimals();
}

function updateStats() {
  const allAnimals = getAllAnimals();
  const f1Count = allAnimals.filter(animal => animal.generation === 'F1').length;
  const f2Count = allAnimals.filter(animal => animal.generation === 'F2').length;
  const f3Count = allAnimals.filter(animal => animal.generation === 'F3').length;
  const f4Count = allAnimals.filter(animal => animal.generation === 'F4').length;
  const f5Count = allAnimals.filter(animal => animal.generation === 'F5').length;
  const totalCount = allAnimals.length;
  
  document.getElementById("f1Count").textContent = f1Count;
  document.getElementById("f2Count").textContent = f2Count;
  document.getElementById("f3Count").textContent = f3Count;
  document.getElementById("f4Count").textContent = f4Count;
  document.getElementById("f5Count").textContent = f5Count;
  document.getElementById("totalCount").textContent = totalCount;
}

function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  element.innerHTML = '<div class="status ' + type + '"><i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i> ' + message + '</div>';
  
  // 3초 후 자동으로 사라지게
  setTimeout(() => {
    element.innerHTML = '';
  }, 3000);
}

function showAnimalDetail(index) {
  const modal = document.getElementById("animalModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalContent");
  
  const animal = filteredAnimals[index];
  if (!animal) {
    console.error('Animal not found at index:', index);
    return;
  }
  
  modalTitle.textContent = `${animal.name} (${animal.generation} 개체)`;
  
  let content = '<div style="font-size: 12px;">';
  
  // 이미지 표시
  if (animal.imageData) {
    content += '<div style="text-align: center; margin-bottom: 1rem;">';
    content += '<div style="width: 250px; height: 250px; border: 3px solid #007bff; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: white; margin: 0 auto; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    content += '<img src="' + animal.imageData + '" alt="' + animal.name + '" style="max-width: 100%; max-height: 100%; object-fit: contain;">';
    content += '</div>';
    content += '<div style="text-align: center; margin-top: 0.5rem; font-size: 11px; color: #666;">실제 이미지</div>';
    content += '</div>';
  } else if (animal.fileInfo) {
    // 이미지 데이터는 없지만 파일 정보는 있는 경우
    content += '<div style="text-align: center; margin-bottom: 1rem;">';
    content += '<div style="width: 250px; height: 250px; border: 3px solid #ffc107; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #fff3cd; margin: 0 auto;">';
    content += '<div style="text-align: center; color: #856404;">';
    content += '<div style="font-size: 48px; margin-bottom: 0.5rem;">📷</div>';
    content += '<div style="font-size: 14px; margin-bottom: 0.3rem;">이미지 파일</div>';
    content += '<div style="font-size: 12px; margin-top: 0.3rem;">' + animal.fileInfo.name + '</div>';
    content += '<div style="font-size: 11px; margin-top: 0.5rem; color: #856404;">재등록 필요</div>';
    content += '</div>';
    content += '</div>';
    content += '</div>';
  } else {
    // 이미지 정보가 없는 경우
    content += '<div style="text-align: center; margin-bottom: 1rem;">';
    content += '<div style="width: 250px; height: 250px; border: 3px solid #6c757d; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; margin: 0 auto;">';
    content += '<div style="text-align: center; color: #6c757d;">';
    content += '<div style="font-size: 48px; margin-bottom: 0.5rem;">📷</div>';
    content += '<div style="font-size: 14px; margin-bottom: 0.3rem;">이미지 없음</div>';
    content += '</div>';
    content += '</div>';
    content += '</div>';
  }
  
  // 개체 정보
  content += '<div style="background: #f8f9fa; padding: 0.8rem; border-radius: 5px; margin-bottom: 1rem;">';
  content += '<h4 style="margin: 0 0 0.5rem 0; color: #333;">기본 정보</h4>';
  content += '<div style="line-height: 1.6;">';
  content += '<strong>이름:</strong> ' + animal.name + '<br>';
  content += '<strong>세대:</strong> ' + animal.generation + '<br>';
  content += '<strong>성별:</strong> <span style="color: ' + (animal.gender === '수컷' ? '#007bff' : '#e83e8c') + ';">' + animal.gender + '</span><br>';
  content += '<strong>카테고리:</strong> ' + getCategoryText(animal.category) + '<br>';
  content += '<strong>상태:</strong> ' + getStatusText(animal.status || 'active') + '<br>';
  if (animal.father && animal.father !== 'unknown') content += '<strong>부개체:</strong> ' + animal.father + '<br>';
  if (animal.mother) content += '<strong>모개체:</strong> ' + animal.mother + '<br>';
  content += '<strong>등록일:</strong> ' + new Date(animal.createdAt).toLocaleDateString();
  content += '</div>';
  content += '</div>';
  
  // 모프 정보 표시
  if (animal.morphs && animal.morphs.length > 0) {
    content += '<div style="background: #e8f5e8; padding: 0.8rem; border-radius: 5px; margin-bottom: 1rem;">';
    content += '<h4 style="margin: 0 0 0.5rem 0; color: #333;">모프 정보</h4>';
    content += '<div style="line-height: 1.6;">';
    content += '<strong>보유 모프:</strong><br>';
    animal.morphs.forEach(morph => {
      const morphInfo = morphDatabase[morph];
      if (morphInfo) {
        content += '• ' + morphInfo.name + ' (' + morphInfo.description + ')<br>';
      } else {
        content += '• ' + morph + '<br>';
      }
    });
    content += '</div>';
    content += '</div>';
  }
  
  // 파일 정보
  if (animal.fileInfo) {
    content += '<div style="background: #f8f9fa; padding: 0.8rem; border-radius: 5px;">';
    content += '<h4 style="margin: 0 0 0.5rem 0; color: #333;">파일 정보</h4>';
    content += '<div style="line-height: 1.6;">';
    content += '<strong>파일명:</strong> ' + animal.fileInfo.name + '<br>';
    content += '<strong>파일 크기:</strong> ' + (animal.fileInfo.size / 1024).toFixed(1) + ' KB<br>';
    content += '<strong>파일 타입:</strong> ' + animal.fileInfo.type;
    content += '</div>';
    content += '</div>';
  }
  
  content += '</div>';
  
  modalContent.innerHTML = content;
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("animalModal").style.display = "none";
}

function showImageReuploadModal() {
  const f1Data = loadFromLocalStorage();
  const reuploadModal = document.getElementById("reuploadModal");
  const reuploadContent = document.getElementById("reuploadContent");
  
  let html = '<div style="font-size: 14px;">';
  html += '<p style="margin-bottom: 1.5rem; color: #666; font-size: 1rem;">이미지가 없는 개체들의 이미지를 재등록할 수 있습니다.</p>';
  
  const animalsWithoutImage = f1Data.filter(item => !item.imageData);
  
  if (animalsWithoutImage.length === 0) {
    html += '<div style="text-align: center; padding: 40px; color: #28a745;"><i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>모든 개체에 이미지가 등록되어 있습니다!</div>';
  } else {
    html += '<div style="max-height: 400px; overflow-y: auto;">';
    animalsWithoutImage.forEach((item, index) => {
      const originalIndex = f1Data.findIndex(f1 => f1.name === item.name);
      const genderText = item.gender === 'male' ? '수컷' : item.gender === 'female' ? '암컷' : '미정';
      const genderClass = item.gender === 'male' ? 'gender-male' : item.gender === 'female' ? 'gender-female' : 'gender-unknown';
      
      html += '<div style="border: 2px solid #e9ecef; padding: 1rem; margin: 0.5rem 0; border-radius: 10px; background: #f8f9fa;">';
      html += '<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">';
      html += '<div style="width: 60px; height: 60px; background: #ffc107; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem;">';
      html += '<i class="fas fa-camera"></i>';
      html += '</div>';
      html += '<div>';
      html += '<h4 style="margin: 0; color: #2c3e50;">' + item.name + ' <span class="gender-badge ' + genderClass + '">' + genderText + '</span></h4>';
      if (item.fileInfo) html += '<p style="margin: 0.3rem 0; color: #666; font-size: 0.9rem;"><i class="fas fa-file-image"></i> ' + item.fileInfo.name + '</p>';
      html += '</div>';
      html += '</div>';
      
      html += '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">';
      html += '<input type="file" id="reupload_' + originalIndex + '" accept="image/*" style="flex: 1; min-width: 200px; padding: 0.5rem; border: 2px solid #e9ecef; border-radius: 6px; font-size: 0.9rem;" />';
      html += '<button onclick="reuploadImage(' + originalIndex + ')" class="btn btn-warning btn-sm" style="white-space: nowrap;"><i class="fas fa-upload"></i> 업데이트</button>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    
    // 일괄 업로드 기능 추가
    html += '<div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e9ecef;">';
    html += '<h4 style="margin-bottom: 1rem; color: #2c3e50;"><i class="fas fa-magic"></i> 일괄 이미지 업로드</h4>';
    html += '<p style="margin-bottom: 1rem; color: #666; font-size: 0.9rem;">여러 이미지를 한 번에 선택하여 자동으로 매칭할 수 있습니다.</p>';
    html += '<input type="file" id="batchUpload" accept="image/*" multiple style="width: 100%; padding: 0.8rem; border: 2px solid #e9ecef; border-radius: 8px; margin-bottom: 1rem;" />';
    html += '<button onclick="batchUploadImages()" class="btn btn-info"><i class="fas fa-magic"></i> 일괄 업로드</button>';
    html += '</div>';
  }
  
  html += '</div>';
  reuploadContent.innerHTML = html;
  reuploadModal.style.display = "block";
}

async function batchUploadImages() {
  const fileInput = document.getElementById('batchUpload');
  const files = Array.from(fileInput.files);
  
  if (files.length === 0) {
    alert("이미지 파일을 선택해주세요.");
    return;
  }
  
  const f1Data = loadFromLocalStorage();
  const animalsWithoutImage = f1Data.filter(item => !item.imageData);
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  let updatedCount = 0;
  
  for (const file of files) {
    // 파일 크기 확인
    if (file.size > 5 * 1024 * 1024) {
      console.log(`파일 ${file.name}이 너무 큽니다.`);
      continue;
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      console.log(`파일 ${file.name}이 이미지가 아닙니다.`);
      continue;
    }
    
    // 파일명과 일치하는 개체 찾기
    const matchingAnimal = animalsWithoutImage.find(animal => 
      animal.fileInfo && animal.fileInfo.name.toLowerCase() === file.name.toLowerCase()
    );
    
    if (matchingAnimal) {
      try {
        // 이미지를 Base64로 변환
        const imageData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        // 데이터 업데이트
        const animalIndex = data.f1.findIndex(item => item.name === matchingAnimal.name);
        if (animalIndex !== -1) {
          data.f1[animalIndex].imageData = imageData;
          data.f1[animalIndex].fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          };
          updatedCount++;
        }
      } catch (err) {
        console.error(`파일 ${file.name} 처리 오류:`, err);
      }
    }
  }
  
  // 변경사항 저장
  if (updatedCount > 0) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    alert(`${updatedCount}개의 이미지가 성공적으로 업데이트되었습니다!`);
    closeReuploadModal();
    showRegisteredAnimals(); // 목록 새로고침
  } else {
    alert("일치하는 이미지 파일을 찾을 수 없습니다. 파일명이 개체의 파일명과 정확히 일치해야 합니다.");
  }
}

async function reuploadImage(index) {
  const fileInput = document.getElementById('reupload_' + index);
  const file = fileInput.files[0];
  
  if (!file) {
    alert("파일을 선택해주세요.");
    return;
  }
  
  // 파일 크기 확인
  if (file.size > 5 * 1024 * 1024) {
    alert("파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.");
    return;
  }
  
  // 이미지 파일인지 확인
  if (!file.type.startsWith('image/')) {
    alert("이미지 파일만 선택해주세요.");
    return;
  }
  
  try {
    // 이미지를 Base64로 변환
    const imageData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    // 데이터 업데이트
    const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    if (data.f1 && data.f1[index]) {
      data.f1[index].imageData = imageData;
      data.f1[index].fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      
      alert("이미지가 성공적으로 업데이트되었습니다!");
      closeReuploadModal();
      showRegisteredAnimals(); // 목록 새로고침
    }
  } catch (err) {
    console.error("이미지 업로드 오류:", err);
    alert("이미지 업로드에 실패했습니다.");
  }
}

async function quickReupload(index) {
  // 파일 입력 요소 생성
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  
  input.onchange = async function() {
    const file = this.files[0];
    if (!file) return;
    
    // 파일 크기 확인
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.");
      return;
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert("이미지 파일만 선택해주세요.");
      return;
    }
    
    try {
      // 이미지를 Base64로 변환
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      // 데이터 업데이트
      const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      if (data.f1 && data.f1[index]) {
        data.f1[index].imageData = imageData;
        data.f1[index].fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        
        // 성공 메시지 표시
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          font-weight: 500;
          animation: slideIn 0.3s ease;
        `;
        successMsg.innerHTML = '<i class="fas fa-check-circle"></i> 이미지가 성공적으로 업데이트되었습니다!';
        document.body.appendChild(successMsg);
        
        // 3초 후 메시지 제거
        setTimeout(() => {
          successMsg.style.animation = 'slideOut 0.3s ease';
          setTimeout(() => document.body.removeChild(successMsg), 300);
        }, 3000);
        
        // 목록 새로고침
        showRegisteredAnimals();
      }
    } catch (err) {
      console.error("이미지 업로드 오류:", err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };
  
  // 파일 선택 다이얼로그 열기
  input.click();
}

function closeReuploadModal() {
  document.getElementById("reuploadModal").style.display = "none";
}

async function autoUpdateImages() {
  const f1Data = loadFromLocalStorage();
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  let updatedCount = 0;
  
  // 이미지가 없는 개체들 찾기
  const animalsWithoutImage = f1Data.filter(item => !item.imageData && item.fileInfo);
  
  if (animalsWithoutImage.length === 0) {
    alert("업데이트할 이미지가 없습니다!");
    return;
  }
  
  // 파일 입력 요소 생성
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true; // 여러 파일 선택 가능
  input.style.display = 'none';
  
  input.onchange = async function() {
    const files = Array.from(this.files);
    
    for (const file of files) {
      // 파일 크기 확인
      if (file.size > 5 * 1024 * 1024) {
        console.log(`파일 ${file.name}이 너무 큽니다.`);
        continue;
      }
      
      // 이미지 파일인지 확인
      if (!file.type.startsWith('image/')) {
        console.log(`파일 ${file.name}이 이미지가 아닙니다.`);
        continue;
      }
      
      // 파일명과 일치하는 개체 찾기
      const matchingAnimal = animalsWithoutImage.find(animal => 
        animal.fileInfo && animal.fileInfo.name.toLowerCase() === file.name.toLowerCase()
      );
      
      if (matchingAnimal) {
        try {
          // 이미지를 Base64로 변환
          const imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          // 데이터 업데이트
          const animalIndex = data.f1.findIndex(item => item.name === matchingAnimal.name);
          if (animalIndex !== -1) {
            data.f1[animalIndex].imageData = imageData;
            data.f1[animalIndex].fileInfo = {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified
            };
            updatedCount++;
          }
        } catch (err) {
          console.error(`파일 ${file.name} 처리 오류:`, err);
        }
      }
    }
    
    // 변경사항 저장
    if (updatedCount > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      alert(`${updatedCount}개의 이미지가 자동으로 업데이트되었습니다!`);
      showRegisteredAnimals(); // 목록 새로고침
    } else {
      alert("일치하는 이미지 파일을 찾을 수 없습니다.");
    }
  };
  
  // 파일 선택 다이얼로그 열기
  input.click();
}

function clearAllData() {
  if (confirm("정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    alert("모든 데이터가 삭제되었습니다.");
    showRegisteredAnimals();
  }
}

function previewImage() {
  const fileInput = document.getElementById("animalImage");
  const previewDiv = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");
  
  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    
    // 파일 크기 확인 (10MB로 증가)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다. 10MB 이하의 파일을 선택해주세요.");
      fileInput.value = "";
      previewDiv.style.display = "none";
      return;
    }
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert("이미지 파일만 선택해주세요.");
      fileInput.value = "";
      previewDiv.style.display = "none";
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewDiv.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    previewDiv.style.display = "none";
  }
}

function showFamilyTree() {
  const generation = document.getElementById("treeGeneration").value;
  const treeContainer = document.getElementById("familyTreeContainer");
  
  if (!generation) {
    treeContainer.innerHTML = "<p class='text-muted'>세대를 선택해주세요.</p>";
    return;
  }
  
  const allAnimals = getAllAnimals();
  const targetAnimals = allAnimals.filter(animal => animal.generation === generation);
  
  if (targetAnimals.length === 0) {
    treeContainer.innerHTML = `<p class='text-muted'>${generation} 세대에 등록된 개체가 없습니다.</p>`;
    return;
  }
  
  let treeHTML = `<div class="family-tree">`;
  
  targetAnimals.forEach(animal => {
    const parents = getParents(animal, allAnimals);
    
    treeHTML += `
      <div class="tree-item">
        <div class="animal-card tree-card">
          <div class="animal-image">
            ${animal.imageData ? 
              `<img src="${animal.imageData}" alt="${animal.name}" class="tree-img">` : 
              `<div class="no-image">📷</div>`
            }
          </div>
          <div class="animal-info">
            <h4>${animal.name}</h4>
            <span class="gender-badge ${animal.gender === '수컷' ? 'male' : 'female'}">
              ${animal.gender}
            </span>
            <span class="generation-badge">${animal.generation}</span>
          </div>
        </div>
        
        ${parents.length > 0 ? `
          <div class="parents">
            <div class="parent-arrow">↓</div>
            <div class="parent-cards">
              ${parents.map(parent => `
                <div class="parent-card">
                  <div class="parent-image">
                    ${parent.imageData ? 
                      `<img src="${parent.imageData}" alt="${parent.name}" class="parent-img">` : 
                      `<div class="no-image">📷</div>`
                    }
                  </div>
                  <div class="parent-info">
                    <h5>${parent.name}</h5>
                    <span class="gender-badge ${parent.gender === '수컷' ? 'male' : 'female'}">
                      ${parent.gender}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  });
  
  treeHTML += `</div>`;
  treeContainer.innerHTML = treeHTML;
}

function getParents(animal, allAnimals) {
  const parents = [];
  
  if (animal.father && animal.father !== "unknown") {
    const father = allAnimals.find(a => a.name === animal.father);
    if (father) parents.push(father);
  }
  
  if (animal.mother && animal.mother !== "") {
    const mother = allAnimals.find(a => a.name === animal.mother);
    if (mother) parents.push(mother);
  }
  
  return parents;
}

function getStatusBadge(status) {
  const statusMap = {
    'active': '<span class="status-badge active">보유 중</span>',
    'sold': '<span class="status-badge sold">분양 완료</span>',
    'deceased': '<span class="status-badge deceased">사망</span>',
    'deleted': '<span class="status-badge deleted">삭제</span>'
  };
  return statusMap[status] || statusMap['active'];
}

let currentStatusAnimalIndex = -1;

function updateAnimalStatus(index) {
  const animal = filteredAnimals[index];
  if (!animal) return;
  
  currentStatusAnimalIndex = index;
  document.getElementById('statusAnimalName').textContent = `"${animal.name}"의 상태를 변경하세요:`;
  document.getElementById('statusModal').style.display = 'block';
}

function closeStatusModal() {
  document.getElementById('statusModal').style.display = 'none';
  currentStatusAnimalIndex = -1;
}

function changeStatus(newStatus) {
  if (currentStatusAnimalIndex === -1) return;
  
  const animal = filteredAnimals[currentStatusAnimalIndex];
  if (!animal) return;
  
  // 데이터 업데이트
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  const generationKey = animal.generation.toLowerCase();
  
  if (data[generationKey]) {
    const animalIndex = data[generationKey].findIndex(a => a.id === animal.id);
    if (animalIndex !== -1) {
      data[generationKey][animalIndex].status = newStatus;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      
      // 성공 메시지 표시
      const statusText = getStatusText(newStatus);
      showStatus("registerStatus", `"${animal.name}"의 상태가 "${statusText}"로 변경되었습니다.`, "success");
      
      // 모달 닫기
      closeStatusModal();
      
      // 목록 새로고침
      filterAnimals();
      updateStats();
    }
  }
}

// 페이지 로드 시 초기화
window.onload = function() {
  // 사용자 인증 확인
  displayUserInfo();
  
  // 플랜별 제한사항 표시
  showPlanLimitations();
  
  showRegisteredAnimals();
  updateStats();
  migrateOldData();
  updateGenerationFields(); // 초기 세대 필드 설정
};

function migrateOldData() {
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  let updated = false;
  
  if (data.f1) {
    data.f1.forEach(item => {
      // imageData가 없고 fileInfo만 있는 경우 마이그레이션
      if (item.fileInfo && !item.imageData) {
        console.log("기존 데이터 발견:", item.name);
        // 여기서는 기존 데이터는 그대로 두고, 새로운 등록부터 이미지 데이터를 저장
      }
    });
  }
  
  if (updated) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }
}

// 디버깅용 함수 - 콘솔에서 실행 가능
function debugData() {
  console.log('=== 데이터 디버깅 ===');
  const data = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
  console.log('전체 데이터:', data);
  
  const allAnimals = getAllAnimals();
  console.log('모든 개체:', allAnimals);
  
  const f1Animals = allAnimals.filter(a => a.generation === 'F1');
  console.log('F1 개체들:', f1Animals);
  
  const maleF1 = f1Animals.filter(a => a.gender === '수컷');
  console.log('F1 수컷들:', maleF1);
  
  return { data, allAnimals, f1Animals, maleF1 };
}

// 전역 함수로 노출
window.registerAnimal = registerAnimal;
window.updateGenerationFields = updateGenerationFields;
window.toggleParentFields = toggleParentFields;
window.previewImage = previewImage;
window.showRegisteredAnimals = showRegisteredAnimals;
window.showAnimalDetail = showAnimalDetail;
window.closeModal = closeModal;
window.showImageReuploadModal = showImageReuploadModal;
window.closeReuploadModal = closeReuploadModal;
window.reuploadImage = reuploadImage;
window.quickReupload = quickReupload;
window.autoUpdateImages = autoUpdateImages;
window.batchUploadImages = batchUploadImages;
window.clearAllData = clearAllData;
window.showFamilyTree = showFamilyTree;
window.debugData = debugData;
window.getStatusBadge = getStatusBadge;
window.updateAnimalStatus = updateAnimalStatus;
window.filterAnimals = filterAnimals;
window.toggleViewMode = toggleViewMode;
window.exportData = exportData;
window.closeStatusModal = closeStatusModal;
window.changeStatus = changeStatus;
window.showTreeModal = showTreeModal;
window.closeTreeModal = closeTreeModal;
window.searchAnimalsForTree = searchAnimalsForTree;
window.selectAnimalForTree = selectAnimalForTree;
window.searchInTree = searchInTree;
window.changeTreeView = changeTreeView;

window.exportTreeAsImage = exportTreeAsImage;
window.filterByGeneration = filterByGeneration;
window.logout = logout;
window.showPricing = showPricing;
window.showPremiumFeature = showPremiumFeature;
window.showAdminStats = showAdminStats;
window.showUserManagement = showUserManagement;
window.showSystemSettings = showSystemSettings;
window.backupAllData = backupAllData;
window.restoreData = restoreData;
window.clearAllSystemData = clearAllSystemData;
window.addNewUser = addNewUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.calculateMorphs = calculateMorphs;
window.getSelectedMorphs = getSelectedMorphs;
window.calculateOffspringMorphs = calculateOffspringMorphs;
window.displayMorphResults = displayMorphResults;
window.clearMorphSelection = clearMorphSelection;

let currentViewMode = 'card'; // 'card' or 'table'
let filteredAnimals = [];

function filterAnimals() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const generationFilter = document.getElementById('generationFilter').value;
  const genderFilter = document.getElementById('genderFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;
  
  const allAnimals = getAllAnimals();
  
  filteredAnimals = allAnimals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || animal.status === statusFilter || (!animal.status && statusFilter === 'active');
    const matchesGeneration = !generationFilter || animal.generation === generationFilter;
    const matchesGender = !genderFilter || animal.gender === genderFilter;
    const matchesCategory = !categoryFilter || animal.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesGeneration && matchesGender && matchesCategory;
  });
  
  displayAnimals();
  updateStatsSummary();
}

function displayAnimals() {
  if (currentViewMode === 'card') {
    displayAnimalsAsCards();
  } else {
    displayAnimalsAsTable();
  }
}

function displayAnimalsAsCards() {
  const container = document.getElementById("registeredAnimals");
  
  if (filteredAnimals.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p>검색 결과가 없습니다.</p>
      </div>
    `;
    return;
  }
  
  let html = '<div class="animals-grid">';
  
  filteredAnimals.forEach((animal, index) => {
    const imageDisplay = animal.imageData ? 
      `<img src="${animal.imageData}" alt="${animal.name}">` : 
      `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6c757d; font-size: 2rem;">📷</div>`;
    
    const statusBadge = getStatusBadge(animal.status || 'active');
    
    html += `
      <div class="animal-card ${animal.status !== 'active' ? 'inactive' : ''}" onclick="showAnimalDetail(${index})" style="cursor: pointer;">
        <div class="animal-image">
          ${imageDisplay}
        </div>
        <div class="animal-info">
          <h3>${animal.name}</h3>
          <div class="animal-details">
            <span class="gender-badge ${animal.gender === '수컷' ? 'gender-male' : 'gender-female'}">
              ${animal.gender}
            </span>
            <span class="generation-badge">${animal.generation}</span>
            ${statusBadge}
          </div>
          <div class="action-buttons">
            <button onclick="event.stopPropagation(); showAnimalDetail(${index})" class="btn btn-primary btn-sm">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="event.stopPropagation(); updateAnimalStatus(${index})" class="btn btn-info btn-sm">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function displayAnimalsAsTable() {
  const container = document.getElementById("registeredAnimals");
  
  if (filteredAnimals.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p>검색 결과가 없습니다.</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <table class="animals-table">
      <thead>
        <tr>
          <th>이미지</th>
          <th>이름</th>
          <th>세대</th>
          <th>성별</th>
          <th>상태</th>
          <th>부개체</th>
          <th>모개체</th>
          <th>등록일</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  filteredAnimals.forEach((animal, index) => {
    const imageCell = animal.imageData ? 
      `<img src="${animal.imageData}" alt="${animal.name}" class="table-image">` : 
      `<div style="width: 50px; height: 50px; background: #f8f9fa; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #6c757d;">📷</div>`;
    
    const statusText = getStatusText(animal.status || 'active');
    
    html += `
      <tr>
        <td>${imageCell}</td>
        <td><strong>${animal.name}</strong></td>
        <td><span class="generation-badge">${animal.generation}</span></td>
        <td><span class="gender-badge ${animal.gender === '수컷' ? 'gender-male' : 'gender-female'}">${animal.gender}</span></td>
        <td>${statusText}</td>
        <td>${animal.father || '-'}</td>
        <td>${animal.mother || '-'}</td>
        <td>${new Date(animal.createdAt).toLocaleDateString()}</td>
        <td>
          <button onclick="showAnimalDetail(${index})" class="btn btn-primary btn-sm">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="updateAnimalStatus(${index})" class="btn btn-info btn-sm">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

function getStatusText(status) {
  const statusMap = {
    'active': '보유 중',
    'sold': '분양 완료',
    'deceased': '사망',
    'deleted': '삭제'
  };
  return statusMap[status] || '보유 중';
}

function getCategoryText(category) {
  const categoryMap = {
    'breeding': '번식용',
    'pet': '펫용',
    'show': '쇼용',
    'research': '연구용',
    'sale': '판매용'
  };
  return categoryMap[category] || '미분류';
}

function toggleViewMode() {
  currentViewMode = currentViewMode === 'card' ? 'table' : 'card';
  document.getElementById('viewModeText').textContent = currentViewMode === 'card' ? '카드 보기' : '테이블 보기';
  displayAnimals();
}

function updateStatsSummary() {
  const statsContainer = document.getElementById('animalStats');
  
  const total = filteredAnimals.length;
  const active = filteredAnimals.filter(a => a.status === 'active' || !a.status).length;
  const sold = filteredAnimals.filter(a => a.status === 'sold').length;
  const deceased = filteredAnimals.filter(a => a.status === 'deceased').length;
  const deleted = filteredAnimals.filter(a => a.status === 'deleted').length;
  
  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-number">${total}</div>
      <div class="stat-label">전체</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">${active}</div>
      <div class="stat-label">보유 중</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">${sold}</div>
      <div class="stat-label">분양 완료</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">${deceased}</div>
      <div class="stat-label">사망</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">${deleted}</div>
      <div class="stat-label">삭제</div>
    </div>
  `;
}

function exportData() {
  // 플랜 제한 확인
  const currentUser = userManager.getCurrentUser();
  const plan = paymentSystem.plans[currentUser?.plan || 'free'];
  
  if (plan && !plan.limits.dataExport) {
    alert(`${plan.name} 플랜은 데이터 내보내기 기능을 사용할 수 없습니다. 업그레이드하세요.`);
    return;
  }
  
  const allAnimals = getAllAnimals();
  if (allAnimals.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }
  
  const dataStr = JSON.stringify(allAnimals, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `gecko-breeding-data-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  alert('데이터가 다운로드되었습니다.');
}

let selectedTreeAnimal = null;
let currentTreeView = 'ancestors';

// 사용자 관리 시스템
class UserManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }
    
    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : {
            'admin@crestedgecko.com': {
                email: 'admin@crestedgecko.com',
                password: 'Admin2024!',
                name: '시스템 관리자',
                plan: 'admin',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        };
    }
    
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }
    
    getCurrentUser() {
        if (!this.currentUser) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
            }
        }
        return this.currentUser;
    }
    
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// UserManager를 전역으로 등록
window.userManager = new UserManager();
const userManager = window.userManager;

// 로그아웃 함수 (전역 함수로 등록)
window.logout = function() {
    userManager.logout();
}

// 사용자 정보 표시 (전역 함수로 등록)
window.displayUserInfo = function() {
  const currentUser = userManager.getCurrentUser();
  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.name;
    
    // 플랜 표시 업데이트
    const planDisplay = {
      'free': 'Free',
      'starter': 'Starter',
      'pro': 'Pro',
      'enterprise': 'Enterprise',
      'lifetime': 'Lifetime Pro',
      'admin': 'Admin',
      'guest': 'Guest'
    };
    document.getElementById('userPlan').textContent = planDisplay[currentUser.plan] || 'Free';
    
    // 테스터를 위한 프리미엄 섹션 표시 (모든 사용자에게 표시)
    document.getElementById('premiumSection').style.display = 'block';
  } else {
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    window.location.href = 'login.html';
  }
}

// 플랜 선택 페이지로 이동 (전역 함수로 등록)
window.showPricing = function() {
  window.location.href = 'pricing.html';
}

// 프리미엄 기능 표시 (테스터용 - 모든 사용자에게 허용)
window.showPremiumFeature = function(feature) {
  const currentUser = userManager.getCurrentUser();
  
  // 테스터를 위해 모든 로그인된 사용자에게 프리미엄 기능 허용
  if (!currentUser) {
    alert('로그인이 필요합니다.');
    window.location.href = 'login.html';
    return;
  }
  
  switch (feature) {
    case 'ai-prediction':
      showAIPrediction();
      break;
    case 'advanced-analytics':
      showAdvancedAnalytics();
      break;
    case 'breeding-plan':
      showBreedingPlan();
      break;
    default:
      alert('준비 중인 기능입니다.');
  }
}

// 프리미엄 기능 패널 표시 (관리자용) (전역 함수로 등록)
window.showPremiumFeatures = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3>⭐ 프리미엄 기능 관리</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>🤖 AI 예측 기능</h4>
            <p>유전자 조합을 통한 자손 예측</p>
            <button onclick="showAIPrediction()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              AI 예측 실행
            </button>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>📊 고급 분석</h4>
            <p>상세한 통계 및 분석 도구</p>
            <button onclick="showAdvancedAnalytics()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              분석 도구 실행
            </button>
          </div>
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>🧬 번식 계획</h4>
            <p>최적의 번식 조합 제안</p>
            <button onclick="showBreedingPlan()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              번식 계획 생성
            </button>
          </div>
          <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>📄 PDF 내보내기</h4>
            <p>데이터를 PDF로 내보내기</p>
            <button onclick="exportData()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              PDF 내보내기
            </button>
          </div>
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>🌳 가족 트리</h4>
            <p>상세한 혈통 분석</p>
            <button onclick="showFamilyTree()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              가족 트리 보기
            </button>
          </div>
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; padding: 20px; border-radius: 10px;">
            <h4>🧮 모프 계산기</h4>
            <p>복잡한 유전자 조합 계산</p>
            <button onclick="calculateMorphs()" style="background: rgba(0,0,0,0.1); color: #333; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              모프 계산기 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 플랜 관리 패널 표시 (관리자용)
function showPlanManagement() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3>💎 플랜 관리</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>⭐ Lifetime Pro</h4>
            <div style="font-size: 1.5rem; font-weight: bold; color: #28a745;">₩299,000</div>
            <p>평생 무제한 사용</p>
            <button onclick="upgradeUserToLifetime()" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              업그레이드
            </button>
          </div>
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>👑 관리자 권한</h4>
            <div style="font-size: 1.5rem; font-weight: bold; color: #ffc107;">무료</div>
            <p>모든 권한 부여</p>
            <button onclick="upgradeUserToAdmin()" style="background: #ffc107; color: #212529; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              권한 부여
            </button>
          </div>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>📊 Pro 플랜</h4>
            <div style="font-size: 1.5rem; font-weight: bold; color: #17a2b8;">₩29,900/월</div>
            <p>고급 기능 사용</p>
            <button onclick="upgradeUserToPro()" style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
              업그레이드
            </button>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h4>현재 사용자 정보</h4>
          <div id="currentUserPlanInfo">로딩 중...</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // 현재 사용자 정보 표시
  displayCurrentUserPlanInfo();
}

// 현재 사용자 플랜 정보 표시
function displayCurrentUserPlanInfo() {
  const currentUser = userManager.getCurrentUser();
  const userInfoDiv = document.getElementById('currentUserPlanInfo');
  
  if (currentUser) {
    const planDisplay = {
      'free': 'Free',
      'starter': 'Starter',
      'pro': 'Pro',
      'enterprise': 'Enterprise',
      'lifetime': 'Lifetime Pro',
      'admin': 'Admin',
      'guest': 'Guest'
    };
    
    userInfoDiv.innerHTML = `
      <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 10px;">
        <strong>이메일:</strong> ${currentUser.email}<br>
        <strong>이름:</strong> ${currentUser.name}<br>
        <strong>현재 플랜:</strong> <span style="background: ${currentUser.plan === 'admin' ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 4px;">${planDisplay[currentUser.plan] || 'Free'}</span><br>
        <strong>가입일:</strong> ${new Date(currentUser.createdAt).toLocaleDateString()}
      </div>
    `;
  } else {
    userInfoDiv.innerHTML = '<div style="color: #721c24; background: #f8d7da; padding: 10px; border-radius: 5px;">로그인되지 않았습니다.</div>';
  }
}

// 사용자를 Lifetime Pro로 업그레이드
function upgradeUserToLifetime() {
  const currentUser = userManager.getCurrentUser();
  if (currentUser) {
    currentUser.plan = 'lifetime';
    currentUser.planActivatedAt = new Date().toISOString();
    currentUser.planType = 'Lifetime Pro';
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser.email]) {
      users[currentUser.email] = currentUser;
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    alert('✅ Lifetime Pro 플랜으로 업그레이드되었습니다!');
    displayCurrentUserPlanInfo();
  }
}

// 사용자를 관리자로 업그레이드
function upgradeUserToAdmin() {
  const currentUser = userManager.getCurrentUser();
  if (currentUser) {
    currentUser.plan = 'admin';
    currentUser.role = 'admin';
    currentUser.planActivatedAt = new Date().toISOString();
    currentUser.planType = 'Admin';
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser.email]) {
      users[currentUser.email] = currentUser;
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    alert('👑 관리자 권한이 부여되었습니다!');
    displayCurrentUserPlanInfo();
  }
}

// 사용자를 Pro로 업그레이드
function upgradeUserToPro() {
  const currentUser = userManager.getCurrentUser();
  if (currentUser) {
    currentUser.plan = 'pro';
    currentUser.planActivatedAt = new Date().toISOString();
    currentUser.planType = 'Pro';
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser.email]) {
      users[currentUser.email] = currentUser;
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    alert('✅ Pro 플랜으로 업그레이드되었습니다!');
    displayCurrentUserPlanInfo();
  }
}

// AI 모프 예측
window.showAIPrediction = function() {
  const allAnimals = getAllAnimals();
  const breedingPairs = allAnimals.filter(animal => 
    animal.gender === '수컷' && animal.status === 'active'
  );
  
  if (breedingPairs.length === 0) {
    alert('번식 가능한 수컷이 없습니다.');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3><i class="fas fa-brain"></i> AI 모프 예측</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; padding: 20px;">
          <i class="fas fa-robot" style="font-size: 3rem; color: var(--premium-color); margin-bottom: 1rem;"></i>
          <h4>AI가 최적의 번식 조합을 분석합니다</h4>
          <p>고급 알고리즘을 통해 가장 높은 성공률의 모프 조합을 제안합니다.</p>
          <button onclick="runAIPrediction()" class="btn btn-premium">
            <i class="fas fa-magic"></i> AI 분석 시작
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 고급 분석
window.showAdvancedAnalytics = function() {
  const allAnimals = getAllAnimals();
  const stats = {
    total: allAnimals.length,
    active: allAnimals.filter(a => a.status === 'active').length,
    breeding: allAnimals.filter(a => a.category === 'breeding').length,
    premium: allAnimals.filter(a => a.morphs && a.morphs.length > 0).length
  };
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3><i class="fas fa-chart-line"></i> 고급 분석</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>총 개체 수</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${stats.total}</div>
          </div>
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>번식용 개체</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${stats.breeding}</div>
          </div>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>프리미엄 모프</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${stats.premium}</div>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h4>수익성 분석</h4>
          <p>예상 월 수익: ₩${(stats.breeding * 50000).toLocaleString()}</p>
          <p>번식 성공률: ${Math.min(95, 70 + stats.premium * 2)}%</p>
          <p>혈통 가치: ₩${(stats.total * 30000).toLocaleString()}</p>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 번식 계획
window.showBreedingPlan = function() {
  const allAnimals = getAllAnimals();
  const males = allAnimals.filter(a => a.gender === '수컷' && a.status === 'active');
  const females = allAnimals.filter(a => a.gender === '암컷' && a.status === 'active');
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3><i class="fas fa-calendar-alt"></i> 번식 계획</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; padding: 20px;">
          <i class="fas fa-calendar-check" style="font-size: 3rem; color: var(--success-color); margin-bottom: 1rem;"></i>
          <h4>최적의 번식 시기와 파트너 매칭</h4>
          <p>계절, 나이, 모프를 고려한 스마트 번식 계획을 제공합니다.</p>
          <div style="margin: 20px 0;">
            <p><strong>수컷:</strong> ${males.length}마리</p>
            <p><strong>암컷:</strong> ${females.length}마리</p>
          </div>
          <button onclick="generateBreedingPlan()" class="btn btn-success">
            <i class="fas fa-calendar-plus"></i> 번식 계획 생성
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// AI 예측 실행 (전역 함수로 등록)
window.runAIPrediction = function() {
  try {
    const allAnimals = getAllAnimals();
    const breedingPairs = allAnimals.filter(animal => 
      animal.gender === '수컷' && animal.status === 'active'
    );
    
    if (breedingPairs.length === 0) {
      alert('번식 가능한 수컷이 없습니다. 먼저 개체를 등록해주세요.');
      return;
    }
    
    // AI 분석 시뮬레이션
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3>🤖 AI 분석 결과</h3>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div style="text-align: center; padding: 20px;">
            <i class="fas fa-robot" style="font-size: 3rem; color: var(--premium-color); margin-bottom: 1rem;"></i>
            <h4>AI 분석 완료!</h4>
            <p>고급 알고리즘을 통한 최적 번식 조합 분석 결과입니다.</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4>📊 분석 통계</h4>
            <ul>
              <li>총 개체 수: ${allAnimals.length}마리</li>
              <li>번식 가능한 수컷: ${breedingPairs.length}마리</li>
              <li>분석된 모프 조합: ${breedingPairs.length * 3}개</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4>🏆 추천 번식 조합</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #28a745;">
                <h5>🥇 최고 성공률</h5>
                <p><strong>루시퍼 × 릴리화이트</strong></p>
                <p>예상 성공률: <span style="color: #28a745; font-weight: bold;">95%</span></p>
                <p>예상 모프: 루시퍼 릴리화이트</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #ffc107;">
                <h5>🥈 고가치 조합</h5>
                <p><strong>세이블 × 아잔틱</strong></p>
                <p>예상 성공률: <span style="color: #ffc107; font-weight: bold;">88%</span></p>
                <p>예상 모프: 세이블 아잔틱</p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 2px solid #17a2b8;">
                <h5>🥉 안정적 조합</h5>
                <p><strong>할리퀸 × 핀스트라이프</strong></p>
                <p>예상 성공률: <span style="color: #17a2b8; font-weight: bold;">82%</span></p>
                <p>예상 모프: 할리퀸 핀스트라이프</p>
              </div>
            </div>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h4>💡 AI 조언</h4>
            <ul>
              <li>번식 시기는 3-4월이 최적입니다</li>
              <li>온도는 24-26°C를 유지하세요</li>
              <li>습도는 60-70%가 적정합니다</li>
              <li>영양 상태가 좋은 개체를 선택하세요</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <button onclick="generateBreedingPlan()" style="background: var(--premium-color); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">
              📅 번식 계획 생성
            </button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">
              닫기
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
  } catch (error) {
    console.error('AI 예측 오류:', error);
    alert('AI 분석 중 오류가 발생했습니다: ' + error.message);
  }
}

// 번식 계획 생성 (전역 함수로 등록)
window.generateBreedingPlan = function() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h3>📅 AI 번식 계획</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; padding: 20px;">
          <i class="fas fa-calendar-alt" style="font-size: 3rem; color: var(--premium-color); margin-bottom: 1rem;"></i>
          <h4>AI가 생성한 최적 번식 계획</h4>
          <p>계절과 개체 상태를 고려한 맞춤형 번식 일정입니다.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>🌸 3월 - 루시퍼 × 릴리화이트</h4>
            <p><strong>예상 성공률:</strong> 95%</p>
            <p><strong>예상 모프:</strong> 루시퍼 릴리화이트</p>
            <p><strong>시장 가치:</strong> ₩500,000</p>
            <p><strong>준비사항:</strong> 온도 24°C, 습도 65%</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>🌺 4월 - 세이블 × 아잔틱</h4>
            <p><strong>예상 성공률:</strong> 88%</p>
            <p><strong>예상 모프:</strong> 세이블 아잔틱</p>
            <p><strong>시장 가치:</strong> ₩350,000</p>
            <p><strong>준비사항:</strong> 온도 25°C, 습도 70%</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px;">
            <h4>🌻 5월 - 할리퀸 × 핀스트라이프</h4>
            <p><strong>예상 성공률:</strong> 82%</p>
            <p><strong>예상 모프:</strong> 할리퀸 핀스트라이프</p>
            <p><strong>시장 가치:</strong> ₩280,000</p>
            <p><strong>준비사항:</strong> 온도 26°C, 습도 60%</p>
          </div>
        </div>
        
        <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h4>📈 예상 수익 분석</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h5>총 투자 비용</h5>
              <p style="font-size: 1.5rem; font-weight: bold; color: #dc3545;">₩150,000</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h5>예상 총 수익</h5>
              <p style="font-size: 1.5rem; font-weight: bold; color: #28a745;">₩1,130,000</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h5>순이익</h5>
              <p style="font-size: 1.5rem; font-weight: bold; color: #17a2b8;">₩980,000</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h5>ROI</h5>
              <p style="font-size: 1.5rem; font-weight: bold; color: #ffc107;">653%</p>
            </div>
          </div>
        </div>
        
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h4>💡 AI 조언</h4>
          <ul>
            <li>번식 전 2주간 영양 상태를 최적화하세요</li>
            <li>각 조합별로 별도의 테라리움을 준비하세요</li>
            <li>온도와 습도를 정확히 모니터링하세요</li>
            <li>번식 후 3개월간 특별 관리가 필요합니다</li>
            <li>시장 가격 변동을 주기적으로 확인하세요</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="exportData()" style="background: var(--success-color); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">
            📄 계획 내보내기
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 0 10px;">
            닫기
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 플랜별 제한사항 표시
function showPlanLimitations() {
  const currentUser = userManager.getCurrentUser();
  if (!currentUser) return;
  
  // 관리자인 경우 제한사항 표시하지 않음
  if (currentUser.plan === 'admin') {
    showAdminPanel();
    return;
  }
  
  const plan = paymentSystem.plans[currentUser.plan || 'free'];
  if (!plan) return;
  
  // 제한사항 알림 표시
  const limitations = [];
  
  if (plan.limits.animals !== -1) {
    const currentCount = getAllAnimals().length;
    const remaining = plan.limits.animals - currentCount;
    if (remaining <= 5) {
      limitations.push(`개체 등록 한도: ${remaining}마리 남음`);
    }
  }
  
  if (plan.limits.generations && plan.limits.generations.length < 5) {
    const maxGen = plan.limits.generations[plan.limits.generations.length - 1].toUpperCase();
    limitations.push(`세대 제한: ${maxGen}까지만 등록 가능`);
  }
  
  if (plan.limits.imagesPerAnimal !== -1) {
    limitations.push(`이미지 제한: 개체당 ${plan.limits.imagesPerAnimal}장`);
  }
  
  if (plan.limits.morphCombinations !== -1) {
    limitations.push(`모프 계산: 최대 ${plan.limits.morphCombinations}개 조합`);
  }
  
  if (!plan.limits.pdfExport) {
    limitations.push('PDF 내보내기 불가');
  }
  
  if (!plan.limits.dataExport) {
    limitations.push('데이터 내보내기 불가');
  }
  
  if (plan.limits.ads) {
    limitations.push('광고 노출됨');
  }
  
  // 제한사항이 있으면 표시
  if (limitations.length > 0) {
    const limitationDiv = document.createElement('div');
    limitationDiv.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      max-width: 300px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    limitationDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #856404;">${plan.name} 플랜 제한</strong>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #856404;">×</button>
      </div>
      <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 0.9rem;">
        ${limitations.map(limit => `<li>${limit}</li>`).join('')}
      </ul>
      <button onclick="showPricing()" style="margin-top: 10px; padding: 5px 10px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        업그레이드
      </button>
    `;
    
    document.body.appendChild(limitationDiv);
    
    // 10초 후 자동으로 숨김
    setTimeout(() => {
      if (limitationDiv.parentNode) {
        limitationDiv.remove();
      }
    }, 10000);
  }
}

// 관리자 패널 표시
function showAdminPanel() {
  const adminDiv = document.createElement('div');
  adminDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: 1px solid #c3e6cb;
    border-radius: 8px;
    padding: 15px;
    max-width: 320px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    color: white;
  `;
  
  adminDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <strong style="color: white;">👑 관리자 패널</strong>
      <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: white;">×</button>
    </div>
    <div style="color: white; font-size: 0.9rem; margin-bottom: 10px;">
      <p>⭐ 최고 플랜 + 관리자 권한</p>
      <p>모든 기능 무제한 사용 가능</p>
    </div>
    <div style="display: flex; flex-direction: column; gap: 5px;">
      <button onclick="showAdminStats()" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        📊 시스템 통계
      </button>
      <button onclick="showUserManagement()" style="padding: 5px 10px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        👥 사용자 관리
      </button>
      <button onclick="showSystemSettings()" style="padding: 5px 10px; background: #ffc107; color: #212529; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        ⚙️ 시스템 설정
      </button>
      <button onclick="showPremiumFeatures()" style="padding: 5px 10px; background: #e83e8c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        ⭐ 프리미엄 기능
      </button>
      <button onclick="showPlanManagement()" style="padding: 5px 10px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
        💎 플랜 관리
      </button>
    </div>
  `;
  
  document.body.appendChild(adminDiv);
  
  // 30초 후 자동으로 숨김
  setTimeout(() => {
    if (adminDiv.parentNode) {
      adminDiv.remove();
    }
  }, 30000);
}

// 관리자 통계 표시
function showAdminStats() {
  const allAnimals = getAllAnimals();
  const users = userManager.loadUsers();
  const totalUsers = Object.keys(users).length;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-header">
        <h3>📊 시스템 통계</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>총 개체 수</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--success-color);">${allAnimals.length}</div>
          </div>
          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>총 사용자 수</h4>
            <div style="font-size: 2rem; font-weight: bold; color: var(--warning-color);">${totalUsers}</div>
          </div>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; text-align: center;">
            <h4>세대별 분포</h4>
            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">
              F1: ${allAnimals.filter(a => a.generation === 'F1').length}<br>
              F2: ${allAnimals.filter(a => a.generation === 'F2').length}<br>
              F3: ${allAnimals.filter(a => a.generation === 'F3').length}
            </div>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h4>플랜별 사용자 분포</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 10px;">
            ${Object.entries(users).map(([email, user]) => `
              <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #dee2e6;">
                <strong>${user.name}</strong><br>
                <small>${user.plan || 'free'}</small><br>
                <small>${new Date(user.createdAt).toLocaleDateString()}</small>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 사용자 관리 표시
function showUserManagement() {
  const users = userManager.loadUsers();
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px;">
      <div class="modal-header">
        <h3>👥 사용자 관리</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 20px;">
          <button onclick="addNewUser()" class="btn btn-primary">
            <i class="fas fa-plus"></i> 새 사용자 추가
          </button>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
          <h4>등록된 사용자 목록</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
            ${Object.entries(users).map(([email, user]) => `
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <strong>${user.name}</strong>
                  <span style="background: ${user.plan === 'admin' ? '#dc3545' : '#28a745'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">
                    ${user.plan || 'free'}
                  </span>
                </div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 10px;">
                  <div>${email}</div>
                  <div>가입일: ${new Date(user.createdAt).toLocaleDateString()}</div>
                </div>
                <div style="display: flex; gap: 5px;">
                  <button onclick="editUser('${email}')" class="btn btn-secondary btn-sm">수정</button>
                  <button onclick="deleteUser('${email}')" class="btn btn-danger btn-sm">삭제</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 시스템 설정 표시
function showSystemSettings() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h3>⚙️ 시스템 설정</h3>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 20px;">
          <h4>데이터 관리</h4>
          <button onclick="backupAllData()" class="btn btn-primary" style="margin: 5px;">
            <i class="fas fa-download"></i> 전체 데이터 백업
          </button>
          <button onclick="restoreData()" class="btn btn-warning" style="margin: 5px;">
            <i class="fas fa-upload"></i> 데이터 복원
          </button>
          <button onclick="clearAllSystemData()" class="btn btn-danger" style="margin: 5px;">
            <i class="fas fa-trash"></i> 전체 데이터 삭제
          </button>
        </div>
        <div style="margin-bottom: 20px;">
          <h4>시스템 정보</h4>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
            <p><strong>버전:</strong> 1.0.0</p>
            <p><strong>마지막 업데이트:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>총 개체 수:</strong> ${getAllAnimals().length}</p>
            <p><strong>총 사용자 수:</strong> ${Object.keys(userManager.loadUsers()).length}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// 관리자 전용 데이터 백업
function backupAllData() {
  const allData = {
    animals: getAllAnimals(),
    users: userManager.loadUsers(),
    systemInfo: {
      backupDate: new Date().toISOString(),
      version: '1.0.0',
      totalAnimals: getAllAnimals().length,
      totalUsers: Object.keys(userManager.loadUsers()).length
    }
  };
  
  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `admin-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  alert('전체 시스템 데이터가 백업되었습니다.');
}

// 데이터 복원
function restoreData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        if (confirm('백업 데이터를 복원하시겠습니까? 현재 데이터가 덮어써집니다.')) {
          // 동물 데이터 복원
          if (data.animals) {
            localStorage.setItem('geckoBreedingData', JSON.stringify(data.animals));
          }
          
          // 사용자 데이터 복원
          if (data.users) {
            localStorage.setItem('users', JSON.stringify(data.users));
          }
          
          alert('데이터가 성공적으로 복원되었습니다. 페이지를 새로고침합니다.');
          location.reload();
        }
      } catch (error) {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
}

// 전체 시스템 데이터 삭제
function clearAllSystemData() {
  if (confirm('정말로 모든 시스템 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    if (confirm('마지막 확인: 모든 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?')) {
      localStorage.clear();
      alert('모든 데이터가 삭제되었습니다. 페이지를 새로고침합니다.');
      location.reload();
    }
  }
}

// 새 사용자 추가
function addNewUser() {
  const email = prompt('이메일을 입력하세요:');
  if (!email) return;
  
  const password = prompt('비밀번호를 입력하세요:');
  if (!password) return;
  
  const name = prompt('사용자 이름을 입력하세요:');
  if (!name) return;
  
  const plan = prompt('플랜을 입력하세요 (free/starter/pro/enterprise/lifetime):', 'free');
  
  const users = userManager.loadUsers();
  users[email] = {
    email: email,
    password: password,
    name: name,
    plan: plan,
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem('users', JSON.stringify(users));
  alert('새 사용자가 추가되었습니다.');
  showUserManagement(); // 목록 새로고침
}

// 사용자 수정
function editUser(email) {
  const users = userManager.loadUsers();
  const user = users[email];
  
  if (!user) {
    alert('사용자를 찾을 수 없습니다.');
    return;
  }
  
  const newName = prompt('새 이름을 입력하세요:', user.name);
  if (!newName) return;
  
  const newPlan = prompt('새 플랜을 입력하세요 (free/starter/pro/enterprise/lifetime):', user.plan);
  if (!newPlan) return;
  
  users[email].name = newName;
  users[email].plan = newPlan;
  
  localStorage.setItem('users', JSON.stringify(users));
  alert('사용자 정보가 수정되었습니다.');
  showUserManagement(); // 목록 새로고침
}

// 사용자 삭제
function deleteUser(email) {
  if (email === 'xhy0808s@naver.com') {
    alert('관리자 계정은 삭제할 수 없습니다.');
    return;
  }
  
  if (confirm(`정말로 ${email} 사용자를 삭제하시겠습니까?`)) {
    const users = userManager.loadUsers();
    delete users[email];
    
    localStorage.setItem('users', JSON.stringify(users));
    alert('사용자가 삭제되었습니다.');
    showUserManagement(); // 목록 새로고침
  }
}

function showTreeModal() {
  document.getElementById('treeModal').style.display = 'block';
  document.getElementById('treeAnimalSearch').value = '';
  document.getElementById('treeSearchResults').innerHTML = '';
}

function closeTreeModal() {
  document.getElementById('treeModal').style.display = 'none';
}

function searchAnimalsForTree() {
  const searchTerm = document.getElementById('treeAnimalSearch').value.toLowerCase();
  const allAnimals = getAllAnimals();
  const results = allAnimals.filter(animal => 
    animal.name.toLowerCase().includes(searchTerm)
  );
  
  displayTreeSearchResults(results);
}

function displayTreeSearchResults(animals) {
  const container = document.getElementById('treeSearchResults');
  
  if (animals.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">검색 결과가 없습니다.</p>';
    return;
  }
  
  let html = '';
  animals.forEach(animal => {
    const imageDisplay = animal.imageData ? 
      `<img src="${animal.imageData}" alt="${animal.name}">` : 
      `<div style="width: 40px; height: 40px; background: #f8f9fa; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #6c757d;">📷</div>`;
    
    html += `
      <div class="search-result-item" onclick="selectAnimalForTree('${animal.name}')">
        ${imageDisplay}
        <div class="search-result-info">
          <div class="search-result-name">${animal.name}</div>
          <div class="search-result-details">${animal.generation} | ${animal.gender} | ${getStatusText(animal.status || 'active')}</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function selectAnimalForTree(animalName) {
  const allAnimals = getAllAnimals();
  selectedTreeAnimal = allAnimals.find(animal => animal.name === animalName);
  
  if (selectedTreeAnimal) {
    closeTreeModal();
    displayFamilyTree();
  }
}

function searchInTree() {
  const searchTerm = document.getElementById('treeSearchInput').value.toLowerCase();
  if (searchTerm.length > 0) {
    const allAnimals = getAllAnimals();
    const results = allAnimals.filter(animal => 
      animal.name.toLowerCase().includes(searchTerm)
    );
    
    if (results.length > 0) {
      selectedTreeAnimal = results[0];
      displayFamilyTree();
    }
  }
}

function changeTreeView() {
  currentTreeView = document.getElementById('treeViewMode').value;
  if (selectedTreeAnimal) {
    displayFamilyTree();
  }
}

function displayFamilyTree() {
  const treeContent = document.getElementById('treeContent');
  
  if (!selectedTreeAnimal) {
    treeContent.innerHTML = `
      <div style="text-align: center; color: #666; padding: 40px;">
        <i class="fas fa-sitemap" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p>개체를 검색하거나 선택하면 혈통 트리가 표시됩니다.</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  
  switch (currentTreeView) {
    case 'ancestors':
      html = displayAncestorsTree(selectedTreeAnimal);
      break;
    case 'descendants':
      html = displayDescendantsTree(selectedTreeAnimal);
      break;
    case 'family':
      html = displayFamilyTreeView(selectedTreeAnimal);
      break;
  }
  
  treeContent.innerHTML = html;
}

function displayAncestorsTree(animal) {
  const allAnimals = getAllAnimals();
  let html = `<div class="tree-section">
    <div class="tree-section-title">${animal.name}의 조상 트리</div>
    <div class="tree-generation">
      <div class="tree-generation-label">현재 개체</div>
      ${createTreeNode(animal, true)}
    </div>`;
  
  // 부모들
  const parents = [];
  if (animal.father && animal.father !== 'unknown') {
    const father = allAnimals.find(a => a.name === animal.father);
    if (father) parents.push(father);
  }
  if (animal.mother && animal.mother !== '') {
    const mother = allAnimals.find(a => a.name === animal.mother);
    if (mother) parents.push(mother);
  }
  
  if (parents.length > 0) {
    html += `<div class="tree-connection">
      <div class="tree-line"></div>
      <div class="tree-arrow">↑</div>
      <div class="tree-line"></div>
    </div>
    <div class="tree-generation">
      <div class="tree-generation-label">부모 세대</div>`;
    parents.forEach(parent => {
      html += createTreeNode(parent);
    });
    html += '</div>';
    
    // 조부모들
    const grandparents = [];
    parents.forEach(parent => {
      if (parent.father && parent.father !== 'unknown') {
        const grandfather = allAnimals.find(a => a.name === parent.father);
        if (grandfather) grandparents.push(grandfather);
      }
      if (parent.mother && parent.mother !== '') {
        const grandmother = allAnimals.find(a => a.name === parent.mother);
        if (grandmother) grandparents.push(grandmother);
      }
    });
    
    if (grandparents.length > 0) {
      html += `<div class="tree-connection">
        <div class="tree-line"></div>
        <div class="tree-arrow">↑</div>
        <div class="tree-line"></div>
      </div>
      <div class="tree-generation">
        <div class="tree-generation-label">조부모 세대</div>`;
      grandparents.forEach(grandparent => {
        html += createTreeNode(grandparent);
      });
      html += '</div>';
    }
  }
  
  html += '</div>';
  return html;
}

function displayDescendantsTree(animal) {
  const allAnimals = getAllAnimals();
  let html = `<div class="tree-section">
    <div class="tree-section-title">${animal.name}의 자손 트리</div>
    <div class="tree-generation">
      <div class="tree-generation-label">현재 개체</div>
      ${createTreeNode(animal, true)}
    </div>`;
  
  // 자식들 찾기
  const children = allAnimals.filter(a => 
    (a.father === animal.name) || (a.mother === animal.name)
  );
  
  if (children.length > 0) {
    html += `<div class="tree-connection">
      <div class="tree-line"></div>
      <div class="tree-arrow">↓</div>
      <div class="tree-line"></div>
    </div>
    <div class="tree-generation">
      <div class="tree-generation-label">자식 세대</div>`;
    children.forEach(child => {
      html += createTreeNode(child);
    });
    html += '</div>';
    
    // 손자들 찾기
    const grandchildren = [];
    children.forEach(child => {
      const childChildren = allAnimals.filter(a => 
        (a.father === child.name) || (a.mother === child.name)
      );
      grandchildren.push(...childChildren);
    });
    
    if (grandchildren.length > 0) {
      html += `<div class="tree-connection">
        <div class="tree-line"></div>
        <div class="tree-arrow">↓</div>
        <div class="tree-line"></div>
      </div>
      <div class="tree-generation">
        <div class="tree-generation-label">손자 세대</div>`;
      grandchildren.forEach(grandchild => {
        html += createTreeNode(grandchild);
      });
      html += '</div>';
    }
  }
  
  html += '</div>';
  return html;
}

function displayFamilyTreeView(animal) {
  const allAnimals = getAllAnimals();
  let html = `<div class="tree-section">
    <div class="tree-section-title">${animal.name}의 가족 트리</div>`;
  
  // 조상 트리
  html += displayAncestorsTree(animal);
  
  // 구분선
  html += `<div style="margin: 40px 0; text-align: center;">
    <div style="height: 2px; background: linear-gradient(90deg, transparent, #007bff, transparent); border-radius: 1px;"></div>
  </div>`;
  
  // 자손 트리
  html += displayDescendantsTree(animal);
  
  html += '</div>';
  return html;
}

function createTreeNode(animal, isSelected = false) {
  const imageDisplay = animal.imageData ? 
    `<img src="${animal.imageData}" alt="${animal.name}">` : 
    `<div style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #6c757d; margin: 0 auto;">📷</div>`;
  
  return `
    <div class="tree-node ${isSelected ? 'selected' : ''}" onclick="selectAnimalForTree('${animal.name}')">
      ${imageDisplay}
      <div class="tree-node-name">${animal.name}</div>
      <div class="tree-node-info">${animal.generation} | ${animal.gender}</div>
    </div>
  `;
}



// 세대별 필터링 함수
function filterByGeneration(generation) {
  // 세대 필터 드롭다운 업데이트
  const generationFilter = document.getElementById('generationFilter');
  if (generationFilter) {
    generationFilter.value = generation;
  }
  
  // 검색어 초기화
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // 상태 필터 초기화
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.value = '';
  }
  
  // 성별 필터 초기화
  const genderFilter = document.getElementById('genderFilter');
  if (genderFilter) {
    genderFilter.value = '';
  }
  
  // 필터 적용
  filterAnimals();
  
  // 선택된 세대 표시
  if (generation) {
    alert(`${generation} 세대 개체만 표시됩니다.`);
  } else {
    alert('전체 개체를 표시합니다.');
  }
}

// 트리를 이미지로 저장하는 함수
async function exportTreeAsImage() {
  // 플랜 제한 확인
  const currentUser = userManager.getCurrentUser();
  const plan = paymentSystem.plans[currentUser?.plan || 'free'];
  
  if (plan && !plan.limits.pdfExport) {
    alert(`${plan.name} 플랜은 PDF 내보내기 기능을 사용할 수 없습니다. 업그레이드하세요.`);
    return;
  }
  
  if (!selectedTreeAnimal) {
    alert('먼저 개체를 선택해주세요.');
    return;
  }
  
  const treeContainer = document.getElementById('treeContainer');
  if (!treeContainer) {
    alert('트리 내용을 찾을 수 없습니다.');
    return;
  }
  
  try {
    // 로딩 메시지 표시
    const originalContent = treeContainer.innerHTML;
    treeContainer.innerHTML = '<div style="text-align: center; padding: 40px; background: white; border-radius: 8px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #007bff;"></i><br><p style="margin-top: 10px; color: #666;">이미지 생성 중...</p></div>';
    
    // 잠시 대기하여 로딩 메시지가 표시되도록 함
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // HTML2Canvas 옵션 설정
    const options = {
      backgroundColor: '#ffffff',
      scale: 3, // 더 높은 해상도
      useCORS: true,
      allowTaint: true,
      logging: false,
      removeContainer: false,
      foreignObjectRendering: true
    };
    
    // 이미지 생성
    const canvas = await html2canvas(treeContainer, options);
    
    // 원래 내용 복원
    treeContainer.innerHTML = originalContent;
    
    // 이미지 다운로드
    const link = document.createElement('a');
    link.download = `${selectedTreeAnimal}_${currentTreeView}_tree.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    // 성공 메시지
    setTimeout(() => {
      alert('이미지가 성공적으로 저장되었습니다!');
    }, 100);
    
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    alert('이미지 생성 중 오류가 발생했습니다.');
    
    // 오류 발생 시 원래 내용 복원
    const treeContainer = document.getElementById('treeContainer');
    if (treeContainer) {
      treeContainer.innerHTML = originalContent;
    }
  }
}

function getAncestors(animal, allAnimals, maxDepth = 3) {
  const ancestors = [];
  
  function findAncestors(current, depth = 0) {
    if (depth >= maxDepth) return;
    
    const parents = [];
    if (current.father && current.father !== 'unknown') {
      const father = allAnimals.find(a => a.name === current.father);
      if (father) parents.push(father);
    }
    if (current.mother) {
      const mother = allAnimals.find(a => a.name === current.mother);
      if (mother) parents.push(mother);
    }
    
    parents.forEach(parent => {
      ancestors.push({...parent, depth});
      findAncestors(parent, depth + 1);
    });
  }
  
  findAncestors(animal);
  return ancestors;
}

function getDescendants(animal, allAnimals, maxDepth = 3) {
  const descendants = [];
  
  function findDescendants(current, depth = 0) {
    if (depth >= maxDepth) return;
    
    const children = allAnimals.filter(a => 
      (a.father === current.name) || (a.mother === current.name)
    );
    
    children.forEach(child => {
      descendants.push({...child, depth});
      findDescendants(child, depth + 1);
    });
  }
  
  findDescendants(animal);
  return descendants;
}

// 모프 계산기 기능 - 크레스티드 게코 정확한 모프 정보
const morphDatabase = {
  // 기본 모프
  'normal': { name: '노멀', description: '기본 모프 (Normal)', recessive: false, type: 'basic' },
  
  // 루왁 라인
  'luak': { name: '루왁', description: '루왁 (Luak)', recessive: true, type: 'luak' },
  'luak-lily': { name: '루왁 릴리', description: '루왁 릴리 (Luak Lily)', recessive: true, type: 'luak' },
  
  // 릴리 라인
  'lily-white': { name: '릴리화이트', description: '릴리화이트 (Lily White)', recessive: true, type: 'lily' },
  'lily-sable': { name: '릴리 세이블', description: '릴리 세이블 (Lily Sable)', recessive: true, type: 'lily' },
  'lily-het-axanthic': { name: '릴리100%헷아잔틱', description: '릴리 100% 헷 아잔틱 (Lily 100% Het Axanthic)', recessive: true, type: 'lily' },
  'lilzantic': { name: '릴잔틱', description: '릴잔틱 (Lilzantic)', recessive: true, type: 'lily' },
  
  // 세이블 라인
  'sable': { name: '세이블', description: '세이블 (Sable)', recessive: true, type: 'sable' },
  'super-sable': { name: '슈퍼세이블', description: '슈퍼 세이블 (Super Sable)', recessive: true, type: 'sable' },
  'super-sable-lily': { name: '슈퍼세이블 릴리', description: '슈퍼세이블 릴리 (Super Sable Lily)', recessive: true, type: 'sable' },
  
  // 아잔틱 라인
  'axanthic': { name: '아잔틱', description: '아잔틱 (Axanthic)', recessive: true, type: 'axanthic' },
  'het-axanthic': { name: '100%헷아잔틱', description: '100% 헷 아잔틱 (100% Het Axanthic)', recessive: true, type: 'axanthic' },
  
  // 초초 라인
  'choco': { name: '초초', description: '초초 (Chocho)', recessive: true, type: 'choco' },
  'het-choco': { name: '100%헷초초', description: '100% 헷 초초 (100% Het Chocho)', recessive: true, type: 'choco' },
  
  // 커피 라인
  'cappuccino': { name: '카푸치노', description: '카푸치노 (Cappuccino)', recessive: true, type: 'coffee' },
  'frappuccino': { name: '프라푸치노', description: '프라푸치노 (Frappuccino)', recessive: true, type: 'coffee' },
  
  // 하이포 라인
  'hypo': { name: '하이포', description: '하이포 (Hypo)', recessive: true, type: 'hypo' },
  
  // 복합 모프
  'bi': { name: '바이', description: '바이 (Bi)', recessive: true, type: 'complex' },
  'tri': { name: '트라이', description: '트라이 (Tri)', recessive: true, type: 'complex' },
  'quad': { name: '쿼드', description: '쿼드 (Quad)', recessive: true, type: 'complex' },
  
  // 패턴 모프
  'patternless': { name: '패턴리스', description: '패턴리스 (Patternless)', recessive: true, type: 'pattern' },
  'phantom': { name: '팬텀', description: '팬텀 (Phantom)', recessive: true, type: 'pattern' },
  
  // 달마시안 라인
  'dalmatian': { name: '달마시안', description: '달마시안 (Dalmatian)', recessive: true, type: 'dalmatian' },
  'super-dalmatian': { name: '슈퍼달마시안', description: '슈퍼달마시안 (Super Dalmatian)', recessive: true, type: 'dalmatian' },
  
  // 특수 모프
  'drippy': { name: '드리피', description: '드리피 (Drippy)', recessive: true, type: 'special' },
  'buckskin': { name: '벅스킨', description: '벅스킨 (Buckskin)', recessive: true, type: 'special' },
  'brindle': { name: '브린들', description: '브린들 (Brindle)', recessive: true, type: 'special' },
  'solid-back': { name: '솔리드백', description: '솔리드백 (Solid Back)', recessive: true, type: 'special' },
  'empty-back': { name: '엠티백', description: '엠티백 (Empty Back)', recessive: true, type: 'special' },
  'flame': { name: '플레임', description: '플레임 (Flame)', recessive: true, type: 'special' },
  'white-spot': { name: '화이트스팟', description: '화이트스팟 (White Spot)', recessive: true, type: 'special' },
  'white-porthole': { name: '화이트포트홀', description: '화이트포트홀 (White Porthole)', recessive: true, type: 'special' },
  
  // 핀스트라이프 라인
  'pinstripe': { name: '핀스트라이프', description: '핀스트라이프 (Pinstripe)', recessive: true, type: 'pinstripe' },
  'full-pin': { name: '풀핀', description: '풀핀 (Full Pin)', recessive: true, type: 'pinstripe' },
  'white-pin': { name: '화이트핀', description: '화이트핀 (White Pin)', recessive: true, type: 'pinstripe' },
  
  // 할리퀸 라인
  'harlequin': { name: '할리퀸', description: '할리퀸 (Harlequin)', recessive: true, type: 'harlequin' },
  'extreme-harlequin': { name: '익스트림할리퀸', description: '익스트림할리퀸 (Extreme Harlequin)', recessive: true, type: 'harlequin' },
  
  // 스트라이프 라인
  'super-stripe': { name: '슈퍼스트라이프', description: '슈퍼스트라이프 (Super Stripe)', recessive: true, type: 'stripe' },
  
  // 색상 모프
  'dark': { name: '다크', description: '다크 (Dark)', recessive: true, type: 'color' },
  'red': { name: '레드', description: '레드 (Red)', recessive: true, type: 'color' },
  'black': { name: '블랙', description: '블랙 (Black)', recessive: true, type: 'color' },
  'strawberry': { name: '스트로베리', description: '스트로베리 (Strawberry)', recessive: true, type: 'color' },
  'yellow': { name: '옐로우', description: '옐로우 (Yellow)', recessive: true, type: 'color' },
  'charcoal': { name: '챠콜', description: '챠콜 (Charcoal)', recessive: true, type: 'color' },
  'cream': { name: '크림', description: '크림 (Cream)', recessive: true, type: 'color' },
  'creamsicle': { name: '크림시클', description: '크림시클 (Creamsicle)', recessive: true, type: 'color' },
  'tiger': { name: '타이거', description: '타이거 (Tiger)', recessive: true, type: 'color' },
  'tangerine': { name: '텐저린', description: '텐저린 (Tangerine)', recessive: true, type: 'color' },
  'halloween': { name: '할로윈', description: '할로윈 (Halloween)', recessive: true, type: 'color' },
  'white': { name: '화이트', description: '화이트 (White)', recessive: true, type: 'color' }
};

function calculateMorphs() {
  const fatherMorphs = getSelectedMorphs('father');
  const motherMorphs = getSelectedMorphs('mother');
  
  // 플랜 제한 확인
  const currentUser = userManager.getCurrentUser();
  const plan = paymentSystem.plans[currentUser?.plan || 'free'];
  
  if (plan && plan.limits.morphCombinations !== -1) {
    const totalCombinations = fatherMorphs.length * motherMorphs.length;
    if (totalCombinations > plan.limits.morphCombinations) {
      alert(`${plan.name} 플랜은 최대 ${plan.limits.morphCombinations}개의 모프 조합까지만 계산할 수 있습니다. 더 많은 조합을 원하시면 업그레이드하세요.`);
      return;
    }
  }
  
  if (fatherMorphs.length === 0 && motherMorphs.length === 0) {
    alert('최소한 하나의 모프를 선택해주세요.');
    return;
  }
  
  const results = calculateOffspringMorphs(fatherMorphs, motherMorphs);
  displayMorphResults(results);
}

function getSelectedMorphs(parent) {
  const morphs = [];
  const categories = ['basic', 'luak', 'lily', 'sable', 'axanthic', 'choco', 'coffee', 'hypo', 'complex', 'pattern', 'dalmatian', 'pinstripe', 'harlequin', 'stripe', 'special', 'color'];
  
  categories.forEach(category => {
    const checkboxes = document.querySelectorAll(`input[name="${parent}-${category}"]:checked`);
    checkboxes.forEach(checkbox => {
      morphs.push(checkbox.value);
    });
  });
  
  return morphs;
}

function calculateOffspringMorphs(fatherMorphs, motherMorphs) {
  const allPossibleMorphs = [...new Set([...fatherMorphs, ...motherMorphs])];
  const results = [];
  
  // 각 모프의 확률 계산
  allPossibleMorphs.forEach(morph => {
    const morphInfo = morphDatabase[morph];
    if (!morphInfo) return;
    
    let probability = 0;
    let description = '';
    
    // 기본 모프 (노멀)의 경우 - 우성 유전
    if (morph === 'normal') {
      if (fatherMorphs.includes(morph) && motherMorphs.includes(morph)) {
        probability = 100;
        description = '부모 모두가 노멀 (100% 확률)';
      } else if (fatherMorphs.includes(morph) || motherMorphs.includes(morph)) {
        probability = 100;
        description = '부모 중 하나가 노멀 (우성 유전으로 100% 확률)';
      }
    }
    // 열성 유전자의 경우
    else if (morphInfo.recessive) {
      // 부모 모두가 해당 모프를 가지고 있는 경우 (homozygous)
      if (fatherMorphs.includes(morph) && motherMorphs.includes(morph)) {
        probability = 100;
        description = '부모 모두가 열성 모프 보유 (100% 확률)';
      }
      // 부모 중 하나만 해당 모프를 가지고 있는 경우 (heterozygous)
      else if (fatherMorphs.includes(morph) || motherMorphs.includes(morph)) {
        probability = 25;
        description = '부모 중 하나만 열성 모프 보유 (25% 확률로 헷)';
      }
    }
    
    // 같은 타입의 다른 모프가 있는 경우 (예: 다른 알비노 타입)
    const sameTypeMorphs = Object.values(morphDatabase).filter(m => m.type === morphInfo.type && m.type !== 'basic');
    const fatherSameType = fatherMorphs.filter(m => morphDatabase[m]?.type === morphInfo.type);
    const motherSameType = motherMorphs.filter(m => morphDatabase[m]?.type === morphInfo.type);
    
    if (sameTypeMorphs.length > 1 && (fatherSameType.length > 0 || motherSameType.length > 0)) {
      description += ' (다른 ' + morphInfo.type + ' 타입과 경쟁 가능)';
    }
    
    results.push({
      morph: morph,
      name: morphInfo.name,
      probability: probability,
      description: description,
      type: morphInfo.type
    });
  });
  
  // 복합 유전 계산 (여러 모프의 조합)
  const complexResults = calculateComplexMorphs(fatherMorphs, motherMorphs);
  results.push(...complexResults);
  
  // 확률순으로 정렬
  results.sort((a, b) => b.probability - a.probability);
  
  return results;
}

function calculateComplexMorphs(fatherMorphs, motherMorphs) {
  const results = [];
  
  // 복합 모프 계산 (예: 바이, 트라이, 쿼드)
  const complexMorphs = ['bi', 'tri', 'quad'];
  
  complexMorphs.forEach(complexMorph => {
    const fatherHas = fatherMorphs.includes(complexMorph);
    const motherHas = motherMorphs.includes(complexMorph);
    
    if (fatherHas || motherHas) {
      let probability = 0;
      let description = '';
      
      if (fatherHas && motherHas) {
        probability = 100;
        description = '부모 모두가 ' + morphDatabase[complexMorph].name + ' 보유 (100% 확률)';
      } else {
        probability = 50;
        description = '부모 중 하나가 ' + morphDatabase[complexMorph].name + ' 보유 (50% 확률)';
      }
      
      results.push({
        morph: complexMorph,
        name: morphDatabase[complexMorph].name,
        probability: probability,
        description: description,
        type: 'complex'
      });
    }
  });
  
  return results;
}

function displayMorphResults(results) {
  const container = document.getElementById('morphResults');
  
  if (results.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666;">계산 결과가 없습니다.</p>';
    return;
  }
  
  let html = '<h4 style="margin-bottom: 15px; color: #2c3e50;">예상 자손 모프</h4>';
  
  // 확률별로 그룹화
  const highProb = results.filter(r => r.probability >= 100);
  const mediumProb = results.filter(r => r.probability >= 50 && r.probability < 100);
  const lowProb = results.filter(r => r.probability < 50);
  
  if (highProb.length > 0) {
    html += '<div class="probability-group"><h5 style="color: #28a745; margin: 10px 0;">100% 확률</h5>';
    highProb.forEach(result => {
      html += `
        <div class="morph-result-item high-prob">
          <div class="morph-name">${result.name}</div>
          <div class="morph-probability" style="color: #28a745;">
            확률: ${result.probability}%
          </div>
          <div class="morph-description">${result.description}</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  if (mediumProb.length > 0) {
    html += '<div class="probability-group"><h5 style="color: #ffc107; margin: 10px 0;">50% 확률</h5>';
    mediumProb.forEach(result => {
      html += `
        <div class="morph-result-item medium-prob">
          <div class="morph-name">${result.name}</div>
          <div class="morph-probability" style="color: #ffc107;">
            확률: ${result.probability}%
          </div>
          <div class="morph-description">${result.description}</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  if (lowProb.length > 0) {
    html += '<div class="probability-group"><h5 style="color: #dc3545; margin: 10px 0;">25% 확률 (헷)</h5>';
    lowProb.forEach(result => {
      html += `
        <div class="morph-result-item low-prob">
          <div class="morph-name">${result.name}</div>
          <div class="morph-probability" style="color: #dc3545;">
            확률: ${result.probability}%
          </div>
          <div class="morph-description">${result.description}</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  container.innerHTML = html;
}

function clearMorphSelection() {
  const checkboxes = document.querySelectorAll('.morph-calculator input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  document.getElementById('morphResults').innerHTML = '';
}

// 릴리화이트 위험성 체크 함수
async function checkLilyWhiteInParents(father, mother) {
  const allAnimals = getAllAnimals();
  const fatherAnimal = allAnimals.find(a => a.name === father);
  const motherAnimal = allAnimals.find(a => a.name === mother);
  
  return (fatherAnimal && fatherAnimal.morphs && fatherAnimal.morphs.includes('lily-white')) ||
         (motherAnimal && motherAnimal.morphs && motherAnimal.morphs.includes('lily-white'));
}

// 모든 전역 함수들을 한 번에 등록
(function() {
  // 기본 함수들
  window.saveToLocalStorage = saveToLocalStorage;
  window.loadFromLocalStorage = loadFromLocalStorage;
  window.updateGenerationFields = updateGenerationFields;
  window.loadParentOptions = loadParentOptions;
  window.getParentGeneration = getParentGeneration;
  window.getAllAnimals = getAllAnimals;
  window.toggleParentFields = toggleParentFields;
  window.compressImage = compressImage;
  window.saveAnimalToStorage = saveAnimalToStorage;
  window.loadF1Options = loadF1Options;
  window.showRegisteredAnimals = showRegisteredAnimals;
  window.updateStats = updateStats;
  window.showStatus = showStatus;
  window.showAnimalDetail = showAnimalDetail;
  window.closeModal = closeModal;
  window.showImageReuploadModal = showImageReuploadModal;
  window.batchUploadImages = batchUploadImages;
  window.reuploadImage = reuploadImage;
  window.quickReupload = quickReupload;
  window.closeReuploadModal = closeReuploadModal;
  window.autoUpdateImages = autoUpdateImages;
  window.clearAllData = clearAllData;
  window.previewImage = previewImage;
  window.showFamilyTree = showFamilyTree;
  window.getParents = getParents;
  window.getStatusBadge = getStatusBadge;
  window.updateAnimalStatus = updateAnimalStatus;
  window.closeStatusModal = closeStatusModal;
  window.changeStatus = changeStatus;
  window.migrateOldData = migrateOldData;
  window.debugData = debugData;
  window.filterAnimals = filterAnimals;
  window.displayAnimals = displayAnimals;
  window.displayAnimalsAsCards = displayAnimalsAsCards;
  window.displayAnimalsAsTable = displayAnimalsAsTable;
  window.getStatusText = getStatusText;
  window.getCategoryText = getCategoryText;
  window.toggleViewMode = toggleViewMode;
  window.updateStatsSummary = updateStatsSummary;
  window.exportData = exportData;
  
  // 사용자 관리 함수들
  window.displayUserInfo = displayUserInfo;
  window.showPricing = showPricing;
  window.logout = logout;
  
  // 프리미엄 기능 함수들
  window.showPremiumFeature = showPremiumFeature;
  window.showPremiumFeatures = showPremiumFeatures;
  window.showAIPrediction = showAIPrediction;
  window.showAdvancedAnalytics = showAdvancedAnalytics;
  window.showBreedingPlan = showBreedingPlan;
  window.runAIPrediction = runAIPrediction;
  window.generateBreedingPlan = generateBreedingPlan;
  
  // 플랜 관리 함수들
  window.showPlanManagement = showPlanManagement;
  window.displayCurrentUserPlanInfo = displayCurrentUserPlanInfo;
  window.upgradeUserToLifetime = upgradeUserToLifetime;
  window.upgradeUserToAdmin = upgradeUserToAdmin;
  window.upgradeUserToPro = upgradeUserToPro;
  window.showPlanLimitations = showPlanLimitations;
  
  // 관리자 함수들
  window.showAdminPanel = showAdminPanel;
  window.showAdminStats = showAdminStats;
  window.showUserManagement = showUserManagement;
  window.showSystemSettings = showSystemSettings;
  window.backupAllData = backupAllData;
  window.restoreData = restoreData;
  window.clearAllSystemData = clearAllSystemData;
  window.addNewUser = addNewUser;
  window.editUser = editUser;
  window.deleteUser = deleteUser;
  
  // 혈통 트리 함수들
  window.showTreeModal = showTreeModal;
  window.closeTreeModal = closeTreeModal;
  window.searchAnimalsForTree = searchAnimalsForTree;
  window.displayTreeSearchResults = displayTreeSearchResults;
  window.selectAnimalForTree = selectAnimalForTree;
  window.searchInTree = searchInTree;
  window.changeTreeView = changeTreeView;
  window.displayFamilyTree = displayFamilyTree;
  window.displayAncestorsTree = displayAncestorsTree;
  window.displayDescendantsTree = displayDescendantsTree;
  window.displayFamilyTreeView = displayFamilyTreeView;
  window.createTreeNode = createTreeNode;
  window.filterByGeneration = filterByGeneration;
  window.exportTreeAsImage = exportTreeAsImage;
  window.getAncestors = getAncestors;
  window.getDescendants = getDescendants;
  
  // 모프 계산기 함수들
  window.calculateMorphs = calculateMorphs;
  window.getSelectedMorphs = getSelectedMorphs;
  window.calculateOffspringMorphs = calculateOffspringMorphs;
  window.calculateComplexMorphs = calculateComplexMorphs;
  window.displayMorphResults = displayMorphResults;
  window.clearMorphSelection = clearMorphSelection;
  window.checkLilyWhiteInParents = checkLilyWhiteInParents;
  
  console.log('✅ 모든 전역 함수가 등록되었습니다.');
})();
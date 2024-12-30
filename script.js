let map;
let marker;
let autocomplete;
let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

// 初始化 Google Maps
function initMap() {
    // 預設顯示東京
    const tokyo = { lat: 35.6762, lng: 139.6503 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        center: tokyo,
        zoom: 13
    });

    // 初始化自動完成
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById('searchInput'),
        {
            componentRestrictions: { country: 'jp' },
            fields: ['address_components', 'geometry', 'name', 'formatted_address']
        }
    );

    // 監聽地點選擇
    autocomplete.addListener('place_changed', handlePlaceSelect);
    
    // 載入搜尋紀錄
    updateSearchHistory();
}

// 處理地點選擇
function handlePlaceSelect() {
    const place = autocomplete.getPlace();
    
    if (!place.geometry) {
        alert('找不到該地點，請重新選擇');
        return;
    }

    // 更新地圖
    map.setCenter(place.geometry.location);
    
    if (marker) {
        marker.setMap(null);
    }
    
    marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    // 解析地址資訊
    const addressComponents = place.address_components;
    let postalCode = '';
    let japaneseAddress = '';
    
    for (const component of addressComponents) {
        if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
        }
    }

    // 更新顯示資訊
    document.getElementById('japaneseAddress').textContent = place.formatted_address;
    document.getElementById('postalCode').textContent = `郵遞區號：${postalCode}`;
    document.getElementById('englishAddress').textContent = place.name;

    // 儲存到搜尋紀錄
    saveToHistory({
        address: place.formatted_address,
        postalCode: postalCode,
        location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        }
    });
}

// 儲存搜尋紀錄
function saveToHistory(data) {
    searchHistory = searchHistory.filter(item => item.address !== data.address);
    searchHistory.unshift(data);
    
    if (searchHistory.length > 10) {
        searchHistory.pop();
    }
    
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    updateSearchHistory();
}

// 更新搜尋紀錄顯示
function updateSearchHistory() {
    const historyList = document.getElementById('searchHistory');
    historyList.innerHTML = '';
    
    searchHistory.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.address} (${item.postalCode})`;
        li.addEventListener('click', () => {
            document.getElementById('searchInput').value = item.address;
            map.setCenter(item.location);
            if (marker) {
                marker.setMap(null);
            }
            marker = new google.maps.Marker({
                map: map,
                position: item.location
            });
        });
        historyList.appendChild(li);
    });
}

// 複製郵遞區號
document.getElementById('copyButton').addEventListener('click', () => {
    const postalCode = document.getElementById('postalCode').textContent;
    navigator.clipboard.writeText(postalCode.replace('郵遞區號：', ''))
        .then(() => alert('郵遞區號已複製到剪貼簿'));
});

// 開啟導航
document.getElementById('navigationButton').addEventListener('click', () => {
    if (marker) {
        const lat = marker.getPosition().lat();
        const lng = marker.getPosition().lng();
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
});

// 載入地圖
google.maps.event.addDomListener(window, 'load', initMap); 
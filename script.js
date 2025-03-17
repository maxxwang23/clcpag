// Initialize IndexedDB
const dbName = 'videosDB';
const storeName = 'videos';
let db;

const request = indexedDB.open(dbName, 1);

request.onerror = (event) => {
    console.error('Database error:', event.target.error);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'id' });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadSavedVideos();
};

function handleVideoUpload() {
    const videoInput = document.getElementById('videoInput');
    const files = videoInput.files;
    if (!files.length) return;

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const videoData = e.target.result;
            const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const today = new Date();
            const uploadDate = today.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // Create video elements
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-wrapper';

            const videoTitle = document.createElement('p');
            videoTitle.textContent = file.name;
            videoWrapper.appendChild(videoTitle);

            const dateLabel = document.createElement('p');
            dateLabel.className = 'upload-date';
            dateLabel.textContent = `Fecha: ${uploadDate}`;
            videoWrapper.appendChild(dateLabel);

            const videoElement = document.createElement('video');
            videoElement.controls = true;
            videoElement.width = 320;
            videoElement.height = 240;
            videoElement.src = videoData;
            videoWrapper.appendChild(videoElement);

            // Save to IndexedDB with upload date
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const videoInfo = {
                id: videoId,
                name: file.name,
                data: videoData,
                timestamp: uploadDate
            };
            
            const addRequest = store.add(videoInfo);
            
            addRequest.onsuccess = () => {
                // Add delete button
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Eliminar';
                deleteButton.className = 'delete-button';
                deleteButton.onclick = () => deleteVideo(videoId, videoWrapper);
                videoWrapper.appendChild(deleteButton);

                // Add to container
                const videoContainer = document.getElementById('videoContainer');
                videoContainer.appendChild(videoWrapper);
            };
        };

        reader.readAsDataURL(file);
    });

    videoInput.value = '';
}

function deleteVideo(videoId, videoWrapper) {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(videoId);
    
    request.onsuccess = () => {
        videoWrapper.remove();
    };
}

function loadSavedVideos() {
    if (!db) return;

    const videoContainer = document.getElementById('videoContainer');
    videoContainer.innerHTML = '';

    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
        const videos = request.result;
        videos.forEach(video => {
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'video-wrapper';

            const videoTitle = document.createElement('p');
            videoTitle.textContent = video.name;
            videoWrapper.appendChild(videoTitle);

            const dateLabel = document.createElement('p');
            dateLabel.className = 'upload-date';
            dateLabel.textContent = `Fecha: ${video.timestamp}`;
            videoWrapper.appendChild(dateLabel);

            const videoElement = document.createElement('video');
            videoElement.controls = true;
            videoElement.width = 320;
            videoElement.height = 240;
            videoElement.src = video.data;
            videoWrapper.appendChild(videoElement);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.className = 'delete-button';
            deleteButton.onclick = () => deleteVideo(video.id, videoWrapper);
            videoWrapper.appendChild(deleteButton);

            videoContainer.appendChild(videoWrapper);
        });
    };
}

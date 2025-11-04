class LoadingManager {
    static showFullScreenLoader(message = 'Cargando...') {
        // Si ya existe un loader, lo removemos primero
        this.hideFullScreenLoader();

        const loader = document.createElement('div');
        loader.id = 'fullscreen-loader';
        loader.innerHTML = `
            <div class="loader-overlay">
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <p class="loader-text">${message}</p>
                </div>
            </div>
        `;
        
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;

        document.body.appendChild(loader);
        document.body.style.overflow = 'hidden';
    }

    static hideFullScreenLoader() {
        const loader = document.getElementById('fullscreen-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
                document.body.style.overflow = '';
            }, 300);
        }
    }

    static createSkeletonLoader(type = 'card', count = 1) {
        const skeletons = {
            card: `
                <div class="skeleton-card">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text"></div>
                </div>
            `,
            post: `
                <div class="skeleton-post">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line skeleton-author"></div>
                        <div class="skeleton-line skeleton-text"></div>
                        <div class="skeleton-line skeleton-text short"></div>
                    </div>
                </div>
            `
        };

        return Array(count).fill(skeletons[type] || skeletons.card).join('');
    }
}
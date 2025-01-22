document.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('.position-indicator');
    const buttons = document.querySelectorAll('.btn-custom');
    const indicator = document.querySelector('#blue::before');
    
    const overlay = document.createElement('div');
    overlay.classList.add('theme-transition-overlay');
    document.body.appendChild(overlay);

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const position = button.dataset.position;
            nav.style.setProperty('--indicator-position', `${position}px`);
            
            overlay.classList.add('active');
            
            setTimeout(() => {
                document.body.classList.remove('theme-blue', 'theme-orange', 'theme-green', 'theme-red', 'theme-brown');

                document.body.classList.add(`theme-${button.id}`);
                
                setTimeout(() => {
                    overlay.classList.remove('active');
                }, 300);
            }, 300);
        });
    });
});
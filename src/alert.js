document.addEventListener('DOMContentLoaded', () => {
    const borderElem = document.getElementById('borderElem');
    const centerElem = document.getElementById('centerElem');

    // After 10 seconds: intensify the heartbeat border
    setTimeout(() => {
        borderElem.classList.add('intensified');
    }, 10000);

    // After 11 seconds: show center breathing circle
    setTimeout(() => {
        centerElem.classList.add('show');
    }, 11000);
});

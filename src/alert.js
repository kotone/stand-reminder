document.addEventListener('DOMContentLoaded', () => {
    const borderElem = document.getElementById('borderElem');
    const centerElem = document.getElementById('centerElem');

    // After 10 seconds, trigger the expanded animation
    setTimeout(() => {
        borderElem.classList.add('expanded');
        centerElem.classList.add('show');
    }, 10000);
});

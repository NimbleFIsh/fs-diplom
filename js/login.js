window.addEventListener('DOMContentLoaded', () => {
    document.forms[0].addEventListener('submit', e => {
        e.preventDefault();
        const data = {};
        document.forms[0].querySelectorAll('input').forEach(d => d.type != 'submit' ? data[d.name] = d.value : null);
        const xhr = new XMLHttpRequest();
        xhr.open(e.target.method, e.target.action, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.addEventListener('readystatechange', () => {
            if (xhr.readyState === xhr.DONE)
                if (xhr.response === 'access allowed!')
                {
                    localStorage.auth = JSON.stringify(data);
                    window.location.href = window.location.origin + '/admin.html';
                }
        });
        xhr.send(JSON.stringify(data));
    });
});
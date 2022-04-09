const get = (element, id = true, collection = false) => id ?
	document.getElementById(element) : collection ?
		Array.from(document.getElementsByClassName(element)) :
		document.getElementsByClassName(element)[0];

const network = ( data, callback = false ) => { // Функция для сетевого взаимодействия
    const xhr = new XMLHttpRequest();
    xhr.open('POST', './server.php', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (callback) xhr.addEventListener('readystatechange', () => xhr.readyState === xhr.DONE && callback(xhr.response));
    xhr.send(JSON.stringify(data));
}

window.addEventListener('DOMContentLoaded', () => {
    switch(location.pathname) {
        case '/': // Главная страница
            network({ 'command': 'getFilms' }, f => {
                const films = JSON.parse(f);
                network({ 'command': 'getHolls' }, h => {
                    const holls = JSON.parse(h);
                    for (let film in films) { //console.log(films[film]); // film - название фильма, films[film] - длительность
                        const section = document.createElement('section');
                        section.classList.add('movie');
                        section.innerHTML = `<div class="movie__info">
                            <div class="movie__poster"><img class="movie__poster-image" alt="Звёздные войны постер" src="./img/client/poster1.jpg" /></div>
                            <div class="movie__description">
                                <h2 class="movie__title">${film}</h2><p class="movie__synopsis">Описание</p>
                                <p class="movie__data"><span class="movie__data-duration">${films[film]} минут </span><span class="movie__data-origin">США</span></p>
                            </div>
                        </div>`;

                        for (let holl in holls) // holl - название зала, holls[holl] - его данные
                            if (holls[holl].isActive) { // Если в зале открыта продажа билетов, то идём дальше
                                const seasons = holls[holl].seasons.map(el => el.film === film ? el.time : ''); // Получение списка времени сеансов зала для фильма
                                if (seasons.length > 0) {
                                    const div = document.createElement('div');
                                    const ul = document.createElement('ul');
                                    div.classList.add('movie-seances__hall');
                                    ul.classList.add('movie-seances__list');
                                    div.innerHTML = `<h3 class="movie-seances__hall-title">Зал ${holl}</h3>`;
                                    for (let s = 0; s < seasons.length; s++)
                                        if (seasons[s] !== '')
                                            ul.insertAdjacentHTML('beforeEnd',
                                                `<li class="movie-seances__time-block"><a class="movie-seances__time" href="/hall.html?holl=${holl}&film=${film
                                                    }&time=${seasons[s]}">${seasons[s]}</a></li>`);
                                    if (ul.childElementCount > 0) {
                                        div.insertAdjacentElement('beforeEnd', ul);
                                        section.insertAdjacentElement('beforeEnd', div);
                                    }
                                }
                            }

                        document.getElementsByTagName('main')[0].insertAdjacentElement('beforeEnd', section);
                    }
                });
            });
            break;
        
        case '/hall.html': // Бронирование места
            let selected = [];
            const gD = {};
            location.search.substr(1).split('&').map(el => el.split('=')).forEach(el => gD[el[0]] = el[1]);
            get('buying__info', false).insertAdjacentHTML('afterBegin', `<div class="buying__info-description"><h2 class="buying__info-title">${decodeURIComponent(gD.film)}</h2>
            <p class="buying__info-start">Начало сеанса: ${gD.time}</p><p class="buying__info-hall">Зал ${gD.holl}</p></div>`);
            
            const getTextByCode = code => code == 0 ? 'taken' : code == 1 ? 'standart' : code == 2 ? 'vip' : '';
            
            network({ 'command': 'getCurrentHoll', 'holl': gD.holl, 'film': gD.film, 'time': gD.time }, d => {
                const data = JSON.parse(d);
                get('standart-price').innerText = data.price.standart;
                get('vip-price').innerText = data.price.vip;
                for (let r = 0; r < data.size[0]; r++) {
                    const div = document.createElement('div');
                    div.classList.add('buying-scheme__row');
                    for (let c = 0; c < data.size[1]; c++) {
                        const span = document.createElement('span');
                        span.classList.add('buying-scheme__chair');
                        span.dataset.type = data.place[r][c];
                        span.dataset.pos = r + "~" + c;
                        span.classList.add('buying-scheme__chair_'+getTextByCode(data.place[r][c]));
                        span.addEventListener('click', e => {
                            if (!e.target.classList.contains('buying-scheme__chair_selected')) {
                                e.target.classList.add('buying-scheme__chair_selected');
                                selected.push({ 'type': parseInt(e.target.dataset.type), 'pos': e.target.dataset.pos });
                            } else {
                                e.target.classList.remove('buying-scheme__chair_selected');
                                selected = selected.filter(el => el.pos != e.target.dataset.pos);
                            }
                        });
                        div.insertAdjacentElement('beforeEnd', span);
                    }
                    get('buying-scheme__wrapper', false).insertAdjacentElement('beforeEnd', div);
                }
                get('acceptin-button', false).addEventListener('click', () => {
                    if (selected.length === 0) alert('Пожалуйста, выберите места для бронирования');
                    else location.href = `/payment.html?standart=${data.price.standart}&vip=${data.price.vip}&holl=${gD.holl}&film=${gD.film}&time=${gD.time}&select=${JSON.stringify(selected)}`;
                });
            });
            break;

        case '/payment.html': // Оплата
            const gDi = {};
            location.search.substr(1).split('&').map(el => el.split('=')).forEach(el => gDi[el[0]] = el[1]);
            get('ticket__title', false).innerText = decodeURIComponent(gDi.film);
            get('ticket__hall', false).innerText = gDi.holl;
            get('ticket__start', false).innerText = gDi.time;
            let allPrice = 0;
            let chairs = [], chairsOut = '';
            JSON.parse(decodeURIComponent(gDi.select)).forEach(el => {
                const pos = el.pos.split('~');
                if (el.type === 1) allPrice = allPrice + parseInt(gDi.standart);
                else if (el.type === 2) allPrice = allPrice + parseInt(gDi.vip);
                chairs.push('ряд ' + (parseInt(pos[0]) + 1) + ' - место ' + (parseInt(pos[1]) + 1));
            });
            for (let ch = 0; ch < chairs.length; ch++) {
                if (ch !== 0) chairsOut += ", ";
                chairsOut += chairs[ch];
            }
            get('ticket__chairs', false).innerText = chairsOut;
            get('ticket__cost', false).innerText = allPrice;
            
            get('acceptin-button', false).addEventListener('click', () => {
                location.href='/ticket.html?data='+get('ticket__info', false, true).map(el => el.innerText).map(el => el+'_');
                JSON.parse(decodeURIComponent(gDi.select)).forEach(el => {
                    const pos = el.pos.split('~');
                    network({ 'command': 'placeIsMine', 'holl': gDi.holl, 'film': gDi.film, 'time': gDi.time, 'r': pos[0], 'c': pos[1] });
                });
            });
            break;

        case '/ticket.html': // Билет и QR код
            const data = decodeURIComponent(location.search.substr(6));
            network({ 'command': 'getQR', 'data': data.substring(data.length-1,-1).replaceAll('_,', "\n") }, s => {
                get('ticket__info-wrapper', false).insertAdjacentHTML('afterBegin', `<div class="ticket__info-qr">${s}</div>`);
                data.substring(data.length-1,-1).split('_,').reverse().forEach(el => {
                    const eli = el.split(':');
                    if (el.startsWith('Начало сеанса')) eli[1] = eli[1] + ':' + eli[2];
                    get('ticket__info-wrapper', false).insertAdjacentHTML('afterBegin', `<p class="ticket__info">${eli[0]}: <span class="ticket__details">${eli[1]}<span></p>`);
                });
            });
            break;
    }
});
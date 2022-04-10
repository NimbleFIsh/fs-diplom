const get = (element, id = true, collection = false) => id ?
	document.getElementById(element) : collection ?
		Array.from(document.getElementsByClassName(element)) :
		document.getElementsByClassName(element)[0];

const network = ( data, callback = false ) => { // Функция для сетевого взаимодействия
	const auth = JSON.parse(localStorage.auth);
	const xhr = new XMLHttpRequest();
	xhr.open('POST', './admin.php', true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	if (callback) xhr.addEventListener('readystatechange', () => xhr.readyState === xhr.DONE && callback(xhr.response));
	data.auth = { 'mail': auth.mail, 'pwd': auth.pwd };
	xhr.send(JSON.stringify(data));
}

window.addEventListener('DOMContentLoaded', () => {
	const configurePoles = document.querySelectorAll('.conf-step__legend input'); // Поля ввода данных

	const inpListener = e => {
		network({ 'command': 'getHoll', 'holl': e.target.value.substr(4) }, d => {
			const data = JSON.parse(d);
			const target = e.target.offsetParent.offsetParent;
			if (target.id == 'holls') {
				configurePoles[0].placeholder = data.size[0];
				configurePoles[1].placeholder = data.size[1];
				configurePoles[0].value = '';
				configurePoles[1].value = '';
				reRenderHoll(data.size[0], data.size[1], data.place);
			} else if (target.id == 'holls-price') {
				configurePoles[2].placeholder = data.price.standart;
				configurePoles[3].placeholder = data.price.vip;
				configurePoles[2].value = '';
				configurePoles[3].value = '';
			} else if (target.id == 'holl-status') {
				target.getElementsByClassName('conf-step__button-accent')[0].innerText = (data.isActive ? 'Приостановить' : 'Открыть') + ' продажу билетов';
			}
		});
	}

	let step = 0;
	const insertMenu = data => {
		get('conf-step__selectors-box', false, true).forEach(e => {
			const li = document.createElement('li');
			li.innerHTML = `<input type="radio" class="conf-step__radio" name="${e.dataset.name
				}" value="Зал ${data}"><span class="conf-step__selector">Зал ${data}</span>`;
			li.getElementsByTagName('input')[0].addEventListener('click', inpListener);
			e.insertAdjacentElement('beforeEnd', li);
		});

		network({ 'command': 'getHoll', 'holl': data }, d => {
			const data = JSON.parse(d);
			configurePoles[0].placeholder = data.size[0];           configurePoles[0].value = '';
			configurePoles[1].placeholder = data.size[1];           configurePoles[1].value = '';
			configurePoles[2].placeholder = data.price.standart;    configurePoles[2].value = '';
			configurePoles[3].placeholder = data.price.vip;         configurePoles[3].value = '';
			reRenderHoll(data.size[0], data.size[1], data.place);
			if (data.seasons.length > 0)
				data.seasons.forEach((e, i) => {
					const div = document.createElement('div');
					div.classList.add('conf-step__seances-movie');
					div.style = "width: 60px; background-color: rgb(133, 255, 137); left: " + i*60 + "px;";
					div.innerHTML = `<p class="conf-step__seances-movie-title">${e.film}</p><p class="conf-step__seances-movie-start">${e.time}</p>`;
					div.addEventListener('click', e => {
						get('removeSeason', true).getElementsByTagName('span')[0].innerText = e.target.children[0].innerText + ' на время ' + e.target.children[1].innerText;
						const id = Math.random();
						e.target.dataset.id = id;
						get('removeSeason', true).dataset.id = id;
						get('removeSeason', true).classList.add('active');
					});
					get('seasons', true).children[step].children[1].insertAdjacentElement('beforeEnd', div);
				});
			step++;
		});
	}

	const clickTimeline = e => {
		if (e.target.classList.contains('conf-step__seances-timeline')) {
			get('addSeason', true).classList.add('active');
			const id = Math.random();
			e.target.dataset.id = id;
			get('addSeason', true).dataset.id = id;
		}
	}

	network({ 'command': 'getHolls' }, data => { // Получение данных с сервера, после загрузки страницы
		for (el in JSON.parse(data)) {
			const li = document.createElement('li');
			li.innerHTML = `Зал ${el}<button type="button" class="conf-step__button conf-step__button-trash"></button>`;
			li.getElementsByTagName('button')[0].addEventListener('click', removeH); // Вызов модального окна для удаления зала
			get('conf-step__list', false, true)[0].insertAdjacentElement('beforeEnd', li);
			get('seasons', true).insertAdjacentHTML('beforeEnd', 
				`<div class="conf-step__seances-hall"><h3 class="conf-step__seances-title">Зал ${el}</h3><div class="conf-step__seances-timeline"></div></div>`);
			get('conf-step__seances-timeline', false, true).forEach(el => el.addEventListener('click', clickTimeline));
			insertMenu(el);
		};
	});

	network({ 'command': 'film' }, res => {
		const data = JSON.parse(res);
		for (d in data) addFilm({ 'name': d, 'time': data[d] });
	});

	const close = el => el.addEventListener('click', e => { // Закрытие модального окна
		if (e.target.offsetParent.id === 'holls' || e.target.offsetParent.id === 'holls-price') {
			let cur = null;
			get('conf-step__radio', false, true).forEach(f => { if (f.checked ) cur = f; });
			network({ 'command': 'getHoll', 'holl': cur.value.substr(4) }, d => {
				const data = JSON.parse(d);
				if (e.target.offsetParent.id == 'holls') {
					configurePoles[0].placeholder = data.size[0];
					configurePoles[1].placeholder = data.size[1];
					configurePoles[0].value = '';
					configurePoles[1].value = '';
					reRenderHoll(data.size[0], data.size[1], data.place);
				} else if (e.target.offsetParent.id == 'holls-price') {
					configurePoles[2].placeholder = data.price.standart;
					configurePoles[3].placeholder = data.price.vip;
					configurePoles[2].value = '';
					configurePoles[3].value = '';
				}
			});
		}

		get('conf-step__seances-timeline', false, true).forEach(el => el.dataset.id = '');
		get('conf-step__seances-movie', false, true).forEach(el => el.dataset.id = '');
		get('removeSeason', true).dataset.id = '';
		get('addSeason', true).dataset.id = '';

		const tmp = e.target.offsetParent;
		if (tmp.offsetParent.offsetParent) {
			if (tmp.offsetParent.offsetParent.id === 'addFilm')
				Array.from(get('addFilm').getElementsByClassName('conf-step__input')).forEach(el => el.value = '');
			if (!tmp.querySelector('input').classList.contains('conf-step__button-accent')) tmp.querySelector('input').value = '';
			tmp.offsetParent.offsetParent.classList.remove('active');
		}
	});
	
	const removeH = e => { // Модалка удаления зала
		const remH = get('removeHoll', true);
		remH.getElementsByTagName('span')[0].innerText = e.target.previousSibling.nodeValue.split('\n')[0].split(' ')[1];
		remH.classList.add('active');
	}

	get('conf-step__button-regular', false, true).forEach(close); // Кнопка "отмена" для закрытия модалок
	get('popup__dismiss', false, true).forEach(close); // Закрытие модалок

	const chairListener = e => {
		if (e.target.classList.contains('conf-step__chair_disabled')) {
			e.target.classList.remove('conf-step__chair_disabled');
			e.target.classList.add('conf-step__chair_standart');
		}
		else if (e.target.classList.contains('conf-step__chair_standart')) {
			e.target.classList.remove('conf-step__chair_standart');
			e.target.classList.add('conf-step__chair_vip');
		}
		else if (e.target.classList.contains('conf-step__chair_vip')) {
			e.target.classList.remove('conf-step__chair_vip');
			e.target.classList.add('conf-step__chair_disabled');
		}
	}

	const reRenderHoll = (r = configurePoles[0].value, m = configurePoles[1].value, data = false) => { // Перерисовывает зал
		get('conf-step__chair', false, true).forEach(el => el.removeEventListener('click', chairListener));
		Array.from(get('conf-step__hall-wrapper', false, false).children).forEach(el => el.remove());
		for (let i = 0; i < r; i++) {
			const div = document.createElement('div');
			div.classList.add('conf-step__row');
			if (data) {
				for (let f = 0; f < m; f++)
					div.insertAdjacentHTML('beforeEnd', `<span class="conf-step__chair conf-step__chair_${[ 'disabled', 'standart', 'vip' ][data[i][f]]}"></span>`);
			} else {
				for (let f = 0; f < m; f++)
					div.insertAdjacentHTML('beforeEnd', `<span class="conf-step__chair conf-step__chair_disabled"></span>`);
			}
			get('conf-step__hall-wrapper', false, false).insertAdjacentElement('beforeEnd', div);
		}
		get('conf-step__chair', false, true).forEach(el => el.addEventListener('click', chairListener));
	}

	configurePoles[0].addEventListener('change', () => reRenderHoll());
	configurePoles[1].addEventListener('change', () => reRenderHoll());

	const removeSeason = d => {
		Array.from(get('selectFilm', true).children).forEach(el => el.innerText === d && el.remove());
		get('conf-step__seances-movie-title', false, true).forEach(el => (el.innerText == d) && el.offsetParent.remove());
	}

	const removeFilm = e => network({ 'command': 'film', 'mode': 'r', 'name': e.target.children[1].innerText }, () => {
		removeSeason(e.target.children[1].innerText);
		e.target.remove();
	});

	const addFilm = data => {
		const div = document.createElement('div');
		div.classList.add('conf-step__movie');
		div.innerHTML = `<img class="conf-step__movie-poster" alt="poster" src="./img/admin/poster.png">
			<h3 class="conf-step__movie-title">${data.name}</h3><p class="conf-step__movie-duration">${data.time} минут</p>`;
			get('selectFilm', true).innerHTML += `<option>${data.name}</option>`;
		div.addEventListener('click', removeFilm);
		get('conf-step__movies', false).insertAdjacentElement('beforeEnd', div);
	} 

	get('conf-step__button-accent', false, true).forEach(el => el.addEventListener('click', e => { // Открытие модального окна или отправка формы
		if (get('addHole').classList.contains('active')) {
			const data = get('addHole', true).getElementsByTagName('input')[0].value;
			network({ 'holl': data, 'command': 'addHoll' }, dat => { // Запрос на добавление нового зала
				if (dat === 'holl success added!') {
					const li = document.createElement('li');
					li.innerHTML = `Зал ${data}<button type="button" class="conf-step__button conf-step__button-trash"></button>`;
					li.getElementsByTagName('button')[0].addEventListener('click', removeH); // Вызов модального окна для удаления зала
					get('conf-step__list', false, true)[0].insertAdjacentElement('beforeEnd', li); // Добавление нового зала в список
					insertMenu(data);
					get('seasons', true).insertAdjacentHTML('beforeEnd', 
						`<div class="conf-step__seances-hall"><h3 class="conf-step__seances-title">Зал ${el}</h3><div class="conf-step__seances-timeline"></div></div>`);
					get('addHole', true).classList.remove('active');
				} else alert(dat);
			});
		}
		else if (get('removeHoll').classList.contains('active')) {
			network({ // Запрос на удаление зала
				'holl': get('removeHoll', true).getElementsByTagName('span')[0].innerText,
				'command': 'removeHoll'
			}, data => {
				if (data === 'holl success removed!') {
					Array.from(get('conf-step__list', false, true)[0].children).forEach(el => {
						(el.innerText.substr(4) == get('removeHoll', true).getElementsByTagName('span')[0].innerText) && el.remove();
						get('conf-step__selectors-box', false, true).forEach(l => Array.from(l.children).forEach(r => {
							if (r.innerText.substr(4) == get('removeHoll', true).getElementsByTagName('span')[0].innerText) {
								r.getElementsByTagName('input')[0].removeEventListener('click', inpListener);
								r.remove();
							}
						}));
					});
				} else alert(data);
			});
			get('removeHoll', true).classList.remove('active');
		}
		else if (get('addFilm').classList.contains('active')) {
			let data = {};
			Array.from(get('addFilm').getElementsByClassName('conf-step__input')).forEach(el => data[el.name] = el.value);
			data['time'] = parseInt(data['time']);
			network({ 'command': 'film', 'mode': 'a', 'name': data['name'], 'time': data['time'] }, () => addFilm(data));
			get('addFilm').classList.remove('active')
		}
		else if (get('addSeason', true).classList.contains('active')) {
			const data = get('addSeason', true).getElementsByClassName('conf-step__input');
			const h = get('conf-step__seances-timeline', false, true).filter(el => el.dataset.id == get('addSeason', true).dataset.id)[0].previousElementSibling.innerText.substr(4);
			if (data[0].value !== '')
				network({ 'command': 'season', 'holl': h, 'mode': 'a', 'film': data[0].value, 'time': data[1].value }, () => {
					const div = document.createElement('div');
					div.classList.add('conf-step__seances-movie');
					div.style = "width: 60px; background-color: rgb(133, 255, 137); left: " + 60 * Math.random(1, 10) + "px;";
					div.innerHTML = `<p class="conf-step__seances-movie-title">${data[0].value}</p><p class="conf-step__seances-movie-start">${data[1].value}</p>`;
					div.addEventListener('click', e => {
						get('removeSeason', true).getElementsByTagName('span')[0].innerText = data[0].value + ' на время ' + data[1].value;
						const id = Math.random();
						e.target.dataset.id = id;
						get('removeSeason', true).dataset.id = id;
						get('removeSeason', true).classList.add('active');
					});
					Array.from(get('seasons', true).children).filter(el => el.children[0].innerText.substr(4) == h)[0].children[1].insertAdjacentElement('beforeEnd', div);
					get('addSeason').classList.remove('active');
				});
		}
		else if (get('removeSeason', true).classList.contains('active')) {
			const h = get('conf-step__seances-movie', false, true).filter(el => el.dataset.id == get('removeSeason', true).dataset.id)[0];
			const data = get('removeSeason', true).getElementsByTagName('span')[0].innerText.split(' на время ');
			network({ 'command': 'season', 'holl': h.parentElement.previousElementSibling.innerText.substr(4), 'mode': 'r', 'film': data[0], 'time': data[1] }, () => {
				get('removeSeason').classList.remove('active');
				h.remove();
			});
		}
		else if (e.target.offsetParent.id) {
			let size = { 'r': parseInt(configurePoles[0].value), 'm': parseInt(configurePoles[1].value) }, cur = null;
			get('conf-step__radio', false, true).forEach(f => { if (f.checked ) cur = f; });
			if (e.target.offsetParent.id === 'holls') { // Сохарение настроек зала
				if (configurePoles[0].value !== '' || configurePoles[1].value !== '') {
					configurePoles[0].value = '';
					configurePoles[1].value = '';
					configurePoles[0].placeholder = size.r;
					configurePoles[1].placeholder = size.m;
				} else {
					size.r = parseInt(configurePoles[0].placeholder);
					size.m = parseInt(configurePoles[1].placeholder);
				}
				const hole = [];
				let tmp = [];
				Array.from(get('conf-step__hall', false).getElementsByClassName('conf-step__chair')).forEach((el, i) => {
					if (el.classList.contains('conf-step__chair_disabled')) tmp.push(0);
					else if (el.classList.contains('conf-step__chair_standart')) tmp.push(1);
					else if(el.classList.contains('conf-step__chair_vip')) tmp.push(2);
					if ((i % size.m) == size.m-1) {
						hole.push(tmp);
						tmp = [];
					}
				});
				network({ 'command': 'changeHoll', 'holl': cur.value.substr(4), 'place': hole, 'size': [size.r, size.m] });
			}
			else if (e.target.offsetParent.id === 'holls-price') {
				let price = { 'standart': 0, 'vip': 0 };
				if (configurePoles[2].value !== '' && configurePoles[3].value !== '') {
					price.standart = parseInt(configurePoles[2].value);
					price.vip = parseInt(configurePoles[3].value);
				}
				else {
					price.standart = parseInt(configurePoles[2].placeholder);
					price.vip = parseInt(configurePoles[3].placeholder);
				}
				network({ 'command': 'changeHoll', 'holl': cur.value.substr(4), 'price': { 'standart': price.standart, 'vip': price.vip } });
			}
			else if (e.target.offsetParent.id === 'holl-status' && e.target.innerText.toLowerCase() != 'выберите зал') {
				const status = e.target.innerText.toLowerCase().split(' ')[0] == 'приостановить';
				network({ 'command': 'changeActive', 'holl': cur.value.substr(4), 'status': !status }, () =>
					e.target.innerText = (status ? 'Открыть' : 'Приостановить') + ' продажу билетов');
			}
		} else if (e.target.dataset.id) get(e.target.dataset.id, true).classList.add('active'); // Показ модального окна

		get('addHole').getElementsByClassName('conf-step__input')[0].value = ''; // Сброс поля ввода
	}));
	
	get('conf-step__button-trash', false, true).forEach(el => el.addEventListener('click', removeH)); // Вызов модального окна для удаления зала
});
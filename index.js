require('dotenv').config();
const Mustache = require('mustache');
const fetch = require('node-fetch');
const fs = require('fs');
const ps = require('./services/puppeteer.service');

let DATA = {
	refresh_date: new Date().toLocaleDateString('en-GB', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		timeZoneName: 'short',
		timeZone: 'Asia/Jakarta',
	}),
};

async function setWeather() {
	await fetch(
		`https://api.openweathermap.org/data/2.5/weather?q=jakarta&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=metric`,
	)
		.then((r) => r.json())
		.then((r) => {
			DATA.city_temperature = Math.round(r.main.temp);
			DATA.city_weather = r.weather[0].description;
			DATA.city_weather_icon = r.weather[0].icon;
			DATA.sun_rise = new Date(r.sys.sunrise * 1000).toLocaleString('en-GB', {
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'Asia/Jakarta',
			});

			DATA.sun_set = new Date(r.sys.sunset * 1000).toLocaleString('en-GB', {
				hour: '2-digit',
				minute: '2-digit',
				timeZone: 'Asia/Jakarta',
			});
		});
}

async function setInstagramPosts() {
	const instagramImages = await ps.getInstagramPosts('agreeculture.id', 3);
	DATA.img1 = instagramImages[0];
	DATA.img2 = instagramImages[1];
	DATA.img3 = instagramImages[2];
}

async function generateReadMe() {
	await fs.readFile(process.env.MUSTACHE_MAIN_DIR, (err, data) => {
		if (err) throw err;
		const output = Mustache.render(data.toString(), DATA);
		fs.writeFileSync('README.md', output);
	});
}

async function action() {
	await setWeather();
	await setInstagramPosts();
	await generateReadMe();
	await ps.close();

	console.log('Finished generating readme!');
}

action();

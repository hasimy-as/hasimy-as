const fs = require('fs');
const fetch = require('node-fetch');
const Mustache = require('mustache');
const ps = require('./services/puppeteer.service');

require('dotenv').config();

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

function setFallbackWeather() {
	DATA.city_temperature = 30;
	DATA.city_weather = 'partly cloudy';
	DATA.city_weather_icon = '02d';
	DATA.sun_rise = '05:03';
	DATA.sun_set = '17:27';
}

async function setWeather() {
	try {
		const r = await fetch(
			`https://api.openweathermap.org/data/2.5/weather?q=jakarta&appid=${process.env.OPEN_WEATHER_MAP_KEY}&units=metric`,
		).then((res) => res.json());

		if (r && r.main && r.weather && r.weather[0]) {
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
		} else {
			console.warn('Invalid weather API response structure, using fallback weather:', r);
			setFallbackWeather();
		}
	} catch (error) {
		console.error('Error fetching weather data, using fallback weather:', error);
		setFallbackWeather();
	}
}

async function setInstagramPosts() {
	try {
		const instagramImages = await ps.getInstagramPosts('lkpp_ri', 3);
		if (instagramImages && instagramImages.length >= 3 && instagramImages.every(img => img)) {
			DATA.img1 = instagramImages[0];
			DATA.img2 = instagramImages[1];
			DATA.img3 = instagramImages[2];
			console.log('Successfully fetched Instagram images from Picuki.');
			return;
		}
	} catch (error) {
		console.warn('Failed to fetch Instagram posts:', error);
	}

	console.log('Falling back to local images from ./public/img/lkpp/');
	try {
		const files = fs.readdirSync('./public/img/lkpp')
			.filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
			.map(file => `./public/img/lkpp/${file}`);
		
		DATA.img1 = files[0] || '';
		DATA.img2 = files[1] || '';
		DATA.img3 = files[2] || '';
	} catch (err) {
		console.error('Failed to read local fallback images:', err);
		DATA.img1 = '';
		DATA.img2 = '';
		DATA.img3 = '';
	}
}

async function generateReadMe() {
	const templatePath = process.env.MUSTACHE_MAIN_DIR || './main.mustache';
	await fs.readFile(templatePath, (err, data) => {
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


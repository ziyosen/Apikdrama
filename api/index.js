const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // Setting CORS agar bisa diakses GitHub Pages
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const url = "https://drama-id.com/negara/korea-selatan/";

    try {
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        let movies = [];

        // Scrape daftar film sesuai struktur HTML
        $('.style_post_1 article').each((i, el) => {
            movies.push({
                title: $(el).find('.title_post a').text().trim(),
                link: $(el).find('.title_post a').attr('href'),
                image: $(el).find('.thumbnail img').attr('src')
            });
        });

        // Ambil link streaming (Hanya 5 film pertama agar Vercel tidak timeout)
        for (let i = 0; i < Math.min(movies.length, 5); i++) {
            try {
                const detailRes = await axios.get(movies[i].link);
                const $d = cheerio.load(detailRes.data);
                const streamingData = $d('.streaming_load').attr('data');
                
                if (streamingData) {
                    const decoded = Buffer.from(streamingData, 'base64').toString('utf-8');
                    const match = decoded.match(/src="([^"]+)"/);
                    movies[i].streaming_url = match ? match[1] : null;
                }
            } catch (err) {
                console.error("Gagal ambil detail");
            }
        }

        res.status(200).json({ status: "success", data: movies });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

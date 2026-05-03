const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    const url = "https://drama-id.com/negara/korea-selatan/";

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let movies = [];

        // 1. Ambil list film dulu
        $('.style_post_1 article').each((i, el) => {
            movies.push({
                title: $(el).find('.title_post a').text().trim(),
                link: $(el).find('.title_post a').attr('href'),
                image: $(el).find('.thumbnail img').attr('src')
            });
        });

        // 2. Ambil detail untuk 3 film pertama saja (biar gak timeout di Vercel)
        for (let i = 0; i < Math.min(movies.length, 3); i++) {
            const detailRes = await axios.get(movies[i].link);
            const $d = cheerio.load(detailRes.data);

            // Ambil Link Streaming (Decode Base64)
            const streamingData = $d('.streaming_load').attr('data');
            if (streamingData) {
                const decoded = Buffer.from(streamingData, 'base64').toString('utf-8');
                const match = decoded.match(/src="([^"]+)"/);
                movies[i].streaming_url = match ? match[1] : null;
            }

            // Ambil Link Download
            movies[i].downloads = [];
            $d('.link_download li').each((j, dl) => {
                movies[i].downloads.push({
                    resolution: $d(dl).find('strong').text().trim(),
                    url: $d(dl).find('a').attr('href')
                });
            });
        }

        res.status(200).json({ status: "success", data: movies });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

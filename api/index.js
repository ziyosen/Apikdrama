const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    // 1. SETTING CORS: Agar API bisa diakses dari GitHub Pages atau HTML View Lokal
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle Preflight Request untuk Browser
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // URL Target (Bisa kamu modifikasi sesuai kategori yang diinginkan)
    const url = "https://drama-id.com/negara/korea-selatan/";

    try {
        // 2. Ambil HTML dari halaman utama
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let movies = [];

        // 3. Ekstrak daftar film dari elemen article
        $('.style_post_1 article').each((i, el) => {
            movies.push({
                title: $(el).find('.title_post a').text().trim(),
                link: $(el).find('.title_post a').attr('href'),
                image: $(el).find('.thumbnail img').attr('src')
            });
        });

        // 4. Ambil Detail (Link Video) untuk 5 film teratas agar tidak Timeout di Vercel[cite: 1]
        for (let i = 0; i < Math.min(movies.length, 5); i++) {
            try {
                const detailRes = await axios.get(movies[i].link);
                const $d = cheerio.load(detailRes.data);

                // Ekstrak & Decode Link Streaming (Base64)[cite: 1]
                const streamingData = $d('.streaming_load').attr('data');
                if (streamingData) {
                    const decodedIframe = Buffer.from(streamingData, 'base64').toString('utf-8');
                    const match = decodedIframe.match(/src="([^"]+)"/);
                    movies[i].streaming_url = match ? match[1] : null;
                }

                // Ekstrak Link Download[cite: 1]
                movies[i].downloads = [];
                $d('.link_download li').each((j, dl) => {
                    movies[i].downloads.push({
                        resolution: $d(dl).find('strong').text().trim(),
                        url: $d(dl).find('a').attr('href')
                    });
                });
            } catch (err) {
                console.error(`Gagal ambil detail untuk: ${movies[i].title}`);
            }
        }

        // 5. Kirim Hasil ke Frontend[cite: 1]
        res.status(200).json({
            status: "success",
            total: movies.length,
            data: movies
        });

    } catch (error) {
        res.status(500).json({ 
            status: "error", 
            message: "Gagal scraping data: " + error.message 
        });
    }
};

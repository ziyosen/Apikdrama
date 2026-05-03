const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    const url = "https://drama-id.com/negara/korea-selatan/";

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let allMovies = [];

        // Scraping daftar film sesuai file htmlviewer kamu
        $('.style_post_1 article').each((i, el) => {
            const title = $(el).find('.title_post a').text().trim();
            const link = $(el).find('.title_post a').attr('href');
            const image = $(el).find('.thumbnail img').attr('src');
            
            allMovies.push({ title, link, image });
        });

        // Kirim hasil sebagai JSON agar bisa dibaca di browser
        res.status(200).json({
            status: "success",
            total: allMovies.length,
            data: allMovies
        });

    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
};

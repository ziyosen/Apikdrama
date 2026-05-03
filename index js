const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = "https://drama-id.com";
// Masukkan path yang ingin kamu scrape di sini
const TARGET_PATHS = [
    "/negara/korea-selatan/",
    "/status-drama/ongoing/"
];

async function scrapeDrama() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let allData = [];

    for (const path of TARGET_PATHS) {
        console.log(`\n--- Memproses Halaman: ${BASE_URL + path} ---`);
        
        try {
            await page.goto(BASE_URL + path, { waitUntil: 'networkidle' });

            // 1. Ambil semua link film dari daftar di halaman tersebut
            // Berdasarkan file, daftar film ada di dalam .style_post_1 article
            const moviesInPage = await page.$$eval('.style_post_1 article', articles => {
                return articles.map(el => ({
                    title: el.querySelector('.title_post a')?.innerText.trim(),
                    detailUrl: el.querySelector('.title_post a')?.href
                }));
            });

            console.log(`Menemukan ${moviesInPage.length} film. Mulai mengambil detail...`);

            // 2. Masuk ke setiap detail film untuk ambil link video
            for (let movie of moviesInPage) {
                if (!movie.detailUrl) continue;

                console.log(`Scraping detail: ${movie.title}`);
                const detailPage = await context.newPage();
                
                try {
                    await detailPage.goto(movie.detailUrl, { waitUntil: 'domcontentloaded' });

                    // Ambil link download (Alternative 1)
                    const downloadLinks = await detailPage.$$eval('.link_download li', items => {
                        return items.map(li => ({
                            resolution: li.querySelector('strong')?.innerText.trim(),
                            link: li.querySelector('a')?.href
                        }));
                    });

                    // Ambil link streaming (Decode Base64 dari atribut 'data')
                    const streamingData = await detailPage.$eval('.streaming_load', el => el.getAttribute('data')).catch(() => null);
                    let streamUrl = null;
                    
                    if (streamingData) {
                        const decodedIframe = Buffer.from(streamingData, 'base64').toString('utf-8');
                        const match = decodedIframe.match(/src="([^"]+)"/);
                        streamUrl = match ? match[1] : null;
                    }

                    allData.push({
                        ...movie,
                        streaming_url: streamUrl,
                        downloads: downloadLinks
                    });

                } catch (err) {
                    console.error(`Gagal ambil detail ${movie.title}: ${err.message}`);
                } finally {
                    await detailPage.close();
                }

                // Jeda 2 detik antar film biar nggak gampang diblokir
                await new Promise(r => setTimeout(r, 2000));
            }

        } catch (error) {
            console.error(`Gagal memproses path ${path}: ${error.message}`);
        }
    }

    // Simpan hasil ke JSON
    fs.writeFileSync('hasil_scraper_drama.json', JSON.stringify(allData, null, 2));
    console.log("\nSelesai! Data disimpan di hasil_scraper_drama.json");

    await browser.close();
}

scrapeDrama();

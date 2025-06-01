// isilanlari.js
const puppeteer = require('puppeteer');

let liveJobs = [];
let isScraping = false;

async function startStreamingScrape() {
  if (isScraping) return;

  isScraping = true;
  liveJobs = [];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  let currentPage = 1;

  try {
    while (true) {
      const url = `https://www.techcareer.net/jobs?jobs[page]=${currentPage}&jobs[isCompleted]=false`;
      console.log(`🔄 Sayfa ${currentPage} işleniyor...`);

      await page.goto(url, { waitUntil: 'networkidle2' });

      try {
        await page.waitForSelector('a[data-test="single-job-item"]', { timeout: 5000 });
      } catch {
        console.log(`✅ İşlem tamamlandı. Toplam uygun ilan: ${liveJobs.length}`);
        break;
      }

      const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[data-test="single-job-item"]')).map(el => ({
          title: el.querySelector('[data-test="single-job-title"]')?.innerText || '',
          company: el.querySelector('[data-test="single-job-company-name"]')?.innerText || '',
          location: el.querySelector('[data-test="single-job-location-and-work-place"]')?.innerText || '',
          href: el.href,
        }));
      });

      for (const job of jobs) {
        const detailPage = await browser.newPage();
        await detailPage.goto(job.href, { waitUntil: 'domcontentloaded' });

        const description = await detailPage.evaluate(() =>
          document.querySelector('[data-test="job-detail-desc-content"]')?.innerText.toLowerCase() || ''
        );

        await detailPage.close();

        if (
          description.includes('ybs') ||
          description.includes('yönetim bilişim sistemleri') ||
          description.includes('mis') ||
          description.includes('MIS') ||
          description.includes('MANAGEMENT INFORMATION SYSTEMS') ||
          description.includes('YÖNETİM BİLİŞİM SİSTEMLERİ') ||
          description.includes('YBS') ||
          description.includes('management information systems')
        ) {
          liveJobs.push({ ...job, description });
          console.log(`✅ Eklendi: ${job.title}`);
        }
      }

      currentPage++;
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await browser.close();
    isScraping = false;
  }
}

function getLiveJobs() {
  return liveJobs;
}

module.exports = {
  startStreamingScrape,
  getLiveJobs,
};

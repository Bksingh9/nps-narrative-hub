import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import axios from 'axios';
import PQueue from 'p-queue';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class CrawlerService {
  constructor() {
    // Queue for managing concurrent crawl jobs
    this.queue = new PQueue({ concurrency: 2 });
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Crawl a single URL using Puppeteer (for dynamic content)
  async crawlWithPuppeteer(url, selectors = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for content to load
      if (selectors.waitFor) {
        await page.waitForSelector(selectors.waitFor, { timeout: 10000 });
      }

      // Extract data based on selectors
      const data = await page.evaluate(sel => {
        const extractText = selector => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : null;
        };

        const extractAll = selector => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map(el => el.textContent.trim());
        };

        const result = {};

        // Extract NPS-related data
        if (sel.npsScore) result.npsScore = extractText(sel.npsScore);
        if (sel.storeName) result.storeName = extractText(sel.storeName);
        if (sel.storeCode) result.storeCode = extractText(sel.storeCode);
        if (sel.reviews) result.reviews = extractAll(sel.reviews);
        if (sel.ratings) result.ratings = extractAll(sel.ratings);
        if (sel.dates) result.dates = extractAll(sel.dates);
        if (sel.comments) result.comments = extractAll(sel.comments);

        // Extract tables if present
        if (sel.dataTable) {
          const table = document.querySelector(sel.dataTable);
          if (table) {
            const headers = Array.from(table.querySelectorAll('thead th')).map(
              th => th.textContent.trim()
            );
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(
              tr => {
                const cells = Array.from(tr.querySelectorAll('td')).map(td =>
                  td.textContent.trim()
                );
                return headers.reduce((obj, header, index) => {
                  obj[header] = cells[index];
                  return obj;
                }, {});
              }
            );
            result.tableData = rows;
          }
        }

        return result;
      }, selectors);

      return {
        success: true,
        url,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      return {
        success: false,
        url,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    } finally {
      await page.close();
    }
  }

  // Crawl using Axios and Cheerio (for static content)
  async crawlWithCheerio(url, selectors = {}) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      const data = {};

      // Extract data based on selectors
      if (selectors.npsScore)
        data.npsScore = $(selectors.npsScore).text().trim();
      if (selectors.storeName)
        data.storeName = $(selectors.storeName).text().trim();
      if (selectors.storeCode)
        data.storeCode = $(selectors.storeCode).text().trim();

      if (selectors.reviews) {
        data.reviews = [];
        $(selectors.reviews).each((i, el) => {
          data.reviews.push($(el).text().trim());
        });
      }

      if (selectors.ratings) {
        data.ratings = [];
        $(selectors.ratings).each((i, el) => {
          data.ratings.push($(el).text().trim());
        });
      }

      if (selectors.dataTable) {
        data.tableData = [];
        const headers = [];

        $(`${selectors.dataTable} thead th`).each((i, el) => {
          headers.push($(el).text().trim());
        });

        $(`${selectors.dataTable} tbody tr`).each((i, row) => {
          const rowData = {};
          $(row)
            .find('td')
            .each((j, cell) => {
              if (headers[j]) {
                rowData[headers[j]] = $(cell).text().trim();
              }
            });
          if (Object.keys(rowData).length > 0) {
            data.tableData.push(rowData);
          }
        });
      }

      return {
        success: true,
        url,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      return {
        success: false,
        url,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Transform crawled data to NPS format
  transformToNPSFormat(crawledData) {
    const npsRecords = [];

    if (!crawledData.data) return npsRecords;

    const { data } = crawledData;

    // If we have table data, transform it
    if (data.tableData && Array.isArray(data.tableData)) {
      data.tableData.forEach(row => {
        const record = {
          'Store No.':
            data.storeCode ||
            row['Store'] ||
            row['Store Code'] ||
            row['Location'],
          'Store Name': data.storeName || row['Store Name'] || row['Franchise'],
          State: row['State'] || row['Province'] || '',
          Region: row['Region'] || row['Zone'] || '',
          City: row['City'] || row['Location'] || '',
          'NPS Score': this.parseScore(
            row['NPS'] || row['Score'] || row['Rating'] || data.npsScore
          ),
          'Response Date':
            row['Date'] || row['Response Date'] || new Date().toISOString(),
          Comments: row['Comments'] || row['Feedback'] || row['Review'] || '',
          Category: row['Category'] || row['Type'] || 'Web Crawled',
          'Source URL': crawledData.url,
          'Crawled At': crawledData.timestamp,
        };

        npsRecords.push(record);
      });
    }

    // If we have reviews/ratings arrays, transform them
    else if (data.reviews && data.ratings) {
      const maxLength = Math.max(
        data.reviews?.length || 0,
        data.ratings?.length || 0
      );

      for (let i = 0; i < maxLength; i++) {
        const record = {
          'Store No.': data.storeCode || `CRAWL-${Date.now()}-${i}`,
          'Store Name': data.storeName || 'Unknown Store',
          State: '',
          Region: '',
          City: '',
          'NPS Score': this.parseScore(data.ratings?.[i]),
          'Response Date': data.dates?.[i] || new Date().toISOString(),
          Comments: data.reviews?.[i] || '',
          Category: 'Web Crawled',
          'Source URL': crawledData.url,
          'Crawled At': crawledData.timestamp,
        };

        npsRecords.push(record);
      }
    }

    // Single record from general data
    else if (data.npsScore || data.storeName) {
      npsRecords.push({
        'Store No.': data.storeCode || `CRAWL-${Date.now()}`,
        'Store Name': data.storeName || 'Unknown Store',
        State: '',
        Region: '',
        City: '',
        'NPS Score': this.parseScore(data.npsScore),
        'Response Date': new Date().toISOString(),
        Comments: data.comments?.join(' ') || '',
        Category: 'Web Crawled',
        'Source URL': crawledData.url,
        'Crawled At': crawledData.timestamp,
      });
    }

    return npsRecords;
  }

  // Parse score to NPS scale (0-10)
  parseScore(scoreStr) {
    if (!scoreStr) return 5; // Default middle score

    const cleaned = String(scoreStr).replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) return 5;

    // If it's already in 0-10 range
    if (num >= 0 && num <= 10) return Math.round(num);

    // If it's a percentage (0-100)
    if (num >= 0 && num <= 100) return Math.round(num / 10);

    // If it's out of 5 stars
    if (num >= 0 && num <= 5) return Math.round(num * 2);

    return 5; // Default
  }

  // Crawl multiple URLs
  async crawlMultiple(jobs) {
    const results = await Promise.all(
      jobs.map(job =>
        this.queue.add(async () => {
          const method = job.usePuppeteer
            ? 'crawlWithPuppeteer'
            : 'crawlWithCheerio';
          const result = await this[method](job.url, job.selectors);
          const npsData = this.transformToNPSFormat(result);

          return {
            ...result,
            npsData,
            jobId: job.id,
          };
        })
      )
    );

    return results;
  }
}

export default new CrawlerService();

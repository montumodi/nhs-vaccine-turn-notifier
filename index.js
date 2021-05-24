const puppeteer = require('puppeteer');
const randomIntFromInterval = require("./randomizer");
const playsound = require("./playsound");

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const NHS_NUMBER = "";
const DOB_DATE = "";
const DOB_MONTH = "";
const DOB_YEAR = "";
const RANDOM_MIN = 10000;
const RANDOM_MAX = 30000

async function gotonhs() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.nhs.uk/book-a-coronavirus-vaccination/enter-your-nhs-number');
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);

    if (!data.includes("You are in a queue")) {
        const cookie = await page.$("#nhsuk-cookie-banner__link_accept_analytics");
        if (cookie) {
            await page.click("#nhsuk-cookie-banner__link_accept_analytics");
        }

        await page.click("#option_Yes_input");
        await page.click("#submit-button");
        await page.waitForSelector("html");

        const input = await page.$("#NhsNumber");
        await input.focus();
        await input.type(NHS_NUMBER);
        await page.click("#submit-button");
        await page.waitForSelector("html");

        await page.type("#Date_Day", DOB_DATE); 
        await page.type("#Date_Month", DOB_MONTH);
        await page.type("#Date_Year", DOB_YEAR);
        await page.click("#submit-button");
        await page.waitForSelector("html");

        const typeOfworker = await page.evaluate(() => document.querySelector('*').outerHTML);
        if(typeOfworker.includes("Are you a health worker")) {
            const retryInterval = randomIntFromInterval(RANDOM_MIN, RANDOM_MAX);
            console.log(`Retrying in ${retryInterval} ms....`, new Date())
            await wait(retryInterval);
            await browser.close();
            return gotonhs();
        }
        await page.screenshot({ path: 'example.png' });
        await playsound();
    } else {
        const queuePositionElem = await page.$("#queuePosition");
        const queuePosition = await queuePositionElem.evaluate(el => el.textContent);

        const approximateTimeElem = await page.$("#approximateTime");
        const approximateTime = await approximateTimeElem.evaluate(el => el.textContent);

        console.log(`You are in queue. Position ${queuePosition}. Time: ${approximateTime}.. Waiting and Retrying...`);
        await wait(randomIntFromInterval(RANDOM_MIN, RANDOM_MAX));
        await browser.close();
        return gotonhs();
    }
    await browser.close();
}

(async () => {
    await gotonhs();
})();
const puppeteer = require("puppeteer");
const chromePath = require("./config");
const fs = require("fs");

const TOTAL_PAGE = 10;

const formatProgress = (current) => {
  let percent = (current / TOTAL_PAGE) * 100;
  let done = (current / TOTAL_PAGE * 25);
  let left = 25 - done;
  let str = `当前进度：[${''.padStart(done, '=')}${''.padStart(left, '-')}]   ${percent}%`;
  return str;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: chromePath
  });
  console.log("正常启动");
  try {
    const page = await browser.newPage();
    await page.goto('https://movie.douban.com/top250');
    console.log("页面初次加载完毕");

    for (let i = 1; i <= TOTAL_PAGE; i++) {
      await handleData();

      const pageJump = await page.$(`.next`);
      pageJump.click();
      await page.waitFor(5000);

      console.log(formatProgress(i));
      console.log("页面数据加载完毕");
    }
    await browser.close();
    console.log("结束");

    async function handleData() {
      const list = await page.evaluate(() => {
        const movieList = [];
        let itemList = document.querySelectorAll('.item');
        for (item of itemList) {
          let movie = {
            rank: undefined,
            picture: undefined,
            link: undefined,
            title: undefined,
            rate: undefined
          }

          let rank = item.querySelector('.pic em');
          movie.rank = rank.innerText;

          let img = item.querySelector('.pic img');
          movie.picture = img.src;

          let link = item.querySelector('.info .hd a');
          movie.link = link.href;

          let title = item.querySelector('.info .hd .title');
          movie.title = title.innerText;

          let rate = item.querySelector('.rating_num');
          movie.rate = rate.innerText;

          movieList.push(movie);
        }
        return movieList;
      });
      fs.appendFile('movie.txt', JSON.stringify(list, null, 2), err => {
        if (err) {
          console.log(err)
        }
      });
    }
  } catch (err) {
    console.log(err);
    await browser.close();
  } finally {
    process.exit(0);
  }
}

main();
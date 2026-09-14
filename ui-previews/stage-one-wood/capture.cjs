const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:540,height:900},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:5198/ui-previews/stage-one-wood/index.html');
 await page.addStyleTag({content:'html,body,main{margin:0!important;padding:0!important;width:540px!important;height:900px!important}canvas{width:540px!important;height:900px!important;max-height:none!important;max-width:none!important}'});
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
 await page.screenshot({path:'ui-previews/stage-one-wood/preview.png',clip:{x:0,y:442,width:540,height:416}});
 console.log(JSON.stringify({errors}));await browser.close();
})();

const React = require("react"), RDS = require("react-dom/server"), sharp = require("sharp"), lu = require("react-icons/lu");
(async () => {
  for (const n of ["LuFileText", "LuScale", "LuStar"]) {
    const svg = RDS.renderToStaticMarkup(React.createElement(lu[n], { color: "#222223", size: 512, strokeWidth: 1.6 }));
    await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(`assets/${n}.png`);
  }
  console.log("icons ok");
})();

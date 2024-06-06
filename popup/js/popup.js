import "./sr-icon.js";
import "../../scripts/js/bug-collect.js";
import "../../scripts/js/reset.js";
import "../components/top-bar.js";
import "../components/user-script-list.js";
// @ts-ignore
import baseCss from "../style/base.css" assert { type: "css" };
import dialogCss from "../style/dialog.css" assert { type: "css" };
document.adoptedStyleSheets.push(baseCss, dialogCss);

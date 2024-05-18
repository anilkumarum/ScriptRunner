import "../js/reset.js";
import "./helper/alert-box.js";
import "../../popup/js/sr-icon.js";
import "./plus-floating-btn.js";
import { ScriptEditorDialog } from "./editor-dialog/script-editor-dialog.js";
import { showDeveloperModeDialog } from "../js/register-userscript.js";
// @ts-ignore
import baseCss from "../style/base.css" assert { type: "css" };
// @ts-ignore
import snackbarCss from "../style/snackbar.css" assert { type: "css" };
document.adoptedStyleSheets.push(baseCss, snackbarCss);

try {
	chrome.userScripts;
	chrome.userScripts?.configureWorld({ messaging: true });
	if (location.hash === "#add-script") {
		const scriptEditor = new ScriptEditorDialog();
		document.body.appendChild(scriptEditor);
	}
} catch {
	showDeveloperModeDialog();
}

//TODO check files in directories

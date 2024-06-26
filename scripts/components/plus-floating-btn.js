import { getAllFilHandlesInDir } from "../js/file-handle.js";
import { saveFolderInDb } from "../db/folder.js";
import { ReportBug } from "./helper/report-bug.js";
import { html } from "../js/om.compact.js";
// @ts-ignore
import ftbCss from "../style/floating-btn.css" assert { type: "css" };

export class PlusFloatingBtns extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [ftbCss];
	}

	/** @param {FileSystemFileHandle[]} [fileHandles]*/
	async showScriptEditor(fileHandles) {
		const { ScriptEditorDialog } = await import("./editor-dialog/script-editor-dialog.js");
		const scriptEditor = new ScriptEditorDialog(fileHandles);
		document.body.appendChild(scriptEditor);
		this.shadowRoot.lastElementChild["hidden"] = true;
	}

	addScript() {
		this.showScriptEditor();
	}

	async pickScriptFiles() {
		try {
			const types = [
				{
					description: "JS File",
					accept: { "text/*": [".js", ".mjs"] },
				},
			];
			/**@type {FileSystemFileHandle[]}*/
			// @ts-ignore
			const fileHandles = await showOpenFilePicker({ multiple: true, startIn: "documents", types });
			this.showScriptEditor(fileHandles);
		} catch (error) {
			error.code === 20 || document.body.appendChild(new ReportBug(error));
			if (navigator["brave"] && error.message === "showOpenFilePicker is not defined")
				return chrome.tabs.create({ url: "https://statichome.blob.core.windows.net/note-rail/brave-flag.html" });
			console.error(error);
		}
	}

	async pickFolder() {
		try {
			// @ts-ignore
			const dirHandle = await showDirectoryPicker({ mode: "readwrite", startIn: "documents" });
			const fileHandles = await getAllFilHandlesInDir(dirHandle);
			await saveFolderInDb({ dirHandle, jsFiles: fileHandles });
			this.showScriptEditor(Object.values(fileHandles));
		} catch (error) {
			if (navigator["brave"] && error.message === "showDirectoryPicker is not defined")
				return chrome.tabs.create({ url: "https://statichome.blob.core.windows.net/note-rail/brave-flag.html" });
			error.code === 20 || document.body.appendChild(new ReportBug(error));
			toast(error.message);
		}
	}

	render() {
		return html`<plus-floating-btn><sr-icon ico="plus-thick"></sr-icon></plus-floating-btn>
			<sub-floating-btns hidden>
				<sub-floating-btn>
					<floating-btn @click=${this.addScript.bind(this)}>
						<sr-icon ico="code"></sr-icon>
					</floating-btn>
					<floating-label>${i18n("add_script")}</floating-label>
				</sub-floating-btn>
				<sub-floating-btn>
					<floating-btn @click=${this.pickScriptFiles.bind(this)}>
						<sr-icon ico="js"></sr-icon>
					</floating-btn>
					<floating-label>${i18n("open_file")}</floating-label>
				</sub-floating-btn>
				<sub-floating-btn>
					<floating-btn @click=${this.pickFolder.bind(this)}>
						<sr-icon ico="folder-open"></sr-icon>
					</floating-btn>
					<floating-label>${i18n("open_folder")}</floating-label>
				</sub-floating-btn>
			</sub-floating-btns> `;
	}

	connectedCallback() {
		this.shadowRoot.replaceChildren(this.render());
		//prettier-ignore
		$on(this.shadowRoot.firstElementChild, "click", ()=>this.shadowRoot.lastElementChild["hidden"] = !this.shadowRoot.lastElementChild["hidden"]);
	}
}

customElements.define("plus-floating-btns", PlusFloatingBtns);

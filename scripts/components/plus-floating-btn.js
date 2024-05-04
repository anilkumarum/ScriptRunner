import { saveFolderInDb } from "../db/folder.js";
import { html } from "../js/om.compact.js";
import { getAllFilHandlesInDir } from "../js/util.js";
import { ScriptEditorDialog } from "./editor/script-editor-dialog.js";
// @ts-ignore
import ftbCss from "../style/floating-btn.css" assert { type: "css" };

export class PlusFloatingBtns extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.shadowRoot.adoptedStyleSheets = [ftbCss];
	}

	/** @param {FileSystemFileHandle[]} [fileHandles]*/
	showScriptEditor(fileHandles) {
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
			if (navigator["brave"] && error.message === "showOpenFilePicker is not defined")
				return chrome.tabs.create({ url: "https://statichome.blob.core.windows.net/note-rail/brave-flag.html" });
			console.warn(error.message);
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
					<floating-label>Add Script</floating-label>
				</sub-floating-btn>
				<sub-floating-btn>
					<floating-btn @click=${this.pickScriptFiles.bind(this)}>
						<sr-icon ico="js"></sr-icon>
					</floating-btn>
					<floating-label>Open file</floating-label>
				</sub-floating-btn>
				<sub-floating-btn>
					<floating-btn @click=${this.pickFolder.bind(this)}>
						<sr-icon ico="folder-open"></sr-icon>
					</floating-btn>
					<floating-label>Open Folder</floating-label>
				</sub-floating-btn>
			</sub-floating-btns> `;
	}

	connectedCallback() {
		this.shadowRoot.replaceChildren(this.render());
		//prettier-ignore
		$on(this.shadowRoot.firstElementChild,"click",()=>this.shadowRoot.lastElementChild["hidden"] = !this.shadowRoot.lastElementChild["hidden"]);
	}
}

customElements.define("plus-floating-btns", PlusFloatingBtns);

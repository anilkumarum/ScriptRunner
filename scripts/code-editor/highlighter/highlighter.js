import { BracketNotation } from "../elements/bracket-notation.js";
import { HighlightSpan } from "../elements/highlight-span.js";
import { CodeLine } from "../elements/code-line.js";
import { Tokenizer } from "./Tokenizer.js";

export class ScriptHighlighter {
	constructor() {
		this.tokenizer = new Tokenizer();
		this.setListener();
	}

	/**@public @param {ReadableStream<Uint8Array>} fileStream  */
	async *readAndHighlightLines(fileStream) {
		const stream = fileStream.pipeThrough(new TextDecoderStream());
		const reader = stream.getReader();
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				this.contentFrag = new DocumentFragment();
				yield this.tokenizer.parseUserScriptMetaData(value);
				this.insertNewLine();
				this.tokenizer.consume(value);
				yield this.contentFrag;
			}
		} catch (err) {
			console.error(err);
		} finally {
			reader.releaseLock();
		}
	}

	/**@public @param {string} codeContent*/
	highlightLines(codeContent) {
		this.contentFrag = new DocumentFragment();
		this.insertNewLine();
		const userScriptProps = this.tokenizer.parseUserScriptMetaData(codeContent);
		this.tokenizer.consume(codeContent);
		return { userScriptProps, contentFrag: this.contentFrag };
	}

	insertNewLine(data = "") {
		this.currentLine = new CodeLine(data, false);
		this.contentFrag.appendChild(this.currentLine);
	}

	insertText(text) {
		this.currentLine.appendChild(new Text(text));
	}

	insertHighlightText(text, className) {
		this.currentLine.appendChild(new HighlightSpan(text, className));
	}

	insertBracket(bracket) {
		console.log();
		this.currentLine.appendChild(new BracketNotation(bracket));
	}

	setListener() {
		this.tokenizer.on("newline", this.insertNewLine.bind(this));
		this.tokenizer.on("text", this.insertText.bind(this));
		this.tokenizer.on("highlighttext", this.insertHighlightText.bind(this));
		this.tokenizer.on("bracket", this.insertBracket.bind(this));
	}
}

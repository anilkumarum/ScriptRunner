import { getUserScriptProps } from "../../js/parseUserScript.js";
import { CharCode, ClassNames, State, CssClasses, globalKeys, PrevWordClasses } from "../utils/enums.js";
import { EventEmitter } from "../utils/EventEmitter.js";

export class Tokenizer extends EventEmitter {
	constructor() {
		super();
	}
	index = -1;
	sectionStart = 0;
	prevWord = "";
	state;

	skipUptoSequence(sequence) {
		const seqLength = sequence.length;
		const _sequence = [];

		while (++this.index < this.size) {
			const _count = _sequence.length;
			if (seqLength === _count) break;

			const code = this.buffer[this.index];
			if (sequence[_count] === code) _sequence.push(code);
			else _sequence.length = 0;
		}
	}

	fastForwardTo(char) {
		while (this.buffer[++this.index] !== char) {
			if (this.index === this.size || this.buffer[this.index] === CharCode.LineBreak) break;
		}
		this.buffer[this.index - 1] === CharCode.BackSlash && this.fastForwardTo(char);
	}

	trimWhitespace(data) {
		if (!data.startsWith(" ") && !data.startsWith("\t")) return data;
		const size = data.length;
		//trim left
		let startI = 0;
		while (++startI < size) if (data[startI] !== CharCode.Space && data[startI] !== CharCode.Tab) break;
		data.slice(0, startI) && this.emit("text", data.slice(0, startI));
		return data.slice(startI);
	}

	sendTextData() {
		const data = this.buffer.slice(this.sectionStart, this.index);
		data && this.emit("text", data);
		this.sectionStart = this.index;
	}

	stateInBlockComment() {
		this.skipUptoSequence("*/");
		const word = this.buffer.slice(this.sectionStart, this.index);
		const className = ClassNames.Comment;
		this.emit("highlighttext", word, className);
		this.sectionStart = this.index;
		this.buffer[this.index] === CharCode.LineBreak && this.onLineEnd();
	}

	stateInLineComment() {
		this.fastForwardTo(CharCode.LineBreak);
		const word = this.buffer.slice(this.sectionStart, this.index + 1);
		const className = ClassNames.Comment;
		this.emit("highlighttext", word, className);
		this.emit("newline");
		this.sectionStart = this.index + 1; //+1 skip \n
	}

	stateInString(char) {
		this.sendTextData();
		this.fastForwardTo(char);
		const word = this.buffer.slice(this.sectionStart, this.index + 1);
		const className = ClassNames.String;
		this.emit("highlighttext", word, className);
		this.sectionStart = this.index + 1;
		this.state &&= null;
	}

	stateInTemplate(char) {
		this.stateInString(char); //temp
	}

	onDot(char) {
		const word = this.buffer.slice(this.sectionStart, this.index);
		let className;
		if (this.state === State.InPropChain) className = ClassNames.PropChain;
		else {
			className = ClassNames.ObjName;
			this.state = State.InPropChain;
		}
		this.emit("highlighttext", word, className);
		this.emit("text", char);
		this.sectionStart = this.index + 1; //+1 skip .
		this.state = State.InPropChain;
	}

	onColon(char) {
		const word = this.buffer.slice(this.sectionStart, this.index);
		if (word) {
			const className = ClassNames.PropKey;
			this.emit("highlighttext", word, className);
		}
		this.emit("text", char);
		this.sectionStart = this.index + 1; //+1 skip :
		this.state = State.InPropChain;
	}

	onCloseSqrBracket(char) {
		const word = this.buffer.slice(this.sectionStart, this.index);
		if (word) {
			const className = ClassNames.ObjName;
			this.emit("highlighttext", word, className);
		}
		this.emit("bracket", char);
		this.sectionStart = this.index + 1; //+1 skip ]
	}

	beforeOpenSqrBracket(char) {
		const word = this.buffer.slice(this.sectionStart, this.index);
		if (word) {
			let className;
			if (this.state === State.InPropChain) (className = ClassNames.PropChain), (this.state = null);
			this.emit("highlighttext", word, className);
		}
		this.emit("bracket", char);
		this.sectionStart = this.index + 1; //+1 skip [
	}

	onCloseCurlyBracket(char) {
		const word = this.buffer.slice(this.sectionStart, this.index);
		if (word) {
			const className = ClassNames.MutableVar;
			this.emit("highlighttext", word, className);
		}
		this.state = null;
		this.emit("bracket", char);
		this.sectionStart = this.index + 1; //+1 skip }
	}

	beforeOpenCurlyBracket(char) {
		this.state = null;
		this.emit("bracket", char);
		this.sectionStart = this.index + 1; //+1 skip {
	}

	onCloseParentheses(char) {
		const word = this.buffer.slice(this.sectionStart, this.index);
		if (word) {
			const className = ClassNames.MutableVar;
			this.emit("highlighttext", word, className);
		}
		this.emit("bracket", char);
		this.sectionStart = this.index + 1; //+1 skip (
		this.state = null;
	}

	beforeOpenParentheses(char) {
		const word = this.trimWhitespace(this.buffer.slice(this.sectionStart, this.index));
		if (word) {
			const className = globalKeys.has(word)
				? "global-key"
				: word === "constructor"
				? ClassNames.Reserved
				: ClassNames.FuncName;
			this.emit("highlighttext", word, className);
		}

		this.emit("bracket", char);
		this.sectionStart = this.index + 1; //+1 skip (
		this.state = State.InFuncParam;
	}

	onWordEnd(char) {
		const word = this.trimWhitespace(this.buffer.slice(this.sectionStart, this.index));
		if (word) {
			let className;
			for (const key in CssClasses) CssClasses[key].has(word) && (className = key);
			className ??= PrevWordClasses[this.prevWord];
			if (!className && this.state) (className = this.state), (this.state = null);
			className ? this.emit("highlighttext", word, className) : this.emit("text", word);
		}
		this.emit("text", char);
		this.sectionStart = this.index + 1; //+1 skip \s
		this.prevWord = word;
	}

	onLineEnd() {
		const word = this.buffer.slice(this.sectionStart, this.index);
		let className;
		for (const key in CssClasses) CssClasses[key].has(word) && (className = key);
		className ??= PrevWordClasses[this.prevWord];
		if (!className && this.state) (className = this.state), (this.state = null);
		className ? this.emit("highlighttext", word, className) : this.emit("text", word);
		this.prevWord = null;
		this.emit("newline");
		this.sectionStart = this.index + 1;
	}

	symbolChars = {
		[CharCode.LineBreak]: this.onLineEnd.bind(this),
		[CharCode.Space]: this.onWordEnd.bind(this),
		[CharCode.Comma]: this.onWordEnd.bind(this),
		[CharCode.Dot]: this.onDot.bind(this),
		[CharCode.Colon]: this.onColon.bind(this),
		[CharCode.OpeningParentheses]: this.beforeOpenParentheses.bind(this),
		[CharCode.ClosingParentheses]: this.onCloseParentheses.bind(this),
		[CharCode.OpeningCurlyBracket]: this.beforeOpenCurlyBracket.bind(this),
		[CharCode.ClosingCurlyBracket]: this.onCloseCurlyBracket.bind(this),
		[CharCode.OpeningSqrBracket]: this.beforeOpenSqrBracket.bind(this),
		[CharCode.ClosingSqrBracket]: this.onCloseSqrBracket.bind(this),
		[CharCode.SingleQuote]: this.stateInString.bind(this),
		[CharCode.DoubleQuote]: this.stateInString.bind(this),
		[CharCode.Backtick]: this.stateInTemplate.bind(this),
		[CharCode.Slash]: (char) => {
			const nxtChar = this.buffer[this.index + 1];
			nxtChar === CharCode.Slash
				? this.stateInLineComment()
				: nxtChar === CharCode.Asterisk && this.stateInBlockComment();
		},
		[CharCode.BackSlash]: (char) => (this.sectionStart = this.index++),
	};

	/**@public  @param {string} buffer*/
	consume(buffer) {
		this.buffer = buffer;
		this.size = this.buffer.length;

		while (++this.index < buffer.length) {
			const char = buffer[this.index];
			this.symbolChars[char]?.(char);
		}
		this.onWordEnd("");
	}

	/** @param {string} buffer*/
	parseUserScriptMetaData(buffer) {
		const userScriptRx = new RegExp(/==UserScript==(.*)==\/UserScript==/, "gs");
		const scriptInfo = userScriptRx.exec(buffer);
		if (!scriptInfo) return;
		const userScriptProps = getUserScriptProps(scriptInfo[1]);
		this.sectionStart = this.index = scriptInfo.index + scriptInfo[0].length;
		return userScriptProps;
	}
}

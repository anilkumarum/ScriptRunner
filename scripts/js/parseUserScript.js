/**@param {string} codeText*/
export function parseUserScriptMeta(codeText) {
	const userScriptRx = new RegExp(/==UserScript==(.*)==\/UserScript==/, "gs");
	const propRx = new RegExp(/@([^\s]+) (.*)$/, "gm");
	const scriptInfo = userScriptRx.exec(codeText);
	if (!scriptInfo) return { code: codeText.trim() };

	const propsText = scriptInfo[1];
	const propsIterator = propsText.matchAll(propRx);
	const userScriptProps = {
		name: null,
		description: null,
		version: null,
		author: null,
		icon: null,
		runAt: null,
		matches: [],
		excludeMatches: [],
	};

	for (const match of propsIterator) {
		const key = match[1];
		const value = match[2].trim();
		if (key === "match") userScriptProps.matches.push(value);
		else if (key === "exclude") userScriptProps.excludeMatches.push(value);
		else if (key === "run_at") userScriptProps.runAt = value;
		else if (userScriptProps[key] !== undefined) userScriptProps[key] = value;
	}
	const codeStartIdx = scriptInfo.index + scriptInfo[0].length;
	const code = codeText.slice(codeStartIdx).trim();
	return { code, userScriptProps };
}

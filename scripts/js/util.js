/**@param {FileSystemDirectoryHandle} dirHandle*/
export async function getAllFilHandlesInDir(dirHandle) {
	/**@type {Object<string,FileSystemFileHandle>} */
	const fileHandles = {};
	const promises = [];
	/**@param {FileSystemDirectoryHandle} dirHandle, * @param {string} dirPath*/
	async function addNotesFromDir(dirHandle, dirPath) {
		// @ts-ignore
		for await (const entity of dirHandle.values()) {
			if (entity.kind === "directory") promises.push(addNotesFromDir(entity, entity.name + "/"));
			else if (entity.name.endsWith(".js")) fileHandles[dirPath + entity.name] = entity;
		}
	}
	promises.push(addNotesFromDir(dirHandle, ""));
	await Promise.all(promises);
	await new Promise((r) => setTimeout(r, 1000));
	return fileHandles;
}

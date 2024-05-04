import { Store, connect } from "./db.js";

export async function getAllFolders() {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.Folders, "readonly").objectStore(Store.Folders);
			const fetchQuery = store.getAll();
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export async function getFolder(foldername) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.Folders, "readonly").objectStore(Store.Folders);
			const fetchQuery = store.get(foldername);
			fetchQuery.onsuccess = ({ target }) => resolve(target["result"]);
			fetchQuery.onerror = (e) => reject(e);
			db.close();
		});
	});
}

/**@param {{dirHandle:FileSystemDirectoryHandle,jsFiles:Object<string,FileSystemFileHandle>}} dirHandleData*/
export async function saveFolderInDb(dirHandleData) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.Folders, "readwrite").objectStore(Store.Folders);
			//TODO if exist then add number at end
			const insertTask = store.add(dirHandleData, dirHandleData.dirHandle.name);
			insertTask.onsuccess = (e) => resolve(e);
			insertTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

export async function removeFolder(foldername) {
	return new Promise((resolve, reject) => {
		connect().then((db) => {
			const store = db.transaction(Store.Folders, "readonly").objectStore(Store.Folders);
			const deleteTask = store.delete(foldername);
			deleteTask.onsuccess = ({ target }) => resolve(target["result"]);
			deleteTask.onerror = (e) => reject(e);
			db.close();
		});
	});
}

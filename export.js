/**	Perform standard point buy method for character abilities.
 */

import {ExportSys} from "./exportSys.js";
import {ExportSwade} from "./exportSwade.js";
import {ExportDnD5e} from "./exportDnD5e.js";
 
export class ExportJournal {

	createExporter(systemId) {
		switch (systemId) {
		case 'swade':
			this.sysExporter = new ExportSwade(this);
			break;
		case 'dnd5e':
			this.sysExporter = new ExportDnD5e(this);
			break;
		default:
			this.sysExporter = new ExportSys(this);
			break;
		}
	}

	saveDataToFile(content, contentType, fileName) {
	  const a = document.createElement('a');
	  const file = new Blob([content], { type: contentType });

	  a.href = URL.createObjectURL(file);
	  a.download = fileName;
	  a.click();

	  URL.revokeObjectURL(a.href);
	}

	htmlEntities(str) {
		return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	header = '';
	footer = '';
	cssSection = '';
	pages = "";
	replaceUUIDs = game.settings.get('export-journal', 'replaceUUIDs');
	saveHTML = game.settings.get('export-journal', 'savehtml');
	bodyDiv = '';
	titleDiv = '';
	pageDiv = '';
	tab = null;
	
	sysExporter = null;

	async init(title) {
		
		this.header = 
`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>${this.htmlEntities(title)}</title>
	<STYLE type="text/css" media="screen,print">
	<!--CSS-->
	</STYLE>
</head>
<body>
`;

		this.footer =
`</body>
</html>
`;	

		let css = game.settings.get('export-journal', 'css');

		let response = await fetch(css);
		if (!response.ok) {
			ui.notifications.warn(`Unable to read CSS file ${css}`);
			return false;
		}

		this.cssSection = await response.text();

		let search = this.cssSection.match(/PAGEDIV=([A-Za-z0-9_]+)/);
		if (search && search.length > 1)
			this.pageDiv = search[1];
		search = this.cssSection.match(/TITLEDIV=([A-Za-z0-9_]+)/);
		if (search && search.length > 1)
			this.titleDiv = search[1];
		search = this.cssSection.match(/BODYDIV=([A-Za-z0-9_]+)/);
		if (search && search.length > 1)
			this.bodyDiv = search[1];
		
		return true;
	}
	
	doReplacements(content) {
		if (!content)
			return "";
		if (this.replaceUUIDs) {
			//content = content.replaceAll(/@[A-Za-z0-9]+\[[^\]]+\]{([^}]+)}/g, '<b>$1</b>');
			content = content.replaceAll(/@[A-Za-z0-9]+\[[^\]]+\]{([^}]+)}/g, function (x) {
				let search = x.match(/@([A-Za-z0-9]+)\[([^\]]+)\]{([^}]+)}/);
				if (search[1] == 'UUID') {
					let ref = search[2].split('.');
					return `<a href="#${ref[ref.length-1]}">${search[3]}</a>`;
				} else if (search[1] == 'OpenCompendium') {
					return `<a href="#${search[2]}">${search[3]}</a>`;
				}
				return `<b>${search[3]}</b>`;
			});			
			//content = content.replaceAll(/@OpenCompendium\[[^\]]+\]{([^}]+)}/g, '<b>$1</b>');
		}
		return content;
	}
	
	async write(text) {
		this.pages += text;
	}

	async writePages(journal, depth) {
		let pp = journal.pages.filter(() => true);

		if (journal.name) {
			if (depth == 1)
				this.write(`<div class="docheader" id="${journal._id}"><h1 class="docheader">` + this.htmlEntities(journal.name) + `</h1></div>\n`);
			else
				this.write(`<h${depth} id="${journal._id}">` + this.htmlEntities(journal.name) + `</h${depth}>\n`);
		}
		
		pp.sort((a, b) => a.sort - b.sort);

		if (depth == 1 && this.bodyDiv)
			this.write(`<div class="${this.bodyDiv}">\n`);

		for (var page of pp) {
			if (page.title.show) {
				if (this.titleDiv)
					this.write(`<div class="${this.titleDiv}">`);
				this.write(`<h1 id="${page._id}">` + this.htmlEntities(page.name) + `</h1>`);
				if (this.titleDiv)
					this.write(`</div>\n`);
			}
			let content = page.text.content;
			if (content) {
				if (this.pageDiv)
					this.write(`<div class="${this.pageDiv}">\n`);
				this.write(this.doReplacements(content));
				if (this.pageDiv)
					this.write(`</div>\n`);
			}
		}

		if (depth == 1 && this.bodyDiv)
			this.write(`</div>\n`);

		return true;
	}
	
	async writeFile(fileName) {
		let fileContent = this.header.replace("<!--CSS-->", this.cssSection) + this.pages + this.footer;
		if (this.saveHTML)
			this.saveDataToFile(fileContent, "text/html", fileName + '.html');
		else {
			this.tab = window.open('about:blank', '_blank');
			if (!this.tab) {
				ui.notifications.warn('Unable to open tab in browser');
				return false;
			}
			await this.tab.document.write(fileContent);
			await this.tab.document.close();
		}
		return true;
	}
	
	writeData(item, arr) {
		for (let  i = 0; i < arr.length; i++) {
			const elt = arr[i];
			if (item.system && item.system[elt[0]]) {
				this.write(`<p class="itemdata">${elt[1]}: ${item.system[elt[0]]}</p>\n`);
			}
		}
	}

	systemFields = [
		['armor', 'Armor'],
		['damage', 'Damage'],
		['rank', 'Rank'],
		['range', 'Range'],
		['rof', 'RoF'],
		['ap', 'AP'],
		['parry', 'Parry'],
		['pp', 'Power Points'],
		['duration', 'Duration'],
		['arcane', 'Arcane']
	];

	async writeItem(item, depth) {
		if (this.sysExporter == null || this.sysExporter.systemId != item._stats.systemId) {
			this.createExporter(item._stats.systemId);
		}
		this.sysExporter.exportItem(item, depth);
	}
	
	async exportIt(journal) {
		if (!await this.init(journal.name))
			return false;
		await this.writePages(journal, 1);
		await this.writeFile(journal.name);
		
		return true;
	}
	
	async exportActor(actor, depth) {
		if (this.sysExporter == null || this.sysExporter.systemId != actor._stats.systemId) {
			this.createExporter(actor._stats.systemId);
		}
		
		this.sysExporter.exportActor(actor, depth);
	}
	
	async exportTable(table, depth) {
		const header = `h${depth}`;
		if (table.name)
			this.write(`<${header} id="${table._id}">` + this.htmlEntities(table.name) + `</${header}>\n`);
		if (table.description) {
			this.write(`<p>` + this.doReplacements(table.description) + "</p>\n");
		}
		this.write("<table>\n");
		for (const entry of table.results) {
			this.write("<tr>\n");
			let range = entry.range[0];
			if (entry.range[0] != entry.range[1])
				range += '-' + entry.range[1];
			this.write(`<td style="width: 20%">${range}</td><td style="font-weight: bold; text-align: left;">${this.htmlEntities(entry.name)}</td>\n`);
			if (entry.description) {
				this.write("</tr>\n");
				this.write("<tr>\n");
				this.write(`<td style="width: 20%"></td><td style="text-align: left;">${this.doReplacements(entry.description)}</td>\n`);
			}
			this.write("</tr>\n");
		}
		this.write("</table>\n");
	}

	async exportDoc(doc, type, depth) {
		switch (type) {
		case 'Item':
			await this.writeItem(doc, depth);
			break;
		case 'JournalEntry':
			await this.writePages(doc, depth);
			break
		case 'Actor':
			await this.exportActor(doc, depth);
			break;
		case 'RollTable':
			await this.exportTable(doc, depth);
			break;
		case 'Scene':
		case 'Macro':
		case 'Adventure':
		default:
			break;
		}
	}
	
	async exportCompendium(pack) {
		let isJournal = pack.metadata.type == "JournalEntry";
		switch (pack.metadata.type) {
		case 'Macro':
		case 'Scene':
		case 'Adventure':
			return;
		}

		if (!isJournal) {
			this.write(`<h1 id="${pack.metadata.id}">${this.htmlEntities(pack.title)}</h1>\n`);

			if (this.bodyDiv)
				this.write(`<div class="${this.bodyDiv}">\n`);
		}

		let type = pack.metadata.type;

		const documents = await pack.getDocuments();
		let entries = [];
		for (const doc of documents)
			entries.push(doc);

		entries.sort(function(a, b) {
			return a.name.localeCompare(b.name);
		});
		
		for (const doc of entries) {
			if (!doc.folder) {
				await this.exportDoc(doc, type, isJournal ? 1 : 2);
			}
		}
		
		await this.compendiumFolders(pack.folders, documents, 1);

		if (!isJournal) {
			if (this.bodyDiv)
				this.write(`</div>\n`);
		}
	}
	
	async compendiumFolders(folders, docs, depth) {
		for (const folder of folders) {
			if (folder instanceof Folder && folder.depth != undefined && folder.depth == depth) {
				if (depth > 1)
					this.write(`<h${depth}>${this.htmlEntities(folder.name)}</h${depth}>\n`);
				
				let contents = [];
				for (const entry of folder.contents)
					contents.push(entry)
				
				if (folder.sorting == 'm') {
					contents.sort(function(a, b) {
						return a.sort - b.sort;
					});
				} else {
					contents.sort(function(a, b) {
						return a.name.localeCompare(b.name);
					});
				}
				
				for (const item of contents) {
					const doc = docs.find(({ uuid }) => uuid === item.uuid);
					if (doc) {
						let type = 'Item';
						if (doc instanceof Actor)
							type = 'Actor';
						else if (doc instanceof JournalEntry)
							type = 'JournalEntry';
						else if (!doc instanceof Item)
							type = 'DoNotProcess';
						await this.exportDoc(doc, type, depth+1);
					}
				}
				let children = folder.children;
				if (children) {
					let childFolders = [];
					for (const child of children) {
						childFolders.push(child.folder);
					}
					await this.compendiumFolders(childFolders, docs, depth + 1);
				}
			}
		}
	}
	
	
	finish() {
		//console.log(`export-journal | Finished`);
	}

	static {
		//console.log("export-journal | loaded.");

		Hooks.on("init", function() {
		  //console.log("export-journal | initialized.");
		});

		Hooks.on("ready", function() {
		  //console.log("export-journal | ready to accept game data.");
		});
	}
}


/*
 * Create the configuration settings.
 */
Hooks.once('init', async function () {
	
});

function insertJournalHeaderButtons(jes, buttons) {
  let journal = jes.document;
  buttons.unshift({
    label: "Export to HTML",
    icon: "fas fa-text",
    class: "export-journal-button",
    onClick: async (event) => {
		let ej = null;
		try {
			ej = new ExportJournal();
			if (!await ej.exportIt(journal))
				return false;
		} catch (msg) {
			ui.notifications.warn(msg);
		} finally {
			if (ej)
				ej.finish();
		}

      }
  });
}

Hooks.on("getHeaderControlsJournalEntrySheet", insertJournalHeaderButtons);

/*
 * Create the configuration settings.
 */
Hooks.once('init', async function () {
	let defFilter = 'modules/export-journal/css/' + game.system.id + '.txt';
	game.settings.register('export-journal', 'css', {
	  name: 'CSS file',
	  hint: 'Name of CSS file. Must be placed in data/modules/export-journal/css folder.',
	  scope: 'client',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: String,       // Number, Boolean, String, Object
	  default: defFilter,
	  filePicker: true,
	});
	game.settings.register('export-journal', 'replaceUUIDs', {
	  name: 'Replace UUIDs',
	  hint: 'Replace UUIDs with the text inside the braces: @UUID[...]{...}.',
	  scope: 'client',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Boolean,       // Number, Boolean, String, Object
	  default: true
	});
	game.settings.register('export-journal', 'savehtml', {
	  name: 'Save as HTML file',
	  hint: "If checked, the output is saved as an HTML file. Otherwise it is written to a new browser tab. A tab can display images stored in the Foundry file system, where an HTML file will show a missing link icon.",
	  scope: 'client',     // "world" = sync to db, "client" = local storage
	  config: true,       // false if you dont want it to show in module config
	  type: Boolean,       // Number, Boolean, String, Object
	  default: true
	});

});


Hooks.on("getJournalDirectoryEntryContext", (html, entries) => {
	entries.push({
		name: "Export to HTML",
		icon: '<i class="fas fa-file-text"></i>',
		condition: li => {
			return game.user.isGM;
		},
		callback: async (li) => {
			let ej;
			try {
				const journal = game.journal.get(li.data("documentId"));
				ej = new ExportJournal();
				if (!await ej.exportIt(journal))
					return false;
			} catch (msg) {
				ui.notifications.warn(msg);
			} finally {
				if (ej)
					ej.finish();
			}

		}
	});
});


Hooks.on("getJournalDirectoryFolderContext", (journal, entries) => {
	entries.push({
		name: "Export to HTML",
		icon: '<i class="fas fa-file-text"></i>',
		condition: li => {
			return game.user.isGM;
		},
		callback: async (html) => {
			let ej;
			try {
				let attr = html[0].parentNode.attributes;
				const id = attr["data-folder-id"].nodeValue;
				ej = new ExportJournal();
				if (!await ej.exportIt(id))
					return false;
			} catch (msg) {
				ui.notifications.warn(msg);
			} finally {
				if (ej)
					ej.finish();
			}

		}
	});

});

function documentContextOptions(app, options) {
    options.push({
        name: `Export to HTML`,
        icon: '<i class="fas fa-text"></i>',
        condition: () => game.user.isGM,
        callback: async (li) =>  {
            const entry = app.collection.get(li.dataset.entryId);
            if (entry) {
				let ej;
				try {
					ej = new ExportJournal();
					if (!await ej.exportIt(entry))
						return false;
				} catch (msg) {
					ui.notifications.warn(msg);
				} finally {
					if (ej)
						ej.finish();
				}
			}
        },
    });
}

const hooknames = [
    "getJournalEntryContextOptions"
];

for (const hook of hooknames)
    Hooks.on(hook, documentContextOptions);


async function procFolder(ej, folder, depth) {
	function sortArr(sorting, sorted) {
		if (folder.sorting == 'm') {
			sorted.sort(function(a, b) {
				return a.sort - b.sort;
			});
		} else {
			sorted.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});
		}
	}

	ej.write(`<h${depth}>${ej.htmlEntities(folder.name)}</h${depth}>\n`);
	if (depth == 1 && ej.bodyDiv)
		ej.write(`<div class="${ej.bodyDiv}">\n`);

	let sorted = [];
    for (const f of folder.getSubfolders(false))
		sorted.push(f);
	sortArr(folder.sorting, sorted);

	for (const f of sorted)
        await procFolder(ej, f, depth+1);

	sorted = [];

    for (const entry of folder.contents)
		sorted.push(entry);
	sortArr(folder.sorting, sorted);

	for (const entry of sorted) {
		if (entry instanceof JournalEntry)
			await ej.writePages(entry, depth+1);
		else if (entry instanceof Item)
			await ej.writeItem(entry, depth+1);
		else if (entry instanceof Actor)
			await ej.exportActor(entry, depth+1)
		else if (entry instanceof RollTable)
			await ej.exportTable(entry, depth+1);
    }
	if (depth == 1 && ej.bodyDiv)
		ej.write(`</div>\n`);
	
}

Hooks.on('getFolderContextOptions', (app, options) => {
	switch (app.options.id) {
	case 'journal':
	case 'items':
		break;
	default:
		break;
	}

    options.push({
        name: `Export to HTML`,
        icon: '<i class="fas fa-text"></i>',
        condition: () => game.user.isGM,
        callback: async header => {
            const folder = await fromUuid(header.closest(".directory-item").dataset.uuid);
            if (folder) {
				let ej = new ExportJournal();
				try {
					await ej.init(folder.name);
					if (folder.type == 'Compendium') {
						let packArr = [];
						for (const pack of game.packs.filter(pack => pack.folder === folder))
							packArr.push(pack);
						if (folder.sorting == 'm') {
							packArr.sort(function(a, b) {
								return a.sort - b.sort;
							});
						} else {
							packArr.sort(function(a, b) {
								return a.metadata.label.localeCompare(b.metadata.label);
							});
						}
						for (let i = 0; i < packArr.length; i++)
							await ej.exportCompendium(packArr[i]);
						// FIX: it's not processing child folders of this folder.
						//await procFolder(ej, folder, 2);
						for (const f of folder.children) {
							for (const e of f.entries)
								await ej.exportCompendium(e);
						}
					} else {
						await procFolder(ej, folder, 1);
					}
					await ej.writeFile(folder.name);
				} catch (msg) {
					ui.notifications.warn(msg);
				} finally {
					if (ej)
						ej.finish();
				}
			}
        },
    });
})

Hooks.on('getCompendiumContextOptions', (app, options) => {
    options.push({
        name: `Export to HTML`,
        icon: '<i class="fas fa-text"></i>',
        condition: () => game.user.isGM,
        callback: async (li) => {
            const pack = game.packs.get(li.dataset.pack);
            if (pack) {
				let ej = new ExportJournal();
				try {
					await ej.init(pack.title);
					await ej.exportCompendium(pack);
					await ej.writeFile(pack.title);
				} catch (msg) {
					ui.notifications.warn(msg);
				} finally {
					if (ej)
						ej.finish();
				}
			}
			
        },
    });
})

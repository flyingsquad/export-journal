/**	Perform standard point buy method for character abilities.
 */
 
export class ExportJournal {
	saveDataToFile(content, contentType, fileName) {
	  const a = document.createElement('a');
	  const file = new Blob([content], { type: contentType });

	  a.href = URL.createObjectURL(file);
	  a.download = fileName;
	  a.click();

	  URL.revokeObjectURL(a.href);
	}

	async exportIt(journal) {
		function htmlEntities(str) {
			return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		}

		let header = 
`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>${htmlEntities(journal.name)}</title>
	<STYLE type="text/css" media="screen,print"><!--CSS--></STYLE>
</head>
<body>
`;

		let footer = `
</body>
</html>
`;

		let css = game.settings.get('export-journal', 'css');

		let response = await fetch(css);
		if (!response.ok) {
			ui.notifications.warn(`Unable to read CSS file ${css}`);
			return false;
		}
	
		let cssSection = await response.text();

		let pages = "";
		let pp = journal.pages.filter(() => true);
		
		pp.sort((a, b) => a.sort - b.sort);

		for (var page of pp) {
			if (page.title.show)
				pages += `<div class="title"><h1>` + htmlEntities(page.name) + `</h1></div>`;
			pages += `<div class="body">`;
			pages += page.text.content;
			pages += `</div>`;
		}
		let fileContent = header.replace("<!--CSS-->", cssSection) + pages + footer;
		saveDataToFile(fileContent, "text/html", journal.name + '.html');
	}
	
	finish() {
		console.log(`export-journal | Finished`);
	}

	static {
		console.log("export-journal | loaded.");

		Hooks.on("init", function() {
		  console.log("export-journal | initialized.");
		});

		Hooks.on("ready", function() {
		  console.log("sexport-journal | ready to accept game data.");
		});
	}
}


/*
 * Create the configuration settings.
 */
Hooks.once('init', async function () {
	
});

function insertJournalHeaderButtons(actorSheet, buttons) {
  let journal = actorSheet.object;
  buttons.unshift({
    label: "Export",
    icon: "fas fa-text",
    class: "export-journal-button",
    onclick: async () => {
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

Hooks.on("getJournalSheetHeaderButtons", insertJournalHeaderButtons);

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

});
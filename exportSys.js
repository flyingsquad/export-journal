// Base class for exporting actor to HTML.

export class ExportSys {
	ej = null;
	systemId = null;

	constructor(ej) {
		this.ej = ej;
	}

	itemText = null;
	
	writeItext(txt) {
		this.itemText += txt;
	}

	write(txt) {
		this.ej.write(txt);
	}

	subsection(hdr, txt, depth) {
		if (!txt)
			return;
		this.ej.write(`<h${depth+1}>${this.ej.doReplacements(hdr)}</h${depth+1}>\n`);
		this.ej.write(this.ej.doReplacements(txt) + "\n");
	}

	getItemText(item, depth) {
		this.itemText = "";
		const header = `h${depth}`;
		if (item.name)
			this.writeItext(`<${header} id="${item._id}">` + this.ej.htmlEntities(item.name) + `</${header}>\n`);
		return this.itemText;
	}

	exportItem(item, depth) {
		return this.getItemText(item, depth);
	}

	exportActor(actor, depth) {
		this.write(`<h${depth} id="${actor._id}">${this.ej.htmlEntities(actor.name)}</h${depth}>\n`);
	}

}

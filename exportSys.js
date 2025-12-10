// Base class for exporting actor to HTML.

export class ExportSys {
	ej = null;
	systemId = null;

	constructor(ej) {
		this.ej = ej;
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
	
	exportItem(item, depth) {
		const header = `h${depth}`;
		if (item.name)
			this.write(`<${header} id="${item._id}">` + this.ej.htmlEntities(item.name) + `</${header}>\n`);
	}

	exportActor(actor, depth) {
		this.write(`<h${depth} id="${actor._id}">${this.ej.htmlEntities(actor.name)}</h${depth}>\n`);
	}

}

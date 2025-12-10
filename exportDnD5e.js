import {ExportSys} from "./exportSys.js";

export class ExportDnD5e extends ExportSys {
	
	constructor(ej) {
		super(ej);
	}

	exportItem(item, depth) {
		const header = `h${depth}`;
		if (item.name)
			this.write(`<${header} id="${item._id}">` + this.ej.htmlEntities(item.name) + `</${header}>\n`);
		if (item.system?.description?.value)
			this.subsection('Description', item.system.description.value, depth+1);
		
	}

	exportActor(actor, depth) {
		function showAbil(ex, abil) {
			return `${abil.value} (${abil.mod})`;
		}
		this.write(`<h${depth} id="${actor._id}">${this.ej.htmlEntities(actor.name)}</h${depth}>\n`);
		if (actor.img)
			this.write(`<p><img class="img" src="${actor.img}" alt="${actor.name}"></p>\n`);

		if (actor.system.details) {
			this.subsection('Appearance', actor.system.details.appearance, depth+1);
			if (actor.system.details.biography)
				this.subsection('Biography', actor.system.details?.biography.value, depth+1);
			this.subsection('Notes', actor.system.details.notes, depth+1);
		}

		if (actor.type == 'character' || actor.type == 'npc') {
			this.write(
`<table>
    <thead>
        <tr>
            <th id="str" style="text-align:center">STR</th>
            <th id="dex" style="text-align:center">DEX</th>
            <th id="con" style="text-align:center">CON</th>
            <th id="int" style="text-align:center">INT</th>
            <th id="wis" style="text-align:center">WIS</th>
            <th id="cha" style="text-align:center">CHA</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="text-align:center">${showAbil(this, actor.system.abilities.str)}</td>
            <td style="text-align:center">${showAbil(this, actor.system.abilities.dex)}</td>
            <td style="text-align:center">${showAbil(this, actor.system.abilities.con)}</td>
            <td style="text-align:center">${showAbil(this, actor.system.abilities.int)}</td>
            <td style="text-align:center">${showAbil(this, actor.system.abilities.wis)}</td>
            <td style="text-align:center">${showAbil(this, actor.system.abilities.cha)}</td>
        </tr>
    </tbody>
</table>`);
		}
	}
	
}
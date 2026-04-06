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

	listItems(actor, header, types) {
		let string = '';
		let items = actor.items.contents.filter(i => {
			const result = types.includes(i.type);
			return result;
		});
		for (const i of items) {
			if (string)
				string += ', ';
			string += i.name;
		}
		if (string)
			this.write(`<p><b>${header}</b> ${string}</p>\n`);
	}

	exportActor(actor, depth) {
		function firstUpper(str) {
			return `${str[0].toUpperCase()}${str.slice(1)}`
		}
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
			let skills = '';
			for (const skill in actor.system.skills) {
				const s = actor.system.skills[skill];
				if (s.value == 0)
					continue;
				if (skills)
					skills += ', ';
				const fullName = game.i18n.localize(`DND5E.Skill${firstUpper(skill)}`);
				skills += `${fullName}: ${s.value > 0 ? '+' : ''}${s.value}`;
			}
			if (skills)
				this.write(`<p><b>Skills:</b> ${skills}</p>\n`);
			let tools = '';
			for (const tool in actor.system.tools) {
				const t = actor.system.tools[tool];
				if (t.value == 0)
					continue;
				if (tools)
					tools += ', ';
				let key = `DND5E.Tool${firstUpper(tool)}}`;
				let fullName = game.i18n.localize(key);
				if (key == fullName)
					fullName = firstUpper(tool);
				tools += `${fullName}: ${t.value > 0 ? '+' : ''}${t.value}`;
			}
			if (tools)
				this.write(`<p><b>Tools:</b> ${tools}</p>\n`);

			this.listItems(actor, 'Race', ['race']);
			this.listItems(actor, 'Background', ['background']);
			this.listItems(actor, 'Classes & Subclasses', ['class', 'subclass']);
			this.listItems(actor, 'Feats', ['feat']);
			this.listItems(actor, 'Spells', ['spell']);
			this.listItems(actor, 'Weapons', ['weapon']);
			this.listItems(actor, 'Tools', ['tool']);
			this.listItems(actor, 'Armor & Shield', ['armor', 'shield']);
			this.listItems(actor, 'Equipment', ['equipment']);
			this.listItems(actor, 'Loot', ['loot']);
			this.listItems(actor, 'Consumables', ['consumable']);
			this.listItems(actor, 'Containers', ['container']);
			
		}
	}
	
}
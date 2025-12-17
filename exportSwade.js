import {ExportSys} from "./exportSys.js";

export class ExportSwade extends ExportSys {
	
	constructor(ej) {
		super(ej);
	}

	writeData(item, arr) {
		for (let  i = 0; i < arr.length; i++) {
			const elt = arr[i];
			if (item.system && item.system[elt[0]]) {
				this.writeItext(`<p class="itemdata">${elt[1]}: ${item.system[elt[0]]}</p>\n`);
			}
		}
	}

	systemFields = [
		['price', 'Price'],
		['armor', 'Armor'],
		['damage', 'Damage'],
		['rank', 'Rank'],
		['range', 'Range'],
		['rof', 'RoF'],
		['ap', 'AP'],
		['parry', 'Parry'],
		['pp', 'Power Points'],
		['duration', 'Duration'],
		['arcane', 'Arcane'],
		['weight', 'Weight']
	];

	listItems(ej, actor, type, category) {
		let items = [];
		for (let item of actor.items)
			if (item.type === type)
				items.push(item);

		if (items.length > 0) {
			items.sort(function(a, b) {
				return a.name.localeCompare(b.name);
			});
			let str = '';
			for (let i = 0; i < items.length; i++) {
				let it = items[i];
				if (str)
					str += '; ';
				str += ej.htmlEntities(it.name);
				if (it.system.quantity && it.system.quantity > 1) {
					str += ` (x${it.system.quantity})`;
				}
				if (type == 'skill')
					str += ' ' + this.showDie(it.system.die);
				else if (type == 'weapon' || type == 'power' || type == 'armor' || type == 'consumable' || type == 'gear') {
					let data = '';
					for (let  j = 0; j < this.systemFields.length; j++) {
						const elt = this.systemFields[j];
						if (it.system && it.system[elt[0]]) {
							if (data)
								data += '; ';
							data += `${elt[1]}: ${it.system[elt[0]]}`;
						}
					}
					if (type == 'power' && it.system.trapping) {
						if (data)
							data += '; ';
						data += 'Trappings: ' + ej.htmlEntities(it.system.trapping);
					}
					if (data) {
						const strength = this.showDie(actor.system.attributes.strength.die);
						str += ' (' + data.replaceAll('@str', strength) + ')';
					}
				}
			}
			ej.write(`<p class="attributes"><b>${category}:</b> ` + str + `</p>\n`);
		}
	}

	getItemText(item, depth) {
		this.itemText = "";
		const header = `h${depth}`;
		if (item.name)
			this.writeItext(`<${header} id="${item._id}">` + this.ej.htmlEntities(item.name) + `</${header}>\n`);

		switch (item.type) {
		default:
			if (item.type == 'hindrance') {
				switch (item.system.severity) {
				case 'major':
					this.writeItext(`<p style="font-weight: bold">Major Hindrance</p>\n`);
					break;
				case 'minor':
					this.writeItext(`<p style="font-weight: bold">Minor Hindrance</p>\n`);
					break;
				case 'either':
					this.writeItext(`<p style="font-weight: bold">Major or Minor Hindrance</p>\n`);
					break;
				}
			} else if (item.type == 'skill') {
					this.writeItext(`<p><b>Attribute:</b> ${item.system.attribute.replace(/^./, char => char.toUpperCase())}</p>\n`);
			}

			if (item.system.requirements && item.system.requirements.length > 0) {
				this.writeItext(`<p><b>Requirements:</b> `);
				let str = '';
				let combinator = '';
				for (const r of item.system.requirements) {
					if (combinator)
						str += combinator;
					if (r.combinator == 'and')
						combinator = ', ';
					else
						combinator = ` ${r.combinator} `;
					switch (r.type) {
					case 'other':
						str += r.label;
						break
					case 'rank':
						str += ['Novice', 'Seasoned', 'Veteran', 'Heroic'][r.value];
						break;
					case 'attribute':
						str += r.selector.replace(/^./, char => char.toUpperCase()) + ` d${r.value}+`;
						break;
					case 'skill':
						str += r.label + ` d${r.value}+`;
						break;
					case 'power':
						str += `<em>${r.label}</em>`;
						break;
					case 'wildCard':
						str += (r.value ? '' : 'not ') + "Wild Card";
						break;
					default:
						str += r.label;
						break;
					}
				}
				this.writeItext(str + `</p>`);
			}

			this.writeData(item, this.systemFields);
			if (item.system && item.system.description)
				this.writeItext(this.ej.doReplacements(item.system.description));
			if (item.system?.grants?.length > 0) {
				let grants = [];
				for (let g of item.system.grants) {
					if (g.name)
						grants.push(g.name);
					else {
						let uuidParts = g.uuid.split('.');
						if (uuidParts.length == 5 && uuidParts[0] == 'Compendium') {
							const pack = game.packs.get(uuidParts[1] + '.' + uuidParts[2]);
							if (pack) {
								const item = pack.index.get(uuidParts[4]);
								if (item)
									grants.push(item.name);
							}
						}
					}
				}
				
				grants.sort(function(a, b) {
					return a.localeCompare(b);
				});
				
				this.writeItext(`<p class="itemdata"><b>Grants:</b> `);
				for (let i = 0; i < grants.length; i++) {
					if (i > 0)
						this.writeItext('; ');
					this.writeItext(this.ej.doReplacements(grants[i]));
				}
				this.writeItext(`</p>\n`);
			}
			break;
		}

		return this.itemText;
	}

	exportItem(item, depth) {
		this.write(this.getItemText(item, depth));
		return;

		const header = `h${depth}`;
		if (item.name)
			this.write(`<${header} id="${item._id}">` + this.ej.htmlEntities(item.name) + `</${header}>\n`);
		switch (item.type) {
		default:
			if (item.type == 'hindrance') {
				switch (item.system.severity) {
				case 'major':
					this.write(`<p style="font-weight: bold">Major Hindrance</p>\n`);
					break;
				case 'minor':
					this.write(`<p style="font-weight: bold">Minor Hindrance</p>\n`);
					break;
				case 'either':
					this.write(`<p style="font-weight: bold">Major or Minor Hindrance</p>\n`);
					break;
				}
			} else if (item.type == 'skill') {
					this.write(`<p><b>Attribute:</b> ${item.system.attribute.replace(/^./, char => char.toUpperCase())}</p>\n`);
			}

			if (item.system.requirements && item.system.requirements.length > 0) {
				this.write(`<p><b>Requirements:</b> `);
				let str = '';
				for (const r of item.system.requirements) {
					if (str) {
						if (r.combinator == 'and')
							str += ', ';
						else
							str += r.combinator;
					}
					switch (r.type) {
					case 'other':
						str += r.label;
						break
					case 'rank':
						str += ['Novice', 'Seasoned', 'Veteran', 'Heroic'][r.value];
						break;
					case 'attribute':
						str += r.selector.replace(/^./, char => char.toUpperCase()) + ` d${r.value}+`;
						break;
					case 'skill':
						str += r.label + ` d${r.value}+`;
						break;
					case 'power':
						str += `<em>${r.label}</em>`;
						break;
					case 'wildCard':
						str += (r.value ? '' : 'not ') + "Wild Card";
						break;
					default:
						str += r.label;
						break;
					}
				}
				this.write(str + `</p>`);
			}

			this.writeData(item, this.systemFields);
			if (item.system && item.system.description)
				this.write(this.ej.doReplacements(item.system.description));
			if (item.system?.grants?.length > 0) {
				let grants = [];
				for (let g of item.system.grants) {
					if (g.name)
						grants.push(g.name);
					else {
						let uuidParts = g.uuid.split('.');
						if (uuidParts.length == 5 && uuidParts[0] == 'Compendium') {
							const pack = game.packs.get(uuidParts[1] + '.' + uuidParts[2]);
							if (pack) {
								const item = pack.index.get(uuidParts[4]);
								if (item)
									grants.push(item.name);
							}
						}
					}
				}
				
				grants.sort(function(a, b) {
					return a.localeCompare(b);
				});
				
				this.write(`<p class="itemdata"><b>Grants:</b> `);
				for (let i = 0; i < grants.length; i++) {
					if (i > 0)
						this.write('; ');
					this.write(this.ej.doReplacements(grants[i]));
				}
				this.write(`</p>\n`);
			}
			break;
		}
	}

	showDie(die) {
		let txt = 'd' + die.sides;
		if (die.modifier > 0)
			txt += '+' + die.modifier;
		else if (die.modifier < 0)
			txt += die.modifier;
		return txt;
	}

	
	exportActor(actor, depth) {
		// This provides a method for putting system-dependent information
		// in the actor name header.

		let headerInfoBefore = "";
		let headerInfoAfter = "";
		if (actor.system.wildcard)
			headerInfoBefore = '[WC] ';
			
		this.write(`<h${depth} id="${actor._id}">${headerInfoBefore}` + this.ej.htmlEntities(actor.name) + `${headerInfoAfter}</h${depth}>\n`);
		if (actor.img)
			this.write(`<p><img class="img" src="${actor.img}" alt="${actor.name}"></p>\n`);

		if (actor.system.details) {
			this.subsection('Appearance', actor.system.details.appearance, depth+1);
			if (actor.system.details.biography)
				this.subsection('Biography', actor.system.details?.biography.value, depth+1);
			this.subsection('Goals', actor.system.details.goals, depth+1);
			this.subsection('Notes', actor.system.details.notes, depth+1);
		}
		if (actor.type == 'npc' || actor.type == 'character') {
			this.listItems(this.ej, actor, 'ancestry', 'Ancestry');
			this.write(`<p class="attributes"><b>Attributes:</b> Agility ${this.showDie(actor.system.attributes.agility.die)}, Smarts ${this.showDie(actor.system.attributes.smarts.die)}, Spirit ${this.showDie(actor.system.attributes.spirit.die)}, Strength ${this.showDie(actor.system.attributes.strength.die)}, Vigor ${this.showDie(actor.system.attributes.vigor.die)}</p>\n`);
			this.listItems(this.ej, actor, 'skill', 'Skills');
			let stats = '<p class="attributes"><b>Pace:</b> ';
			if (actor.system.pace.ground)
				stats += actor.system.pace.ground;
			else
				stats += '--';
			if (actor.system.pace.fly)
				stats += ` (Fly: ${actor.system.pace.fly})`;
			stats += `; <b>Parry:</b> ${actor.system.stats.parry.value}`;
			stats += `; <b>Toughness:</b> ${actor.system.stats.toughness.value}`;
			if (actor.system.stats.toughness.armor)
				stats += ` (${actor.system.stats.toughness.armor})`;
			if (actor.system.stats.size)
				stats += `; <b>Size:</b> ${actor.system.stats.size}`;
			stats += "</p>\n";
			this.write(stats);
			this.listItems(this.ej, actor, 'edge', 'Edges');
			this.listItems(this.ej, actor, 'hindrance', 'Hindrances');
			this.listItems(this.ej, actor, 'ability', 'Special Abilities');
			this.listItems(this.ej, actor, 'power', 'Powers');
			this.listItems(this.ej, actor, 'weapon', 'Weapons');
			this.listItems(this.ej, actor, 'gear', 'Gear');
			this.listItems(this.ej, actor, 'armor', 'Armor');
			this.listItems(this.ej, actor, 'shield', 'Shield');
			this.listItems(this.ej, actor, 'consumable', 'Consumables');
		} else if (actor.type === 'group') {
			if (actor.system.description)
				this.subsection('Description', actor.system.description, depth+1);
			if (actor.system.members && actor.system.members.size > 0) {
				this.write(`<h${depth+1}>Members</h${depth+1}>\n`);
				this.write('<ul>\n');
				for (let [key, m] of actor.system.members) {
					this.write(`<li>${this.doReplacements(m.actor.name)}</li>\n`);
				}
				this.write('</ul>\n');
			}
		}
	}
}

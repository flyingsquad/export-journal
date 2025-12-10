import {ExportSys} from "./exportSys.js";

export class ExportSwade extends ExportSys {
	
	constructor(ej) {
		super(ej);
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

	exportItem(item, depth) {
		const header = `h${depth}`;
		if (item.name)
			this.write(`<${header} id="${item._id}">` + this.ej.htmlEntities(item.name) + `</${header}>\n`);
		switch (item.type) {
		default:
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
				for (let g of item.system.grants)
					grants.push(g.name);
				
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

	
	exportActor(actor, depth) {
		function showDie(die) {
			let txt = 'd' + die.sides;
			if (die.modifier > 0)
				txt += '+' + die.modifier;
			else if (die.modifier < 0)
				txt += die.modifier;
			return txt;
		}
		
		function listItems(ej, actor, type, category) {
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
						str += ' ' + showDie(it.system.die);
					else if (type == 'weapon' || type == 'power' || type == 'armor') {
						let data = '';
						for (let  j = 0; j < ej.systemFields.length; j++) {
							const elt = ej.systemFields[j];
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
							const strength = showDie(actor.system.attributes.strength.die);
							str += ' (' + data.replaceAll('@str', strength) + ')';
						}
					}
				}
				ej.write(`<p class="attributes"><b>${category}:</b> ` + str + `</p>\n`);
			}
		}

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
			listItems(this.ej, actor, 'ancestry', 'Ancestry');
			this.write(`<p class="attributes"><b>Attributes:</b> Agility ${showDie(actor.system.attributes.agility.die)}, Smarts ${showDie(actor.system.attributes.smarts.die)}, Spirit ${showDie(actor.system.attributes.spirit.die)}, Strength ${showDie(actor.system.attributes.strength.die)}, Vigor ${showDie(actor.system.attributes.vigor.die)}</p>\n`);
			listItems(this.ej, actor, 'skill', 'Skills');
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
			listItems(this.ej, actor, 'edge', 'Edges');
			listItems(this.ej, actor, 'hindrance', 'Hindrances');
			listItems(this.ej, actor, 'ability', 'Special Abilities');
			listItems(this.ej, actor, 'power', 'Powers');
			listItems(this.ej, actor, 'weapon', 'Weapons');
			listItems(this.ej, actor, 'gear', 'Gear');
			listItems(this.ej, actor, 'armor', 'Armor');
			listItems(this.ej, actor, 'shield', 'Shield');
			listItems(this.ej, actor, 'consumable', 'Consumables');
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

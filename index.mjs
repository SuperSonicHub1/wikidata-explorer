// https://js.cytoscape.org/
// https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial
// https://www.wikidata.org/wiki/Wikidata:SPARQL_query_service

// TODO: Need to find a better layout system 
// Look at https://www.yworks.com/products/yed/applicationfeatures for inspiration (thanks @ilidemi:matrix.org!)
// https://github.com/search?p=1&q=cytoscape.js+layout&type=Repositories 

// import cytoscape from "https://cdn.jsdelivr.net/npm/cytoscape@3.23.0/dist/cytoscape.esm.min.js";

/**
 * @param {string} label
 * @returns {string}
 */
function shortenLabel(label) {
	const maxLength = 50
	if (label.length <= maxLength) return label
	else return label.slice(0, maxLength - 6) + '…' + label.slice(label.length - 5)
}

/**
 * https://stackoverflow.com/a/8199791
 * @returns {string}
 */
function getUserLanguage() {
	return (navigator.language || navigator.userLanguage || 'en').split('-')[0]
}

/**
 * 
 * @param {string} query
 * @returns {URL}
 */
function generateQueryURL(query) {
	const params = new URLSearchParams({
		query,
		format: 'json',
	});

	return new URL(`https://query.wikidata.org/sparql?${params}`)
}

/**
 * Snagged from {@link https://query.wikidata.org/}'s autocomplete feature.
 * https://www.wikidata.org/w/api.php?action=help&modules=wbsearchentities
 * @param {string} query
 * @returns {Promise<object[]>}
 */
async function wikidataEntityAutocomplete(query) {
	const params = new URLSearchParams({
		origin: '*',
		action: 'wbsearchentities',
		format: 'json',
		limit: 5,
		continue: 0,
		language: getUserLanguage(),
		uselang: getUserLanguage(),
		search: query,
		type: 'item',
	})

	const res = await fetch(new URL(`https://www.wikidata.org/w/api.php?${params}`))
	const body = await res.json()
	return body.search
}

/**
 * https://stackoverflow.com/a/46385132
 * Made the varaibles much easier on the eyes.
 * Consider integrating https://stackoverflow.com/questions/62090841/sparql-query-how-to-get-the-external-identifiers-links-url-of-a-specific-wiki
 * @param {string} query
 * @returns {Promise<object[]>}
 */
async function makeQuery(entityId) {
	const query = `SELECT ?item ?itemLabel ?wdItem ?wdItemLabel ?propQualifier ?propQualifierEntity ?statementProperty ?statementTarget ?property ?statement ?statementTargetLabel ?wdItemPropQualifierLabel ?propQualifierEntityLabel {
		VALUES (?item) {(wd:${entityId})}
	  
		?item ?property ?statement .
		?statement ?statementProperty ?statementTarget .
	  
		?wdItem wikibase:claim ?property.
		?wdItem wikibase:statementProperty ?statementProperty.
	  
		OPTIONAL {
			?statement ?propQualifier ?propQualifierEntity .
			?wdItemPropQualifier wikibase:qualifier ?propQualifier .
		}
	  
		SERVICE wikibase:label { bd:serviceParam wikibase:language "${getUserLanguage()}". }
	} ORDER BY ?wdItem ?statement ?statementTarget`
	const res = await fetch(await generateQueryURL(query))
	return (await res.json()).results.bindings
}

function xmlDatatypeToJs(object) {
	const { datatype, value } = object
	switch (datatype) {
		case "http://www.w3.org/2001/XMLSchema#dateTime":
			return new Date(Date.parse(value))
		case 'http://www.w3.org/2001/XMLSchema#decimal':
			return parseFloat(value)
		default:
			console.error(`Unsupported type: ${datatype}`, object)
			return value
	}
}

function wikidataDatatypeToJs(object) {
	const { type, value } = object
	switch (type) {
		case 'literal':
			if (object.datatype) return xmlDatatypeToJs(object)
			else return value
		case 'uri':
			return new URL(value)
		default:
			const error = Error(`Unsupported type: ${type}`)
			error.object = object
			console.info(object)
			throw error
	}
}

function parseWikidataItem(item) {
	return Object.fromEntries(Object.entries(item).map(([k, v]) => [k, wikidataDatatypeToJs(v)]))
}

function isWikidataUrl(item) {
	return item instanceof URL && item.hostname.includes('wikidata.org')
}

/**
 * https://js.cytoscape.org/#notation/elements-json
 * @param {object[]} wikidataItems
 * @returns {object}
 */
async function wikidataToCytoscape(wikidataItems, cy) {
	wikidataItems = wikidataItems.map(parseWikidataItem)

	for (const { item, itemLabel, statement, property, wdItemLabel, statementTarget, statementTargetLabel, propQualifier, propQualifierEntity, wdItemPropQualifierLabel, ...everythingElse } of wikidataItems) {
		const itemId = item.toString(),
			statementId = statement.toString(),
			statementTargetId = statementTarget.toString(),
			propQualifierEntityId = propQualifierEntity ? propQualifierEntity.toString() : undefined

		const itemIsWikidata = isWikidataUrl(item)
		const statementTargetIsWikidata = isWikidataUrl(statementTarget)

		if (cy.getElementById(itemId).length == 0) {
			const node = cy.add(
				{
					group: 'nodes',
					data: {
						id: itemId,
						label: itemLabel,
						shortLabel: shortenLabel(itemLabel),
					}
				}
			)
			if (itemIsWikidata) node.addClass('wikidata')
		}

		if (cy.getElementById(statementTargetId).length == 0) {
			const node = cy.add({
				group: 'nodes',
				data: {
					id: statementTargetId,
					label: statementTargetLabel,
					shortLabel: shortenLabel(statementTargetLabel),
				},
			})
			if (statementTargetIsWikidata) node.addClass('wikidata')
			if (property.pathname.endsWith('P18')) node.addClass('image')
		}

		if (cy.getElementById(statementId).length == 0) cy.add(
			{
				group: 'edges',
				data: {
					id: statementId,
					source: itemId,
					target: statementTargetId,
					label: wdItemLabel,
					shortLabel: shortenLabel(wdItemLabel),
				},
				classes: 'autororate'
			}
		)

		// Not working for some reason
		// Not entirely sure if qualifiers even make sense for the UI
		// if (propQualifier) cy.add(
		// 	{
		// 		group: 'edges',
		// 		data: {
		// 			id: `${statementId}-${propQualifier}`,
		// 			source: statementTargetId,
		// 			target: propQualifierEntityId,
		// 			label: wdItemPropQualifierLabel,
		// 		},
		// 		classes: 'autororate'
		// 	}
		// )
	}

	// Re-layout
	await cy.layout({
		// name: 'circle',

		name: 'avsdf',
		nodeSeparation: 120
		// circle: true,
		// fit: false,
		// spacingFactor: 3.5,
	}).run()
}

async function addToGraph(id, cy) {
	const bindings = await makeQuery(id)
	await wikidataToCytoscape(bindings, cy)
}

const cy = cytoscape({
	container: document.getElementById('cy'), // container to render in
	style: [
		// https://github.com/cytoscape/cytoscape.js/tree/master/documentation/demos/labels
		{
			"selector": "node[label]",
			"style": {
				"label": "data(shortLabel)"
			}
		},
		{
			"selector": "edge[label]",
			"style": {
				"label": "data(shortLabel)",
				"width": 3
			}
		},
		{
			"selector": "node[label]:active, node[label]:selected",
			"style": {
				"label": "data(label)"
			}
		},
		{
			"selector": "edge[label]:active, edge[label]:selected",
			"style": {
				"label": "data(label)",
				"width": 3
			}
		},
		
		{
			"selector": ".autorotate",
			"style": {
				"edge-text-rotation": "autorotate"
			}
		},

		// https://github.com/cytoscape/cytoscape.js/tree/master/documentation/demos/images-breadthfirst-layout
		// Images don't display due to CORS :(
		// {
		// 	selector: '.image',
		// 	style: {
		// 		'background-image': 'data(label)',
		// 		'background-fit': 'cover',
		// 	}
		// },

		// https://github.com/cytoscape/cytoscape.js/tree/master/documentation/demos/edge-types
		{
			selector: 'edge',
			style: {
				"curve-style": "bezier",
				"control-point-step-size": 50,
				'target-arrow-shape': 'triangle',
			},
		},

		{
			selector: '.wikidata',
			style: {
				'background-color': '#339966',
			}
		},
	]
})

window.cy = cy


cy.on('click', 'node', async e => {
	const node = e.target
	const data = node.data()
	console.info(data)

	// Ctrl-click to open page in new tab
	if (/** @type {MouseEvent} */ (e.originalEvent).ctrlKey) {
		window.open(data.id)
		return
	}

	// Load new nodes if URL is Wikidata
	if (node.classes().includes('wikidata')) {
		// Get ID
		const pieces = new URL(data.id).pathname.split('/')
		const id = pieces[pieces.length - 1]

		await addToGraph(id, cy)

		cy.center(node)
	}
})
cy.on('click', 'edge', e => {
	const node = e.target
	const data = node.data()
	console.info(data)

	// Ctrl-click to open page in new tab
	// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
	if (/** @type {MouseEvent} */ (e.originalEvent).ctrlKey) {
		window.open(data.id)
		return
	}
})

// https://github.com/SuperSonicHub1/vanilla-js-typeahead/

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
}

const searchBox = document.getElementById("search-bar")
const datalist = document.getElementById("autocomplete")

searchBox.addEventListener('input', async e => {
    const query = e.target.value
    const results = await wikidataEntityAutocomplete(query)
    removeAllChildNodes(datalist)
    for (const {id, label, description} of results) {
        const option = new Option(`${label} (${description})`, id)
        datalist.appendChild(option)
    }
})

document.querySelector('#form form').addEventListener('submit', async e => {
	console.log('eeee')
	e.preventDefault()
    const id = searchBox.value
	searchBox.value = ''
	console.log(id)

	if (id) await addToGraph(id, cy)
})

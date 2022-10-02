# wikidata-explorer

a tool for exporing Wikidata with a graph UI

[Check it.](https://SuperSonicHub1.github.io/wikidata-explorer/)

From about.html:

<figure>
	<video controls src="demo-video.webm">Your browser still doesn't support HTML5 video? smh, bro.</video>
	<figcaption>A demo of the creator (me!) using <em>Wikidata Explorer</em>.</figcaption>
</figure>
<p>I worked on <em>Wikidata Explorer</em> for the first two days of the jam before burning out and running out of time to do anything else due to Life™.</p>
<p>My initial idea for this project can be summarized in a bulleted self-dialogue:</p>
<ul>
	<li>
		Hmm,
		<a href="https://www.wikidata.org/wiki/Wikidata:Main_Page">Wikidata</a>
		has a lot of really neat info, but I find I don't browse it like I do Wikipedia...
		Is that because the UI doesn't encourage me to peruse it as much?
	</li>
	<li>Wikidata is basically a really really big graph, right?</li>
	<li>What if I could render that graph?</li>
	<li>I could then let the user click on nodes so that they can explore related topics and see how exactly they're connected to each other...</li>
	<li>If I execute this correctly, this could actually be a really productive exploration tool!</li>
</ul>
<p>
	I still think that the potential for it to be that is still there, but in practice I wasn't able to easily do this. The main issue is Wikidata
	entries have a lot of edges (<a href="https://www.wikidata.org/wiki/Q17">Japan</a> has over three hundred), and making graphs where a small number of nodes
	have a large number of edges is really hard to manage; it's frustrating when your graph unknowingly explodes. I couldn't find or imagine a layout algorithm
	which would make this tool more human-friendly, so I just kinda set it aside. Graphs are not always the best UI tool, even if the underlying data is modeled 
	as such.
</p>
<p>
	I want to thank <a href="https://www.scattered-thoughts.net/">Jamie</a> for hosting this <a href="https://www.hytradboi.com/jam">jam</a> (it's the first communal hacking session I've done since COVID!) and everyone in
	<a href="https://matrix.to/#/#hytradboi:scattered-thoughts.net">#hytradboi</a> for being super chill and great people to talk to;
	can't wait to see everyone's awesome projects!
</p>

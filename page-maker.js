var jade = require('jade');
var fs = require('fs');
var marked = require('marked');
var request = require('request');
var html2jade = require('html2jade');

marked.setOptions({
    highlight: function(code) {
        return require('highlight.js').highlightAuto(code).value;
    }
});

var pagesDir = fs.readdirSync('./pages');
var pages = [];
for (var i = 0; i < pagesDir.length; i++) {
    var name  = pagesDir[i].replace(/.md/g,'');
    var displayName = name.replace(/\d/g,'');
    displayName = displayName.replace(/-/g,' ');
    var content = marked(fs.readFileSync('./pages/'+pagesDir[i], 'utf8'));
    pages[i] = {
        name: name
        ,displayName: displayName
        ,content: content
    }
}

var html = jade.renderFile('index.jade',{pages: pages});
for (var i = 0; i < pages.length; i++) {
    html = html.replace(pages[i].name+"%%%%", pages[i].content);
}
fs.writeFileSync('index.html', html, 'utf8');

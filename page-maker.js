var jade = require('jade');
var fs = require('fs');
var marked = require('marked');
var request = require('request');
var html2jade = require('html2jade');

marked.setOptions({
  highlight: function (code) {
    return require('highlight.js').highlightAuto(code).value;
  }
});

request.get('https://raw.githubusercontent.com/burawi/tayr/master/readme.md', function(error, response, readme) {
    if (!error && response.statusCode == 200) {
        readme = marked(readme);

        var html = jade.renderFile('index.jade');
        html = html.replace(/readme.jade%%%%%/g, readme);
        fs.writeFileSync('index.html', html, 'utf8');
    }
});

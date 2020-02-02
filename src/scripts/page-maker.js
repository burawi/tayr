const fs = require('fs');
const jade = require('jade');
const marked = require('marked');



  let pages, html;


  pages = fs.readdirSync('../pages').map(page => {
    let name  = page.replace(/.md/g, ''),
    displayName = (name.replace(/\d/g, '')).replace(/-/g, ' '),
    content = marked(fs.readFileSync(`../pages/${page}`, 'utf8'));
    return ({ name, displayName, content });
  });

  
  html = jade.renderFile('../index.jade', { pages });
  pages.map(({ name, content }) => {
    html = html.replace(`${name}%%%%`, content);
  });


  fs.writeFileSync('../../index.html', html, 'utf8');
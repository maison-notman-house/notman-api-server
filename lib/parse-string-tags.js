var tagRegExp = /\[.*?\]/g;

module.exports = function parseStringTags(s) {
  if (typeof s !== 'string') throw new Error('String required');

  var tags = [];
  var matches = s.match(tagRegExp);

  if (matches) {
    for (var i = 0; i < matches.length; i++) {
      var tag = matches[i];
      s = s.replace(tag, '');
      tags.push(tag.slice(1, -1).toLowerCase().trim());
    }
  }

  return {
    string: s,
    tags: tags
  };
};

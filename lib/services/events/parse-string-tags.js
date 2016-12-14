const TAG_REG_EXP = /\[.*?\]/g;

module.exports = function parseStringTags(s) {
    if (typeof s !== 'string') throw new Error('String required');

    var tags = [];
    var matches = s.match(TAG_REG_EXP);
    var publicEvent = false;
    if (matches) {
        for (var i = 0; i < matches.length; i++) {
            var tag = matches[i];
            s = s.replace(tag, '');
            tags.push(tag.slice(1, -1).toLowerCase().trim());
        }
    }

    if (s.endsWith('*')) {
        publicEvent = true;
        s = s.substring(0, s.length - 1).trim();
    }

    return {
        string: s,
        tags: tags,
        publicEvent: publicEvent
    };
};
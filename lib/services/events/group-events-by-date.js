module.exports = function groupEventsByDate(events) {
  var currentGroup;
  var groups = [];

  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    if (currentGroup == null || currentGroup.date !== event.date) {
      currentGroup = {
        date: event.date,
        day: event.day,
        items: []
      };
      groups.push(currentGroup);
    }
    currentGroup.items.push(event);
  }

  return groups;
};

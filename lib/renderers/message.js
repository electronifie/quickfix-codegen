module.exports = function renderMessage (message, template) {
  var first = message.childNodes()[0];
  var fields = message.find('./field');
  var components = message.find('./component');
  var json = {
    name: message.attr('name').value(),
    msgType: message.attr('msgtype').value(),
    first: {
      name: first.attr('name').value(),
      type: first.name()
    },
    fields: fields.map(function (field) {
      return {
        name: field.attr('name').value(),
      };
    }),
    components: components.map(function (field) {
      return {
        name: field.attr('name').value(),
      };
    })
  };
  return {
    json: json,
    text: template(json)
  };
};
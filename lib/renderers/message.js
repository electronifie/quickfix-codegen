module.exports = function renderMessage (message, template) {

  var json = {
    name: message.attr('name').value(),
    msgType: message.attr('msgtype').value()
  };

  var childNodes = message.childNodes();

  if (childNodes.length) {
    var first = childNodes[0];
    json.first = {
      name: first.attr('name').value(),
      type: first.name()
    };
  }

  var fields = message.find('./field');

  if (fields) {
    json.fields = fields.map(function (field) {
      return {
        name: field.attr('name').value(),
      };
    });
  }

  var components = message.find('./component');

  if (components) {
    json.components = components.map(function (field) {
      return {
        name: field.attr('name').value(),
      };
    });
  }

  return {
    json: json,
    text: template(json)
  };
};
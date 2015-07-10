module.exports = function renderField (message, template) {
  var first = message.childNodes()[0];
  var values = message.find('./value');
  var json = {
    name: message.attr('name').value(),
    number: message.attr('number').value(),
    type: message.attr('type').value(),
    values: values.map(function (value) {
      return {
        enum: value.attr('enum').value(),
        description: value.attr('description').value(),
      };
    })
  };
  return {
    json: json,
    text: template(json)
  };
};
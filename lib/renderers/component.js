var util = require('util');

module.exports = function renderComponent (message, template, doc) {

  function getComponent (name) {
    return doc.get(util.format("/fix/components/component[@name='%s']", name));
  }

  function getField (name) {
    return doc.get(util.format("/fix/fields/field[@name='%s']", name));
  }

  function getFirstFieldNumber (element) {

    var name = element.name();
    if (name === 'field' || name === 'group') {
      return getField(element.attr('name').value()).attr('number').value();
    } else {
      var hasChildNodes = !! element.childNodes().length;
      var nodeName;
      var elementName;
      if ( ! hasChildNodes) {
         nodeName = element.name();
         elementName = element.attr('name').value();
        if (nodeName === 'field' || nodeName === 'group') {
          return getFirstFieldNumber(getField(elementName));
        } else {
          return getFirstFieldNumber(getComponent(elementName));
        }
      } else {
        nodeName = element.childNodes()[0].name();
        elementName = element.childNodes()[0].attr('name').value();
        if (nodeName === 'field' || nodeName === 'group') {
          return getFirstFieldNumber(getField(elementName));
        } else {
          return getFirstFieldNumber(getComponent(elementName));
        }
      }

    }

  }

  var fields = message.find('./field');
  var groups = message.find('./group');
  var components = message.find('./component');
  var json = {
    name: message.attr('name').value(),
    fields: fields.map(function (field) {
      return {
        name: field.attr('name').value(),
      };
    }),
    groups: groups.map(function (group) {
      var components = group.find('./component');
      var fields = group.find('./field');
      return {
        name: group.attr('name').value(),
        components: components.map(function (field) {
          return {
            name: field.attr('name').value(),
            tag: getFirstFieldNumber(field)
          };
        }),
        fields: fields.map(function (field) {
          return {
            name: field.attr('name').value(),
          };
        }),
        tag: getFirstFieldNumber(group)
      };
    }),
    components: components.map(function (field) {
      return {
        name: field.attr('name').value(),
        tag: getFirstFieldNumber(field)
      };
    }),
    tag: getFirstFieldNumber(message)
  };
  return {
    name: json.name,
    json: json,
    text: template(json)
  };
};
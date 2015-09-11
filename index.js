#!/usr/bin/env node

var camelCase = require('camel-case');
var fs = require('fs');
var handlebars = require('handlebars');
var libxmljs = require('libxmljs');
var mkdirp = require('mkdirp');
var path = require('path');
var renderComponent = require('./lib/renderers/component');
var renderField = require('./lib/renderers/field');
var renderMessage = require('./lib/renderers/message');
var util = require('util');

var INPUT = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve('./FIX50SP2_EP194.xml');
var OUTPUT_DIR = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(__dirname + '/output/');

var componentSource = fs.readFileSync(__dirname + '/templates/component.hbs').toString();
var componentTemplate = handlebars.compile(componentSource);
var fieldSource = fs.readFileSync(__dirname + '/templates/field.hbs').toString();
var fieldTemplate = handlebars.compile(fieldSource);
var indexSource = fs.readFileSync(__dirname + '/templates/index.hbs').toString();
var indexTemplate = handlebars.compile(indexSource);
var messageSource = fs.readFileSync(__dirname + '/templates/message.hbs').toString();
var messageTemplate = handlebars.compile(messageSource);

function registerHelpers (doc) {

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

  function groupName (string) {
    if (string.indexOf('No') === 0) {
      string = string.substr(2, string.length - 2);
    }
    return string;
  }

  handlebars.registerHelper('camelCase', function (string) {
    return camelCase(string);
  });

  handlebars.registerHelper('camelCaseGroupName', function (string) {
    return camelCase(groupName(string));
  });

  handlebars.registerHelper('groupName', groupName);

  handlebars.registerHelper('componentNumber', function (field) {
    var element = getComponent(field.name);
    return getFirstFieldNumber(element);
  });

  handlebars.registerHelper('fieldNumber', function (field) {
    var element = getField(field.name);
    return element.attr('number').value();
  });

}

mkdirp(OUTPUT_DIR, function (err) {
  if (err) return console.error(err);
  mkdirp(OUTPUT_DIR + '/components', function (err) {
    if (err) return console.error(err);
    mkdirp(OUTPUT_DIR + '/fields', function (err) {
      if (err) return console.error(err);
        mkdirp(OUTPUT_DIR + '/messages', function (err) {
          if (err) console.error(err);

          fs.readFile(INPUT, function (err, data) {

            var xmlDoc = libxmljs.parseXmlString(data.toString(), { noblanks: true });

            registerHelpers(xmlDoc);

            var messages = xmlDoc.get("/fix/messages");
            var results = [];

            for (var i = 1; i <= messages.childNodes().length; i++) {

              var message = xmlDoc.get(util.format("/fix/messages/message[%s]", i));

              var result = renderMessage(message, messageTemplate);

              fs.writeFileSync(OUTPUT_DIR + '/messages/' + result.json.name + '.js', result.text);

              results.push(result);

            }

            fs.writeFileSync(OUTPUT_DIR + '/messages/index.js', indexTemplate({ results: results }));

            var components = xmlDoc.get("/fix/components");
            var results = [];

            for (i = 1; i <= components.childNodes().length; i++) {

              var component = xmlDoc.get(util.format("/fix/components/component[%s]", i));

              var result = renderComponent(component, componentTemplate, messages);

              fs.writeFileSync(OUTPUT_DIR + '/components/' + result.json.name + '.js', result.text);

              results.push(result);
            }

            fs.writeFileSync(OUTPUT_DIR + '/components/index.js', indexTemplate({ results: results }));

            var fields = xmlDoc.get("/fix/fields");

            for (i = 1; i <= fields.childNodes().length; i++) {

              var field = xmlDoc.get(util.format("/fix/fields/field[%s]", i));

              var result = renderField(field, fieldTemplate);

              fs.writeFileSync(OUTPUT_DIR + '/fields/' + result.json.name + '.js', result.text);

              results.push(result);
            }

            fs.writeFileSync(OUTPUT_DIR + '/fields/index.js', indexTemplate({ results: results }));

          });

        });
      });
  });

});

# Templatize #

Basic templating code, similar to Mustache.js. It originally started as needing a very simplistic template library, hence creating my own version, before snowballing requirements basically made it almost the same functional capacity as Mustache.js. On the plus side, it's much lighter, the core code just a little over 100 lines. For a brief comparison versus Mustache, see the last section.

Lawrence Sim © 2019

## Contents ##

* [How to Use](#how-to-use)
* [Variables](#variables)
* [Sections](#sections)
    * [Basic sections](#basic-sections)
    * [Section value evaluation](#section-value-evaluation)
    * [Sections with data](#sections-with-data)
    * [More section behavior](#more-section-behavior)
* [Repeating Sections](#repeating-sections)
* [Nested Sections](#nested-sections)
* [Functions](#functions)
* [Putting it all together](#putting-it-all-together)
* [Templatize vs Mustache](#templatize-vs-mustache)

## How to Use ##

Import the source or minified javascript. If regular script import, uses name `Templatize`. There is only one function you need to know:

**`Templatize.render(template, bindings, cleanup)`** : Renders template.

| Name | Type | Description |
| --- | --- | :--- |
| `template` | `String` | The template. |
| `bindings` | `Object` | The object literal of data-bindings. |
| `cleanup` | `Boolean` | Whether to cleanup unrendered markups. Defaults to false. |

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** (String) The rendered template.

----------

## Variables ##

Parts related to templates to be encased in double curly braces, with dot notation to traverse nested structures. Example below where above the break is the template and below the data-bindings.

&nbsp; *Template:*

```
{{name.first}} is {{age}} years old.
```

&nbsp; *Bindings:*

```javascript
{
  age: 46, 
  name: { first: "Bob" }
}
```

&nbsp; *Outputs:*

```
Bob is 46 years old.
```

Generally avoid any data-binding names starting with an underscore (`_`) as some reserved values use the underscore prefix (e.g. `_display` and `_parent`).

## Sections ##

### Basic Sections ###

Section are marked with start at `#`-prefix and end at `/`-prefix. By binding section to a `true` or `false` value, they may be shown or removed.

&nbsp; *Template:*

```
{{#married}}Is married.{{/married}}{{#single}}Is single.{{/single}}
```

&nbsp; *Bindings:*

```javascript
{
  married: true, 
  single: false
}
```

&nbsp; *Outputs:*

```
Is married.
```

You may also do an inverse section by replacing `#` starting prefix with `^`. Such sections will only be displayed if the section is evaluated to `false`.

&nbsp; *Template:*

```
{{^single}}Is not single.{{/single}}
```

&nbsp; *Bindings:*

```javascript
{single: false}
```

&nbsp; *Outputs:*

```
Is not single.
```

Data may be put inside of a section. E.g.:

&nbsp; *Template:*

```javascript
{{#married}}Is married to {{spouse}}.{{/married}}
```

&nbsp; *Bindings:*

```
{
  married: true, 
  spouse: "Linda"
}
```

&nbsp; *Outputs:*

```
Is married to Linda.
```

### Section value evaluation ###

Section data may be other values besides boolean. However, evaluation of non-boolean values have minor differences from normal Javascript behavior. Values of `undefined`, `null`, an empty string, or a string composed only of whitespace (if you want to add whitespace, use `&nbsp;`), evaluate to `false`. Conversely, a value of `0` is evaluated as `true`.

If section key does not exist, that section is simply not evaluated in the template, which is a common error. E.g.: 


&nbsp; *Template:*

```
{{#married}}Is married.{{/married}}{{#single}}Is single.{{/single}}
```

&nbsp; *Bindings:*

```javascript
{married: true}
```

&nbsp; *Outputs:*

```
Is married.{{#single}}Is single.{{/single}}
```

### Sections with data ###

As long as data-binding for section evaluates to `true` (see above), it will be treated as such. You may use this as a shortcut for both displaying the section and formatting its value:

&nbsp; *Template:*

```
{{#job}}Occupation: {{job}}{{/job}}
```

&nbsp; *Bindings:*

```javascript
{job: "Chef"}
```

&nbsp; *Outputs:*

```
Occupation: Chef
```

The above though is somewhat messy of an implementation. One alternative is to separate a "display" variable like so:

&nbsp; *Template:*

```
{{#showJob}}Occupation: {{job}}{{/showJob}}
```

&nbsp; *Bindings:*

```javascript
{
  showJob: true, 
  job: "Chef"
}
```

Or, even better, used a nested structure for the section like below:

&nbsp; *Template:*

```
{{#job}}Occupation: {{job.title}}{/job}}
```
 
&nbsp; *Bindings:*

```javascript
{
  job: {title: "Chef"}
}
// or conversely, which will hide the entire section..
{
  job: false
}
```

Note that section data (excluding repeating sections) are scoped for the entire template. E.g., given the above example, `{{job.title}}` may be used anywhere in the template inside or outside of a `{{#job}}{{/job}}` section and will be replaced with `"Chef"` when rendered.

### More section behavior ###

Section data may still be filled out but removed/hidden if a `_display` variable exists and evaluates to  `false` (this behavior evaluates "truthiness" in a standard fashion -- e.g. unlike for the section value itself, `0` evaluates to `false`).

&nbsp; *Template:*

```
Occupation: {{#job}}{{job.title}}{/job}} {{^job}}Unemployed{{/job}}<br />
Bob is a {{job.title}}
```

&nbsp; *Bindings:*

```javascript
{
  job: {
    title: "Chef", 
    _display: false
  }
}
```

&nbsp; *Outputs:*

```
Occupation: 
Bob is a chef.
```

Note in the above that `_display` does not reverse the behavior of inverse sections (the section `{{^job}}Unemployed{/job}}` is still hidden as `job` itself is not evaluated to `false`). Also, nested section data may still be accessed and rendered outside of the section, even if the section itself is set not to display.

## Repeating Sections ##

For repeating sections, set the section value to an array of objects and section html will be repeated. May still use `_display` to not use particular array item. Values within any array item are limited in scope only to that section given that array item.

&nbsp; *Template:*

```
{{#children}}Child: {{children.firstName}}<br />{{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  children: [
    {firstName: "Tina"}, 
    {firstName: "Gene"}, 
    {firstName: "Louise"}
  ]
}
```

&nbsp; *Outputs:*

```
Child: Tina
Child: Gene
Child: Louise
```

Note value must be an array of objects. E.g., the above template with the following data-bindings will error:


&nbsp; *Data:*

```javascript
{
  children: ["Tina", "Gene", "Louise"]
}
```

Unlike regular sections, repeating sections are limited in scope to its own section. Thus, variables within a repeating section's data bindings will not evaluate outside the portion of the template within the repeating section. Values from outside, however, can be scoped within the repeating section.

&nbsp; *Template:*

```
{{#children}}Child: {{children.firstName}} {{lastName}}<br />{{/children}}
<br />
These won't evaluate: {{children}} {{children.firstName}} {{children[0].firstName}}
```

&nbsp; *Bindings:*

```javascript
{
  lastName: "Belcher", 
  children: [
    {firstName: "Tina"}, 
    {firstName: "Gene"}, 
    {firstName: "Louise"}
  ]
}
```

&nbsp; *Outputs:*

```
Child: Tina Belcher
Child: Gene Belcher
Child: Louise Belcher

These won't evaluate: {{children}} {{children.firstName}} {{children[0].firstName}}
```

## Nested Sections ##

Nested sections should behave as expected, even mixing regular versus repeating sections, as long as you properly manage the scope.

&nbsp; *Template:*

```
{{#children}}
  {{#children.lastChild}}and {{/children.lastChild}}
  {{children.name.first}} {{name.last}}
  {{^children.lastChild}}, {{/children.lastChild}}
{{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher"
  }, 
  children: [
    {
      name: {first: "Tina"},
      lastChild: false
    }, 
    {
      name: {first: "Gene"},
      lastChild: false
    }, 
    {
      name: {first: "Louise"},
      lastChild: true
    }
  ]
}
```

&nbsp; *Outputs:*

```
Tina Belcher, Gene Belcher, and Louise Belcher.
```

A few behaviors to note for the above example:

* Within the template for the repeating section, scope is still from the top level, hence we can render `name.last` within, and subvariables of `children` must be called via dot notation.
* `children[].lastChild` must be specified for all array items, as the evaluation for `lastChild` in each repeat of the section will only happen where such a key exists.

## Functions ##

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object where it resides.

&nbsp; *Template:*

```
{{name.full}} has {{numChildrenText}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher", 
    full: function() {
      return this.first + " " + this._parent.name.last;
    }
  }, 
  numChildrenText: function() {
    switch(this.children.length) {
      case 0:
        return "no children"
      case 1:
        return "one child"
      default:
        return this.children.length + " children"
    }
  }, 
  children: [
    {firstName: "Tina"}, 
    {firstName: "Gene"}, 
    {firstName: "Louise"}
  ]
}
```

&nbsp; *Outputs:*

```
Bob Belcher has 3 children.
```

Note `name.full` is called within context of `name`, whereas `numChildrenText` is called within the context of the root data-bindings object. However, each context is given a `_parent` parameter to traverse upwards in scope. In `name.full`, this is used in a somewhat contrived example to traverse up to the full context (before returning back to the same).

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply the `errorOnFuncFailure` flag to `true`: 

```javascript
Templatize.errorOnFuncFailure = true;
```

Depending on your dependency manager, this may or may not affect all references to `Templatize`. Generally speaking, assume `Templatize` is a static reference, so either adjust for all uses, and/or have it reset back to a desired behavior after using it with non-default behavior.

## Putting it all together ##

Below is a complex example using a bit of everything covered above.

&nbsp; *Template:*

```javascript
{{name.full}} has {{numChildrenText}}<br />
{{#children}}
  {{#children.lastChild}}and {{/children.lastChild}}
  {{children.firstName}} {{name.last}} (age {{children.age}})
  {{^children.lastChild}}, {{/children.lastChild}}
{{/children}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher", 
    full: function() {
      return this.first + " " + this.last;          
    }
  }, 
  numChildrenText: function() {
    switch(this.children.length) {
      case 0:
        return "no children"
      case 1:
        return "one child: "
      default:
        return this.children.length + " children: "
    }
  }, 
  thisYear: 2018, 
  children: [
    {
      firstName: "Tina", 
      born: 2005, 
      age: function() { return this._parent.thisYear - this.born; }, 
      lastChild: function() { return this._parent.isLastChild(this); }
    }, 
    {
      firstName: "Gene", 
      born: 2007, 
      age: function() { return this._parent.thisYear - this.born; }, 
      lastChild: function() { return this._parent.isLastChild(this); }
    }, 
    {
      firstName: "Louise", 
      born: 2009, 
      age: function() { return this._parent.thisYear - this.born; }, 
      lastChild: function() { return this._parent.isLastChild(this); }
    }
  ], 
  isLastChild: function(childObj) {
    return childObj === this.children[this.children.length-1];
  }
}
```

&nbsp; *Outputs:*

```
Bob Belcher has 3 children: 
Tina Belcher (age 13), Gene Belcher (age 11), and Louise Belcher (age 9).
```

Note that the `children[].lastChild` function calls a function from the parent scope (`isLastChild`) to dynamically determine if it is the last object in the array. Arguably this is  somewhat contrived, and it would easier just to preprocess the children data-bindings object and assign values to each child's attributes, but this is just a demonstration of possible design patterns.

## Templatize vs Mustache ##

Minor syntactic differences are evaluation of "truthiness" (e.g. Mustache reads `0` as false when evaluating a section), and scope within sections and when calling functions. Additionally, there is no inherent support for partials (though as Templatize maps and renders on runtime, a design pattern can easily work around this) and no support for custom delimiters.

### Caching ###

Mustache parses templates before rendering, and maps all recognized markup locations. This introduces a bit of an overhead when first rendering a template and subsequently, Templatize is faster in that regard. However, the preprocessed map is cached and all subsequent renders that use the same template in Mustache are greatly improved in speed.

### Missing Bindings ###

As aforementioned, templates are not preprocessed to map data-bindings. Instead, templates are rendered at call, using the supplied data bindings, and finding the appropriate, matching markup in the template. Consequently, **missing bindings in the template are rendered as is**. This may be particularly tricky when using inverse sections. The binding must still exist, even if it evaluates to `false` -- if undefined, the section syntax is ignored in the template.

Additionally, formatting issues are not checked and validated. Thus, providing an incomplete data-binding or badly formatted template will result in rendering issues.

&nbsp; *Template:*

```
{{name.first}} {{#age}}is {{age}} years old.
```

&nbsp; *Data:*

```javascript
{age: 46}
```

&nbsp; *Outputs:*

```
{{name.first}} {{#age}}is 46 years old.
```

In the above, `{{name.first}}` is not replaced because the binding does not exist in the supplied data. As well, the use of the `{{#age}}` section is erroneously rendered as the expected closing tag (`{{/age}}`) was not found.

To cleanup any remaining markup, set the `cleanup` parameter in `Templatize.render()` as `true`.



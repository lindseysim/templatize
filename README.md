# Templatize #

Basic templating code, similar to Mustache.js. It originally started as needing a very simplistic template library, hence creating my own version, before snowballing requirements basically made it almost the same functional capacity as Mustache.js. On the plus side, it's much lighter, the core code just a little over 100 lines. For a brief comparison versus Mustache, see the last section.

Lawrence Sim © 2021

## Contents ##

* [How to Use](#how-to-use)
* [Variables](#variables)
    * [Naming](#naming)
    * [Comments and escaping](#comments-and-escaping)
    * [Formatting](#formatting)
* [Lists](#lists)
* [Sections](#sections)
    * [Section value evaluation](#section-value-evaluation)
    * [Evaluation of zero-value](#evaluation-of-zero-value)
    * [More section behavior](#more-section-behavior)
* [Repeating Sections](#repeating-sections)
* [Nested Sections](#nested-sections)
* [Functions](#functions)
    * [Context and parent](#context-and-parent)
    * [Nesting](#nesting)
    * [Functions within functions](#functions-within-functions)
    * [Dynamically scoping functions](#dynamically-scoping-functions)
    * [Error handling](#error-handling)
* [Putting it all together](#putting-it-all-together)
* [Templatize vs Mustache](#templatize-vs-mustache)
* [Common errors and more](#common-errors-and-more)
    * [Missing bindings](#missing-bindings)
    * [Formatting lists and functions](#formatting-lists-and-functions)
    * [Scoping of functions within functions](#scoping-of-function-within-functions)
* [Acknowledgments](#acknowledgments)

----------

&nbsp; 

## How to Use ##

Import the source or minified javascript. If regular script import, uses name `Templatize`. There is only one function you need to know:

*Templatize*.**render**(*template, *bindings*[, *cleanup*]) : Renders template.

| Name | Type | Description |
| --- | --- | :--- |
| `template` | `String` | The template. |
| `bindings` | `Object` | The object literal of data-bindings. |
| `cleanup` | `Boolean` | Whether to cleanup unrendered markups. Defaults to false. |

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** (String) The rendered template.

**Flags**

Two flags you may set involves evaluation of zero-values for sections and error handling of functions. The default values for both are `false`. For the functions for these flags, see [Evaluation of zero-value](#evaluation-of-zero-value) (for sections) and [Error handling](#error-handling) (for functions).

```javascript
Templatize.evalZeroAsTrue = false;
Templatize.errorOnFuncFailure = false;
```

When editing flags, it is best to assume `Templatize` is static. That is, all imported version of it are affected.

**Custom renderer**

*Templatize*.**custom**([*options*]) : Clones new version of Templatize renderer.

Clone the renderer -- either to ensure a unique copy to scope flag changes only to the cloned instance or customize the rendering options. The `options` parameter, which is optional, can be supplied with the follow properties to customize the behavior of the cloned renderer.

| Name | Type | Description |
| --- | --- | :--- |
| `delimiters` | `String[]` | If supplied, the custom start and end delimiters. Defaults to `["{{","}}"]`. |
| `errorOnFuncFailure` | `Boolean` | Sets the flag to throw exceptions from functions in data bindings. |
| `evalZeroAsTrue` | `Boolean` | Sets the flag to evaluate zero-values are true for sections. |

&nbsp;&nbsp;&nbsp;&nbsp; **Returns:** New instance of Templatize renderer.

----------

&nbsp; 

## Variables ##

Parts related to templates to be encased in double curly braces, with dot notation to traverse nested structures. Example below where above the break is the template and below the data-bindings.

Missing bindings in the template are rendered as is unless the `cleanup` parameter is set. For more details, see [Missing bindings](#missing-bindings).

&nbsp; *Template:*

```
{{name.first}} is {{age}} years old.<br />
This binding is {{missing}}
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
This binding is {{missing}}
```

### Naming ###

**Special/reserved property names**

* `_parent` is a special keyword (see [Context and parent](#context-and-parent)).
* `_display` is a special keyword. While it is meant to be set (see [More section behavior](#more-section-behavior]), it should only be done when specifically calling said functionality.
* Any property name with a leading bang (`!`) will be treated as an [escaped tag](#comments-and-escaping) in the template code.

**Things to avoid in property names**

* While whitespaces can be part of the property name, it is generally not good practice. At the very least avoid using it as leading or trailing character(s). Templatize will generally handle trimming and adjust in cases where it does exist, but proper behavior cannot be fully guaranteed.
* While periods/dots (`.`) can mostly be used in the property name without failing (only one edge case where it would error with helper functions), it is generally to be avoided to avoid confusion.
* Avoid the double-colon (`::`), which is a [formatting](#formatting) directive, or a tilde (`~`), which is used for [dynamically scoping functions](#dynamically-scoping-functions).
* Avoid starting any parameter name with the special characters used for [lists](#lists) and [sections](#sections) -- which include ampersand (`&`), hash (`#`), and carot (`^`). Though, if not given an array value, they will still resolve, this leads to confusion in the template code.

### Comments and escaping ###

Both comments and escaping is done with a bang (`!`). For comments, place the bang within the opening `{{`. For escaping, place the bang outside the opening `{{`.

&nbsp; *Template:*

```
{{name.first}} is !{{age}} years old. {{!is this the right age?}}
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
Bob is {{age}} years old.
```

### Formatting ###

Formatting options are also available by suffixing the property name in the template code with a double-colon and format directive. For strings, accepted directives are 'upper', 'lower', and 'capitalize'. For numbers, Templatize uses the [d3-format library](https://github.com/d3/d3-format). See documentation there for various formatting options.

The format directive 'encode' will also encode HTML special characters such as pointed brackets, ampersands, and quotes. You can also preface another format directive with a "^" to achieve the same in addition to the chosen directive.

&nbsp; *Template:*

```
{{name:capitalize}} lives in {{locale::capitalize}} and sells burgers for {{price.burger::$.2f}}.
{{break}}{{break::encode}}{{break::^upper}}{{break::^}}
```

&nbsp; *Bindings:*

```javascript
{
  name: "bob", 
  locale: "new england", 
  price: { burger: 5 }, 
  break: "<br />"
}
```

&nbsp; *Outputs:*

```
Bob lives in New England and sells burgers for $5.00.
<br /><BR /><br />
```

Formatting also works for [lists](#lists) and [functions](#functions), an example is shown in the section [Formatting lists and functions](#formatting-lists-and-functions).

&nbsp;

## Lists ##

Lists are marked with a `&`-prefix and can only take in an array. The output is grammatically formatted with appropriate use of commas and/or the 'and'-conjunction, as dictated by the length of the list. No other dynamic text or subsections should be nested within a list and values within the array should be strings or numbers only for best results.

&nbsp; *Template:*

```
{{&name::capitalize}} sells {{&sells}} with {{&with}}. 
```

&nbsp; *Bindings:*

```javascript
{
  name: ["bob"], 
  sells: ["burgers", "sodas", "fries"], 
  with: ["his wife", "kids"]
}
```

&nbsp; *Outputs:*

```
Bob sells burgers, sodas, and fries with his wife and kids.
```

> *Note, there is no support for Oxford-comma non-believers. May god help your souls.*

&nbsp; 

## Sections ##

Section are marked with start at `#`-prefix and end at `/`-prefix. By binding section to a `true` or `false` value, they may be shown or removed.

You may also use an inverse section by replacing the hash (`#`) starting prefix with a carot (`^`). Such sections will only be displayed if the section is evaluated to `false`.

Data may be put inside of a section.

&nbsp; *Template:*

```
Bob is {{#married}}married{{/married}}{{#single}}single{{/single}}.<br />
{{#married}}Bob is married to {{spouse}}.{{/married}}<br />
Bob has {{^haspets}}no pets{{/haspets}}{{#haspets}}pets{{/haspets}}.
```

&nbsp; *Bindings:*

```javascript
{
  married: true, 
  single: false, 
  spouse: "Linda", 
  haspets: false
}
```

&nbsp; *Outputs:*

```
Bob is married.
Bob is married to Linda.
Bob has no pets.
```

If the section key does not exist, that section is simply not evaluated in the template, which is a common error.

&nbsp; *Template:*

```
Bob is {{^single}}married.{{/single}}{{#single}}single.{{/single}}
```

&nbsp; *Bindings:*

```javascript
{married: true}
```

&nbsp; *Outputs:*

```
Bob is {{^single}}married.{{/single}}{{#single}}single.{{/single}}
```

### Section value evaluation ###

Section data may be other values besides boolean. Values of `undefined`, `null`, an empty string or a string composed only of whitespace (if you want to add whitespace, use `&nbsp;`), and `0` evaluate to `false`. As long as data-binding for section evaluates to `true`, it will be treated as such. You may use this as a shortcut for both displaying the section and formatting its value. 

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

The above though is somewhat messy of an implementation. One alternative is to separate a "display" variable, or use an object for the section data.

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

&nbsp; *Template:*

```
{{#job}}Occupation: {{job.title}}{/job}}
```
 
&nbsp; *Bindings:*

```javascript
{
  job: {title: "Chef"}
}
// or conversely, which will hide the section..
{
  job: false
}
```

Note that section data (excluding repeating sections) are scoped for the entire template. E.g., given the above example, `{{job.title}}` may be used anywhere in the template inside or outside of a `{{#job}}{{/job}}` section and will be replaced with `"Chef"` when rendered.

### Evaluation of zero-value ###

There may however be cased in which you do want sections to evaluate `0` as `true`.

&nbsp; *Template:*

```
Profit:<br />
Monday - {{#monday}}{{monday::$.2f}}{{/monday}}{{^monday}}Closed{{/monday}}<br />
Sunday - {{#sunday}}{{sunday::$.2f}}{{/sunday}}{{^sunday}}Closed{{/sunday}}<br />
Saturday - {{#saturday}}{{saturday::$.2f}}{{/saturday}}{{^saturday}}Closed{{/saturday}}<br />
```

&nbsp; *Bindings:*

```javascript
{
  monday: null, 
  sunday: 0, 
  saturday: 122
}
```

&nbsp; *Outputs:*

```
Profit:
Monday - Closed
Sunday - Closed
Saturday - $122.00
```

By setting `evalZeroAsTrue` to `true`, you can change this behavior to treat zero-values as truthy.

```javascript
Templatize.evalZeroAsTrue = true;
```

Which will change to output as follows.

&nbsp; *Outputs:*

```
Profit:
Monday - Closed
Sunday - $0.00
Saturday - $122.00
```

Depending on your dependency manager, this may or may not affect all references to `Templatize`. Generally speaking, assume `Templatize` is a static reference, so either adjust for all uses, and/or have it reset back to a desired behavior after using it with non-default behavior.

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

&nbsp;

## Repeating Sections ##

For repeating sections, set the section value to an array and the section will be repeated for as many items exists in the array. May still use `_display` to not use particular array item. Values within the repeating section must still be called via dot notation within the section.

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
    {firstName: "Louise"}, 
    {firstName: "Kuchi-Kopi", _display: false}
  ]
}
```

&nbsp; *Outputs:*

```
Child: Tina
Child: Gene
Child: Louise
```

Note above example uses an array of objects. If a flat array of values is used, may simply use dot notation ending with the dot to display the value.

&nbsp; *Template:*

```
{{#children}}Child: {{children.}}<br />{{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  children: ["Tina", "Gene", "Louise"]
}
```

&nbsp; *Outputs:*

```
Child: Tina
Child: Gene
Child: Louise
```

Note there is currently no support for multidimensional-arrays or an array of functions. It must either be an array of objects or printable values. With and array of objects however, there may be more nested arrays or functions within each item.

&nbsp; *Template:*

```
{{#a}}{{#a.b}}[{{a.b.c}}]{{/a.b}}<br />{{/a}}
```

&nbsp; *Bindings:*

```javascript
// this is hard to think of a good example so gonna go real basic/abstract
{
  a: [
    {
      b: [{c: 1}, {c: 2}]
    }, 
    {
      b: [{c: 3}, {c: 4}]
    }
  ]
}
```

&nbsp; *Outputs:*

```
[1][2]
[3][4]
```

Unlike regular sections, access to variables within repeating section's array are limited in scope to where in the template the section is used. Thus, variables within a repeating section's data bindings will not evaluate outside the portion of the template within the repeating section. Values from outside, however, can be scoped within the repeating section.

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

&nbsp; 

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
Tina Belcher , Gene Belcher , and Louise Belcher
```

A few behaviors to note for the above example:

* Within the template for the repeating section, scope is still from the top level, hence we can render `name.last` within, and sub-variables of `children` must be called via dot notation.
* `children[].lastChild` must be specified for all array items, as the evaluation for `lastChild` in each repeat of the section will only happen where such a key exists.

&nbsp; 

## Functions ##

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object where it resides.

&nbsp; *Template:*

```
{{name}} has {{numChildrenText}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: "Bob", 
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
Bob has 3 children.
```

### Context and parent ###

In the previous example, the function `numChildrenText` was called with a `this` context of the data object at the same level in which the function exists, allowing it to access the var `children`. For nested, variables, `this` will also include a `_parent` to allow traversal up the data structure.

&nbsp; *Template:*

```
The head of the family is {{head.name}}, who is married to {{relations.wife.name}}.
```

&nbsp; *Bindings:*

```javascript
{
  familyName: "Belcher", 
  head: {
    firstName: "Bob", 
    name: function() { return this.firstName + " " + this._parent.familyName }
  }, 
  relations: {
    wife: {
      firstName: "Linda", 
      name: function() { return this.firstName + " " + this._parent._parent.familyName }
    }
  }
}
```

&nbsp; *Outputs:*

```
The head of the family is Bob Belcher, who is married to Linda Belcher.
```

Note in the more deeply-nested case, `this._parent` is used twice to traverse upwards two levels.

### Nesting ###

Additionally, the return value of the function may also be another object, array, or function, and treated as appropriate.

&nbsp; *Template:*

```
Bob's kids are {{&kidsNames}}<br />
Louise is {{kidsAges.Louise}} years old
```

&nbsp; *Bindings:*

```javascript
{
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ], 
  kidsNames: function() {
    // this returns an array that we'll treat as a list
    return this.children.map(child => child.name);
  }, 
  kidsAges: function() {
    // this returns an object that we can nest into
    var ages = {};
    this.children.forEach(child => {
      ages[child.name] = 2021 - child.born;
    });
    return ages;
  }
}
```

&nbsp; *Outputs:*

```
Bob's kids are Tina, Gene, and Louise
Louise is 9 years old
```

### Functions within functions ###

Finally, there is the special case of calling a function within a function. While this is easily done using the `this` context, all inner functions that are manually triggered require careful monitoring of the context as nested function calls get triggered. For a detailed explanation and example of how this works, see [Scoping of functions within functions](#scoping-of-function-within-functions).

### Dynamically scoping functions ###

You may want set the context of the functions dynamically, for example, within a repeating section. By calling a function with the tilde (`~`), the function will be called with the context as specified before the tilde.

&nbsp; *Template:*

```
{{#family.children}}{{family.children.name}} is {{family.children~calcAge}}. {{/family.children}}
```

&nbsp; *Bindings:*

```javascript
{
  family: {
    children: [
      {name: "Tina", born: 2008}, 
      {name: "Gene", born: 2010}, 
      {name: "Louise", born: 2012}
    ]
  }, 
  calcAge: function() {
    return 2021 - this.born;
  }
}
```

&nbsp; *Outputs:*

```
Bob is 47.
```

### Marking context-only functions ###

One important thing to note, Templatize will individually evaluate any function in the context it is placed in the data-binding. This is as Templatize evaluates by bindings then searching for relevant tags (instead of by tags then searching for bindings). 

As such, the below will result in an exception when `calcAge` is evaluated independently in the top-level scope and does not find a `this._parent` to reference `year` from.

&nbsp; *Template:*

```
{{#children}}{{children.name}} is {{children~calcAge}}. {{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ], 
  year: 2021, 
  calcAge: function() {
    return this._parent.year - this.born;
  }
}
```

Normally, this does not break the rendering, as the default behavior is to fail functions silently (see next section). However, if that is modified, then this will throw the exception.

To prevent this, the `calcAge` function could be adjusted in a few ways. First, it could simply check for the existence of the parameters it requires and if not found, return blank or some other filler value. Or you could simply wrap the interior block of the function in a try-catch-finally block to prevent the exception from bubbling out.

Another method is to prefix the property name with a tilde ('~'), which tells Templatize not to evaluate this function unless provided a given context. (When referencing the function in the template, you do not include the tilde.) Note that any references to the function without a dynamically provided context will not render.

&nbsp; *Template:*

```
{{#children}}{{children~funcs.fullName}} is {{children~calcAge}}. {{/children}}
```

&nbsp; *Bindings:*

```javascript
{
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ], 
  familyName: "Belcher", 
  year: 2021, 
  '~calcAge': function() {
    return this._parent.year - this.born;
  }, 
  funcs: {
    '~fullName': function() {
      return this.name + " " + this._parent.familyName;
    }
  }
}
```

### Error handling ###

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply set the `errorOnFuncFailure` flag to `true`: 

```javascript
Templatize.errorOnFuncFailure = true;
```

Depending on your dependency manager, this may or may not affect all references to `Templatize`. Generally speaking, assume `Templatize` is a static reference, so either adjust for all uses, and/or have it reset back to a desired behavior after using it with non-default behavior.

&nbsp; 

## Putting it all together ##

Below is a complex example using a bit of everything covered above.

&nbsp; *Template:*

```
{{name~fullname}} has {{numChildrenText}}.<br />
{{&kidsNamesAndAges}}.
<br /><br />
{{#relations}}His {{relations.relation}} is {{relations.fullname}}. {{/relations}}
```

&nbsp; *Bindings:*

```javascript
{
  familyName: "Belcher", 
  name: {
    first: "Bob", 
    full: function() {
      return this.first + " " + this._parent.familyName;          
    }
  }, 
  children: [
    {name: "Tina", born: 2008}, 
    {name: "Gene", born: 2010}, 
    {name: "Louise", born: 2012}
  ],  
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
  year: 2021, 
  kidsNamesAndAges: function() {
    return this.children.map(child => {
      child._parent = this;  // helper functions being manually called need '_parent'
      var fullname = this['~fullname'].call(child), 
          age = this.year - child.born;
      return fullname + " is " + age + " years old";
    });
  }, 
  relations: [
    {
      relation: "wife", 
      name: "Linda", 
      fullname: function() { return this._parent['~fullname'].call(this); }
    }, 
    {
      relation: "rival", 
      fullname: "Jimmy Pesto"
    }
  ], 
  '~fullname': function() {
    return (this.first || this.name) + " " + this._parent.familyName;
  },
}
```

&nbsp; *Outputs:*

```
Bob Belcher has 3 children. 
Tina Belcher is 13 years old, Gene Belcher is 11 years old, and Louise Belcher is 9 years old.

His wife is Linda Belcher. His rival is Jimmy Pesto.
```

&nbsp;

## Templatize vs Mustache ##

It's not a competition, but it's worth mentioning why there's a big library that emulates most of what [Mustache.js](https://github.com/janl/mustache.js/) does, while while they are similar there are enough differences to make switching between incompatible beyond the basic variables and sections. As aforementioned, this originally developed as an extremely minimal and lightweight implementation of a templating system, that only eventually blew up and became quite a full-on project. Partly because it contains some customizations I prefer and partly just as a side-project for practice.

#### Major syntax and usage differences ####

The support for grammatically formatted [lists](#lists) and built-in formatters are unique to Templatize as well as the options to evaluate zero-values as true.

**Scope for repeating sections**

Mustache treats template code within a repeating section as scoped within (not requiring dot notation to grab values from each list item within that section). Templatize still requires the full dot notation to grab data within a repeating section.

**Scope for functions**

In Mustache, functions called within a section are given the `this` context of the data-binding of the section. Thus calling a function in a repeating section changes the context to the item per iteration. 

In Templatize, functions are by default given the context of where the function lives within the data binding. To provide a different context, it must be explicitly called. See [Dynamically scoping functions](#dynamically-scoping-functions).

**Partials** 

Templatize has no inherent support for partials -- though as Templatize maps and renders on runtime, it is not really necessary.

#### Architecture differences ####

Templatize is data-binding-orientated. That it, it traverses the data bindings provided, and looks for tags in the template code that would be associated with said data binding. This results in [potential artifacts from unresolved template tags](#missing-bindings) unless the `clean` parameter is set.

Mustache is template-oriented in that it first maps the template, finding all valid tags, then replaces them, if found, with the associated value in the data-binding object.



&nbsp;

## Common errors and more ##

### Missing bindings ###

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

&nbsp;

### Formatting lists and functions ###

The formatting feature also applies to lists and functions.

&nbsp; *Template:*

```
Order:<br />
{{#order}}-{{order.name}}<br />{{/order}}
Item prices: {{&prices::$.2f}}<br />
Sale tax: {{salesTax::.0%}}<br />
Total (w/ tax): {{total::$.2f}}
```

&nbsp; *Bindings:*

```javascript
{
  order: [
    {name: "BURGER", price: 5}, 
    {name: "FRIES", price: 2}
  ], 
  ticket: function() {
    return this.order.map(item => item.price*(1.0+this.salesTax));
  }, 
  prices: [5, 2], 
  salesTax: 0.05, 
  total: function() {
    var sum = 0;
    this.order.forEach(item => {
      sum += item.price*(1.0+this.salesTax);
    });
    return sum;
  }
}
```

&nbsp; *Outputs:*

```
Order:
-BURGER
-FRIES
Item prices: $5.00 and $2.00
Sale tax: 5%
Total (w/ tax): $7.35
```

&nbsp;

### Scoping of function within functions ###

When calling a function manually within another function, the `this` context as it will not be automatically handled. You may at times need to explicitly set the `this` context (e.g. by using [*Function*.prototype.call()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call)). As well, `this._parent` will not be automatically created, if needed.

&nbsp; *Template:*

```
The kids are {{&ages}} years old.
```

&nbsp; *Bindings:*

```javascript
{
  year: 2021, 
  calcAge: function(born) {
    return this.year - born;
  }, 
  children: [
    {
      name: "Tina", 
      born: 2008, 
      age: function() {
        return this._parent.calcAge(this.born);
      }
    }, 
    {
      name: "Gene", 
      born: 2010, 
      age: function() {
        return this._parent.calcAge(this.born);
      }
    }, 
    {
      name: "Louise", 
      born: 2012, 
      age: function() {
        return this._parent.calcAge(this.born);
      }
    }
  ], 
  ages: function() {
    return this.children.map(child => {
      child._parent = this;
      return child.age();
    });
  }
}
```

&nbsp; *Outputs:*

```
The kids are 13, 11, and 9 years old.
```

There's a lot going on here, so let's break it down step by step. First, we defined the function `calcAge`, which uses its `this` context to access `year`. Note that as it takes in an input parameter, it cannot be called directly by Templatize which can't know how to pass said parameter (using `{{calcAge}}` in the template would result in "NaN").

This function is called by the function `age` within each instance of `children`. In `age`, the `this` context is used to pass each child's `born` property as an input parameter to `calcAge`. Because the scope is nested, it uses `this._parent` to access `calcAge`. When `calcAge` is called here, because it is called from the scope of `_parent`, the `this` context within `calcAge` still has access to `this.year`.

Finally, the function `ages` maps each item in `children` to the result of the `age` function to create an array of just the ages. However, because we are manually calling a function within a function, and the inner function relies on `this._parent`, we need to supply `this._parent` as that variable is not automatically added in a manual function call.

Confused yet? Don't worry, the above case is a very contrived scenario to force the issue for demonstration. There are many cleaner and more efficient solutions to the above example that avoid such scoping problems. E.g. the map function could simply return `this.year - child.born`, or the template could dynamically pass the repeating section's item of iteration of the function.

-----

&nbsp;

### Acknowledgments ###

Number formatting using the [d3-format](https://github.com/d3/d3-format) module, which is Copyright under Mike Bostock. [The full license can be found here](https://github.com/d3/d3-format/blob/master/LICENSE).

# Templatize

Basic templating code, similar to Mustache.js. It originally started as needing a very simplistic template library, hence creating my own version, before snowballing requirements basically made it almost the same functional capacity as Mustache.js. On the plus side, it's much lighter, the core code just a little over 100 lines. For a brief comparison versus Mustache, see the last section.

Lawrence Sim © 2021

## Contents

* [Usage](#usage)
* [The Basics](#the-basics)
    * [Variables](#variables)
        * [Naming restrictions](#naming-restrictions)
        * [Comments and escaping](#comments-and-escaping)
    * [Formatting](#formatting)
    * [Lists](#lists)
    * [Sections](#sections)
        * [Section value evaluation](#section-value-evaluation)
        * [Repeating Sections](#repeating-sections)
    * [Scoping and the context directive](#scoping-and-the-context-directive)
    * [Functions](#functions)
* [More](#more)
* [Acknowledgments](#acknowledgments)

* [Variables](#variables)
    * [Formatting](#formatting)
* [Lists](#lists)
* [Sections](#sections)
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

----------

&nbsp; 

## Usage

Import the source or minified javascript. If regular script import, uses name `Templatize`. The most basic use-case will simply call the `Templatize.render()` function.

*Templatize*.**render**(*template*, *bindings*[, *options*]) : Renders template.

| Name | Type | Description |
| --- | --- | :--- |
| `template` | String | The template. |
| `bindings` | Object | The object literal of data-bindings. |
| `options` | Object | See [Options](#options). |

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** (String) The rendered template.

However, this will not take advantage of caching the processed template. If reusing the template, first clone a rendering instance from said template using `Templatize.from()`, then call the render function on that. With the options here, you may set custom delimiters.

*Templatize*.**from**(*template*[, *options*]) : Renders template.

| Name | Type | Description |
| --- | --- | :--- |
| `template` | String | The template. |
| `options` | Object | The default options. See [Options](#options). |

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** (Interface) An instance of the Templatize rendering interface based off this template.

From this object, simply call: 

*Interface*.prototype.**render**(*bindings*[, *options*]) : Renders template.

| Name | Type | Description |
| --- | --- | :--- |
| `bindings` | Object | The object literal of data-bindings. |
| `options` | Object | Any overrides of the default options. See [Options](#options). |

&nbsp;

##### Options

| Name | Default | Description |
| --- | --- | :--- |
| `delimiters` | `["{{", "}}"]` | Set custom delimiters here as array of strings. Only available in `Templatize.from()` when creating a new instance off a preprocessed template. |
| `errorOnFuncFailure` | `false` | If true, throw exceptions resulting from function calls in the data-bindings. Otherwise, simply warns in the console and returns empty for the binding being evaluated. |
| `evalZeroAsTrue` | `false` | If true, zero-values are treated as a real value for section evaluation. See [Section value evaluation](#section-value-evaluation). |
| `escapeAll` | `false` | If true, all tags are by default HTML special-character escaped. Any tag printing unescaped code needs the specific formatting directive. See [Formatting](#formatting). |
| `errorOnMissingTags` | `false` | If true, throw exceptions when a data-binding called by the template is missing. Otherwise, simply warns in the console and returns empty. |

----------


&nbsp;


## The Basics

Templates are strings in which tags define where the text will be dynamically replaced and updated. By default, tags use the double-curly-braces delimiters (e.g. `{{likeThis}}`). The value inside the tag is the key, which may be supplemented by special characters called directives, which instruction special-case use or handling for the tag.

Whitespace between the delimiters and the inner key (and directives) are generally trimmed, but as a general rule, either use no whitespaces or only between the opening delimiter and the start of the inner value, and between the end of the inner value and closing delimiter -- e.g. `{{likeThis}}` or `{{ likeThis }}` but `{{ not like this }}`.

&nbsp;

### Variables

Variables are the most basic use-case, where you simply replace the tag with the value of the associated data-binding. Dot-notation may be used to traverse the data-structure.

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

The default behavior is to treat missing bindings as empty. You may also throw an exception when encounter a missing binding by setting the `errorOnMissingTags` parameter in [the render options](#options).

### Comments and escaping

Both comments and escaping is done with a bang directive (`!`). For comments, place the bang within the opening delimiter. For escaping, place the bang just outside the opening delimiter.

&nbsp; *Template:*

```
{{name.first}} is !{{age}} years old. {{! note to self: is this the right age? }}
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

### Naming restrictions

**Restrictions for property names**

* `_parent` is a special keyword (see [Context and parent](#context-and-parent)).
* `_display` is a special keyword. While it is meant to be set (see [More section behavior](./docs/sections.md#more-section-behavior]), it should only be done when specifically calling said functionality.
* Any property name with a leading bang (`!`) will be treated as an [escaped tag](#comments-and-escaping) in the template code.
* Any property name with a leading directive used for [lists](#lists) and [sections](#sections) -- which include ampersand (`&`), hash (`#`), and caret (`^`) -- will be interpreted as such and not considered part of the key name.
* Ending a property name ending with a semi-colon (`;`) will be interpreted as the escape [formatting](#formatting) directive and not part of the key name.
* Using in any place a double-colon (`::`), which is a [formatting](#formatting) directive, or a tilde (`~`), which is used for [dynamically scoping functions](./docs/sections.md#dynamically-scoping-functions), will be interpreted as their respective directives.

**Things to avoid in property names**

* While whitespaces can be part of the property name, it is generally not good practice. At the very least avoid using it as leading or trailing character(s). Templatize will generally handle trimming and adjust in cases where it does exist, but proper behavior cannot be fully guaranteed.
* While dots (`.`) can mostly be used in the property name without failing (though a few edge-cases may still result in odd behavior), it is generally to be avoided to reduce naming confusion.


&nbsp;


## Formatting

Formatting options are also available by suffixing the property name in the template code with a double-colon and format directive. For strings, a few of the commonly recognized values are detailed in the below table. If not recognized, Templatize uses the format directive as an input to the [d3-format library](https://github.com/d3/d3-format), which handles many number formats. See documentation there for various formatting options.

| Directive | Description |
| --- | :--- |
| "html" | If the [option](#options) `escapeAll` is set true, this directive sets the output not to escape HTML special characters. |
| "raw" | See above. |
| "encode" | Encodes HTML special characters in rendered output. |
| "upper" | Transforms all alphabetical characters to uppercase. |
| "caps" | See above. |
| "allcaps" | See above. |
| "lower" | Transforms all alphabetical characters to lowercase. |
| "capitalize" | Capitalizes the first letter in each word. |

Additionally, you can short-hand by suffixing a semi-colon (`;`) to the variable name or format directive

&nbsp; *Template:*

```
{{name:capitalize}} lives in {{locale::capitalize}} and sells burgers for {{price.burger::$.2f}}.
{{break}}{{break::encode}}{{break::upper;}}{{break;}}
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

Formatting also works for [lists](#lists) and [functions](#functions).


&nbsp; 


## Lists

Lists are marked with a `&`-directive and can only take in an array (or a function that returns an array). The output is grammatically formatted with appropriate use of commas and/or the 'and'-conjunction, as dictated by the length of the list. No other dynamic text or subsections should be nested within a list and values within the array should be strings or numbers only for best results.

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

*Note, the Oxford-comma is the default -- and only -- behavior, as the universe intended.*


&nbsp; 


## Sections

Section starts are tags with the `#`-directive and the sections end at tags with the `/`-directive. If the data bound to the section tag evaluates as true, it will be shown, and hidden if it evaluates to false. You may also use an inverse section by replacing the hash (`#`) starting prefix with a caret (`^`). Such sections will only be displayed if the section is evaluated to `false`.

Data may be put inside of a section, whether from elsewhere or the same data-binding.

&nbsp; *Template:*

```
Bob is {{#married}}married{{/married}}{{#single}}single{{/single}}.<br />
{{#spouse}}Bob is married to {{spouse}}.{{/spouse}}<br />
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

### Section value evaluation

The data bound to a section tag is evaluated for 'truthiness'. Values of `undefined`, `null`, an empty string or a string composed only of whitespace, an empty array, and `0` evaluate as false. Otherwise, as long as data-binding for section evaluates to true, it will be treated as such. You may use this as a shortcut for both displaying the section and formatting its value. 

&nbsp;

##### More

See additional documentation for more on [sections](./docs/sections.md), [section value evaluation](./docs/sections.md#section-value-evaluation), [the `_display` parameter](./docs/sections.md#the-_display-parameter), and more.

&nbsp; 

### Repeating Sections

If the value bound to a section tag is an array (or function that evaluates to an array), the section will be repeated for as many items as exists in the array.

Note that each item is also treated to the same [section value evaluation](./docs/sections.md#section-value-evaluation) to determine whether it is rendered.

For a flat array of values you may simply use the [context directive](#scoping-and-the-context-directive) alone to display the value of each item. 

&nbsp; *Template:*

```
{{#children}}Child: {{.}}<br />{{/children}}
```

&nbsp; *Bindings:*

```javascript
{children: ["Tina", "Gene", "Louise", "", null, false, 0]}
```

&nbsp; *Outputs:*

```
Child: Tina
Child: Gene
Child: Louise
```

##### More

See additional documentation for more on [repeating sections](./docs/sections.md#repeating-sections).


&nbsp; 


## Scoping and the context directive

All keys in template tags must provide the full path to the data-binding, even if within a section. However, one way to shortcut to the inner-most context is by prefacing the tag key with the context directive (`.`).

&nbsp; *Template:*

```
{{#name}}1. {{name.first}}{{/name}}<br />
{{#name}}2. {{first}}{{/name}}<br />
{{#name}}3. {{.first}}{{/name}}
```

&nbsp; *Bindings:*

```javascript
{name: {first: "Bob"}}
```

&nbsp; *Outputs:*

```
1. Bob
2.
3. Bob
```


&nbsp;


## Functions

Functions are evaluated to determine the returned value. The function is called within the context of the data-binding object where it resides (and may access the context via `this`).

As the behavior of the function depends on what is returned, it may be used in a variety of contexts. Note however that functions that return a function will continue to be re-evaluated until it returns a non-function value or will error if it exceeds a maximum number of iterations without doing such.

&nbsp; *Template:*

```
{{fullname}}'s friends include {{&friends}}.
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher"
  }, 
  fullname: function() {
    return this.name.first + " " + this.name.last;
  }, 
  relations: [
    {name: "Teddy", friendly: true}, 
    {name: "Mort", friendly: true}, 
    {name: "Jimmy Pesto", friendly: false}
  ], 
  friends: function() { 
    return this.relations.filter(person => person.friendly)
                         .map(person => person.name);
  }
}
```

&nbsp; *Outputs:*

```
Bob Belcher's friends include Teddy and Mort.
```

##### More

See additional documentation for more on [functions](#./docs/functions.md).


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

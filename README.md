# Templatize

Basic templating code. It originally started as needing a very simplistic template library, hence creating my own version, before snowballing requirements (and also just personal curiosity on where I could take it) turned it into a powerful templating library of its own.

Lawrence Sim © 2023

## Contents

* [Installation](#installation)
* [Usage](#usage)
* [The Basics](#the-basics)
    * [Variables](#variables)
    * [Lists](#lists)
    * [Sections](#sections)
    * [Scoping and context](#scoping-and-the-context-directive)
    * [Functions](#functions)
    * [Formatting](#formatting)
    * [Partials](#partials)
* [More Topics (including comparison with Mustache)](#more-topics)
* [Acknowledgments](#acknowledgments)

----------


&nbsp; 


## Installation

Templatize may be installed via NPM: `npm install @lawrencesim/templatize`. 

Once installed, the module can be imported or required as necessitated by your project.

```javascript
// ES6 module import
import Templatize from '@lawrencesim/templatize';
// CommonJS require
const Templatize = require('@lawrencesim/templatize').Templatize;
```

Otherwise, the files in the folder `dist` can be directly sourced or copied. The `.cjs` and `.mjs` extensions for CommonJS and ES6 module imports respectively. The `min.js` and `umd.js` builds are minimized, with the former only being defined as a global import suitable for script tags in HTML.

&nbsp; 


## Usage

The most basic use-case is to simply call the `Templatize.render()` function.

```javascript
var rendered = Templatize.render(myTemplate, bindings, options);
```

However this will not take advantage of template caching. If reusing the template, one can first create a rendering instance from said template using `Templatize.from()`, then call the render function on that instance.

```javascript
var templateOne = Templatize.from(myTemplate, options);
var rendered = templateOne.render(bindings);
```

<a href="templatize-render" name="templatize-render">#</a> *Templatize*.**render**(*template*, *bindings*[, *options*])

| Name | Type | Description |
| --- | --- | :--- |
| `template` | String | The template. |
| `bindings` | Object | The object literal of data-bindings. |
| `options` | Object | See [options](#options). |

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** (String) The rendered template.

<a href="templatize-from" name="templatize-from">#</a> *Templatize*.**from**(*template*[, *options*])

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** An instance of the Templatize rendering interface based off this template.

<a href="templatize-instance-render" name="templatize-instance-render">#</a> *Interface*.prototype.**render**(*bindings*[, *options*])

&nbsp; &nbsp; &nbsp; &nbsp;**Returns:** The rendered template string.

### Options

* **`delimiters`** - Set custom delimiters here as array of strings.
* **`errorOnFuncFailure`** - If true, throw exceptions resulting from function calls in the data-bindings. Otherwise, simply warns in the console and returns empty for the binding being evaluated.
* **`evalZeroAsTrue`** - If true, zero-values are treated as a real value for section evaluation. See [section value evaluation](#section-value-evaluation).
* **`escapeAll`** - If true, all tags are by default HTML special-character escaped. Any tag printing unescaped code needs the specific formatting directive. See [formatting](#formatting).
* **`errorOnMissingTags`** - If true, throw exceptions when a data-binding called by the template is missing. Otherwise, simply warns in the console and returns empty.
* **`partials`** - A map of partial templates by name. Used to refer to [partials](#partials).

Options given in a `render()` call will overwrite those set in an interface created with `Templatize.from()`. 

The one exception is custom delimiters for an interface created from `Templatize.from()`. In such a case, the original template and any provided partials are preprocessed. When calling `render()` on the interface with provided options, the delimiters will not take effect except on any newly provided partials with those options.

----------


&nbsp;


## The Basics

Templates are strings in which tags define where the text will be dynamically replaced and updated. By default, tags use the double-curly-braces delimiters (e.g. `{{likeThis}}`). The value inside the tag is the key or key name, which may be supplemented by special characters called directives that instruct special-case use or handling of the tag.

Whitespace between the delimiters and the inner key (and directives) are generally trimmed and ignored by the renderer, but as a general rule, either use no whitespaces or only between the delimiters and key, not within the key value itself -- e.g. `{{likeThis}}` or `{{ likeThis }}` but `{{ not like this }}`.

The data-binding for a tag is the data, identified by the tag key, that will be supplanted in the tag's place.

&nbsp;

### Variables

Variables are the most basic use-case, where the tag will render the data-binding value associated with the tag's key. Dot-notation may be used to traverse the data-structure.

&nbsp; *Template:*

```
{{name.first}} is {{age}} years old.
```

&nbsp; *Bindings:*

```javascript
{
  name: { first: "Bob" }, 
  age: 46
}
```

&nbsp; *Outputs:*

```
Bob is 46 years old.
```

The default behavior is to treat missing bindings as empty. You may also throw an exception when encounter a missing binding by setting the `errorOnMissingTags` parameter in [the render options](#options).

&nbsp; 

### Comments and escaping

Both commenting and escaping are done with a bang directive (`!`). For comments, place the bang within the opening delimiter. For escaping, place the bang just outside the opening delimiter.

&nbsp; *Template:*

```
{{name.first}} is !{{age}} years old. {{! note to self: is this the right age? }}
```

&nbsp; *Bindings:*

```javascript
{
  name: { first: "Bob" }, 
  age: 46
}
```

&nbsp; *Outputs:*

```
Bob is {{age}} years old.
```

&nbsp; 

### Naming restrictions

**Restrictions for tag key names**

* `_display` is a special keyword. While it can be set (see the [_display parameter](./more/sections/#the-_display-parameter)), it should only be done when specifically calling said functionality.
* Any key name with a leading bang (`!`) will be treated as a [comment](#comments-and-escaping) in the template code.
* Any key name with a leading period (`.`) will be treated as a [context directive](#scoping-and-the-context-directive) and not part of the key name.
* Any key name with a leading directive used for [lists](#lists) and [sections](#sections) -- which include ampersand (`&`), hash (`#`), and caret (`^`) -- will be interpreted as such and not considered part of the key name.
* Ending a key name with a semi-colon (`;`) will be interpreted as the escape [formatting](#formatting) directive and not part of the key name.
* Using in any place a double-colon (`::`), which is a [formatting](#formatting) directive, or an arrow operator (`->`), which is used for [passing context to functions](./more/functions/#passing-context-to-functions), will be interpreted as their respective directives.

**Things to avoid in tag key names**

* While whitespaces can be part of the key name, it is generally not good practice. At the very least avoid using it as leading or trailing characters. Templatize will generally handle trimming and adjust in cases where it does exist, but proper behavior cannot be fully guaranteed.
* While dots (`.`) can mostly be used in the key name without failing (though a few edge-cases may still result in odd behavior), it is generally to be avoided to reduce naming confusion.


&nbsp;


## Lists

Lists are marked with an ampersand (`&`) and can take in an array (or a function that returns an array). The output is grammatically formatted with appropriate use of commas and/or the 'and'-conjunction, as dictated by the length of the list. No other dynamic text or subsections should be nested within a list, and values within the array should be strings or numbers only for best results.

One special case exists with the list functionality, the combination of the list and section directive (`&#`) which can be used to [grammatically list repeating sections](./more/sections#repeating-list-sections).

&nbsp; *Template:*

```
{{&name}} sells {{&sells}} with his {{&with}}. 
```

&nbsp; *Bindings:*

```javascript
{
  name: ["Bob"], 
  sells: ["burgers", "sodas", "fries"], 
  with: ["wife", "kids"]
}
```

&nbsp; *Outputs:*

```
Bob sells burgers, sodas, and fries with his wife and kids.
```

*Note, the Oxford-comma is the default -- and only -- behavior, as the universe intended.*


&nbsp; 


## Sections

Section start at tags with the `#`-directive and end at the corresponding tags with the `/`-directive. If the data bound to the tag evaluates as true, the content between the section tags will be shown. Conversely, it will be hidden if it evaluates to false. 

You may also inverse the rules for showing and hiding a section by replacing the hash (`#`) with a caret (`^`) in the section start tag.

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

&nbsp;

### Section value evaluation

The data bound to a section tag is evaluated for 'truthiness'. Null values, an empty string or composed only of whitespace, an empty list, and `0` evaluate as false (though in certain cases you may want to [treat 0-values as true](./more/sections/#treating-zero-values-as-true)). Otherwise, as long as data-binding for section evaluates to true, it will be treated as such. You may use this as a shortcut for both displaying the section and formatting its value. 

&nbsp; 

### Repeating Sections

If the value bound to a section tag is an array (or function that evaluates to an array), the section will be repeated for as many items as exists in the array. 

Within the context of the repeating section (that is, between the opening and closing section tags), the same tag key is temporarily bound to the value of each item during each iteration. Thus, the tag key can be used within the section context to access the inner values as it iterates through the array.

&nbsp; *Template:*

```
{{#children}}Child: {{children}}<br />{{/children}}
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

Note that each item is also treated to the same [section value evaluation](./more/sections/#section-value-evaluation) to determine whether it is rendered.

&nbsp;

### More on sections

See additional documentation for more on [sections](./more/sections/) and [repeating sections](./more/sections/#repeating-sections), including [section value evaluation](./more/sections/#section-value-evaluation), the [`_display` parameter](./more/sections/#the-_display-parameter), and more.


&nbsp; 


## Scoping and the context directive

All keys in template tags must provide the full path to the data-binding, even if within a section. However, one way to shortcut to the inner-most context is by prefacing the tag key with the context directive (`.`). A naked context tag (`{{.}}`) is particularly useful for repeating sections with flat values.

&nbsp; *Template:*

```
{{#name}}1. {{name.first}}{{/name}}<br />
{{#name}}2. {{first}}{{/name}}<br />
{{#name}}3. {{.first}}{{/name}}<br />
<br />
Friends: {{#friends}}{{.}} {{/friends}}
```

&nbsp; *Bindings:*

```javascript
{
  name: {first: "Bob"}, 
  friends: ["Teddy", "Mort"]
}
```

&nbsp; *Outputs:*

```
1. Bob
2.
3. Bob

Friends: Teddy Mort
```

In the above, we try to access `name.first` in three ways. Using the full binding path (1) works in almost any case. However, using `first` without giving a context (2), fails as it tries to find a binding for `first` from the root, which does not exist. We can fix this by providing the context directive (3), which begins the search from the given context, with is within the section (and corresponding data-binding for) `name`.

The naked context tag (`{{.}}`) in the final line is equivalent to the tag `{{friends}}`, which in-context of a repeating section, accesses each iterated value in the list.


&nbsp;


## Functions

Functions are evaluated and uses the returned value as the data-binding to the specified tag. As the behavior of the function depends on what is returned, it may be used in a variety of contexts, such as using the function output as a section or list.

The function is called within the context of the data-binding object where it resides (accessed via `this`) and given the argument of the full/root data-binding object.

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
  fullname: function(root) {
    return this.name.first + " " + root.name.last;
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

Note, since none of the tags were called in context, for the functions called, `this` and `root` will refer to the same (the root data-binding).

&nbsp;

### Error handling

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply set the `errorOnFuncFailure` flag to `true` in the [options](../README.md#options).

&nbsp;

### Passing context to functions

To change the context of a function (accessed by the `this` keyword) when it is called, the tag may pair the key referencing a data context with the key for the function, using the pass-as-context directive (`->`) to separate them. The function will also be passed a `root` parameter that is always a reference to the data-binding at the top-most level.

```
The burger-of-the-day is:<br />
"{{special.burger->getTodays}}"<br />
{{special.price->getTodays}}
```

&nbsp; *Bindings:*

```javascript
{
  special: {
    burger: {
      sunday: "Yes I Cayenne Burger", 
      monday: "So Many Fennel So Little Thyme Burger"
    }, 
    price: {
      sunday: "$5.95", 
      monday: "$5.50"
    }
  }, 
  today: "sunday", 
  getTodays: function(root) {
    return this[root.today];
  }
}
```

&nbsp; *Outputs:*

```
The burger-of-the-day is:
"Yes I Cayenne Burger"
$5.95
```

This functionality is covered in greater depth in the [additional function documentation](./more/functions/) under [passing-context-to-functions](./more/functions/#passing-context-to-functions)

&nbsp;

### Passing sections as context to functions

By combining the inclusive section directive with the pass-context-to-function directive (`#->`), the section's render text will be passed to function named by the tag key. The closing section tag is given by the standard closing directive (`/`) and the same function name.

&nbsp; *Template:*

```
{{#->bold}}{{main->fullname}}{{/bold}}
{{#->parenthesis}}aged {{main.age}}{{/parenthesis}}
```

&nbsp; *Bindings:*

```javascript
{
  main: {
    first: "Bob", 
    last: "Belcher", 
    age: 46
  }, 
  fullname: function(root) {
    return this.first + " " + this.last;
  },
  bold: function() {
    return "<strong>"+this+"</strong>";
  }, 
  parenthesis: function() {
    return "("+this+")";
  }
}
```

&nbsp; *Outputs:*

<pre>
<strong>Bob Belcher</strong> (aged 46)
</pre>

&nbsp;

### More on functions

Functions are arguably the most powerful (and sometimes frustrating) aspect of Templatize, especially paired with the [pass-context-to-function directive](./more/functions/#passing-context-to-functions) and [chaining functions](./more/functions/#chaining-functions). This section only covers the most superficial use of functions.

See additional documentation for more on [functions](./more/functions/).


&nbsp;


## Formatting

Formatting options are also available by suffixing the key name in the template code with a double-colon (`::`) and following with a format key. For strings, a few of the commonly recognized values are detailed in the below table. If not recognized, Templatize uses the format key as an input to the [d3-format library](https://github.com/d3/d3-format), which handles many number formats. See documentation there for various formatting options.


* **html** - If the [option](#options) `escapeAll` is set true, this key sets the output not to escape HTML special characters.
    * **raw** - Same as above.
* **encode** - Encodes HTML special characters in rendered output.
* **upper** - Transforms all alphabetical characters to uppercase.
    * **caps** - Same as above.
    * **allcaps** - Same as above.
* **lower** - Transforms all alphabetical characters to lowercase.
* **capitalize** - Capitalizes the first letter in each word.

Additionally, you can shorthand the **encode** format directive and key by suffixing a semi-colon (`;`) to the end of the tag name. It may even be combined with another format directive.

&nbsp; *Template:*

```
{{name::capitalize}} lives in {{locale::capitalize}} 
    and sells burgers for {{price.burger::$.2f}}.
{{break}}
{{break::encode}}{{break;}}{{break::upper;}}
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
<br /><br /><BR />
```

&nbsp;

Formatting also works for [lists](#lists) and [functions](#functions).

&nbsp; *Template:*

```
Order: {{&order::lower}}<br />
Prices: {{&ticket::$.2f}}<br />
Sale tax: {{salesTax::.0%}}<br />
Total: {{total::$.2f}}<br />
Total (w/ tax): {{addTax::$.2f}}
```

&nbsp; *Bindings:*

```javascript
{
  order: ["BURGER", "FRIES"], 
  prices: {
    BURGER: 5, 
    FRIES: 2
  }, 
  ticket: function() {
    return this.order.map(item => this.prices[item]);
  }, 
  salesTax: 0.05, 
  total: function() {
    return this.order.reduce((total, item) => total + this.prices[item], 0);
  }, 
  addTax: function() {
    return this.total()*(1+this.salesTax);
  }
}
```

&nbsp; *Outputs:*

```
Order: burger and fries
Prices: $5.00 and $2.00
Sale tax: 5%
Total: $7.00
Total (w/ tax): $7.35
```


&nbsp;


## Partials

Partials are reusable sub-templates that can be called from the main template. Partials are supplied in the [options](#options) and called in the template with the partial directive (`>`). 

The partial template will using the same data-bindings given for rendering the template. However, the in-context directive (`.`) may be prefixed before the key name to render the partial with data-bindings corresponding to the current data context.

Partials cannot be used as sections or passed as context, but they can be given a formatting directive.

&nbsp; *Template:*

```
1. {{>fullname}}
{{#wife}}
  2. {{>fullname::upper}}
  3. {{>.fullname;}}
{{/wife}}
```

&nbsp; *Bindings:*

```javascript
{
  name: {
    first: "Bob", 
    last: "Belcher"
  }, 
  wife: {
    name: {
      first: "Linda", 
      last: "Belcher"
    }
  }
}
```

&nbsp; *Code:*

```javascript
var partials = {
  fullname: "{{name.first}} {{name.last}}<br />"
};
Templatize.render(template, bindings, {partials: partials});
```

&nbsp; *Outputs:*

```
1. Bob Belcher
2. BOB BELCHER
3. Linda Belcher<br />
```


&nbsp; 



## More Topics

The above only takes a cursory glance at some of the directives. Be sure to look into the additional documentation below.

* [More about sections and repeating sections](./more/sections/)
* [More about functions](./more/functions/)

&nbsp;

#### Advanced usage, edge cases, and general weirdness

That's all great, you may be thinking, but what about if I [pass a function to itself](./more/advanced/#passing-a-function-to-itself)? Or [use a pass-as-context directive in the section tag](./more/advanced/#mixing-directives-in-a-section-tag)? What about [multi-dimensional arrays](./more/advanced/#multi-dimensional-arrays)? Did you think of all that?

Well luckily for you, you sadist, we have such a section on [advanced usage, edge cases, and general weirdness](./more/advanced/).

&nbsp;

#### Templatize vs Mustache.js

Time to address the elephant in the room. Why recreate what Mustache.js (basically) already does? How does Templatize differ? Which is better? Which is faster? The quick answers are: just because, much more powerful function directives (among a few other syntactic differences), depends what you want, and probably Mustache.js. But if you want a little more substance to those answers, see [Templatize vs. Mustache.js](./more/compared/).


-----


&nbsp;


### Acknowledgments

Number formatting utilizes the [d3-format](https://github.com/d3/d3-format) module, which is Copyright under Mike Bostock. [The full license can be found here](https://github.com/d3/d3-format/blob/master/LICENSE).

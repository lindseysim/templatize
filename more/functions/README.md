## Functions Documentation

* [Functions](#functions)
    * [Error handling](#error-handling)
    * [Function returns and formatting](#function-returns-and-formatting)
    * [Chaining functions](#chaining-functions)
    * [Passing context to functions](#passing-context-to-functions)
      * [Passing sections as context](#passing-sections-as-context)
    * [Function evaluation and caching](#function-evaluation-and-caching)
* [More](#more)


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

By default, functions fail silently. If an error occurs during function call, exception is not raised further and value is assumed to be an empty string. To change this, simply set the `errorOnFuncFailure` flag to true in the [options](../../#options).

&nbsp; 

### Function returns and formatting

The returned of a function is handled as appropriate for the type of value it is. (In the first example, a function returning an array used as a list was shown.) If a function returns an object, it can be referenced into as if it were a normal object, even if the property nesting is not resolved until the function is called. 

Formatting directives can also be applied.

&nbsp; *Template:*

```
Menu: <br />
{{menu.burger.name::capitalize}} - {{menu.burger.price::$.2f}}.<br />
{{menu.fries.name::capitalize}} - {{menu.fries.price::$.2f}}.<br />
{{menu.soda.name::capitalize}} - {{menu.soda.price::$.2f}}. 
```

&nbsp; *Bindings:*

```javascript
{ 
  burger: {name: "burger", price: 5}, 
  fries: {name: "fries", price: 2}, 
  soda: {name: "soda", price: 2}, 
  menu: function() {
    return {burger: this.burger, fries: this.fries, soda: this.soda};
  }
}
```

&nbsp; *Outputs:*

```
Menu:
Burger - $5.00.
Fries - $2.00.
Soda - $2.00.
```

Functions outputs are cached after their first evaluation. As such, calling `menu` repeatedly will not result in wasted processing calling the `menu` function. This is covered later in the section [function evaluation and caching](#function-evaluation-and-caching).

&nbsp;

### Chaining functions

Functions can be chained using multiple pass-as-context directives and will be evaluated left-to-right.

&nbsp; *Template:*

```
{{value->log2->square}}
```

&nbsp; *Bindings:*

```javascript
{
  value: 128, 
  log2: function() { return Math.log2(this); }, 
  square: function() { return this*this; }
}
```

&nbsp; *Outputs:*

```
49
```

&nbsp;

### Passing context to functions

To change the context of a function (accessed by the `this` keyword) when it is called, the tag may pair the key referencing a data context with the key for the function, using the pass-as-context directive (`->`) to separate them. The function will also be passed a `root` parameter that is always a reference to the data-binding at the top-most level.

&nbsp; *Template:*

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

In the function `getTodays()`, the data accessed by the `this` keyword changes depending on context passed to the function. But using the `root` parameter keeps the reference to `root.today` constant no matter the context in which the function was called.

&nbsp;

#### Passing sections as context

By combining the inclusive section directive with the pass-context-to-function directive (`#->`), the section's render text will be passed to function named by the tag key. The closing section tag is given by the standard closing directive (`/`) and the same function name.

&nbsp; *Template:*

```
{{#->louise-ify}}
  {{#->highlight}}
    burger-of-the-day: 
    "new bacon-ings" 
    comes with bacon
    5.95
  {{/highlight}}
{{/louise-ify}}
```

&nbsp; *Bindings:*

```javascript
{
  highlight: function() {
    // split lines, ignore empties
    var lines = this.split(/\n/g).map(l => l.trim()).filter(l => l);
    lines = lines.map(l => {
      l = l.toUpperCase();
      // stylize price
      if(l.match(/[0-9]+(\.[0-9]+)?/)) return "$"+l;
      // stylize header
      if(l === "BURGER-OF-THE-DAY:") return "<strong><u>"+l+"</strong></u>";
      // stylize 'comes with' line
      if(l.startsWith("COMES WITH")) return "<em>"+l+"</em>";
      return l;
    });
    // add line breaks
    return lines.join("<br />");
  }, 
  'louise-ify': function() {
    // cause mischief
    return this.replace(/"[a-z\- ]+"/i, "The Child Molester")
               .replace(/comes with [a-z ]+/gi, "comes with Candy!");
  }
}
```

&nbsp; *Outputs:*

<pre>
<strong><u>BURGER-OF-THE-DAY:</u></strong>
The Child Molester
<em>comes with candy!</em>
$5.95
</pre>

&nbsp;

### Function evaluation and caching

As demonstrated earlier, functions can return almost anything and be appropriately handled from there. However, functions that return a function will continue to be re-evaluated until it returns a non-function value. Or it will error if it begins to detect an infinite recursion (the max. number of recursions or overflow limit is set to 99).

Functions are evaluated when they are first called (or never if they are not). After the first call however, the returned value from the first evaluation is cached. If the function is passed to a context however, it is considered dynamic and re-evaluated each time (even if the same context). In such a way, this is a shortcut to bypass caching even if the passed context is not used.

&nbsp; *Template:*

```
{{   count}}-{{i}}<br />
{{.->count}}-{{i}}<br />
{{   count}}-{{i}}<br />
{{.->count}}-{{i}}
```

&nbsp; *Bindings:*

```javascript
{
  i: 0, 
  count: root => ++root.i
}
```

&nbsp; *Outputs:*

```
1-1
2-1
1-1
3-1
```

Note in the above, any call to `{{count}}` will render "1" as that was value returned at first render. However, by passing a context, we can force the function to re-evaluate, which is what is done on every other line. That said, calling `{{count}}` again after these context calls will still return the cached value of "1". 

Additionally the value of `i` is not evaluated until it is first called (when it equals "1" since the function `count` has been called once and incremented `i`), but after that point, all tags referencing `i` use the now cached value ("1"), even when future evaluations of `count` modify `i`.

**In general, it is highly discouraged for functions to modify the data binding or return different results depending on number of times called** as the results may be quite unintuitive between the caching strategy and rendering optimizations built into Templatize. For an even weirder example, see the documentation on [function evaluation and modifying binding data](../advanced/#function-evaluation-and-modifying-binding-data).

----

&nbsp;

#### More

Functions and the pass-context-to-function directives represent one of the most flexible and powerful use-cases of Templatize (though sometimes the most frustrating to debug). For a run down of some of the advanced uses, edge cases, and particular behaviors, read the section: [advanced usage, edge cases, and general weirdness](../advanced/).
